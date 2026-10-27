import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: any | null;
  isLoading: boolean;
  onlineUsers: Array<{
    uid: string;
    displayName: string;
    photoURL: string;
    isVerified: boolean;
    currentRoomId?: string | null;
    vouchCount: number;
  }>;
  setUser: (user: User | null) => void;
  setFirebaseUser: (fbUser: any | null) => void;
  setLoading: (v: boolean) => void;
  setOnlineUsers: (users: AuthState['onlineUsers']) => void;
  toggleFollow: (targetUid: string) => void;
  updateUserVouch: (vouchCount: number, isVerified: boolean) => void;
  logout: () => void;
}

// Load saved user from localStorage if present
const SAVED_USER_KEY = 'globetalk_current_user';
const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(SAVED_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  firebaseUser: null,
  isLoading: false,
  onlineUsers: [],
  setUser: (user) => {
    if (user) {
      localStorage.setItem(SAVED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SAVED_USER_KEY);
    }
    set({ user });
  },
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  toggleFollow: (targetUid) =>
    set((state) => {
      if (!state.user) return state;
      const isFollowing = state.user.following.includes(targetUid);
      const updatedFollowing = isFollowing
        ? state.user.following.filter((id) => id !== targetUid)
        : [...state.user.following, targetUid];

      const updatedUser: User = {
        ...state.user,
        following: updatedFollowing,
      };
      localStorage.setItem(SAVED_USER_KEY, JSON.stringify(updatedUser));
      return { user: updatedUser };
    }),
  updateUserVouch: (vouchCount, isVerified) =>
    set((state) => {
      if (!state.user) return state;
      const updatedUser: User = {
        ...state.user,
        vouchCount,
        isVerified,
      };
      localStorage.setItem(SAVED_USER_KEY, JSON.stringify(updatedUser));
      return { user: updatedUser };
    }),
  logout: () => {
    localStorage.removeItem(SAVED_USER_KEY);
    set({ user: null, firebaseUser: null });
  },
}));
