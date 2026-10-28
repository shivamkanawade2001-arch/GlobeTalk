import React from 'react';
import { Room } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  Mic,
  Headphones,
  Lock,
  Volume2,
  Users,
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room, asListener?: boolean) => void;
  onOpenUser?: (uid: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onJoin,
  onOpenUser,
}) => {
  const speakers = room.participants || [];
  const speakerCount = speakers.length;
  const maxCapacity = room.maxParticipants || 6;
  const isFull = speakerCount >= maxCapacity;
  const emptySlotsCount = Math.max(0, maxCapacity - speakerCount);
  const listenerCount = room.listeners?.length || 0;
  const hasActiveSpeaker = speakers.some((s) => s.isSpeaking && !s.isMuted);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-[#141426] hover:bg-[#181830] border border-white/10 hover:border-emerald-500/40 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5">
      <div>
        {/* Top Header: Languages & Room Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {room.languages.map((lang) => (
              <Badge key={lang} variant="language" language={lang}>
                {lang}
              </Badge>
            ))}
            <Badge variant="level" level={room.level}>
              {room.level}
            </Badge>
          </div>

          {!room.isPublic ? (
            <span
              className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs flex items-center gap-1"
              title="Locked Room"
            >
              <Lock className="w-3 h-3" />
              <span className="text-[10px]">Private</span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Now
            </span>
          )}
        </div>

        {/* Room Title */}
        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug mb-2">
          {room.title}
        </h3>

        {/* Topic Question Box */}
        {room.sharedMedia?.topicPrompt && (
          <div className="mb-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-indigo-200 leading-relaxed">
            <span className="font-semibold text-amber-400 mr-1">Topic:</span>
            {room.sharedMedia.topicPrompt}
          </div>
        )}

        {/* Visual Speaking Seats */}
        <div className="mb-4 p-3 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-white/70 flex items-center gap-1.5 text-[11px]">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Speaking Seats
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isFull
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {speakerCount} / {maxCapacity} Filled
            </span>
          </div>

          {/* Circular Avatar Slots representing speakers + empty seats */}
          <div className="flex flex-wrap items-center gap-2">
            {speakers.map((speaker) => (
              <div
                key={speaker.uid || speaker.socketId}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUser?.(speaker.uid);
                }}
                className="relative cursor-pointer"
                title={`${speaker.displayName}${speaker.isSpeaking ? ' (Speaking now)' : ''}`}
              >
                <Avatar
                  src={speaker.photoURL}
                  name={speaker.displayName}
                  size="md"
                  isSpeaking={speaker.isSpeaking && !speaker.isMuted}
                  isMuted={speaker.isMuted}
                  isVerified={speaker.isVerified}
                />
                {speaker.isSpeaking && !speaker.isMuted && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-emerald-500 text-black shadow-sm">
                    <Volume2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            ))}

            {/* Empty Seat Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/30 group-hover:border-emerald-500/30 group-hover:text-emerald-400/50 transition-colors"
                title="Available seat - click Join to speak!"
              >
                <Mic className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>

          {listenerCount > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Headphones className="w-3 h-3 text-indigo-400" />
                {listenerCount} quiet listener{listenerCount === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Join to Speak or Listen First */}
      <div className="space-y-2 pt-1">
        {isFull ? (
          <button
            onClick={() => onJoin(room, true)}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition"
          >
            <Headphones className="w-3.5 h-3.5" />
            Seats Full — Listen In (Audio)
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onJoin(room, false)}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              Join & Speak
            </button>
            <button
              onClick={() => onJoin(room, true)}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center justify-center gap-1 transition cursor-pointer"
              title="Join quietly as a listener"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Listen Only</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
