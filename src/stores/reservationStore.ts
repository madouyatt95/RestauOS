import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReservationStatus = 'en_attente' | 'confirmee' | 'honoree' | 'annulee';

export interface Reservation {
  id: string;
  clientName: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  tableId?: string;
}

interface ReservationState {
  reservations: Reservation[];
  addReservation: (res: Omit<Reservation, 'id' | 'status'>) => void;
  updateReservationStatus: (id: string, status: ReservationStatus, tableId?: string) => void;
  getPendingReservations: () => Reservation[];
  getTodayReservations: () => Reservation[];
}

export const useReservationStore = create<ReservationState>()(
  persist(
    (set, get) => ({
      reservations: [
        { id: 'res-1', clientName: 'M. Diop', date: new Date().toISOString().split('T')[0], time: '20:00', guests: 4, status: 'en_attente' },
        { id: 'res-2', clientName: 'Mme. Sow', date: new Date().toISOString().split('T')[0], time: '21:30', guests: 2, status: 'en_attente' },
      ],

      addReservation: (res) => set((state) => ({
        reservations: [
          { ...res, id: `res-${Date.now()}`, status: 'en_attente' },
          ...state.reservations
        ]
      })),

      updateReservationStatus: (id, status, tableId) => set((state) => ({
        reservations: state.reservations.map((r) => 
          r.id === id ? { ...r, status, tableId: tableId || r.tableId } : r
        )
      })),

      getPendingReservations: () => get().reservations.filter(r => r.status === 'en_attente'),
      
      getTodayReservations: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().reservations.filter(r => r.date === today && r.status !== 'annulee');
      }
    }),
    { name: 'restauos-reservations' }
  )
);
