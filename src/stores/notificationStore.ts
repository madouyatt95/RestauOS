import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
  type: 'order' | 'swap' | 'stock' | 'review' | 'delivery' | 'promo' | 'system' | 'loyalty' | 'payment';
  title: string;
  message: string;
  read: boolean;
  date: string;
  targetRole?: string;
  actionUrl?: string;
  orderId?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'date'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        { id: 'n1', type: 'order', title: 'Nouveau ticket', message: 'Table 5 — 3 plats en cuisine', read: false, date: new Date(Date.now() - 120000).toISOString() },
        { id: 'n2', type: 'swap', title: 'Demande d\'échange', message: 'Awa Fall souhaite échanger son service de jeudi soir', read: false, date: new Date(Date.now() - 300000).toISOString(), targetRole: 'Gérant' },
        { id: 'n3', type: 'stock', title: 'Stock bas', message: 'Riz brisé : seulement 3kg restants', read: false, date: new Date(Date.now() - 600000).toISOString(), targetRole: 'Gérant' },
        { id: 'n4', type: 'review', title: 'Nouvel avis ⭐', message: 'Ousmane T. a laissé 5 étoiles', read: true, date: new Date(Date.now() - 3600000).toISOString() },
        { id: 'n5', type: 'delivery', title: 'Course terminée', message: 'Pape Sow a livré la commande #4F2A', read: true, date: new Date(Date.now() - 7200000).toISOString() },
        { id: 'n6', type: 'promo', title: 'Happy Hour actif', message: '-30% sur les boissons jusqu\'à 19h', read: true, date: new Date(Date.now() - 10800000).toISOString() },
      ],
      addNotification: (n) => set((s) => ({
        notifications: [{ ...n, id: `n${Date.now()}`, read: false, date: new Date().toISOString() }, ...s.notifications]
      })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
      clearAll: () => set({ notifications: [] }),
      getUnreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    { name: 'restauos-notifications' }
  )
);
