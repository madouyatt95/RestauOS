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
  updateTableFloor: (id: string, floor: string) => void;
  getTable: (id: string) => Table | undefined;
}

const INITIAL_TABLES: Table[] = [
  // RDC
  { id: 't1', number: 1, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', x: 15, y: 20 },
  { id: 't2', number: 2, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', x: 15, y: 40 },
  { id: 't3', number: 3, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', x: 15, y: 60 },
  
  // Étage
  { id: 't4', number: 4, capacity: 6, status: 'reservee', shape: 'rectangle', floor: 'ETAGE', x: 50, y: 25 },
  { id: 't5', number: 5, capacity: 4, status: 'libre', shape: 'square', floor: 'ETAGE', x: 40, y: 50 },
  
  // Terrasse
  { id: 't11', number: 11, capacity: 2, status: 'libre', shape: 'round', floor: 'TERRASSE', x: 50, y: 50 },
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
      updateTableFloor: (id, floor) => set(state => ({
        tables: state.tables.map(t => t.id === id ? { ...t, floor } : t)
      })),
      getTable: (id) => get().tables.find(t => t.id === id),

    }),
    { name: 'restauos-tables' }
  )
);
