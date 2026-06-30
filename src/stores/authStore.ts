import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole =
  | 'Admin'
  | 'Gérant'
  | 'Caissier'
  | 'Serveur'
  | 'Chef cuisine'
  | 'Livreur'
  | 'Réceptionniste'
  | 'Gouvernante'
  | 'Maintenance'
  | 'Barman'
  | 'Croupier'
  | 'Praticien spa'
  | 'Vendeur boutique'
  | 'Stockiste'
  | 'Acheteur'
  | 'Client';

export type UserBusinessModule = 'restaurant' | 'hotel' | 'casino' | 'spa' | 'boutique' | 'stock' | 'delivery' | 'direction';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  demoTitle?: string;
  accessLevel?: 'direction' | 'site_manager' | 'business_manager' | 'pos_manager' | 'staff' | 'client';
  siteIds?: string[];
  posIds?: string[];
  businessModules?: UserBusinessModule[];
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
  { id: 'u15', name: 'Babacar Ndiaye', role: 'Gérant', demoTitle: 'Manager Restaurant', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], shiftOverride: true },
  { id: 'u8', name: 'Ndeye Diagne', role: 'Gérant', demoTitle: 'Manager Hôtel', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-room-service', 'pos-minibar'], businessModules: ['hotel'], shiftOverride: true },
  { id: 'u10', name: 'Aly Sarr', role: 'Gérant', demoTitle: 'Manager Casino', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-bar-machines', 'pos-nightclub', 'pos-casino-floor'], businessModules: ['casino'], shiftOverride: true },
  { id: 'u11', name: 'Rama Ba', role: 'Gérant', demoTitle: 'Manager Spa', accessLevel: 'business_manager', siteIds: ['site-dakar'], posIds: ['pos-spa-wellness'], businessModules: ['spa'], shiftOverride: true },
  { id: 'u14', name: 'Modou Gueye', role: 'Gérant', demoTitle: 'Responsable Bars POS', accessLevel: 'pos_manager', siteIds: ['site-dakar'], posIds: ['pos-bar-machines', 'pos-nightclub'], businessModules: ['casino'], shiftOverride: true },
  { id: 'u9', name: 'Aminata Diallo', role: 'Réceptionniste', demoTitle: 'Réception PMS', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-room-service', 'pos-minibar'], businessModules: ['hotel'], employeeId: 'e11', shiftOverride: true },
  { id: 'u16', name: 'Aissatou Ba', role: 'Gouvernante', demoTitle: 'Gouvernante générale', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-minibar'], businessModules: ['hotel'], employeeId: 'e16', shiftOverride: true },
  { id: 'u17', name: 'Mamadou Sow', role: 'Maintenance', demoTitle: 'Maintenance hôtel', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-minibar'], businessModules: ['hotel'], employeeId: 'e17', shiftOverride: true },
  { id: 'u12', name: 'Khady Sow', role: 'Vendeur boutique', demoTitle: 'Boutique hôtel', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-boutique-hotel'], businessModules: ['boutique'], employeeId: 'e15', shiftOverride: true },
  { id: 'u3', name: 'Ibrahima Ba', role: 'Caissier', demoTitle: 'Caissier restaurant/bar', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin', 'pos-bar-machines'], businessModules: ['restaurant', 'casino'], employeeId: 'e3' },
  { id: 'u18', name: 'Modou Bar', role: 'Barman', demoTitle: 'Barman casino/night-club', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-bar-machines', 'pos-nightclub'], businessModules: ['casino'], employeeId: 'e12', shiftOverride: true },
  { id: 'u19', name: 'Oumar Cissé', role: 'Croupier', demoTitle: 'Croupier casino', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-casino-floor'], businessModules: ['casino'], employeeId: 'e18', shiftOverride: true },
  { id: 'u20', name: 'Sophie Ndiaye', role: 'Praticien spa', demoTitle: 'Praticienne spa', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-spa-wellness'], businessModules: ['spa'], employeeId: 'e19', shiftOverride: true },
  { id: 'u21', name: 'Binta Fall', role: 'Stockiste', demoTitle: 'Responsable dépôts', accessLevel: 'staff', siteIds: ['site-dakar'], businessModules: ['stock', 'restaurant', 'hotel', 'casino', 'spa', 'boutique'], employeeId: 'e20', shiftOverride: true },
  { id: 'u22', name: 'Souleymane Diop', role: 'Acheteur', demoTitle: 'Achats fournisseurs', accessLevel: 'staff', siteIds: ['site-dakar'], businessModules: ['stock'], employeeId: 'e21', shiftOverride: true },
  { id: 'u4', name: 'Awa Fall', role: 'Serveur', demoTitle: 'Serveuse restaurant', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], employeeId: 'e2' },
  { id: 'u7', name: 'Abdou Mbaye', role: 'Serveur', demoTitle: 'Serveur room service', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['hotel', 'restaurant'], employeeId: 'e9' },
  { id: 'u5', name: 'Mamadou Diop', role: 'Chef cuisine', demoTitle: 'Chef cuisine restaurant', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant', 'stock'], employeeId: 'e1' },
  { id: 'u6', name: 'Pape Sow', role: 'Livreur', demoTitle: 'Livreur room service', accessLevel: 'staff', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['delivery', 'hotel'], employeeId: 'e5' },
  { id: 'u23', name: 'Lamine Niang', role: 'Livreur', demoTitle: 'Livreur Saly', accessLevel: 'staff', siteIds: ['site-saly'], posIds: ['pos-saly-bar'], businessModules: ['delivery', 'restaurant'], employeeId: 'e14', shiftOverride: true },
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
