import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useRoomStore } from './stores/roomStore';
import { getSocket, identifyUser } from './services/socket';
import { Room, User } from './types';
import { Navbar } from './components/layout/Navbar';
import { Lobby } from './components/lobby/Lobby';
import { VoiceRoom } from './components/room/VoiceRoom';
import { FriendsPresence } from './components/social/FriendsPresence';
import { AuthModal } from './components/modals/AuthModal';
import { CreateRoomModal } from './components/modals/CreateRoomModal';
import { UserProfileModal } from './components/modals/UserProfileModal';

export function App() {
  const { user, setUser, setOnlineUsers, updateUserVouch } = useAuthStore();
  const {
    rooms,
    setRooms,
    upsertRoom,
    currentRoom,
    setCurrentRoom,
    addChatMessage,
    setChatMessages,
  } = useRoomStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [isFriendsDrawerOpen, setIsFriendsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Fetch Initial Rooms ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    };
    fetchRooms();
  }, [setRooms]);

  // ── 2. Socket Event Listeners ───────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    // Identify user on socket if logged in
    if (user) {
      identifyUser(user);
    }

    // Lobby room updates
    const handleRoomCreated = (data: { room: Room }) => {
      upsertRoom(data.room);
    };

    const handleRoomUpdated = (data: { room: Room }) => {
      upsertRoom(data.room);
      if (useRoomStore.getState().currentRoom?.id === data.room.id) {
        setCurrentRoom(data.room);
      }
    };

    // Presence update
    const handlePresence = (data: { users: any[] }) => {
      setOnlineUsers(data.users);
    };

    // Joined room confirmation
    const handleJoinedRoom = (data: { room: Room; messages: any[] }) => {
      setCurrentRoom(data.room);
      setChatMessages(data.messages || []);
    };

    // Chat message received
    const handleChatMessage = (msg: any) => {
      addChatMessage(msg);
    };

    // Moderation kicked
    const handleKicked = (data: { reason?: string; hostName?: string }) => {
      alert(data.reason || 'You were removed from the room by the host.');
      setCurrentRoom(null);
    };

    // Peer vouched for user
    const handleVouched = (data: { by: string; vouchCount: number; isVerified: boolean }) => {
      updateUserVouch(data.vouchCount, data.isVerified);
      showToast(
        `🎉 ${data.by} vouched for your speaking etiquette! (${data.vouchCount}/3 vouches${
          data.isVerified ? ' - You are now Verified!' : ''
        })`
      );
    };

    socket.on('lobby:room-created', handleRoomCreated);
    socket.on('lobby:room-updated', handleRoomUpdated);
    socket.on('presence:update', handlePresence);
    socket.on('room:joined', handleJoinedRoom);
    socket.on('chat:message', handleChatMessage);
    socket.on('mod:kicked', handleKicked);
    socket.on('social:vouched', handleVouched);

    return () => {
      socket.off('lobby:room-created', handleRoomCreated);
      socket.off('lobby:room-updated', handleRoomUpdated);
      socket.off('presence:update', handlePresence);
      socket.off('room:joined', handleJoinedRoom);
      socket.off('chat:message', handleChatMessage);
      socket.off('mod:kicked', handleKicked);
      socket.off('social:vouched', handleVouched);
    };
  }, [
    addChatMessage,
    setCurrentRoom,
    setOnlineUsers,
    setChatMessages,
    updateUserVouch,
    upsertRoom,
    user,
  ]);

  // ── 3. Join Room Flow ───────────────────────────────────────────────────────
  const handleJoinRoom = (room: Room, asListener: boolean = false) => {
    // If not logged in, prompt user to select identity / sign-in first
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Emit join
    getSocket().emit('room:join', { roomId: room.id, asListener });
    setCurrentRoom(room);
  };

  const handleLeaveRoom = () => {
    getSocket().emit('room:leave');
    setCurrentRoom(null);
  };

  const handleOpenCreateRoom = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCreateRoomModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F1A] text-white selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-2xl border border-white/20 text-xs font-semibold animate-fade-in-up flex items-center gap-2">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        onOpenCreateRoom={handleOpenCreateRoom}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setSelectedProfileUser(user)}
        onToggleFriends={() => setIsFriendsDrawerOpen(!isFriendsDrawerOpen)}
        isFriendsOpen={isFriendsDrawerOpen}
      />

      {/* Application Content View */}
      <div className="flex-1 flex overflow-hidden">
        {currentRoom ? (
          <VoiceRoom
            room={currentRoom}
            onLeave={handleLeaveRoom}
            onOpenProfile={(u) => setSelectedProfileUser(u)}
          />
        ) : (
          <main className="flex-1 flex overflow-y-auto">
            <Lobby
              rooms={rooms}
              onJoinRoom={handleJoinRoom}
              onOpenCreateRoom={handleOpenCreateRoom}
              onOpenProfile={(u) => setSelectedProfileUser(u)}
            />
          </main>
        )}

        {/* Live Friends Presence Sidebar Drawer (on Lobby or collapsible in room) */}
        {!currentRoom && isFriendsDrawerOpen && (
          <div className="absolute inset-y-16 right-0 z-30 md:static md:z-auto shadow-2xl md:shadow-none animate-fade-in-up">
            <FriendsPresence
              onJoinRoom={(roomId) => {
                const r = rooms.find((x) => x.id === roomId);
                if (r) handleJoinRoom(r);
              }}
              onOpenProfile={(u) => setSelectedProfileUser(u)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onRoomCreated={(roomId) => {
          const r = rooms.find((x) => x.id === roomId);
          if (r) setCurrentRoom(r);
        }}
      />

      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          onClose={() => setSelectedProfileUser(null)}
          onUpdateSelf={(updated) => {
            if (user) {
              const next = { ...user, ...updated };
              setUser(next);
              setSelectedProfileUser(next);
              identifyUser(next);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
