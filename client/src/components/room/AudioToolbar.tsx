import React from 'react';
import { useRoomStore } from '../../stores/roomStore';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  MessageSquare,
  BookOpen,
  Users,
} from 'lucide-react';

interface AudioToolbarProps {
  onLeave: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AudioToolbar: React.FC<AudioToolbarProps> = ({
  onLeave,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const {
    isMuted,
    setMuted,
    isDeafened,
    setDeafened,
    activeSidebarTab,
    setActiveSidebarTab,
  } = useRoomStore();

  return (
    <footer className="w-full bg-[#101020] border-t border-white/10 px-3 sm:px-6 py-3 shrink-0 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Chat & Helper Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSidebarTab('chat');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isSidebarOpen && activeSidebarTab === 'chat'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
            }`}
            title="Open Room Chat & Corrections"
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Room Chat</span>
          </button>

          <button
            onClick={() => {
              setActiveSidebarTab('vocabulary');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isSidebarOpen && activeSidebarTab === 'vocabulary'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
            }`}
            title="Word Corrections & Notes"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Corrections</span>
          </button>
        </div>

        {/* Center: BIG PRIMARY MIC TOGGLE */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMuted(!isMuted)}
            className={`flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 shadow-xl active:scale-95 ${
              isMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/40 animate-pulse'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                <span>Muted (Tap to Speak)</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                <span>Microphone LIVE</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Deafen Audio & Leave Room */}
        <div className="flex items-center gap-2">
          {/* Deafen (Mute Sound) */}
          <button
            onClick={() => setDeafened(!isDeafened)}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              isDeafened
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
            title={isDeafened ? 'Sound Muted' : 'Sound ON'}
          >
            <Headphones className="w-4 h-4" />
            <span className="hidden md:inline">{isDeafened ? 'Unmute Sound' : 'Deafen'}</span>
          </button>

          {/* Leave Room Button */}
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs transition active:scale-95"
            title="Leave this voice room"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
