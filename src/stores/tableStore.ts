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
  x: number; // Position X en %
  y: number; // Position Y en %
  currentOrderId?: string;
  reservedFor?: string;
}

interface TableState {
  tables: Table[];
  updateTableStatus: (id: string, status: TableStatus, orderId?: string) => void;
  updateTablePosition: (id: string, x: number, y: number) => void;
  updateTableCapacity: (id: string, capacity: number) => void;
  getTable: (id: string) => Table | undefined;
}

const INITIAL_TABLES: Table[] = [
  // Zone Entrée
  { id: 't1', number: 1, capacity: 2, status: 'libre', shape: 'round', x: 15, y: 20 },
  { id: 't2', number: 2, capacity: 2, status: 'libre', shape: 'round', x: 15, y: 40 },
  { id: 't3', number: 3, capacity: 2, status: 'libre', shape: 'round', x: 15, y: 60 },
  
  // Zone Centrale (Grandes tables)
  { id: 't4', number: 4, capacity: 6, status: 'reservee', shape: 'rectangle', x: 50, y: 25 },
  { id: 't5', number: 5, capacity: 4, status: 'libre', shape: 'square', x: 40, y: 50 },
  { id: 't6', number: 6, capacity: 4, status: 'libre', shape: 'square', x: 60, y: 50 },
  { id: 't7', number: 7, capacity: 8, status: 'occupee', shape: 'rectangle', x: 50, y: 75 },
  
  // Zone Fenêtre
  { id: 't8', number: 8, capacity: 4, status: 'libre', shape: 'square', x: 85, y: 20 },
  { id: 't9', number: 9, capacity: 4, status: 'libre', shape: 'square', x: 85, y: 40 },
  { id: 't10', number: 10, capacity: 4, status: 'libre', shape: 'square', x: 85, y: 60 },
  { id: 't11', number: 11, capacity: 2, status: 'libre', shape: 'round', x: 85, y: 80 },
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

      updateTableCapacity: (id, capacity) => set((state) => ({
        tables: state.tables.map((t) => t.id === id ? { ...t, capacity } : t)
      })),

      getTable: (id) => get().tables.find((t) => t.id === id),

    }),
    { name: 'restauos-tables' }
  )
);
