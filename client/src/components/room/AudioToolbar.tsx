import React, { useState } from 'react';
import { useRoomStore } from '../../stores/roomStore';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  MessageSquare,
  BookOpen,
  Share2,
  Settings,
  Wifi,
  Sparkles,
  FileText,
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
    audioQuality,
    setAudioQuality,
    activeSidebarTab,
    setActiveSidebarTab,
  } = useRoomStore();

  const [showQualityMenu, setShowQualityMenu] = useState(false);

  return (
    <footer className="w-full bg-[#101020]/95 backdrop-blur-xl border-t border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Audio Quality / Stability Indicator */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/70 hover:text-white transition"
            title="Adjust WebRTC Audio Bandwidth Quality"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-medium">Bandwidth:</span>
            <span className="text-emerald-400 font-bold">{audioQuality}</span>
          </button>

          {showQualityMenu && (
            <div className="absolute left-0 bottom-12 z-40 w-52 rounded-2xl bg-[#1c1c36] border border-white/10 shadow-2xl p-2 space-y-1 animate-fade-in-up">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 py-1 block">
                Connection Bandwidth
              </span>
              {(['High', 'Standard', 'Low-Bandwidth'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setAudioQuality(q);
                    setShowQualityMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition ${
                    audioQuality === q
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{q}</span>
                  {audioQuality === q && <span className="text-[10px]">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Main Primary Controls (Mic, Deafen, Leave) */}
        <div className="flex items-center gap-3">
          {/* Mic Toggle Button */}
          <button
            onClick={() => setMuted(!isMuted)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-95 ${
              isMuted
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/30'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-5 h-5 stroke-[2.5]" />
                <span>Unmute Mic</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 stroke-[2.5]" />
                <span>Mute Mic</span>
              </>
            )}
          </button>

          {/* Deafen (Mute Sound) */}
          <button
            onClick={() => setDeafened(!isDeafened)}
            className={`p-3 rounded-2xl border transition active:scale-95 ${
              isDeafened
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
            }`}
            title={isDeafened ? 'Undeafen audio' : 'Deafen (Mute all incoming audio)'}
          >
            <Headphones className="w-5 h-5" />
          </button>

          {/* Leave Room Button */}
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-white/80 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 font-bold text-xs transition active:scale-95"
            title="Leave this voice room"
          >
            <PhoneOff className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>

        {/* Right: Sidebar & Collaborative Tools Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setActiveSidebarTab('chat');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            className={`p-2.5 rounded-xl border transition ${
              isSidebarOpen && activeSidebarTab === 'chat'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
            }`}
            title="Room Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setActiveSidebarTab('vocabulary');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            className={`p-2.5 rounded-xl border transition ${
              isSidebarOpen && activeSidebarTab === 'vocabulary'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
            }`}
            title="Vocabulary & Corrections"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setActiveSidebarTab('media');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            className={`p-2.5 rounded-xl border transition ${
              isSidebarOpen && activeSidebarTab === 'media'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
            }`}
            title="Shared Topics & Whiteboard"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setActiveSidebarTab('participants');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            className={`p-2.5 rounded-xl border transition ${
              isSidebarOpen && activeSidebarTab === 'participants'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
            }`}
            title="Speakers & Moderation"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
