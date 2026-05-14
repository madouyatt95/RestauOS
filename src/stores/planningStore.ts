import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShiftType = 'midi' | 'soir' | 'journee' | 'repos';

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // ISO Date YYYY-MM-DD
  type: ShiftType;
  hours: string; // e.g., "11:00 - 15:00"
}

interface PlanningState {
  shifts: Shift[];
  addShift: (shift: Omit<Shift, 'id'>) => void;
  removeShift: (id: string) => void;
  updateShift: (id: string, type: ShiftType, hours: string) => void;
  getShiftsByDate: (date: string) => Shift[];
  getShiftsByEmployee: (employeeId: string) => Shift[];
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      shifts: (() => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const d = (offset: number) => {
          const dt = new Date(monday);
          dt.setDate(monday.getDate() + offset);
          return dt.toISOString().split('T')[0];
        };
        return [
          // Mamadou Diop - Cuisinier (principalement midi)
          { id: 's01', employeeId: 'e1', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's02', employeeId: 'e1', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's03', employeeId: 'e1', date: d(2), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's04', employeeId: 'e1', date: d(3), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's05', employeeId: 'e1', date: d(5), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          // Awa Fall - Serveuse (soir principalement)
          { id: 's06', employeeId: 'e2', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's07', employeeId: 'e2', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's08', employeeId: 'e2', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's09', employeeId: 'e2', date: d(4), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's10', employeeId: 'e2', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Ibrahima Ba - Caissier (midi)
          { id: 's11', employeeId: 'e3', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's12', employeeId: 'e3', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's13', employeeId: 'e3', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's14', employeeId: 'e3', date: d(4), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's15', employeeId: 'e3', date: d(5), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          // Pape Sow - Livreur (soir)
          { id: 's16', employeeId: 'e5', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's17', employeeId: 'e5', date: d(2), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's18', employeeId: 'e5', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's19', employeeId: 'e5', date: d(5), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's20', employeeId: 'e5', date: d(6), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Seynabou Kane - Serveuse (midi/soir alternés)
          { id: 's21', employeeId: 'e6', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's22', employeeId: 'e6', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's23', employeeId: 'e6', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's24', employeeId: 'e6', date: d(4), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's25', employeeId: 'e6', date: d(6), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
        ];
      })(),
      addShift: (newShift) => set((state) => ({
        shifts: [...state.shifts, { ...newShift, id: `s${Date.now()}` }]
      })),
      removeShift: (id) => set((state) => ({
        shifts: state.shifts.filter(s => s.id !== id)
      })),
      updateShift: (id, type, hours) => set((state) => ({
        shifts: state.shifts.map(s => s.id === id ? { ...s, type, hours } : s)
      })),
      getShiftsByDate: (date) => get().shifts.filter(s => s.date === date),
      getShiftsByEmployee: (employeeId) => get().shifts.filter(s => s.employeeId === employeeId),
    }),
    { name: 'restauos-planning' }
  )
);
