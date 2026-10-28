import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRoomStore } from '../../stores/roomStore';
import { getSocket } from '../../services/socket';
import { LANGUAGES, LEVELS, ProficiencyLevel } from '../../types';
import {
  X,
  Sparkles,
  Users,
  Lock,
  Unlock,
  Headphones,
  Languages,
  BookOpen,
  MessageSquare,
  Radio,
} from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const user = useAuthStore((s) => s.user);
  const upsertRoom = useRoomStore((s) => s.upsertRoom);

  const [title, setTitle] = useState('');
  const [primaryLang, setPrimaryLang] = useState('English');
  const [secondaryLang, setSecondaryLang] = useState<string>('None');
  const [level, setLevel] = useState<ProficiencyLevel>('Intermediate');
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [allowListeners, setAllowListeners] = useState<boolean>(true);
  const [topicPrompt, setTopicPrompt] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const quickTopicSuggestions = [
    {
      title: '💼 Job Interview & Self-Introduction Practice',
      topic: 'Introduce yourself, your college degree, and your career goals!',
    },
    {
      title: '🗣️ Overcome Hesitation: Spoken English for Beginners',
      topic: 'Speak freely without fear of grammar mistakes. Describe your day!',
    },
    {
      title: '🎓 Campus Placement GD: Tech vs Human Jobs',
      topic: 'Will AI take away fresh graduate jobs or create new opportunities?',
    },
    {
      title: '🇮🇳 Hindi to English Fluency Practice',
      topic: 'Practice translating thoughts from your native language into simple English.',
    },
    {
      title: '☕ Casual Friendly Chit-Chat & Daily Life',
      topic: 'Share an interesting custom, festival, or food from your hometown!',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setSubmitting(true);
    const selectedLanguages = [primaryLang];
    if (secondaryLang !== 'None' && secondaryLang !== primaryLang) {
      selectedLanguages.push(secondaryLang);
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (tags.length === 0) {
      tags.push(level, ...selectedLanguages);
    }

    const payload = {
      title: title.trim(),
      hostId: user.uid,
      hostName: user.displayName,
      hostAvatar: user.photoURL,
      languages: selectedLanguages,
      level,
      maxParticipants,
      isPublic,
      allowListeners,
      tags,
      sharedMedia: topicPrompt.trim()
        ? {
            type: 'topic',
            topicPrompt: topicPrompt.trim(),
          }
        : undefined,
    };

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const createdRoom = await response.json();
      upsertRoom(createdRoom);

      // Join the socket room as host
      getSocket().emit('room:join', { roomId: createdRoom.id });

      onClose();
      if (onRoomCreated) {
        onRoomCreated(createdRoom.id);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating room. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141426] border border-white/10 shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
            <Radio className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Host a Voice Room</h2>
            <p className="text-xs text-white/50">
              Create a custom space for speaking practice or bilingual exchange.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic Title */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center justify-between">
              <span>Room Title / Topic</span>
              <span className="text-[11px] text-white/40 font-normal">Scannable Headline</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🗣️ IELTS Band 7+ Speaking Practice & Vocabulary"
              className="w-full text-xs p-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
              required
            />

            {/* Quick Topic Prompts */}
            <div className="mt-2 space-y-1.5">
              <span className="text-[10px] font-semibold text-emerald-400 block">
                ⚡ 1-Click Practice Room Ideas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTopicSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s.title}
                    onClick={() => {
                      setTitle(s.title);
                      setTopicPrompt(s.topic);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition text-left cursor-pointer"
                  >
                    + {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Languages Selector (Supports Bilingual Exchange) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                Primary Language
              </label>
              <select
                value={primaryLang}
                onChange={(e) => setPrimaryLang(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="bg-gray-900 text-white">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-purple-400" />
                Secondary (Bilingual)
              </label>
              <select
                value={secondaryLang}
                onChange={(e) => setSecondaryLang(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="None" className="bg-gray-900 text-white">
                  None (Monolingual)
                </option>
                {LANGUAGES.filter((l) => l !== primaryLang).map((lang) => (
                  <option key={lang} value={lang} className="bg-gray-900 text-white">
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proficiency Level */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              Target Proficiency Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition ${
                    level === lvl
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Participant Limit Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-white/80 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Speaker Capacity Limit
              </label>
              <span className="text-xs font-bold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                {maxParticipants} Speakers {maxParticipants === 2 ? '(1-on-1 Practice)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>2 (1-on-1)</span>
              <span>4 (Small Group)</span>
              <span>6 (Standard)</span>
              <span>10 (Large)</span>
            </div>
          </div>

          {/* Privacy & Listeners Controls */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                isPublic
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {isPublic ? (
                <Unlock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-semibold">
                  {isPublic ? 'Public Room' : 'Locked Room'}
                </div>
                <div className="text-[10px] opacity-75">
                  {isPublic ? 'Visible to all in Lobby' : 'Members by invite only'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAllowListeners(!allowListeners)}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                allowListeners
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/5 border-white/5 text-white/50'
              }`}
            >
              <Headphones className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold">
                  {allowListeners ? 'Allow Silent Listeners' : 'Speakers Only'}
                </div>
                <div className="text-[10px] opacity-75">
                  {allowListeners ? 'Learners can tune in' : 'No overflow spectators'}
                </div>
              </div>
            </button>
          </div>

          {/* Starter Discussion Prompt */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              Starter Conversation Question / Prompt (Optional)
            </label>
            <input
              type="text"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="e.g. What is the most memorable travel experience you've ever had?"
              className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Custom Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. IELTS, Fluency, Slang, Exam"
              className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Opening Room...' : 'Launch Room & Start Speaking'}
          </button>
        </form>
      </div>
    </div>
  );
};
