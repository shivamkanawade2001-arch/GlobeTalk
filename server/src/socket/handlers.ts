import { Server, Socket } from 'socket.io';
import { rooms, users, roomMessages } from '../store';
import { Room, RoomParticipant, ChatMessage } from '../types';

// Map socket id to session details
interface ClientSession {
  socketId: string;
  uid: string;
  displayName: string;
  photoURL: string;
  isVerified: boolean;
  roomId?: string;
}

const sessions = new Map<string, ClientSession>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── 1. User Identity / Handshake ──────────────────────────────────────────
    socket.on('user:identify', (data: {
      uid: string;
      displayName: string;
      photoURL: string;
      isVerified?: boolean;
    }) => {
      let user = users.get(data.uid);
      if (!user) {
        user = {
          uid: data.uid,
          displayName: data.displayName || 'Learner',
          photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.uid}`,
          email: `${data.uid}@globetalk.io`,
          isVerified: !!data.isVerified,
          vouchCount: 0,
          vouchedBy: [],
          nativeLanguages: ['English'],
          learningLanguages: ['Spanish'],
          followers: [],
          following: [],
          createdAt: Date.now(),
          bio: 'Language enthusiast on GlobeTalk 🌍',
          country: 'Global',
          currentRoomId: null,
        };
        users.set(data.uid, user);
      }

      sessions.set(socket.id, {
        socketId: socket.id,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isVerified: user.isVerified,
      });

      socket.join(`user:${user.uid}`);

      // Broadcast user presence
      broadcastPresence(io);
    });

    // ── 2. Room Join ──────────────────────────────────────────────────────────
    socket.on('room:join', (data: { roomId: string; asListener?: boolean }) => {
      const { roomId, asListener = false } = data;
      const session = sessions.get(socket.id);
      if (!session) return;

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error:room-not-found');
        return;
      }

      // Check room full
      if (!asListener && room.participants.length >= room.maxParticipants) {
        // If listeners allowed, join as listener
        if (room.allowListeners) {
          joinAsListener(io, socket, room, session);
          return;
        } else {
          socket.emit('room:full', { message: 'Room has reached maximum speaker capacity' });
          return;
        }
      }

      // Leave any existing room
      if (session.roomId && session.roomId !== roomId) {
        leaveCurrentRoom(io, socket, session);
      }

      socket.join(roomId);
      session.roomId = roomId;

      // Update user profile presence
      const user = users.get(session.uid);
      if (user) user.currentRoomId = roomId;

      const participant: RoomParticipant = {
        socketId: socket.id,
        uid: session.uid,
        displayName: session.displayName,
        photoURL: session.photoURL,
        isMuted: false,
        isSpeaking: false,
        isHost: room.hostId === session.uid,
        isListener: asListener,
        isVerified: session.isVerified,
      };

      if (asListener) {
        // remove duplicate if any
        room.listeners = room.listeners.filter((l) => l.uid !== session.uid);
        room.listeners.push(participant);
      } else {
        room.participants = room.participants.filter((p) => p.uid !== session.uid);
        room.participants.push(participant);
      }

      // Send initial room state & message history to joiner
      const history = roomMessages.get(roomId) || [];
      const peers = room.participants
        .filter((p) => p.socketId !== socket.id && !p.socketId.startsWith('mock-'))
        .map((p) => ({
          socketId: p.socketId,
          uid: p.uid,
          displayName: p.displayName,
          photoURL: p.photoURL,
          isMuted: p.isMuted,
          isSpeaking: p.isSpeaking,
        }));

      socket.emit('room:joined', {
        room,
        messages: history,
        peers,
      });

      // Explicitly send room:peers to joiner for WebRTC peer connections
      socket.emit('room:peers', { peers });

      // Notify all other peers in the room that a new peer joined
      socket.to(roomId).emit('room:peer-joined', {
        socketId: socket.id,
        uid: session.uid,
        displayName: session.displayName,
        photoURL: session.photoURL,
      });

      // Broadcast updated room state to all members in room
      io.to(roomId).emit('room:updated', { room });
      // Broadcast to lobby
      io.emit('lobby:room-updated', { room });
      broadcastPresence(io);

      console.log(`[Room] ${session.displayName} joined ${room.title} (${asListener ? 'Listener' : 'Speaker'})`);
    });

    // ── 3. Room Leave ─────────────────────────────────────────────────────────
    socket.on('room:leave', () => {
      const session = sessions.get(socket.id);
      if (session && session.roomId) {
        leaveCurrentRoom(io, socket, session);
      }
    });

    // ── 4. WebRTC Mesh Signaling ──────────────────────────────────────────────
    socket.on('rtc:offer', (data: { to: string; offer: any }) => {
      io.to(data.to).emit('rtc:offer', {
        from: socket.id,
        offer: data.offer,
      });
    });

    socket.on('rtc:answer', (data: { to: string; answer: any }) => {
      io.to(data.to).emit('rtc:answer', {
        from: socket.id,
        answer: data.answer,
      });
    });

    socket.on('rtc:ice-candidate', (data: { to: string; candidate: any }) => {
      io.to(data.to).emit('rtc:ice-candidate', {
        from: socket.id,
        candidate: data.candidate,
      });
    });

    // ── 5. Audio Mute / Speaking Indicators ───────────────────────────────────
    socket.on('audio:mute-toggle', (data: { isMuted: boolean }) => {
      const session = sessions.get(socket.id);
      if (!session?.roomId) return;
      const room = rooms.get(session.roomId);
      if (!room) return;

      const p = room.participants.find((x) => x.socketId === socket.id);
      if (p) {
        p.isMuted = data.isMuted;
        if (data.isMuted) p.isSpeaking = false;
      }
      io.to(session.roomId).emit('audio:peer-mute', {
        socketId: socket.id,
        uid: session.uid,
        isMuted: data.isMuted,
      });
      io.to(session.roomId).emit('room:updated', { room });
    });

    socket.on('audio:speaking', (data: { isSpeaking: boolean }) => {
      const session = sessions.get(socket.id);
      if (!session?.roomId) return;
      const room = rooms.get(session.roomId);
      if (!room) return;

      const p = room.participants.find((x) => x.socketId === socket.id);
      if (p && !p.isMuted) {
        p.isSpeaking = data.isSpeaking;
      }
      io.to(session.roomId).emit('audio:peer-speaking', {
        socketId: socket.id,
        uid: session.uid,
        isSpeaking: data.isSpeaking,
      });
    });

    // ── 6. Chat & Vocabulary Corrections ──────────────────────────────────────
    socket.on('chat:message', (data: {
      roomId: string;
      text: string;
      type?: 'chat' | 'correction' | 'vocab';
      original?: string;
      correction?: string;
      note?: string;
    }) => {
      const session = sessions.get(socket.id);
      if (!session) return;

      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        roomId: data.roomId,
        senderId: session.uid,
        senderName: session.displayName,
        senderAvatar: session.photoURL,
        text: data.text,
        type: data.type || 'chat',
        original: data.original,
        correction: data.correction,
        note: data.note,
        timestamp: Date.now(),
      };

      if (!roomMessages.has(data.roomId)) {
        roomMessages.set(data.roomId, []);
      }
      roomMessages.get(data.roomId)!.push(msg);

      io.to(data.roomId).emit('chat:message', msg);
    });

    // ── 7. Collaborative Media & Whiteboard ───────────────────────────────────
    socket.on('media:update', (data: {
      roomId: string;
      media: Room['sharedMedia'];
    }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      room.sharedMedia = data.media;
      io.to(data.roomId).emit('media:updated', { media: data.media });
      io.to(data.roomId).emit('room:updated', { room });
    });

    // ── 8. Host Moderation ────────────────────────────────────────────────────
    socket.on('mod:kick', (data: { targetUid: string; roomId: string }) => {
      const session = sessions.get(socket.id);
      const room = rooms.get(data.roomId);
      if (!room || !session || room.hostId !== session.uid) return;

      // Find target socket
      const targetP = room.participants.find((p) => p.uid === data.targetUid) ||
                      room.listeners.find((l) => l.uid === data.targetUid);
      if (!targetP) return;

      io.to(targetP.socketId).emit('mod:kicked', {
        reason: 'The host removed you from the room.',
        hostName: session.displayName,
      });

      // Evict target
      room.participants = room.participants.filter((p) => p.uid !== data.targetUid);
      room.listeners = room.listeners.filter((l) => l.uid !== data.targetUid);

      io.to(data.roomId).emit('room:updated', { room });
      io.emit('lobby:room-updated', { room });
    });

    socket.on('mod:mute-peer', (data: { targetUid: string; roomId: string }) => {
      const session = sessions.get(socket.id);
      const room = rooms.get(data.roomId);
      if (!room || !session || room.hostId !== session.uid) return;

      const targetP = room.participants.find((p) => p.uid === data.targetUid);
      if (targetP) {
        targetP.isMuted = true;
        targetP.isSpeaking = false;
        io.to(targetP.socketId).emit('mod:force-mute');
        io.to(data.roomId).emit('audio:peer-mute', {
          socketId: targetP.socketId,
          uid: targetP.uid,
          isMuted: true,
        });
        io.to(data.roomId).emit('room:updated', { room });
      }
    });

    socket.on('mod:lock-toggle', (data: { roomId: string }) => {
      const session = sessions.get(socket.id);
      const room = rooms.get(data.roomId);
      if (!room || !session || room.hostId !== session.uid) return;

      room.isPublic = !room.isPublic;
      io.to(data.roomId).emit('room:updated', { room });
      io.emit('lobby:room-updated', { room });
    });

    socket.on('mod:transfer-host', (data: { targetUid: string; roomId: string }) => {
      const session = sessions.get(socket.id);
      const room = rooms.get(data.roomId);
      if (!room || !session || room.hostId !== session.uid) return;

      const targetP = room.participants.find((p) => p.uid === data.targetUid);
      if (targetP) {
        room.hostId = targetP.uid;
        room.hostName = targetP.displayName;
        room.hostAvatar = targetP.photoURL;
        room.participants.forEach((p) => {
          p.isHost = p.uid === targetP.uid;
        });
        io.to(data.roomId).emit('room:updated', { room });
        io.emit('lobby:room-updated', { room });
      }
    });

    // ── 9. Social Follow & Peer Verification ──────────────────────────────────
    socket.on('social:follow', (data: { targetUid: string }) => {
      const session = sessions.get(socket.id);
      if (!session) return;

      const actor = users.get(session.uid);
      const target = users.get(data.targetUid);
      if (!actor || !target || actor.uid === target.uid) return;

      const isFollowing = actor.following.includes(target.uid);
      if (isFollowing) {
        actor.following = actor.following.filter((id) => id !== target.uid);
        target.followers = target.followers.filter((id) => id !== actor.uid);
      } else {
        actor.following.push(target.uid);
        if (!target.followers.includes(actor.uid)) target.followers.push(actor.uid);
      }

      socket.emit('social:updated', { actor, target });
      io.to(`user:${target.uid}`).emit('social:updated', { actor, target });
      broadcastPresence(io);
    });

    socket.on('social:vouch', (data: { targetUid: string }) => {
      const session = sessions.get(socket.id);
      if (!session) return;

      const voucher = users.get(session.uid);
      const target = users.get(data.targetUid);
      if (!voucher || !target || voucher.uid === target.uid) return;

      // Only verified users can vouch
      if (!voucher.isVerified) {
        socket.emit('social:vouch-error', { message: 'Only verified community members can vouch for peers.' });
        return;
      }

      if (!target.vouchedBy.includes(voucher.uid)) {
        target.vouchedBy.push(voucher.uid);
        target.vouchCount = target.vouchedBy.length;
        // 3 vouches unlocks Verified status
        if (target.vouchCount >= 3) {
          target.isVerified = true;
        }
      }

      io.emit('social:user-updated', { user: target });
      io.to(`user:${target.uid}`).emit('social:vouched', {
        by: voucher.displayName,
        vouchCount: target.vouchCount,
        isVerified: target.isVerified,
      });
    });

    // ── 10. Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const session = sessions.get(socket.id);
      if (session) {
        if (session.roomId) {
          leaveCurrentRoom(io, socket, session);
        }
        sessions.delete(socket.id);
        const user = users.get(session.uid);
        if (user) user.currentRoomId = null;
        broadcastPresence(io);
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

function leaveCurrentRoom(io: Server, socket: Socket, session: ClientSession) {
  const roomId = session.roomId;
  if (!roomId) return;

  socket.leave(roomId);
  session.roomId = undefined;

  const room = rooms.get(roomId);
  if (room) {
    room.participants = room.participants.filter((p) => p.socketId !== socket.id);
    room.listeners = room.listeners.filter((l) => l.socketId !== socket.id);

    // If host left and there are other participants, promote next participant
    if (room.hostId === session.uid && room.participants.length > 0) {
      const newHost = room.participants[0];
      newHost.isHost = true;
      room.hostId = newHost.uid;
      room.hostName = newHost.displayName;
      room.hostAvatar = newHost.photoURL;
    }

    io.to(roomId).emit('room:peer-left', { socketId: socket.id, uid: session.uid });
    io.to(roomId).emit('room:updated', { room });
    io.emit('lobby:room-updated', { room });
  }

  const user = users.get(session.uid);
  if (user) user.currentRoomId = null;
}

function joinAsListener(io: Server, socket: Socket, room: Room, session: ClientSession) {
  socket.join(room.id);
  session.roomId = room.id;

  const participant: RoomParticipant = {
    socketId: socket.id,
    uid: session.uid,
    displayName: session.displayName,
    photoURL: session.photoURL,
    isMuted: true,
    isSpeaking: false,
    isHost: false,
    isListener: true,
    isVerified: session.isVerified,
  };

  room.listeners = room.listeners.filter((l) => l.uid !== session.uid);
  room.listeners.push(participant);

  const history = roomMessages.get(room.id) || [];
  socket.emit('room:joined', {
    room,
    messages: history,
    peers: room.participants,
    isListener: true,
  });

  io.to(room.id).emit('room:updated', { room });
  io.emit('lobby:room-updated', { room });
  broadcastPresence(io);
}

function broadcastPresence(io: Server) {
  const onlineUsers = Array.from(users.values()).map((u) => ({
    uid: u.uid,
    displayName: u.displayName,
    photoURL: u.photoURL,
    isVerified: u.isVerified,
    currentRoomId: u.currentRoomId,
    vouchCount: u.vouchCount,
  }));
  io.emit('presence:update', { users: onlineUsers });
}
