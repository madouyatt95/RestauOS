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
      shifts: [
        { id: 's1', employeeId: 'u4', date: new Date().toISOString().split('T')[0], type: 'midi', hours: '11:00 - 16:00' },
        { id: 's2', employeeId: 'u5', date: new Date().toISOString().split('T')[0], type: 'soir', hours: '18:00 - 23:00' },
      ],
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
