import React, { useState } from 'react';
import { Room, User } from '../../types';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VoiceGrid } from './VoiceGrid';
import { AudioToolbar } from './AudioToolbar';
import { RoomSidebar } from './RoomSidebar';
import { Badge } from '../ui/Badge';
import {
  Radio,
  Lock,
  Unlock,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Headphones,
  Users,
} from 'lucide-react';

interface VoiceRoomProps {
  room: Room;
  onLeave: () => void;
  onOpenProfile: (user: User) => void;
}

export const VoiceRoom: React.FC<VoiceRoomProps> = ({
  room,
  onLeave,
  onOpenProfile,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize WebRTC audio engine for this room
  useWebRTC(room.id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#0c0c16] overflow-hidden">
      {/* Room Top Header Bar */}
      <div className="h-14 px-6 border-b border-white/10 bg-[#121222]/80 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onLeave}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
            title="Return to Discovery Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-md">
                {room.title}
              </h2>
              {!room.isPublic && (
                <span className="p-0.5 rounded bg-amber-500/20 text-amber-300">
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                {room.languages.map((l) => (
                  <Badge key={l} variant="language" language={l} className="py-0 text-[10px]">
                    {l}
                  </Badge>
                ))}
              </div>
              <Badge variant="level" level={room.level} className="py-0 text-[10px]">
                {room.level}
              </Badge>
              <span className="text-[10px] text-white/40 hidden sm:inline">
                Host: <strong className="text-white/70">{room.hostName}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/70 hover:text-white transition"
            title="Copy room link to invite friends"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share Room</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Center Area: Voice Grid + Collaborative Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <VoiceGrid room={room} onOpenProfile={onOpenProfile} />

        {isSidebarOpen && (
          <div className="absolute inset-y-0 right-0 z-20 md:static md:z-auto shadow-2xl md:shadow-none animate-fade-in-up">
            <RoomSidebar
              room={room}
              onClose={() => setIsSidebarOpen(false)}
              onOpenProfile={onOpenProfile}
            />
          </div>
        )}
      </div>

      {/* Bottom Audio Controls Bar */}
      <AudioToolbar
        onLeave={onLeave}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    </div>
  );
};
