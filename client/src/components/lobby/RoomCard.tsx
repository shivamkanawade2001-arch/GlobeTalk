import React from 'react';
import { Room, LANGUAGE_EMOJIS } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  Mic,
  MicOff,
  Headphones,
  Lock,
  Volume2,
  Sparkles,
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
    <div className="group relative flex flex-col justify-between rounded-2xl bg-[#141426]/90 hover:bg-[#18182e] border border-white/10 hover:border-indigo-500/40 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      {/* Glow highlight for rooms with active speakers */}
      {hasActiveSpeaker && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-indigo-500/5 pointer-events-none" />
      )}

      <div>
        {/* Top Header: Languages & Level Tag */}
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

          {!room.isPublic && (
            <span
              className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
              title="Locked Room"
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Room Title */}
        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug mb-2">
          {room.title}
        </h3>

        {/* Tags */}
        {room.tags && room.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="tag">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Topic Starter Preview if any */}
        {room.sharedMedia?.topicPrompt && (
          <div className="mb-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/70 italic line-clamp-2">
            💬 "{room.sharedMedia.topicPrompt}"
          </div>
        )}

        {/* Visual Capacity Slots Section */}
        <div className="mb-4 p-3 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="font-semibold text-white/70 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Live Conversation Seats
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                isFull
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {speakerCount} of {maxCapacity} Filled
            </span>
          </div>

          {/* Circular Avatar Slots representing speakers + empty seats */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Speakers */}
            {speakers.map((speaker) => (
              <div
                key={speaker.uid || speaker.socketId}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUser?.(speaker.uid);
                }}
                className="relative group/slot cursor-pointer"
                title={`${speaker.displayName}${speaker.isHost ? ' (Host)' : ''}${
                  speaker.isSpeaking ? ' - Speaking now' : ''
                }`}
              >
                <Avatar
                  src={speaker.photoURL}
                  name={speaker.displayName}
                  size="md"
                  isSpeaking={speaker.isSpeaking && !speaker.isMuted}
                  isMuted={speaker.isMuted}
                  isVerified={speaker.isVerified}
                />
                {speaker.isHost && (
                  <span className="absolute -top-1 -left-1 text-[11px] bg-amber-500/90 text-black px-1 rounded-full font-bold shadow-sm">
                    👑
                  </span>
                )}
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
                className="w-11 h-11 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/30 group-hover:border-indigo-500/30 group-hover:text-indigo-400/50 transition-colors"
                title="Available seat - click Join to speak!"
              >
                <Mic className="w-4 h-4" />
              </div>
            ))}
          </div>

          {/* Listener count row */}
          {room.allowListeners && (
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Headphones className="w-3 h-3 text-indigo-400" />
                {listenerCount} silent learner{listenerCount === 1 ? '' : 's'} listening
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">● Audio Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2">
        {isFull ? (
          room.allowListeners ? (
            <button
              onClick={() => onJoin(room, true)}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Headphones className="w-3.5 h-3.5" />
              Seats Full — Listen In (Audio Only)
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white/5 text-white/30 border border-white/5 cursor-not-allowed"
            >
              Room at Full Capacity
            </button>
          )
        ) : (
          <button
            onClick={() => onJoin(room, false)}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/40"
          >
            <Mic className="w-4 h-4" />
            Join and Talk Now
          </button>
        )}
      </div>
    </div>
  );
};
