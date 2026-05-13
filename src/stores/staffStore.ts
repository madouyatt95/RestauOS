import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  schedule: string;
  status: 'present' | 'retard' | 'absent' | 'repos';
}

interface StaffState {
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateStatus: (id: string, status: Employee['status']) => void;
  removeEmployee: (id: string) => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      employees: [
        { id: 'e1', name: 'Mamadou Diop', role: 'Cuisinier', phone: '77 123 45 67', avatar: '👨‍🍳', schedule: '07:00 - 15:00', status: 'present' },
        { id: 'e2', name: 'Awa Fall', role: 'Serveuse', phone: '78 234 56 78', avatar: '👩‍🍽️', schedule: '15:00 - 23:00', status: 'present' },
        { id: 'e3', name: 'Ibrahima Ba', role: 'Caissier', phone: '76 345 67 89', avatar: '🧑‍💼', schedule: '07:00 - 15:00', status: 'present' },
        { id: 'e4', name: 'Fatou Ndiaye', role: 'Plongeuse', phone: '77 456 78 90', avatar: '👩', schedule: 'Jour de repos', status: 'repos' },
        { id: 'e5', name: 'Pape Sow', role: 'Livreur', phone: '78 567 89 01', avatar: '🛵', schedule: '15:00 - 23:00', status: 'retard' },
        { id: 'e6', name: 'Seynabou Kane', role: 'Serveuse', phone: '76 678 90 12', avatar: '👩‍🍽️', schedule: '15:00 - 23:00', status: 'present' },
      ],

      addEmployee: (emp) => set((s) => ({
        employees: [...s.employees, { ...emp, id: `e-${Date.now()}` }]
      })),

      updateStatus: (id, status) => set((s) => ({
        employees: s.employees.map(e => e.id === id ? { ...e, status } : e)
      })),

      removeEmployee: (id) => set((s) => ({
        employees: s.employees.filter(e => e.id !== id)
      })),
    }),
    { name: 'restauos-staff' }
  )
);
