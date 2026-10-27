import React, { useState } from 'react';
import { Room, Participant, User } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { getSocket } from '../../services/socket';
import {
  Mic,
  MicOff,
  Crown,
  Volume2,
  MoreVertical,
  UserPlus,
  UserCheck,
  Award,
  ShieldAlert,
  Headphones,
  UserX,
  Sparkles,
} from 'lucide-react';

interface VoiceGridProps {
  room: Room;
  onOpenProfile: (user: User) => void;
}

export const VoiceGrid: React.FC<VoiceGridProps> = ({ room, onOpenProfile }) => {
  const currentUser = useAuthStore((s) => s.user);
  const toggleFollow = useAuthStore((s) => s.toggleFollow);

  const [activeMenuPeer, setActiveMenuPeer] = useState<string | null>(null);

  const speakers = room.participants || [];
  const maxCapacity = room.maxParticipants || 6;
  const emptySlotsCount = Math.max(0, maxCapacity - speakers.length);
  const isHost = room.hostId === currentUser?.uid;

  const handleMutePeer = (peer: Participant) => {
    if (!isHost) return;
    getSocket().emit('mod:mute-peer', {
      targetUid: peer.uid,
      roomId: room.id,
    });
    setActiveMenuPeer(null);
  };

  const handleKickPeer = (peer: Participant) => {
    if (!isHost) return;
    if (confirm(`Remove ${peer.displayName} from this room?`)) {
      getSocket().emit('mod:kick', {
        targetUid: peer.uid,
        roomId: room.id,
      });
      setActiveMenuPeer(null);
    }
  };

  const handleTransferHost = (peer: Participant) => {
    if (!isHost) return;
    getSocket().emit('mod:transfer-host', {
      targetUid: peer.uid,
      roomId: room.id,
    });
    setActiveMenuPeer(null);
  };

  const handleVouch = (peer: Participant) => {
    if (!currentUser?.isVerified) {
      alert('Only verified members can vouch for learners.');
      return;
    }
    getSocket().emit('social:vouch', { targetUid: peer.uid });
    setActiveMenuPeer(null);
  };

  const handleFollow = (peer: Participant) => {
    toggleFollow(peer.uid);
    getSocket().emit('social:follow', { targetUid: peer.uid });
    setActiveMenuPeer(null);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      {/* Speaking Grid Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
          {/* Active Speakers */}
          {speakers.map((peer) => {
            const isSelf = peer.uid === currentUser?.uid;
            const isPeerHost = peer.isHost || peer.uid === room.hostId;
            const isSpeaking = peer.isSpeaking && !peer.isMuted;
            const isFollowing = currentUser?.following?.includes(peer.uid) || false;

            return (
              <div
                key={peer.uid || peer.socketId}
                className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300 border ${
                  isSpeaking
                    ? 'bg-[#181a38] border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-[1.02]'
                    : 'bg-[#141426]/80 hover:bg-[#181830] border-white/5'
                }`}
              >
                {/* Host Crown */}
                {isPeerHost && (
                  <span className="absolute top-3 left-3 p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 text-[10px] font-bold">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Host
                  </span>
                )}

                {/* Peer Options Menu Button */}
                {!isSelf && (
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() =>
                        setActiveMenuPeer(activeMenuPeer === peer.uid ? null : peer.uid)
                      }
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Popover Menu */}
                    {activeMenuPeer === peer.uid && (
                      <div className="absolute right-0 top-7 z-30 w-48 rounded-2xl bg-[#1c1c36] border border-white/10 shadow-2xl p-1.5 space-y-1 animate-fade-in-up">
                        <button
                          onClick={() => {
                            onOpenProfile({
                              uid: peer.uid,
                              displayName: peer.displayName,
                              photoURL: peer.photoURL,
                              isVerified: peer.isVerified || false,
                              vouchCount: 0,
                              vouchedBy: [],
                              nativeLanguages: ['English'],
                              learningLanguages: ['Spanish'],
                              followers: [],
                              following: [],
                              createdAt: Date.now(),
                              email: '',
                            });
                            setActiveMenuPeer(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/10 hover:text-white text-left transition"
                        >
                          View Full Profile
                        </button>

                        <button
                          onClick={() => handleFollow(peer)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/10 hover:text-white text-left transition"
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" /> Follow Speaker
                            </>
                          )}
                        </button>

                        {currentUser?.isVerified && !peer.isVerified && (
                          <button
                            onClick={() => handleVouch(peer)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-300 hover:bg-emerald-500/20 text-left transition"
                          >
                            <Award className="w-3.5 h-3.5 text-emerald-400" /> Vouch for Verification
                          </button>
                        )}

                        {/* Host Moderation Controls */}
                        {isHost && (
                          <>
                            <div className="border-t border-white/10 my-1"></div>
                            <button
                              onClick={() => handleMutePeer(peer)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-500/20 text-left transition"
                            >
                              <MicOff className="w-3.5 h-3.5" /> Mute Microphone
                            </button>
                            <button
                              onClick={() => handleTransferHost(peer)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-indigo-300 hover:bg-indigo-500/20 text-left transition"
                            >
                              <Crown className="w-3.5 h-3.5" /> Make Room Host
                            </button>
                            <button
                              onClick={() => handleKickPeer(peer)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20 text-left transition"
                            >
                              <UserX className="w-3.5 h-3.5" /> Kick From Room
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Avatar with Animated Speaking Ring */}
                <div className="relative mb-3.5">
                  <Avatar
                    src={peer.photoURL}
                    name={peer.displayName}
                    size="xl"
                    isSpeaking={isSpeaking}
                    isMuted={peer.isMuted}
                    isVerified={peer.isVerified}
                    className="shadow-xl"
                  />

                  {/* Mic Status Pill */}
                  <span
                    className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ring-4 ring-[#141426] shadow-md ${
                      peer.isMuted
                        ? 'bg-rose-500 text-white'
                        : isSpeaking
                        ? 'bg-emerald-500 text-black animate-bounce'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {peer.isMuted ? (
                      <MicOff className="w-3 h-3" />
                    ) : (
                      <Mic className="w-3 h-3" />
                    )}
                  </span>
                </div>

                {/* Name & Badge */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-bold text-white max-w-[130px] truncate">
                      {peer.displayName} {isSelf && '(You)'}
                    </span>
                  </div>

                  <span className="text-[11px] text-white/50 block mt-0.5">
                    {peer.isMuted
                      ? 'Microphone muted'
                      : isSpeaking
                      ? 'Speaking now...'
                      : 'Listening'}
                  </span>
                </div>

                {/* Voice Audio Wave Visualizer when speaking */}
                {isSpeaking && (
                  <div className="flex items-center gap-1 mt-3 h-3">
                    <span className="w-1 bg-emerald-400 rounded-full h-2 animate-pulse"></span>
                    <span className="w-1 bg-emerald-400 rounded-full h-3.5 animate-bounce"></span>
                    <span className="w-1 bg-emerald-400 rounded-full h-1.5 animate-pulse"></span>
                    <span className="w-1 bg-emerald-400 rounded-full h-3 animate-bounce"></span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty Seats */}
          {Array.from({ length: emptySlotsCount }).map((_, idx) => (
            <div
              key={`empty-grid-${idx}`}
              className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-colors text-center"
            >
              <div className="w-16 h-16 rounded-full border border-white/15 flex items-center justify-center text-white/20 mb-3">
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-white/40 block">Open Speaker Seat</span>
              <span className="text-[10px] text-white/25 mt-0.5">Waiting for learner...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overflow Listeners Tray */}
      {room.allowListeners && (room.listeners?.length || 0) > 0 && (
        <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-white/70">
              Silent Listeners ({room.listeners.length})
            </span>
          </div>

          <div className="flex items-center -space-x-2">
            {room.listeners.slice(0, 8).map((l) => (
              <Avatar
                key={l.uid || l.socketId}
                src={l.photoURL}
                name={l.displayName}
                size="sm"
                className="ring-2 ring-[#0F0F1A]"
              />
            ))}
            {room.listeners.length > 8 && (
              <span className="w-8 h-8 rounded-full bg-white/10 text-white/70 text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0F0F1A]">
                +{room.listeners.length - 8}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
