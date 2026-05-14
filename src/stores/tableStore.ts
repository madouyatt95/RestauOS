import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TableStatus = 'libre' | 'occupee' | 'reservee';
export type TableShape = 'square' | 'round' | 'rectangle';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  shape: TableShape;
  floor: string; // 'RDC', 'ETAGE', 'TERRASSE'
  zone: string; // 'Salle Principale', 'Salon VIP', 'Bar', etc.
  x: number;
  y: number;
  currentOrderId?: string;
  reservedFor?: string;
}

interface TableState {
  tables: Table[];
  updateTableStatus: (id: string, status: TableStatus, orderId?: string) => void;
  updateTablePosition: (id: string, x: number, y: number) => void;
  updateTableCapacity: (id: string, capacity: number) => void;
  updateTableFloor: (id: string, floor: string, zone?: string) => void;
  getTable: (id: string) => Table | undefined;
}

const INITIAL_TABLES: Table[] = [
  // RDC - Salle Principale
  { id: 't1', number: 1, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 20 },
  { id: 't2', number: 2, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 40 },
  { id: 't3', number: 3, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 65 },
  { id: 't4', number: 4, capacity: 4, status: 'occupee', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 20 },
  { id: 't5', number: 5, capacity: 6, status: 'libre', shape: 'rectangle', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 45 },
  { id: 't6', number: 6, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 70 },
  
  // RDC - Salon VIP
  { id: 'v1', number: 101, capacity: 4, status: 'reservee', shape: 'square', floor: 'RDC', zone: 'Salon VIP', x: 75, y: 30 },
  { id: 'v2', number: 102, capacity: 8, status: 'libre', shape: 'rectangle', floor: 'RDC', zone: 'Salon VIP', x: 75, y: 60 },

  // Étage - Lounge
  { id: 'e1', number: 201, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 20, y: 30 },
  { id: 'e2', number: 202, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 20, y: 60 },
  { id: 'e3', number: 203, capacity: 4, status: 'libre', shape: 'square', floor: 'ETAGE', zone: 'Lounge', x: 50, y: 45 },
  
  // Terrasse
  { id: 'ter1', number: 301, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 20, y: 30 },
  { id: 'ter2', number: 302, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 50, y: 30 },
  { id: 'ter3', number: 303, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 80, y: 30 },
];



export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: INITIAL_TABLES,
      
      updateTableStatus: (id, status, orderId) => set((state) => ({
        tables: state.tables.map((t) => 
          t.id === id ? { ...t, status, currentOrderId: orderId || t.currentOrderId } : t
        )
      })),

      updateTablePosition: (id, x, y) => set((state) => ({
        tables: state.tables.map((t) => t.id === id ? { ...t, x, y } : t)
      })),

      updateTableCapacity: (id, capacity) => set(state => ({
        tables: state.tables.map(t => t.id === id ? { ...t, capacity } : t)
      })),
      updateTableFloor: (id, floor, zone) => set(state => ({
        tables: state.tables.map(t => t.id === id ? { ...t, floor, zone: zone || t.zone } : t)
      })),

      getTable: (id) => get().tables.find(t => t.id === id),

    }),
    { name: 'restauos-tables' }
  )
);
