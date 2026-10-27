import { create } from 'zustand';
import { Room, Participant, ChatMessage, RoomMedia } from '../types';

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  participants: Participant[];
  listeners: Participant[];
  chatMessages: ChatMessage[];
  localStream: MediaStream | null;
  isMuted: boolean;
  isDeafened: boolean;
  audioQuality: 'High' | 'Standard' | 'Low-Bandwidth';
  activeSidebarTab: 'chat' | 'media' | 'vocabulary' | 'participants';
  isConnectingAudio: boolean;
  setRooms: (rooms: Room[]) => void;
  upsertRoom: (room: Room) => void;
  setCurrentRoom: (room: Room | null) => void;
  setParticipants: (participants: Participant[]) => void;
  setListeners: (listeners: Participant[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setMuted: (muted: boolean) => void;
  setDeafened: (deafened: boolean) => void;
  setAudioQuality: (q: 'High' | 'Standard' | 'Low-Bandwidth') => void;
  setActiveSidebarTab: (tab: 'chat' | 'media' | 'vocabulary' | 'participants') => void;
  setIsConnectingAudio: (val: boolean) => void;
  setSharedMedia: (media?: RoomMedia) => void;
  updateParticipantSpeaking: (uid: string, isSpeaking: boolean) => void;
  updateParticipantMute: (uid: string, isMuted: boolean) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoom: null,
  participants: [],
  listeners: [],
  chatMessages: [],
  localStream: null,
  isMuted: false,
  isDeafened: false,
  audioQuality: 'High',
  activeSidebarTab: 'chat',
  isConnectingAudio: false,
  setRooms: (rooms) => set({ rooms }),
  upsertRoom: (room) =>
    set((state) => {
      const idx = state.rooms.findIndex((r) => r.id === room.id);
      if (idx >= 0) {
        const next = [...state.rooms];
        next[idx] = room;
        return { rooms: next };
      }
      return { rooms: [room, ...state.rooms] };
    }),
  setCurrentRoom: (currentRoom) =>
    set({
      currentRoom,
      participants: currentRoom?.participants || [],
      listeners: currentRoom?.listeners || [],
    }),
  setParticipants: (participants) => set({ participants }),
  setListeners: (listeners) => set({ listeners }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  setLocalStream: (localStream) => set({ localStream }),
  setMuted: (isMuted) => set({ isMuted }),
  setDeafened: (isDeafened) => set({ isDeafened }),
  setAudioQuality: (audioQuality) => set({ audioQuality }),
  setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
  setIsConnectingAudio: (isConnectingAudio) => set({ isConnectingAudio }),
  setSharedMedia: (media) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          sharedMedia: media,
        },
      };
    }),
  updateParticipantSpeaking: (uid, isSpeaking) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.uid === uid ? { ...p, isSpeaking } : p
      ),
    })),
  updateParticipantMute: (uid, isMuted) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.uid === uid ? { ...p, isMuted, isSpeaking: isMuted ? false : p.isSpeaking } : p
      ),
    })),
}));
