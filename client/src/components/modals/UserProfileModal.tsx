import React, { useState } from 'react';
import { User, LANGUAGES, LANGUAGE_EMOJIS } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { getSocket } from '../../services/socket';
import { ShieldCheck, UserPlus, UserCheck, Award, Globe, Edit3, X, Check } from 'lucide-react';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onUpdateSelf?: (updated: Partial<User>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onUpdateSelf,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const toggleFollow = useAuthStore((s) => s.toggleFollow);

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [nativeLangs, setNativeLangs] = useState<string[]>(user?.nativeLanguages || ['English']);
  const [learningLangs, setLearningLangs] = useState<string[]>(user?.learningLanguages || ['Spanish']);
  const [country, setCountry] = useState(user?.country || 'Global');
  const [vouchFeedback, setVouchFeedback] = useState<string | null>(null);

  if (!user) return null;

  const isSelf = currentUser?.uid === user.uid;
  const isFollowing = currentUser?.following.includes(user.uid) || false;
  const hasVouched = user.vouchedBy?.includes(currentUser?.uid || '') || false;
  const canVouch = !isSelf && (currentUser?.isVerified ?? false) && !hasVouched;

  const handleVouch = () => {
    if (!currentUser) return;
    if (!currentUser.isVerified) {
      setVouchFeedback('Only verified members can vouch for other learners.');
      return;
    }
    getSocket().emit('social:vouch', { targetUid: user.uid });
    setVouchFeedback('You vouched for this learner! ✨');
    setTimeout(() => setVouchFeedback(null), 3000);
  };

  const handleFollow = () => {
    toggleFollow(user.uid);
    getSocket().emit('social:follow', { targetUid: user.uid });
  };

  const handleSaveProfile = () => {
    if (onUpdateSelf) {
      onUpdateSelf({
        bio,
        country,
        nativeLanguages: nativeLangs,
        learningLanguages: learningLangs,
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141424] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-pink-900/40 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar & Top Info */}
          <div className="flex justify-between items-end -mt-14 mb-4">
            <Avatar
              src={user.photoURL}
              name={user.displayName}
              size="xl"
              isVerified={user.isVerified}
              className="ring-4 ring-[#141424] rounded-full shadow-lg"
            />

            <div className="flex gap-2">
              {isSelf ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                      isFollowing
                        ? 'bg-white/10 hover:bg-rose-500/20 text-white border border-white/15 hover:border-rose-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Follow
                      </>
                    )}
                  </button>

                  {canVouch && (
                    <button
                      onClick={handleVouch}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
                      title="Vouch for this member to help them get Verified"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      Vouch (+1)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Name & Verification */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
              {user.isVerified ? (
                <Badge variant="verified">Verified Member</Badge>
              ) : (
                <Badge variant="unverified">Unverified ({user.vouchCount || 0}/3 Vouches)</Badge>
              )}
            </div>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" />
              {user.country || 'Global Citizen'} • Member since{' '}
              {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Peer Verification Explanation Banner */}
          {!user.isVerified && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Peer Verification System: </span>
                Earn 3 vouches from verified community members through respectful, active conversation to unlock advanced room customization and verified badge.
                <div className="mt-1 font-medium text-amber-400">
                  Current progress: {user.vouchCount || 0} of 3 vouches received
                </div>
              </div>
            </div>
          )}

          {vouchFeedback && (
            <div className="mb-3 p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 text-center font-medium animate-pulse">
              {vouchFeedback}
            </div>
          )}

          {/* Bio & Details */}
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-black/30 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  rows={2}
                  placeholder="Share your language journey..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Country / City</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-black/30 border border-white/10 text-white"
                  placeholder="e.g. Spain, Japan, Brazil..."
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Changes
              </button>
            </div>
          ) : (
            <p className="text-sm text-white/80 leading-relaxed mb-4 italic">
              "{user.bio || 'Passionate about exploring cultures through real-time speech!'}"
            </p>
          )}

          {/* Languages Section */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Native Language
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.nativeLanguages?.map((lang) => (
                  <Badge key={lang} variant="language" language={lang}>
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                Practicing / Learning
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.learningLanguages?.map((lang) => (
                  <Badge key={lang} variant="language" language={lang}>
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex justify-around py-3 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div>
              <div className="text-lg font-bold text-white">{user.followers?.length || 0}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Followers</div>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <div className="text-lg font-bold text-white">{user.following?.length || 0}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Following</div>
            </div>
            <div className="w-px bg-white/10"></div>
            <div>
              <div className="text-lg font-bold text-emerald-400">{user.vouchCount || 0}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Peer Vouches</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
