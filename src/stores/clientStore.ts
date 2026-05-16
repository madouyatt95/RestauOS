import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Client {
  id: string;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  visits: number;
  preferences?: string;
  history: { id: string; type: 'gain' | 'use'; points: number; label: string; date: string }[];
}

interface ClientState {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'history'>) => void;
  addPoints: (clientId: string, points: number, label: string) => void;
  usePoints: (clientId: string, points: number, label: string) => void;
  getClient: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clients: [
        {
          id: 'c1', name: 'Ousmane Thiam', phone: '77 111 22 33', points: 2350, totalSpent: 485000, preferences: 'Table fenêtre, eau pétillante, sans piment',
          tier: 'gold', visits: 45,
          history: [
            { id: 'h1', type: 'gain', points: 150, label: 'Commande #1253', date: new Date(Date.now() - 86400000 * 1).toISOString() },
            { id: 'h2', type: 'gain', points: 200, label: 'Commande #1250', date: new Date(Date.now() - 86400000 * 3).toISOString() },
            { id: 'h3', type: 'use', points: 400, label: 'Réduction 2 000 FCFA', date: new Date(Date.now() - 86400000 * 5).toISOString() },
            { id: 'h4', type: 'gain', points: 180, label: 'Commande #1241', date: new Date(Date.now() - 86400000 * 7).toISOString() },
          ]
        },
        { id: 'c2', name: 'Aminata Sow', phone: '78 222 33 44', points: 1200, totalSpent: 320000, tier: 'silver', visits: 28, history: [] },
        { id: 'c3', name: 'Moussa Diallo', phone: '76 333 44 55', points: 450, totalSpent: 125000, tier: 'bronze', visits: 12, history: [] },
        { id: 'c4', name: 'Khady Mbaye', phone: '77 444 55 66', points: 3100, totalSpent: 680000, tier: 'platinum', visits: 65, preferences: 'Sans gluten, table calme, thé à la menthe', history: [] },
        { id: 'c5', name: 'Abdou Niang', phone: '78 555 66 77', points: 800, totalSpent: 210000, tier: 'silver', visits: 20, history: [] },
      ],

      addClient: (client) => set((s) => ({
        clients: [...s.clients, { ...client, id: `c-${Date.now()}`, history: [] }]
      })),

      addPoints: (clientId, points, label) => set((s) => ({
        clients: s.clients.map(c => c.id === clientId ? {
          ...c,
          points: c.points + points,
          history: [{ id: `h-${Date.now()}`, type: 'gain' as const, points, label, date: new Date().toISOString() }, ...c.history]
        } : c)
      })),

      usePoints: (clientId, points, label) => set((s) => ({
        clients: s.clients.map(c => c.id === clientId ? {
          ...c,
          points: Math.max(0, c.points - points),
          history: [{ id: `h-${Date.now()}`, type: 'use' as const, points, label, date: new Date().toISOString() }, ...c.history]
        } : c)
      })),

      getClient: (id) => get().clients.find(c => c.id === id),
    }),
    { name: 'restauos-clients' }
  )
);
