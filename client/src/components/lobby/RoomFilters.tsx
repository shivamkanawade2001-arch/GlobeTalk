import React from 'react';
import { Search, X } from 'lucide-react';

interface RoomFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedLevel: string;
  onLevelChange: (lvl: string) => void;
  totalRooms: number;
}

export const RoomFilters: React.FC<RoomFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  totalRooms,
}) => {
  const quickCategories = [
    { id: 'All', label: '🌟 All Practice Rooms' },
    { id: 'English', label: '🗣️ Spoken English (Fluency)' },
    { id: 'Job Prep', label: '💼 Job & Interview English' },
    { id: 'Hindi', label: '🇮🇳 Hindi + English (Seekho)' },
    { id: 'Spanish', label: '🇪🇸 Spanish' },
    { id: 'French', label: '🇫🇷 French' },
    { id: 'German', label: '🇩🇪 German' },
    { id: 'Japanese', label: '🇯🇵 Japanese' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Category Pills Row - 1-Click for Mobile & Desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {quickCategories.map((cat) => {
          const isSelected = selectedLanguage === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onLanguageChange(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search rooms (e.g. interview, daily life, placement, hesitation, beginner)..."
          className="w-full text-xs py-3 pl-10 pr-9 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:bg-white/[0.07] transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
