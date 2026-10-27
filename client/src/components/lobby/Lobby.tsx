import React, { useState, useMemo } from 'react';
import { Room, User } from '../../types';
import { RoomCard } from './RoomCard';
import { RoomFilters } from './RoomFilters';
import { Plus, Radio, Sparkles, Globe, MessageSquare, Headphones } from 'lucide-react';

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
      // Language filter
      if (
        selectedLanguage !== 'All' &&
        !room.languages.some(
          (l) => l.toLowerCase() === selectedLanguage.toLowerCase()
        )
      ) {
        return false;
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
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-950/80 border border-white/10 p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            24/7 Virtual Language Cafe • No bookings, zero friction
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Speak with the world <br className="hidden sm:inline" />
            <span className="text-gradient">in live voice rooms right now.</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-lg leading-relaxed">
            Jump over the "study-to-speaking" gap. Pick your target language, grab an open seat, and practice conversational fluency naturally.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpenCreateRoom}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Host a Group
            </button>
            <div className="flex items-center gap-2 text-xs text-white/50 px-2 py-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>
                <strong className="text-white">{rooms.length} active voice rooms</strong> online
              </span>
            </div>
          </div>
        </div>

        {/* Ambient background graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-radial from-indigo-500/40 via-transparent to-transparent hidden md:block" />
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
        <div className="rounded-3xl border border-white/5 bg-[#141426]/50 p-12 text-center max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-white/5 text-white/40 w-fit mx-auto mb-3">
            <Radio className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No rooms match your filters</h3>
          <p className="text-xs text-white/50 mb-4">
            Be the first to open a voice table for {selectedLanguage === 'All' ? 'this topic' : selectedLanguage}!
          </p>
          <button
            onClick={onOpenCreateRoom}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
          >
            <Plus className="w-4 h-4" />
            Create "{selectedLanguage === 'All' ? 'New Group' : selectedLanguage + ' Speaking'}"
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={(r, asListener) => onJoinRoom(r, asListener)}
              onOpenUser={(uid) => {
                const speaker = room.participants.find((p) => p.uid === uid);
                if (speaker) {
                  onOpenProfile({
                    uid: speaker.uid,
                    displayName: speaker.displayName,
                    photoURL: speaker.photoURL,
                    isVerified: speaker.isVerified || false,
                    vouchCount: 0,
                    vouchedBy: [],
                    nativeLanguages: ['English'],
                    learningLanguages: ['Spanish'],
                    followers: [],
                    following: [],
                    createdAt: Date.now(),
                    email: '',
                  });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
