import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Promo {
  id: string;
  name: string;
  type: 'happy_hour' | 'menu_jour' | 'combo' | 'fidelite_boost' | 'reduction';
  discount: number; // percentage or fixed FCFA
  discountType: 'percent' | 'fixed';
  productIds?: string[];
  startHour?: string;
  endHour?: string;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string;
  active: boolean;
  description: string;
}

interface PromoState {
  promos: Promo[];
  addPromo: (p: Omit<Promo, 'id'>) => void;
  togglePromo: (id: string) => void;
  removePromo: (id: string) => void;
  updatePromo: (id: string, updates: Partial<Promo>) => void;
  getActivePromos: () => Promo[];
}

export const usePromoStore = create<PromoState>()(
  persist(
    (set, get) => ({
      promos: [
        { id: 'p1', name: 'Happy Hour Bissap', type: 'happy_hour', discount: 30, discountType: 'percent', startHour: '17:00', endHour: '19:00', daysOfWeek: [1,2,3,4,5], active: true, description: '-30% sur toutes les boissons de 17h à 19h' },
        { id: 'p2', name: 'Menu du Jour', type: 'menu_jour', discount: 500, discountType: 'fixed', active: true, description: 'Thiéboudienne + Bissap = -500F' },
        { id: 'p3', name: 'Weekend x2 Points', type: 'fidelite_boost', discount: 2, discountType: 'percent', daysOfWeek: [6,0], active: true, description: 'Points fidélité doublés le week-end' },
        { id: 'p4', name: 'Promo Lancement Yassa', type: 'reduction', discount: 15, discountType: 'percent', active: false, description: '-15% sur le Yassa Poulet cette semaine' },
      ],
      addPromo: (p) => set((s) => ({ promos: [...s.promos, { ...p, id: `p${Date.now()}` }] })),
      togglePromo: (id) => set((s) => ({ promos: s.promos.map(p => p.id === id ? { ...p, active: !p.active } : p) })),
      removePromo: (id) => set((s) => ({ promos: s.promos.filter(p => p.id !== id) })),
      updatePromo: (id, updates) => set((s) => ({ promos: s.promos.map(p => p.id === id ? { ...p, ...updates } : p) })),
      getActivePromos: () => get().promos.filter(p => p.active),
    }),
    { name: 'restauos-promos' }
  )
);
