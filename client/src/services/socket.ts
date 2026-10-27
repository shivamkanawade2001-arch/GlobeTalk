import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to GlobeTalk signaling server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from signaling server:', reason);
    });
  }
  return socket;
}

export function identifyUser(user: { uid: string; displayName: string; photoURL: string; isVerified?: boolean }) {
  const s = getSocket();
  if (s.connected) {
    s.emit('user:identify', user);
  } else {
    s.once('connect', () => {
      s.emit('user:identify', user);
    });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
