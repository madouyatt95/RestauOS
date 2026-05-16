import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  role: 'Admin' | 'Gérant' | 'Caissier' | 'Serveur' | 'Chef cuisine' | 'Livreur' | 'Client';
  avatar?: string;
  employeeId?: string;
  shiftOverride?: boolean;
}

export const DEMO_USERS: UserProfile[] = [
  { id: 'u1', name: 'Cheikh Fall', role: 'Gérant', avatar: '/images/avatar_gerant.png' },
  { id: 'u2', name: 'Admin Systèmes', role: 'Admin' },
  { id: 'u3', name: 'Ibrahima Ba', role: 'Caissier', employeeId: 'e3' },
  { id: 'u4', name: 'Awa Fall', role: 'Serveur', employeeId: 'e2' },
  { id: 'u7', name: 'Fatou Sarr', role: 'Serveur', employeeId: 'e6' },
  { id: 'u5', name: 'Mamadou Diop', role: 'Chef cuisine', employeeId: 'e1' },
  { id: 'u6', name: 'Pape Sow', role: 'Livreur', employeeId: 'e5' },
  { id: 'c1', name: 'Ousmane Thiam', role: 'Client' },
];

interface AuthState {
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  setShiftOverride: (override: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      setShiftOverride: (override) => set(state => ({ user: state.user ? { ...state.user, shiftOverride: override } : null })),
    }),
    { name: 'restauos-auth' }
  )
);
