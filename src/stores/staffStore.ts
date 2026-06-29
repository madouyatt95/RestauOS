import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  schedule: string;
  status: 'present' | 'retard' | 'absent' | 'repos';
  siteIds?: string[];
  posIds?: string[];
  businessModules?: Array<'restaurant' | 'hotel' | 'casino' | 'spa' | 'boutique' | 'stock' | 'direction'>;
  accessLevel?: 'direction' | 'manager' | 'supervisor' | 'staff';
}

interface StaffState {
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateStatus: (id: string, status: Employee['status']) => void;
  removeEmployee: (id: string) => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      employees: [
        // Cuisine
        { id: 'e1', name: 'Mamadou Diop', role: 'Chef Cuisine', phone: '77 123 45 67', avatar: '👨‍🍳', schedule: '07:00 - 15:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant', 'stock'], accessLevel: 'supervisor' },
        { id: 'e7', name: 'Oumar Sy', role: 'Second Cuisine', phone: '77 777 11 22', avatar: '👨‍🍳', schedule: '07:00 - 15:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], accessLevel: 'staff' },
        { id: 'e8', name: 'Moussa Diouf', role: 'Commis Cuisine', phone: '78 888 22 33', avatar: '🧑‍🍳', schedule: '10:00 - 22:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], accessLevel: 'staff' },
        // Salle
        { id: 'e2', name: 'Awa Fall', role: 'Serveuse', phone: '78 234 56 78', avatar: '👩‍🍽️', schedule: '15:00 - 23:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], accessLevel: 'staff' },
        { id: 'e6', name: 'Seynabou Kane', role: 'Serveuse', phone: '76 678 90 12', avatar: '👩‍🍽️', schedule: '15:00 - 23:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], accessLevel: 'staff' },
        { id: 'e9', name: 'Abdou Mbaye', role: 'Serveur', phone: '77 999 33 44', avatar: '🧑‍🍽️', schedule: '11:00 - 16:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['hotel', 'restaurant'], accessLevel: 'staff' },
        { id: 'e10', name: 'Mariama Sarr', role: 'Serveuse', phone: '78 111 44 55', avatar: '👩‍🍽️', schedule: '18:00 - 23:00', status: 'retard', siteIds: ['site-dakar'], posIds: ['pos-nightclub'], businessModules: ['casino'], accessLevel: 'staff' },
        { id: 'e11', name: 'Aminata Diallo', role: 'Hôtesse', phone: '76 222 55 66', avatar: '💁‍♀️', schedule: '11:00 - 23:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['hotel'], accessLevel: 'staff' },
        // Bar & Caisse
        { id: 'e3', name: 'Ibrahima Ba', role: 'Caissier', phone: '76 345 67 89', avatar: '🧑‍💼', schedule: '07:00 - 15:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin', 'pos-bar-machines'], businessModules: ['restaurant', 'casino'], accessLevel: 'supervisor' },
        { id: 'e15', name: 'Khady Sow', role: 'Vendeuse Boutique', phone: '77 666 99 00', avatar: '🛍️', schedule: '09:00 - 18:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-boutique-hotel'], businessModules: ['boutique'], accessLevel: 'staff' },
        { id: 'e12', name: 'Modou Gueye', role: 'Barman', phone: '77 333 66 77', avatar: '🍸', schedule: '18:00 - 02:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-bar-machines', 'pos-nightclub'], businessModules: ['casino'], accessLevel: 'staff' },
        // Plonge
        { id: 'e4', name: 'Fatou Ndiaye', role: 'Plongeuse', phone: '77 456 78 90', avatar: '👩', schedule: 'Jour de repos', status: 'repos', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], accessLevel: 'staff' },
        { id: 'e13', name: 'Boubacar Diagne', role: 'Plongeur', phone: '78 444 77 88', avatar: '🧑', schedule: '11:00 - 23:00', status: 'present', siteIds: ['site-dakar'], posIds: ['pos-restaurant-jardin'], businessModules: ['restaurant'], accessLevel: 'staff' },
        // Livraison
        { id: 'e5', name: 'Pape Sow', role: 'Livreur', phone: '78 567 89 01', avatar: '🛵', schedule: '15:00 - 23:00', status: 'retard', siteIds: ['site-dakar'], posIds: ['pos-room-service'], businessModules: ['hotel', 'restaurant'], accessLevel: 'staff' },
        { id: 'e14', name: 'Lamine Niang', role: 'Livreur', phone: '76 555 88 99', avatar: '🛵', schedule: '11:00 - 16:00', status: 'present', siteIds: ['site-saly'], posIds: ['pos-saly-bar'], businessModules: ['restaurant'], accessLevel: 'staff' },
      ],

      addEmployee: (emp) => set((s) => ({
        employees: [...s.employees, { ...emp, id: `e-${Date.now()}` }]
      })),

      updateStatus: (id, status) => set((s) => ({
        employees: s.employees.map(e => e.id === id ? { ...e, status } : e)
      })),

      removeEmployee: (id) => set((s) => ({
        employees: s.employees.filter(e => e.id !== id)
      })),
    }),
    { name: 'restauos-staff' }
  )
);
