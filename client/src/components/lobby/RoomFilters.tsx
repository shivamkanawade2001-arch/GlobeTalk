import React from 'react';
import { LANGUAGES, LEVELS, ProficiencyLevel, LANGUAGE_EMOJIS } from '../../types';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';

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
  selectedLevel,
  onLevelChange,
  totalRooms,
}) => {
  const popularLanguages = [
    'All',
    'English',
    'Spanish',
    'Japanese',
    'French',
    'German',
    'Hindi',
    'Korean',
    'Mandarin',
    'Portuguese',
    'Italian',
    'Russian',
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Search Input & Total Count Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rooms by topic, grammar, exam (e.g. IELTS, JLPT, Coffee)..."
            className="w-full text-xs py-3 pl-10 pr-9 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.07] transition"
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

        {/* Level Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mr-1 hidden md:inline">
            Level:
          </span>
          <button
            onClick={() => onLevelChange('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              selectedLevel === 'All'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            All Levels
          </button>
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => onLevelChange(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedLevel === lvl
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Language Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {popularLanguages.map((lang) => {
          const isSelected = selectedLanguage === lang;
          const emoji = lang === 'All' ? '🌍' : LANGUAGE_EMOJIS[lang] || '🌐';

          return (
            <button
              key={lang}
              onClick={() => onLanguageChange(lang)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                isSelected
                  ? 'bg-white text-gray-900 font-bold shadow-lg shadow-white/10 scale-105'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/5'
              }`}
            >
              <span>{emoji}</span>
              <span>{lang}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
