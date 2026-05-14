import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WasteEntry {
  id: string;
  productName: string;
  quantity: string;
  reason: 'surproduction' | 'peremption' | 'retour_client' | 'accident' | 'autre';
  costEstimate: number;
  date: string;
  employeeId: string;
}

interface WasteState {
  entries: WasteEntry[];
  addEntry: (e: Omit<WasteEntry, 'id' | 'date'>) => void;
  getWeekTotal: () => number;
}

export const useWasteStore = create<WasteState>()(
  persist(
    (set, get) => ({
      entries: [
        { id: 'w1', productName: 'Riz cuit', quantity: '2kg', reason: 'surproduction', costEstimate: 1500, date: new Date(Date.now() - 86400000).toISOString(), employeeId: 'e1' },
        { id: 'w2', productName: 'Salade', quantity: '500g', reason: 'peremption', costEstimate: 800, date: new Date(Date.now() - 172800000).toISOString(), employeeId: 'e8' },
        { id: 'w3', productName: 'Yassa Poulet', quantity: '1 portion', reason: 'retour_client', costEstimate: 3500, date: new Date(Date.now() - 43200000).toISOString(), employeeId: 'e2' },
      ],
      addEntry: (e) => set((s) => ({ entries: [...s.entries, { ...e, id: `w${Date.now()}`, date: new Date().toISOString() }] })),
      getWeekTotal: () => {
        const weekAgo = Date.now() - 7 * 86400000;
        return get().entries.filter(e => new Date(e.date).getTime() > weekAgo).reduce((a, c) => a + c.costEstimate, 0);
      },
    }),
    { name: 'restauos-waste' }
  )
);
