import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { loginWithGoogle, isFirebaseConfigured } from '../../services/firebase';
import { identifyUser } from '../../services/socket';
import { User, LANGUAGES } from '../../types';
import { Globe, Shield, Sparkles, X, ChevronRight, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState<'quick' | 'guest'>('quick');
  const [guestName, setGuestName] = useState('');
  const [nativeLang, setNativeLang] = useState('English');
  const [learningLang, setLearningLang] = useState('Spanish');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset quick identities for instant testing & exploration
  const presetLearners = [
    {
      name: 'Elena Rostova',
      country: 'Georgia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      native: ['Russian'],
      learning: ['English', 'Spanish'],
      verified: true,
      vouches: 14,
      role: 'Verified Community Host',
    },
    {
      name: 'Kenji Sato',
      country: 'Japan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      native: ['Japanese'],
      learning: ['English'],
      verified: true,
      vouches: 22,
      role: 'Verified Community Host',
    },
    {
      name: 'Mateo Silva',
      country: 'Colombia',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      native: ['Spanish'],
      learning: ['English', 'Portuguese'],
      verified: true,
      vouches: 18,
      role: 'Verified Member',
    },
    {
      name: 'Amara Patel',
      country: 'India',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      native: ['Hindi', 'English'],
      learning: ['Japanese'],
      verified: false,
      vouches: 2,
      role: 'Unverified Learner (2/3 Vouches)',
    },
  ];

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await loginWithGoogle();
      const fbUser = result.user;
      const newUser: User = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Learner',
        photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
        email: fbUser.email || '',
        isVerified: false, // starts unverified as per requirements
        vouchCount: 0,
        vouchedBy: [],
        nativeLanguages: ['English'],
        learningLanguages: ['Spanish'],
        followers: [],
        following: [],
        createdAt: Date.now(),
        bio: 'Learning new languages on GlobeTalk! 🌍',
      };
      setUser(newUser);
      identifyUser(newUser);
      onClose();
    } catch (err: any) {
      if (err.message === 'FIREBASE_NOT_CONFIGURED') {
        setErrorMsg(
          'Firebase Google OAuth keys are not currently configured in .env. Use Instant One-Click Sign-In below to enter immediately!'
        );
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: (typeof presetLearners)[0]) => {
    const uid = `user-${preset.name.toLowerCase().replace(/\s+/g, '-')}`;
    const newUser: User = {
      uid,
      displayName: preset.name,
      photoURL: preset.avatar,
      email: `${uid}@globetalk.io`,
      isVerified: preset.verified,
      vouchCount: preset.vouches,
      vouchedBy: preset.verified ? ['community-system'] : [],
      nativeLanguages: preset.native,
      learningLanguages: preset.learning,
      followers: [],
      following: [],
      createdAt: Date.now() - 86400000 * 30,
      bio: `Practicing languages from ${preset.country}!`,
      country: preset.country,
    };
    setUser(newUser);
    identifyUser(newUser);
    onClose();
  };

  const handleCustomGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestName.trim() || 'New Learner';
    const seed = Math.random().toString(36).substring(2, 8);
    const uid = `guest-${seed}`;

    const newUser: User = {
      uid,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
      email: `${uid}@guest.globetalk.io`,
      isVerified: false, // New users start as Unverified
      vouchCount: 0,
      vouchedBy: [],
      nativeLanguages: [nativeLang],
      learningLanguages: [learningLang],
      followers: [],
      following: [],
      createdAt: Date.now(),
      bio: `Hello! I speak ${nativeLang} and want to practice ${learningLang}.`,
      country: 'Global',
    };

    setUser(newUser);
    identifyUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-md rounded-2xl bg-[#141426] border border-white/10 shadow-2xl overflow-hidden p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to GlobeTalk</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
            The 24/7 Virtual Language Cafe. Drop into live voice practice with native speakers worldwide.
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading ? 'Signing in...' : 'One-Click Sign-In with Google'}
        </button>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
            {errorMsg}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-white/40">
            Or Choose Instant Demo / Guest
          </span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-4 border border-white/5">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Switch to Community Profile
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'guest' ? 'bg-indigo-600 text-white shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Custom New Learner
          </button>
        </div>

        {activeTab === 'quick' ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {presetLearners.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/40 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={preset.avatar}
                    alt={preset.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-indigo-400"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                        {preset.name}
                      </span>
                      {preset.verified && (
                        <Shield className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                      )}
                    </div>
                    <span className="text-[11px] text-white/50 block">
                      {preset.role} • {preset.country}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleCustomGuest} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Your Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full text-xs py-2.5 pl-8 pr-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  required
                />
                <UserIcon className="w-4 h-4 text-white/40 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Native Language</label>
                <select
                  value={nativeLang}
                  onChange={(e) => setNativeLang(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-gray-900 text-white">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Learning Language</label>
                <select
                  value={learningLang}
                  onChange={(e) => setLearningLang(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-gray-900 text-white">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Start Speaking Instantly
            </button>
          </form>
        )}

        {/* Footer note */}
        <p className="text-[11px] text-center text-white/40 mt-4">
          By continuing, you agree to foster a supportive and polite language practice environment.
        </p>
      </div>
    </div>
  );
};
