import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TableStatus = 'libre' | 'occupee' | 'reservee';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

interface TableState {
  tables: Table[];
  updateTableStatus: (id: string, status: TableStatus, orderId?: string) => void;
  getTable: (id: string) => Table | undefined;
}

const INITIAL_TABLES: Table[] = Array.from({ length: 15 }, (_, i) => ({
  id: `t${i + 1}`,
  number: i + 1,
  capacity: [2, 4, 6][Math.floor(Math.random() * 3)],
  status: 'libre',
}));

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: INITIAL_TABLES,
      
      updateTableStatus: (id, status, orderId) => set((state) => ({
        tables: state.tables.map((t) => 
          t.id === id ? { ...t, status, currentOrderId: orderId || t.currentOrderId } : t
        )
      })),

      getTable: (id) => get().tables.find((t) => t.id === id),
    }),
    { name: 'restauos-tables' }
  )
);
