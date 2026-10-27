export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  isVerified: boolean;
  vouchCount: number;
  vouchedBy: string[];
  nativeLanguages: string[];
  learningLanguages: string[];
  followers: string[];
  following: string[];
  createdAt: number;
  bio?: string;
  country?: string;
  currentRoomId?: string | null;
}

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Any';

export interface Participant {
  socketId?: string;
  uid: string;
  displayName: string;
  photoURL: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isListener: boolean;
  isVerified?: boolean;
}

export interface RoomMedia {
  type: 'youtube' | 'link' | 'whiteboard' | 'topic';
  url?: string;
  title?: string;
  topicPrompt?: string;
  whiteboardText?: string;
}

export interface Room {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  languages: string[];
  level: ProficiencyLevel;
  maxParticipants: number;
  isPublic: boolean;
  allowListeners: boolean;
  tags: string[];
  participants: Participant[];
  listeners: Participant[];
  createdAt: number;
  isActive: boolean;
  sharedMedia?: RoomMedia;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type?: 'chat' | 'correction' | 'vocab' | 'system';
  original?: string;
  correction?: string;
  note?: string;
  timestamp: number;
}

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Japanese', 'Korean',
  'Mandarin', 'Portuguese', 'Italian', 'Hindi', 'Arabic', 'Russian',
  'Dutch', 'Swedish', 'Polish', 'Turkish', 'Vietnamese', 'Thai',
  'Indonesian', 'Greek', 'Hebrew', 'Danish', 'Norwegian', 'Finnish'
] as const;

export const LEVELS: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Any'];

export const LEVEL_COLORS: Record<ProficiencyLevel, string> = {
  Beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Advanced: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Any: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export const LANGUAGE_EMOJIS: Record<string, string> = {
  English: '🇬🇧', Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪',
  Japanese: '🇯🇵', Korean: '🇰🇷', Mandarin: '🇨🇳', Portuguese: '🇵🇹',
  Italian: '🇮🇹', Hindi: '🇮🇳', Arabic: '🇸🇦', Russian: '🇷🇺',
  Dutch: '🇳🇱', Swedish: '🇸🇪', Polish: '🇵🇱', Turkish: '🇹🇷',
  Vietnamese: '🇻🇳', Thai: '🇹🇭', Indonesian: '🇮🇩', Greek: '🇬🇷',
  Hebrew: '🇮🇱', Danish: '🇩🇰', Norwegian: '🇳🇴', Finnish: '🇫🇮',
};
