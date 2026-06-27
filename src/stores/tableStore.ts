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
  addTable: (table: Table) => void;
  removeTable: (id: string) => void;
  updateTableStatus: (id: string, status: TableStatus, orderId?: string) => void;
  updateTablePosition: (id: string, x: number, y: number) => void;
  updateTableCapacity: (id: string, capacity: number) => void;
  updateTableFloor: (id: string, floor: string, zone?: string) => void;
  getTable: (id: string) => Table | undefined;
}

const INITIAL_TABLES: Table[] = [
  // RDC - Salle Principale (12 tables)
  { id: 't1', number: 1, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 15 },
  { id: 't2', number: 2, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 30 },
  { id: 't3', number: 3, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 45 },
  { id: 't4', number: 4, capacity: 4, status: 'occupee', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 15 },
  { id: 't5', number: 5, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 30 },
  { id: 't6', number: 6, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 45 },
  { id: 't7', number: 7, capacity: 6, status: 'libre', shape: 'rectangle', floor: 'RDC', zone: 'Salle Principale', x: 70, y: 20 },
  { id: 't8', number: 8, capacity: 6, status: 'libre', shape: 'rectangle', floor: 'RDC', zone: 'Salle Principale', x: 70, y: 40 },
  { id: 't9', number: 9, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 70 },
  { id: 't10', number: 10, capacity: 2, status: 'libre', shape: 'round', floor: 'RDC', zone: 'Salle Principale', x: 15, y: 85 },
  { id: 't11', number: 11, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 70 },
  { id: 't12', number: 12, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salle Principale', x: 40, y: 85 },
  
  // RDC - Salon VIP (4 tables)
  { id: 'v1', number: 101, capacity: 4, status: 'reservee', shape: 'square', floor: 'RDC', zone: 'Salon VIP', x: 25, y: 30 },
  { id: 'v2', number: 102, capacity: 4, status: 'libre', shape: 'square', floor: 'RDC', zone: 'Salon VIP', x: 75, y: 30 },
  { id: 'v3', number: 103, capacity: 8, status: 'libre', shape: 'rectangle', floor: 'RDC', zone: 'Salon VIP', x: 50, y: 60 },
  { id: 'v4', number: 104, capacity: 12, status: 'libre', shape: 'rectangle', floor: 'RDC', zone: 'Salon VIP', x: 50, y: 85 },

  // Étage - Lounge (10 tables)
  { id: 'e1', number: 201, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 15, y: 15 },
  { id: 'e2', number: 202, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 30, y: 15 },
  { id: 'e3', number: 203, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 45, y: 15 },
  { id: 'e4', number: 204, capacity: 4, status: 'libre', shape: 'square', floor: 'ETAGE', zone: 'Lounge', x: 15, y: 45 },
  { id: 'e5', number: 205, capacity: 4, status: 'libre', shape: 'square', floor: 'ETAGE', zone: 'Lounge', x: 45, y: 45 },
  { id: 'e6', number: 206, capacity: 6, status: 'libre', shape: 'rectangle', floor: 'ETAGE', zone: 'Lounge', x: 75, y: 30 },
  { id: 'e7', number: 207, capacity: 6, status: 'libre', shape: 'rectangle', floor: 'ETAGE', zone: 'Lounge', x: 75, y: 60 },
  { id: 'e8', number: 208, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 15, y: 80 },
  { id: 'e9', number: 209, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 35, y: 80 },
  { id: 'e10', number: 210, capacity: 2, status: 'libre', shape: 'round', floor: 'ETAGE', zone: 'Lounge', x: 55, y: 80 },
  
  // Terrasse - Vue Mer (8 tables)
  { id: 'ter1', number: 301, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 15, y: 25 },
  { id: 'ter2', number: 302, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 40, y: 25 },
  { id: 'ter3', number: 303, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 65, y: 25 },
  { id: 'ter4', number: 304, capacity: 4, status: 'libre', shape: 'square', floor: 'TERRASSE', zone: 'Vue Mer', x: 90, y: 25 },
  { id: 'ter5', number: 305, capacity: 2, status: 'libre', shape: 'round', floor: 'TERRASSE', zone: 'Vue Mer', x: 15, y: 65 },
  { id: 'ter6', number: 306, capacity: 2, status: 'libre', shape: 'round', floor: 'TERRASSE', zone: 'Vue Mer', x: 40, y: 65 },
  { id: 'ter7', number: 307, capacity: 2, status: 'libre', shape: 'round', floor: 'TERRASSE', zone: 'Vue Mer', x: 65, y: 65 },
  { id: 'ter8', number: 308, capacity: 2, status: 'libre', shape: 'round', floor: 'TERRASSE', zone: 'Vue Mer', x: 90, y: 65 },
];




export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tables: INITIAL_TABLES,

      addTable: (table) => set((state) => ({
        tables: [...state.tables, table]
      })),

      removeTable: (id) => set((state) => ({
        tables: state.tables.filter(t => t.id !== id)
      })),
      
      updateTableStatus: (id, status, orderId) => set((state) => ({
        tables: state.tables.map((t) => 
          t.id === id ? { ...t, status, currentOrderId: orderId || t.currentOrderId } : t
        )
      })),

      updateTablePosition: (id, x, y) => set((state) => ({
        tables: state.tables.map((t) => t.id === id ? { ...t, x, y } : t)
      })),

      updateTableCapacity: (id, capacity) => set(state => ({
        tables: state.tables.map(t => t.id === id ? { 
          ...t, 
          capacity,
          shape: capacity <= 2 ? 'round' : capacity <= 4 ? 'square' : 'rectangle'
        } : t)
      })),
      updateTableFloor: (id, floor, zone) => set(state => ({
        tables: state.tables.map(t => t.id === id ? { ...t, floor, zone: zone || t.zone } : t)
      })),

      getTable: (id) => get().tables.find(t => t.id === id),

    }),
    { name: 'restauos-tables' }
  )
);
