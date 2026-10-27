import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isSpeaking?: boolean;
  isMuted?: boolean;
  isVerified?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
  '2xl': 'w-32 h-32 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isSpeaking = false,
  isMuted,
  isVerified = false,
  className = '',
}) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'GT';

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    name || 'user'
  )}`;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`rounded-full overflow-hidden transition-all duration-300 relative ${
          sizeClasses[size]
        } ${
          isSpeaking
            ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-[#0F0F1A] speaking-ring'
            : 'ring-1 ring-white/10'
        }`}
      >
        <img
          src={src || defaultAvatar}
          alt={name}
          className="w-full h-full object-cover bg-surface-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
        />
        {!src && !defaultAvatar && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Verified Shield Badge */}
      {isVerified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-sky-500 text-white rounded-full p-0.5 ring-2 ring-[#0F0F1A] shadow-sm"
          title="Verified Community Member"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      {/* Muted overlay icon */}
      {isMuted && (
        <span
          className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white rounded-full p-0.5 ring-2 ring-[#0F0F1A]"
          title="Muted"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      )}
    </div>
  );
};
