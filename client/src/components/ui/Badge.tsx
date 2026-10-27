import React from 'react';
import { ProficiencyLevel, LEVEL_COLORS, LANGUAGE_EMOJIS } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'level' | 'language' | 'tag' | 'verified' | 'unverified' | 'live';
  level?: ProficiencyLevel;
  language?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'tag',
  level,
  language,
  className = '',
}) => {
  if (variant === 'level' && level) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${LEVEL_COLORS[level]} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
        {children}
      </span>
    );
  }

  if (variant === 'language') {
    const emoji = language ? LANGUAGE_EMOJIS[language] || '🌐' : '🌐';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm ${className}`}
      >
        <span>{emoji}</span>
        <span>{children}</span>
      </span>
    );
  }

  if (variant === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 ${className}`}
      >
        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {children}
      </span>
    );
  }

  if (variant === 'unverified') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        {children}
      </span>
    );
  }

  if (variant === 'live') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-normal bg-white/5 text-white/70 border border-white/5 ${className}`}
    >
      #{children}
    </span>
  );
};
