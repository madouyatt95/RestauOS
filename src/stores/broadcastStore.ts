import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BroadcastMessage {
  id: string;
  from: string;
  message: string;
  target: 'all' | 'salle' | 'cuisine' | 'livraison' | 'management';
  priority: 'normal' | 'urgent';
  createdAt: string;
}

const TARGET_LABELS: Record<BroadcastMessage['target'], string> = {
  all: 'Tout le monde',
  salle: 'Salle (Serveurs)',
  cuisine: 'Cuisine',
  livraison: 'Livraison',
  management: 'Management',
};

export { TARGET_LABELS };

interface BroadcastState {
  messages: BroadcastMessage[];
  sendBroadcast: (msg: Omit<BroadcastMessage, 'id' | 'createdAt'>) => void;
  clearAll: () => void;
}

export const useBroadcastStore = create<BroadcastState>()(
  persist(
    (set) => ({
      messages: [
        {
          id: 'b1',
          from: 'Cheikh Fall',
          message: 'Rupture de bissap — proposer jus de bouye en remplacement',
          target: 'salle',
          priority: 'urgent',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 'b2',
          from: 'Cheikh Fall',
          message: 'Réunion d\'équipe à 15h dans la salle du fond',
          target: 'all',
          priority: 'normal',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
      sendBroadcast: (msg) => set((s) => ({
        messages: [
          { ...msg, id: `b${Date.now()}`, createdAt: new Date().toISOString() },
          ...s.messages,
        ],
      })),
      clearAll: () => set({ messages: [] }),
    }),
    { name: 'restauos-broadcast' }
  )
);
