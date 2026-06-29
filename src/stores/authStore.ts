import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  role: 'Admin' | 'Gérant' | 'Caissier' | 'Serveur' | 'Chef cuisine' | 'Livreur' | 'Client';
  demoTitle?: string;
  accessLevel?: 'direction' | 'site_manager' | 'business_manager' | 'pos_manager' | 'staff' | 'client';
  siteIds?: string[];
  posIds?: string[];
  businessModules?: Array<'restaurant' | 'hotel' | 'casino' | 'spa' | 'boutique' | 'stock' | 'delivery' | 'direction'>;
  avatar?: string;
  employeeId?: string;
  customerId?: string;
  roomId?: string;
  shiftOverride?: boolean;
}

export const DEMO_USERS: UserProfile[] = [
  { id: 'u2', name: 'Admin Systèmes', role: 'Admin', demoTitle: 'Direction générale', accessLevel: 'direction', businessModules: ['direction'], shiftOverride: true },
  { id: 'u1', name: 'Cheikh Fall', role: 'Gérant', demoTitle: 'Gérant site Dakar', accessLevel: 'site_manager', siteIds: ['site-dakar'], businessModules: ['restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock'], avatar: '/images/avatar_gerant.png', shiftOverride: true },
  { id: 'u13', name: 'Aminata Touré', role: 'Gérant', demoTitle: 'Gérante site Saly', accessLevel: 'site_manager', siteIds: ['site-saly'], businessModules: ['restaurant', 'stock'], shiftOverride: true },
  { id: 'u8', name: 'Ndeye Diagne', role: 'Gérant', demoTitle: 'Manager Hôtel', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-room-service', 'pos-minibar'], businessModules: ['hotel'], shiftOverride: true },
  { id: 'u10', name: 'Aly Sarr', role: 'Gérant', demoTitle: 'Manager Casino', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-bar-machines', 'pos-nightclub', 'pos-casino-floor'], businessModules: ['casino'], shiftOverride: true },
  { id: 'u11', name: 'Rama Ba', role: 'Gérant', demoTitle: 'Manager Spa', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-spa-wellness'], businessModules: ['spa'], shiftOverride: true },
  { id: 'u14', name: 'Modou Gueye', role: 'Gérant', demoTitle: 'Responsable Bars POS', accessLevel: 'pos_manager', siteIds: ['site-dakar'], posIds: ['pos-bar-machines', 'pos-nightclub'], businessModules: ['casino'], shiftOverride: true },
  { id: 'u9', name: 'Moussa Kane', role: 'Caissier', demoTitle: 'Réception PMS', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-room-service', 'pos-minibar'], businessModules: ['hotel'], employeeId: 'e11' },
  { id: 'u12', name: 'Khady Sow', role: 'Caissier', demoTitle: 'Boutique hôtel', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-boutique-hotel'], businessModules: ['boutique'], employeeId: 'e15' },
  { id: 'u3', name: 'Ibrahima Ba', role: 'Caissier', demoTitle: 'Caissier restaurant/bar', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin', 'pos-bar-machines'], businessModules: ['restaurant', 'casino'], employeeId: 'e3' },
  { id: 'u4', name: 'Awa Fall', role: 'Serveur', demoTitle: 'Serveuse restaurant', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], employeeId: 'e2' },
  { id: 'u7', name: 'Fatou Sarr', role: 'Serveur', demoTitle: 'Serveuse room service', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['hotel', 'restaurant'], employeeId: 'e6' },
  { id: 'u5', name: 'Mamadou Diop', role: 'Chef cuisine', demoTitle: 'Chef cuisine restaurant', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant', 'stock'], employeeId: 'e1' },
  { id: 'u6', name: 'Pape Sow', role: 'Livreur', demoTitle: 'Livreur room service', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['delivery', 'hotel'], employeeId: 'e5' },
  { id: 'c1', name: 'Jean Dupont', role: 'Client', demoTitle: 'Client chambre 105', accessLevel: 'client', customerId: 'guest-jean-dupont', roomId: 'room-105' },
  { id: 'c2', name: 'Aicha Diallo', role: 'Client', demoTitle: 'Cliente chambre 201', accessLevel: 'client', customerId: 'guest-aicha-diallo', roomId: 'room-201' },
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
