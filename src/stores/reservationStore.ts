import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Reservation {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'waitlist' | 'cancelled' | 'noshow';
  notes: string;
  occasion?: 'anniversaire' | 'affaires' | 'romantique' | 'famille' | 'autre';
  tableId?: string;
  createdAt: string;
}

interface ReservationState {
  reservations: Reservation[];
  addReservation: (r: Omit<Reservation, 'id' | 'createdAt'>) => void;
  updateStatus: (id: string, status: Reservation['status'], tableId?: string) => void;
  removeReservation: (id: string) => void;
}

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const useReservationStore = create<ReservationState>()(
  persist(
    (set) => ({
      reservations: [
        { id: 'res1', clientName: 'Ousmane Thiam', clientPhone: '77 000 11 22', date: today, time: '12:30', guests: 4, status: 'confirmed', notes: 'Table près de la fenêtre', occasion: 'affaires', createdAt: new Date().toISOString() },
        { id: 'res2', clientName: 'Marième Ba', clientPhone: '78 111 22 33', date: today, time: '20:00', guests: 2, status: 'confirmed', notes: '', occasion: 'romantique', createdAt: new Date().toISOString() },
        { id: 'res3', clientName: 'Cheikh Diop', clientPhone: '76 222 33 44', date: today, time: '13:00', guests: 8, status: 'pending', notes: 'Menu spécial demandé', occasion: 'famille', createdAt: new Date().toISOString() },
        { id: 'res4', clientName: 'Aminata Seck', clientPhone: '77 333 44 55', date: today, time: '21:00', guests: 6, status: 'waitlist', notes: 'Anniversaire', occasion: 'anniversaire', createdAt: new Date().toISOString() },
        { id: 'res5', clientName: 'Papa Mbaye', clientPhone: '78 444 55 66', date: tomorrow, time: '12:00', guests: 3, status: 'confirmed', notes: '', createdAt: new Date().toISOString() },
        { id: 'res6', clientName: 'Adja Fall', clientPhone: '76 555 66 77', date: tomorrow, time: '19:30', guests: 10, status: 'pending', notes: 'Séminaire', occasion: 'affaires', createdAt: new Date().toISOString() },
      ],
      addReservation: (r) => set((s) => ({ reservations: [...s.reservations, { ...r, id: `res${Date.now()}`, createdAt: new Date().toISOString() }] })),
      updateStatus: (id, status, tableId) => set((s) => ({ reservations: s.reservations.map(r => r.id === id ? { ...r, status, ...(tableId ? { tableId } : {}) } : r) })),
      removeReservation: (id) => set((s) => ({ reservations: s.reservations.filter(r => r.id !== id) })),
    }),
    { name: 'restauos-reservations' }
  )
);
