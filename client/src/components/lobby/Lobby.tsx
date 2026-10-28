import React, { useState, useMemo } from 'react';
import { Room, User } from '../../types';
import { RoomCard } from './RoomCard';
import { RoomFilters } from './RoomFilters';
import { Plus, Radio, Sparkles, Mic, Users, HeartHandshake } from 'lucide-react';

interface LobbyProps {
  rooms: Room[];
  onJoinRoom: (room: Room, asListener?: boolean) => void;
  onOpenCreateRoom: () => void;
  onOpenProfile: (user: User) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  rooms,
  onJoinRoom,
  onOpenCreateRoom,
  onOpenProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Category / Language filter
      if (selectedLanguage !== 'All') {
        if (selectedLanguage === 'Job Prep') {
          const isJob =
            room.tags?.some((t) => /job|interview|career|placement|gd/i.test(t)) ||
            /interview|placement|job|career/i.test(room.title);
          if (!isJob) return false;
        } else if (
          !room.languages.some(
            (l) => l.toLowerCase() === selectedLanguage.toLowerCase()
          )
        ) {
          return false;
        }
      }

      // Level filter
      if (selectedLevel !== 'All' && room.level !== selectedLevel) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = room.title.toLowerCase().includes(q);
        const matchesTags = room.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesHost = room.hostName.toLowerCase().includes(q);
        const matchesTopic = room.sharedMedia?.topicPrompt?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesTags && !matchesHost && !matchesTopic) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, searchQuery, selectedLanguage, selectedLevel]);

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
      {/* Friendly, Simple Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950/60 via-indigo-950/60 to-slate-900 border border-white/10 p-6 sm:p-8 mb-6 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free • Practice Spoken English & Languages Daily
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Speak English with Confidence. <br className="hidden sm:inline" />
            <span className="text-emerald-400">Overcome Hesitation with Friendly Peers.</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/70 mt-2 leading-relaxed">
            Practice for job interviews, campus placements, and daily speaking. No teachers judging you — just supportive graduates helping each other speak fluently.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateRoom}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Start a Practice Room
            </button>

            {filteredRooms.length > 0 && (
              <button
                onClick={() => onJoinRoom(filteredRooms[0], false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10 transition active:scale-95 cursor-pointer"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                Join 1st Open Room
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-white/50 px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{rooms.length} Practice Rooms Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Filters Bar */}
      <RoomFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        totalRooms={filteredRooms.length}
      />

      {/* Active Room Grid */}
      {filteredRooms.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-[#141426]/50 p-10 text-center max-w-md mx-auto">
          <div className="p-3 rounded-2xl bg-white/5 text-white/40 w-fit mx-auto mb-3">
            <Radio className="w-6 h-6 opacity-40" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No rooms found for this topic</h3>
          <p className="text-xs text-white/50 mb-4">
            Be the first person to create a practice room!
          </p>
          <button
            onClick={onOpenCreateRoom}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition shadow"
          >
            <Plus className="w-4 h-4" />
            Create Room Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={onJoinRoom}
              onOpenUser={(uid) => {
                const dummy: User = {
                  uid,
                  displayName: room.hostName,
                  photoURL: room.hostAvatar,
                  email: `${uid}@example.com`,
                  isVerified: true,
                  vouchCount: 5,
                  vouchedBy: [],
                  nativeLanguages: room.languages,
                  learningLanguages: ['English'],
                  followers: [],
                  following: [],
                  createdAt: Date.now(),
                  bio: 'Speaking and practicing daily on GlobeTalk!',
                };
                onOpenProfile(dummy);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
