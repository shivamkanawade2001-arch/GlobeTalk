import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { useRoomStore } from '../stores/roomStore';
import { useAuthStore } from '../stores/authStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC(roomId: string | undefined) {
  const { user } = useAuthStore();
  const {
    isMuted,
    isDeafened,
    setLocalStream,
    updateParticipantSpeaking,
    updateParticipantMute,
    setIsConnectingAudio,
  } = useRoomStore();

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechIntervalRef = useRef<number | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // ── 1. Create Peer Connection ───────────────────────────────────────────────
  const createPeerConnection = useCallback((peerSocketId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(peerSocketId)) {
      return peerConnections.current.get(peerSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(peerSocketId, pc);

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
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

    // Handle remote track
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${peerSocketId}`);
      let audio = remoteAudios.current.get(peerSocketId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudios.current.set(peerSocketId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.muted = isDeafened;
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${peerSocketId} state:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnections.current.delete(peerSocketId);
        const audio = remoteAudios.current.get(peerSocketId);
        if (audio) {
          audio.srcObject = null;
          remoteAudios.current.delete(peerSocketId);
        }
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          getSocket().emit('rtc:offer', {
            to: peerSocketId,
            offer: pc.localDescription,
          });
        })
        .catch((err) => console.error('[WebRTC] Error creating offer:', err));
    }

    return pc;
  }, [isDeafened]);

  // ── 2. Speech Detection (VAD) via Web Audio API ──────────────────────────────
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
        const isSpeakingNow = average > 18; // Audio threshold for speech

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

  // ── 3. Initialize Microphone ────────────────────────────────────────────────
  const initMicrophone = useCallback(async () => {
    setIsConnectingAudio(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Apply initial mute state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });

      setupSpeechDetection(stream);
      setIsConnectingAudio(false);
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Microphone access denied or not found. Continuing with silent fallback stream.', err);
      // Fallback: create silent audio track so user can still join and listen without microphone
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
  }, [isMuted, setIsConnectingAudio, setLocalStream, setupSpeechDetection]);

  // ── 4. WebRTC Signaling Listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    // Start mic
    initMicrophone().then((_stream) => {
      socket.emit('room:join', { roomId });
    });

    // Existing peers received upon joining
    const handlePeers = (data: { peers: Array<{ socketId: string }> }) => {
      console.log('[WebRTC] Room peers received:', data.peers);
      data.peers.forEach((peer) => {
        createPeerConnection(peer.socketId, true); // this client initiates to existing peers
      });
    };

    // A new peer joined the room
    const handlePeerJoined = (data: { socketId: string; displayName: string }) => {
      console.log('[WebRTC] Peer joined:', data.displayName);
      createPeerConnection(data.socketId, false); // wait for their offer
    };

    // Received RTC Offer
    const handleOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received offer from:', data.from);
      let pc = peerConnections.current.get(data.from);
      if (!pc) {
        pc = createPeerConnection(data.from, false);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('rtc:answer', {
          to: data.from,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    // Received RTC Answer
    const handleAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received answer from:', data.from);
      const pc = peerConnections.current.get(data.from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('[WebRTC] Error handling answer:', err);
        }
      }
    };

    // Received ICE Candidate
    const handleIceCandidate = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current.get(data.from);
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    };

    // Peer left
    const handlePeerLeft = (data: { socketId: string }) => {
      const pc = peerConnections.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.socketId);
      }
      const audio = remoteAudios.current.get(data.socketId);
      if (audio) {
        audio.srcObject = null;
        remoteAudios.current.delete(data.socketId);
      }
    };

    // Peer mute changes
    const handlePeerMute = (data: { uid: string; isMuted: boolean }) => {
      updateParticipantMute(data.uid, data.isMuted);
    };

    // Peer speaking changes
    const handlePeerSpeaking = (data: { uid: string; isSpeaking: boolean }) => {
      updateParticipantSpeaking(data.uid, data.isSpeaking);
    };

    // Force mute by host
    const handleForceMute = () => {
      useRoomStore.getState().setMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      socket.emit('audio:mute-toggle', { isMuted: true });
    };

    socket.on('room:peers', handlePeers);
    socket.on('room:peer-joined', handlePeerJoined);
    socket.on('room:peer-left', handlePeerLeft);
    socket.on('rtc:offer', handleOffer);
    socket.on('rtc:answer', handleAnswer);
    socket.on('rtc:ice-candidate', handleIceCandidate);
    socket.on('audio:peer-mute', handlePeerMute);
    socket.on('audio:peer-speaking', handlePeerSpeaking);
    socket.on('mod:force-mute', handleForceMute);

    return () => {
      socket.off('room:peers', handlePeers);
      socket.off('room:peer-joined', handlePeerJoined);
      socket.off('room:peer-left', handlePeerLeft);
      socket.off('rtc:offer', handleOffer);
      socket.off('rtc:answer', handleAnswer);
      socket.off('rtc:ice-candidate', handleIceCandidate);
      socket.off('audio:peer-mute', handlePeerMute);
      socket.off('audio:peer-speaking', handlePeerSpeaking);
      socket.off('mod:force-mute', handleForceMute);

      // Stop speech interval
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
      }

      // Close AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);

      // Close all peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();

      // Clean up remote audios
      remoteAudios.current.forEach((audio) => {
        audio.srcObject = null;
      });
      remoteAudios.current.clear();

      socket.emit('room:leave');
    };
  }, [
    createPeerConnection,
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
