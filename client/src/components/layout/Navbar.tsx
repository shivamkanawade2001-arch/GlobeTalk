import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  Globe,
  Plus,
  Users,
  Radio,
  LogIn,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenCreateRoom: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onToggleFriends: () => void;
  isFriendsOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateRoom,
  onOpenAuth,
  onOpenProfile,
  onToggleFriends,
  isFriendsOpen,
}) => {
  const user = useAuthStore((s) => s.user);
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const rooms = useRoomStore((s) => s.rooms);

  const friendsOnlineCount = onlineUsers.filter((u) =>
    user?.following?.includes(u.uid)
  ).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0F0F1A]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/30 text-white">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-white tracking-tight">
                  Globe<span className="text-emerald-400">Talk</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Free Spoken English
                </span>
              </div>
              <p className="text-[10px] text-white/50 tracking-wide hidden sm:block">
                Live Peer-to-Peer Speaking Practice
              </p>
            </div>
          </div>

          {/* Quick Metrics (Active Rooms & Speakers) */}
          <div className="hidden lg:flex items-center gap-3 ml-6 pl-6 border-l border-white/10 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <strong className="text-white">{rooms.length}</strong> Active Rooms
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-white">{onlineUsers.length || 18}</strong> Learners Speaking
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Create Room Button */}
          <button
            onClick={onOpenCreateRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Start Practice Room</span>
            <span className="sm:hidden">Start Room</span>
          </button>

          {/* Friends Presence Toggle */}
          <button
            onClick={onToggleFriends}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isFriendsOpen
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
            }`}
            title="Toggle Live Friends Presence"
          >
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Friends</span>
            {friendsOnlineCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                {friendsOnlineCount}
              </span>
            )}
          </button>

          {/* User Auth / Profile Badge */}
          {user ? (
            <div
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition"
            >
              <Avatar
                src={user.photoURL}
                name={user.displayName}
                size="sm"
                isVerified={user.isVerified}
              />
              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-white max-w-[100px] truncate">
                    {user.displayName}
                  </span>
                  {user.isVerified && (
                    <ShieldCheck className="w-3 h-3 text-sky-400" />
                  )}
                </div>
                <span className="text-[10px] text-white/40 block">
                  {user.isVerified ? 'Verified' : `${user.vouchCount || 0}/3 Vouches`}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-gray-900 hover:bg-gray-100 transition shadow"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
