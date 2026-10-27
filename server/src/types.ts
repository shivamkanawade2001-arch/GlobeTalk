export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Any';

export interface RoomParticipant {
  socketId: string;
  uid: string;
  displayName: string;
  photoURL: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isHost: boolean;
  isListener: boolean;
  isVerified?: boolean;
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
  participants: RoomParticipant[];
  listeners: RoomParticipant[];
  createdAt: number;
  isActive: boolean;
  sharedMedia?: {
    type: 'youtube' | 'link' | 'whiteboard' | 'topic';
    url?: string;
    title?: string;
    topicPrompt?: string;
    whiteboardText?: string;
  };
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

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  isVerified: boolean;
  vouchCount: number;
  vouchedBy: string[]; // list of uids
  nativeLanguages: string[];
  learningLanguages: string[];
  followers: string[];
  following: string[];
  createdAt: number;
  bio?: string;
  country?: string;
  currentRoomId?: string | null;
}
