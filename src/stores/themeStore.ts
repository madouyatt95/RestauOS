import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  mode: 'dark' | 'light';
  accent: string;
  toggleMode: () => void;
  setAccent: (c: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      accent: '#FF8A00',
      toggleMode: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'restauos-theme' }
  )
);
