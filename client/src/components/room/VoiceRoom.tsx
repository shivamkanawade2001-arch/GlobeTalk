import React, { useState } from 'react';
import { Room, User } from '../../types';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VoiceGrid } from './VoiceGrid';
import { AudioToolbar } from './AudioToolbar';
import { RoomSidebar } from './RoomSidebar';
import { Badge } from '../ui/Badge';
import {
  Lock,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface VoiceRoomProps {
  room: Room;
  onLeave: () => void;
  onOpenProfile: (user: User) => void;
}

const DEFAULT_ICEBREAKERS = [
  'Tell us your name, college degree, and what job or career you are aiming for!',
  'What is the biggest fear or hesitation you have when speaking English?',
  'Introduce yourself and describe your hometown or state!',
  'What is one skill, technology, or hobby you love learning about?',
  'Describe a memorable day from your college or school life.',
  'What did you do today? Describe your daily routine in 3 sentences.',
  'If you had to prepare for a job interview tomorrow, how would you introduce yourself?',
];

export const VoiceRoom: React.FC<VoiceRoomProps> = ({
  room,
  onLeave,
  onOpenProfile,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [icebreakerIndex, setIcebreakerIndex] = useState(0);

  // Initialize WebRTC audio engine for this room
  useWebRTC(room.id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNextIcebreaker = () => {
    setIcebreakerIndex((prev) => (prev + 1) % DEFAULT_ICEBREAKERS.length);
  };

  const currentTopic =
    room.sharedMedia?.topicPrompt || DEFAULT_ICEBREAKERS[icebreakerIndex];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#0c0c16] overflow-hidden">
      {/* Room Top Header Bar */}
      <div className="h-14 px-4 sm:px-6 border-b border-white/10 bg-[#121222] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onLeave}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
            title="Leave room and return to Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
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
            </div>
          </div>
        </div>

        {/* Right Actions: Share Room Link */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition"
            title="Copy link to invite a friend"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite Friend</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Helpful Icebreaker / Question Banner (Eliminates Awkward Silences) */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900 border-b border-indigo-500/20 px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-white/60 shrink-0 hidden sm:inline">Speaking Question:</span>
          <span className="text-white font-medium truncate italic">
            "{currentTopic}"
          </span>
        </div>
        <button
          onClick={handleNextIcebreaker}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white font-semibold text-[11px] shrink-0 transition"
          title="Show next conversation starter"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Next Question</span>
        </button>
      </div>

      {/* Main Center Area: Voice Grid + Sidebar */}
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
