import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  role: 'Admin' | 'Gérant' | 'Caissier' | 'Serveur' | 'Chef cuisine' | 'Livreur' | 'Client';
  avatar?: string;
}

export const DEMO_USERS: UserProfile[] = [
  { id: 'u1', name: 'Cheikh Fall', role: 'Gérant', avatar: '/images/avatar_gerant.png' },
  { id: 'u2', name: 'Admin Systèmes', role: 'Admin' },
  { id: 'u3', name: 'Ibrahima Ba', role: 'Caissier' },
  { id: 'u4', name: 'Awa Fall', role: 'Serveur' },
  { id: 'u5', name: 'Mamadou Diop', role: 'Chef cuisine' },
  { id: 'u6', name: 'Pape Sow', role: 'Livreur' },
  { id: 'c1', name: 'Ousmane Thiam', role: 'Client' },
];

interface AuthState {
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'restauos-auth' }
  )
);
