import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(roomId: string | undefined) {
  const { user } = useAuthStore();
  const {
    isMuted,
    isDeafened,
    setMuted,
    setLocalStream,
    updateParticipantSpeaking,
    updateParticipantMute,
    setIsConnectingAudio,
  } = useRoomStore();

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const candidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechIntervalRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Helper to flush queued ICE candidates once remoteDescription is set
  const flushCandidates = useCallback(async (peerSocketId: string, pc: RTCPeerConnection) => {
    const queued = candidateQueue.current.get(peerSocketId) || [];
    if (queued.length > 0) {
      console.log(`[WebRTC] 🌊 Flushing ${queued.length} queued ICE candidates for ${peerSocketId}`);
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Error adding queued ICE candidate:', e);
        }
      }
      candidateQueue.current.delete(peerSocketId);
    }
  }, []);

  // ── 1. Create Peer Connection (Phone-Call Full Duplex Style) ─────────────────
  const createPeerConnection = useCallback((peerSocketId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(peerSocketId)) {
      return peerConnections.current.get(peerSocketId)!;
    }

    console.log(`[WebRTC] 📞 Setting up full-duplex phone call connection with ${peerSocketId} (initiator: ${isInitiator})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(peerSocketId, pc);

    // Standard Full-Duplex WebRTC (Phone Call Style):
    // Use an explicit sendrecv audio transceiver so both parties continuously send & receive
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        console.log(`[WebRTC] Attaching local mic track to ${peerSocketId}`);
        pc.addTransceiver(track, {
          direction: 'sendrecv',
          streams: [localStreamRef.current],
        });
      }
    } else {
      // If mic is still spinning up, declare sendrecv direction ahead of time
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket().emit('rtc:ice-candidate', {
          to: peerSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle incoming remote audio track (continuous phone call playback)
    pc.ontrack = (event) => {
      console.log(`[WebRTC] 🔊 Received remote audio track from ${peerSocketId}`);
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);

      let audio = remoteAudios.current.get(peerSocketId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = `remote-audio-${peerSocketId}`;
        audio.autoplay = true;
        audio.volume = 1.0;
        (audio as any).playsInline = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        remoteAudios.current.set(peerSocketId, audio);
      }

      audio.srcObject = stream;
      audio.muted = isDeafened;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`[WebRTC] Autoplay waiting for interaction on ${peerSocketId}:`, err);
          const resume = () => {
            audio?.play().catch(() => {});
            window.removeEventListener('click', resume);
            window.removeEventListener('touchstart', resume);
          };
          window.addEventListener('click', resume, { once: true });
          window.addEventListener('touchstart', resume, { once: true });
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${peerSocketId} call state: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnections.current.delete(peerSocketId);
        const audio = remoteAudios.current.get(peerSocketId);
        if (audio) {
          audio.srcObject = null;
          audio.remove();
          remoteAudios.current.delete(peerSocketId);
        }
      }
    };

    // If initiator, create and send offer immediately
    if (isInitiator) {
      pc.createOffer({
        offerToReceiveAudio: true,
        voiceActivityDetection: true,
      })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          console.log(`[WebRTC] Sending call offer to ${peerSocketId}`);
          getSocket().emit('rtc:offer', {
            to: peerSocketId,
            offer: pc.localDescription,
          });
        })
        .catch((err) => console.error('[WebRTC] Error creating call offer:', err));
    }

    return pc;
  }, [isDeafened]);

  // ── 2. Speech Detection (VAD for Visual Ring Only - Never Cuts Audio) ───────
  const setupSpeechDetection = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSpeech = () => {
        if (!analyserRef.current || isMuted) {
          if (isSpeakingRef.current) {
            isSpeakingRef.current = false;
            if (user) {
              updateParticipantSpeaking(user.uid, false);
              getSocket().emit('audio:speaking', { isSpeaking: false });
            }
          }
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isSpeakingNow = average > 14;

        if (isSpeakingNow !== isSpeakingRef.current) {
          isSpeakingRef.current = isSpeakingNow;
          if (user) {
            updateParticipantSpeaking(user.uid, isSpeakingNow);
            getSocket().emit('audio:speaking', { isSpeaking: isSpeakingNow });
          }
        }
      };

      speechIntervalRef.current = window.setInterval(checkSpeech, 150);
    } catch (e) {
      console.warn('[WebRTC] Web Audio speech detection not supported:', e);
    }
  }, [isMuted, updateParticipantSpeaking, user]);

  // ── 3. Initialize Microphone (Default ON like Phone Calls) ───────────────────
  const initMicrophone = useCallback(async () => {
    setIsConnectingAudio(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Default microphone to ON like an incoming phone call
      setMuted(false);
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      // Attach track to any existing peer connections
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        peerConnections.current.forEach(async (pc, peerId) => {
          const transceivers = pc.getTransceivers();
          const audioTransceiver = transceivers.find(
            (t) => t.sender.track?.kind === 'audio' || t.receiver.track?.kind === 'audio'
          );
          if (audioTransceiver && audioTransceiver.sender) {
            console.log(`[WebRTC] Attaching mic track to transceiver for ${peerId}`);
            await audioTransceiver.sender.replaceTrack(audioTrack);
            audioTransceiver.direction = 'sendrecv';
          } else {
            pc.addTrack(audioTrack, stream);
          }
        });
      }

      setupSpeechDetection(stream);
      setIsConnectingAudio(false);
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Microphone access denied or not found. Falling back to silent listener mode.', err);
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        const silentStream = dst.stream;
        silentStream.getAudioTracks().forEach((t) => (t.enabled = false));
        localStreamRef.current = silentStream;
        setLocalStream(silentStream);
      } catch (e) {
        console.error('[WebRTC] Fallback stream error:', e);
      }
      setIsConnectingAudio(false);
      return null;
    }
  }, [setIsConnectingAudio, setLocalStream, setMuted, setupSpeechDetection]);

  // ── 4. WebRTC Signaling Listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    // Start full-duplex mic then join room
    initMicrophone().then((_stream) => {
      socket.emit('room:join', { roomId });
    });

    // Existing peers received upon joining
    const handlePeers = (data: { peers: Array<{ socketId: string }> }) => {
      console.log('[WebRTC] Active participants in room:', data.peers);
      data.peers.forEach((peer) => {
        createPeerConnection(peer.socketId, true); // new joiner calls existing participants
      });
    };

    // A new peer joined the room
    const handlePeerJoined = (data: { socketId: string; displayName?: string }) => {
      console.log('[WebRTC] New participant joined call:', data.socketId, data.displayName);
      createPeerConnection(data.socketId, false); // existing participants prepare for call offer
    };

    // Received RTC Offer from incoming caller
    const handleOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] 📥 Received call offer from:', data.from);
      let pc = peerConnections.current.get(data.from);
      if (!pc) {
        pc = createPeerConnection(data.from, false);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        // Flush any candidates buffered before this offer arrived
        await flushCandidates(data.from, pc);

        // Crucial for phone call full-duplex:
        // Ensure our local mic track is attached to the transceiver sending back to the caller
        if (localStreamRef.current) {
          const myAudioTrack = localStreamRef.current.getAudioTracks()[0];
          if (myAudioTrack) {
            const transceivers = pc.getTransceivers();
            const audioTransceiver = transceivers.find(
              (t) => t.receiver.track?.kind === 'audio' || t.sender.track?.kind === 'audio'
            );
            if (audioTransceiver && audioTransceiver.sender) {
              await audioTransceiver.sender.replaceTrack(myAudioTrack);
              audioTransceiver.direction = 'sendrecv';
            } else {
              const senders = pc.getSenders();
              const audioSender = senders.find((s) => s.track?.kind === 'audio');
              if (audioSender) {
                await audioSender.replaceTrack(myAudioTrack);
              } else {
                pc.addTrack(myAudioTrack, localStreamRef.current);
              }
            }
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] 📤 Sending call answer back to:', data.from);
        socket.emit('rtc:answer', {
          to: data.from,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling call offer:', err);
      }
    };

    // Received RTC Answer
    const handleAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] 📥 Received call answer from:', data.from);
      const pc = peerConnections.current.get(data.from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          await flushCandidates(data.from, pc);
          console.log(`[WebRTC] 🟢 Two-way full-duplex call connected with ${data.from}`);
        } catch (err) {
          console.error('[WebRTC] Error handling call answer:', err);
        }
      }
    };

    // Received ICE Candidate
    const handleIceCandidate = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current.get(data.from);
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        const q = candidateQueue.current.get(data.from) || [];
        q.push(data.candidate);
        candidateQueue.current.set(data.from, q);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    // Peer left
    const handlePeerLeft = (data: { socketId: string }) => {
      console.log('[WebRTC] Peer hung up / left:', data.socketId);
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      const audio = remoteAudios.current.get(data.socketId);
      if (audio) {
        audio.srcObject = null;
        audio.remove();
        remoteAudios.current.delete(data.socketId);
      }
      candidateQueue.current.delete(data.socketId);
    };

    // Peer mute changes
    const handlePeerMute = (data: { uid: string; isMuted: boolean }) => {
      updateParticipantMute(data.uid, data.isMuted);
    };

    // Peer speaking changes
    const handlePeerSpeaking = (data: { uid: string; isSpeaking: boolean }) => {
      updateParticipantSpeaking(data.uid, data.isSpeaking);
    };

    // Global listener to ensure audio context and remote audios stay unmuted on mobile gesture
    const ensureAudioActive = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      remoteAudios.current.forEach((audio) => {
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      });
    };
    window.addEventListener('click', ensureAudioActive);
    window.addEventListener('touchstart', ensureAudioActive);

    socket.on('room:peers', handlePeers);
    socket.on('room:peer-joined', handlePeerJoined);
    socket.on('room:peer-left', handlePeerLeft);
    socket.on('rtc:offer', handleOffer);
    socket.on('rtc:answer', handleAnswer);
    socket.on('rtc:ice-candidate', handleIceCandidate);
    socket.on('audio:peer-mute', handlePeerMute);
    socket.on('audio:peer-speaking', handlePeerSpeaking);

    return () => {
      window.removeEventListener('click', ensureAudioActive);
      window.removeEventListener('touchstart', ensureAudioActive);
      socket.off('room:peers', handlePeers);
      socket.off('room:peer-joined', handlePeerJoined);
      socket.off('room:peer-left', handlePeerLeft);
      socket.off('rtc:offer', handleOffer);
      socket.off('rtc:answer', handleAnswer);
      socket.off('rtc:ice-candidate', handleIceCandidate);
      socket.off('audio:peer-mute', handlePeerMute);
      socket.off('audio:peer-speaking', handlePeerSpeaking);

      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);

      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();

      remoteAudios.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      remoteAudios.current.clear();
      candidateQueue.current.clear();

      socket.emit('room:leave');
    };
  }, [
    createPeerConnection,
    flushCandidates,
    initMicrophone,
    roomId,
    setLocalStream,
    updateParticipantMute,
    updateParticipantSpeaking,
  ]);

  // ── 5. Mute/Unmute audio track toggle ───────────────────────────────────────
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
    getSocket().emit('audio:mute-toggle', { isMuted });
    if (isMuted && user) {
      updateParticipantSpeaking(user.uid, false);
      getSocket().emit('audio:speaking', { isSpeaking: false });
    }
  }, [isMuted, updateParticipantSpeaking, user]);

  // ── 6. Deafen toggle ────────────────────────────────────────────────────────
  useEffect(() => {
    remoteAudios.current.forEach((audio) => {
      audio.muted = isDeafened;
    });
  }, [isDeafened]);

  return {
    peerCount: peerConnections.current.size,
  };
}
