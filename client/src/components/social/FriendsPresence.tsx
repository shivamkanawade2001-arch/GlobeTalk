import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { User } from '../../types';
import {
  Users,
  Radio,
  UserCheck,
  Award,
  Sparkles,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

interface FriendsPresenceProps {
  onJoinRoom: (roomId: string) => void;
  onOpenProfile: (user: User) => void;
}

export const FriendsPresence: React.FC<FriendsPresenceProps> = ({
  onJoinRoom,
  onOpenProfile,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const rooms = useRoomStore((s) => s.rooms);

  // Filter into friends (followed users who are online) and community members
  const friends = onlineUsers.filter(
    (u) => currentUser?.following?.includes(u.uid) && u.uid !== currentUser.uid
  );
  const otherLearners = onlineUsers.filter(
    (u) => !currentUser?.following?.includes(u.uid) && u.uid !== currentUser?.uid
  );

  return (
    <div className="flex flex-col h-full bg-[#121222] border-l border-white/5 w-80 shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Presence
            </h4>
            <span className="text-[10px] text-white/40">
              {onlineUsers.length} online language learners
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Friends Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Friends ({friends.length})
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="px-3 py-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
              <p className="text-xs text-white/40">No friends online right now.</p>
              <p className="text-[11px] text-white/30 mt-1">
                Follow speakers in rooms to see when they hop into practice!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {friends.map((friend) => {
                const room = rooms.find((r) => r.id === friend.currentRoomId);

                return (
                  <div
                    key={friend.uid}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition flex items-center justify-between group"
                  >
                    <div
                      onClick={() =>
                        onOpenProfile({
                          uid: friend.uid,
                          displayName: friend.displayName,
                          photoURL: friend.photoURL,
                          isVerified: friend.isVerified,
                          vouchCount: friend.vouchCount || 0,
                          vouchedBy: [],
                          nativeLanguages: ['English'],
                          learningLanguages: ['Spanish'],
                          followers: [],
                          following: [],
                          createdAt: Date.now(),
                          email: '',
                        })
                      }
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    >
                      <Avatar
                        src={friend.photoURL}
                        name={friend.displayName}
                        size="sm"
                        isVerified={friend.isVerified}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-white truncate">
                            {friend.displayName}
                          </span>
                        </div>
                        {room ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 truncate font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                            In: {room.title}
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/40 block">In Lobby</span>
                        )}
                      </div>
                    </div>

                    {room && (
                      <button
                        onClick={() => onJoinRoom(room.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition shrink-0 flex items-center gap-1"
                        title="Jump into their voice room"
                      >
                        Join
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Community Learners Online */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Community Members ({otherLearners.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {otherLearners.map((learner) => {
              const room = rooms.find((r) => r.id === learner.currentRoomId);

              return (
                <div
                  key={learner.uid}
                  className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition flex items-center justify-between"
                >
                  <div
                    onClick={() =>
                      onOpenProfile({
                        uid: learner.uid,
                        displayName: learner.displayName,
                        photoURL: learner.photoURL,
                        isVerified: learner.isVerified,
                        vouchCount: learner.vouchCount || 0,
                        vouchedBy: [],
                        nativeLanguages: ['English'],
                        learningLanguages: ['Spanish'],
                        followers: [],
                        following: [],
                        createdAt: Date.now(),
                        email: '',
                      })
                    }
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <Avatar
                      src={learner.photoURL}
                      name={learner.displayName}
                      size="xs"
                      isVerified={learner.isVerified}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-white/90 truncate block">
                        {learner.displayName}
                      </span>
                      {room ? (
                        <span className="text-[10px] text-indigo-400/80 truncate block">
                          Speaking in: {room.title}
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/30 block">Browsing lobby</span>
                      )}
                    </div>
                  </div>

                  {room && (
                    <button
                      onClick={() => onJoinRoom(room.id)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Peer Verification Community Info Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Peer-Verified Community
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Verified members vouch for friendly, respectful learners. 3 vouches unlocks Verified status and room moderation privileges.
          </p>
        </div>
      </div>
    </div>
  );
};
