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

export interface SwapRequest {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  shiftId: string;
  date: string;
  reason: string;
  status: 'pending_colleague' | 'pending_manager' | 'approved' | 'rejected';
  createdAt: string;
}

interface PlanningState {
  shifts: Shift[];
  swapRequests: SwapRequest[];
  addShift: (shift: Omit<Shift, 'id'>) => void;
  removeShift: (id: string) => void;
  updateShift: (id: string, type: ShiftType, hours: string) => void;
  getShiftsByDate: (date: string) => Shift[];
  getShiftsByEmployee: (employeeId: string) => Shift[];
  addSwapRequest: (req: Omit<SwapRequest, 'id' | 'status' | 'createdAt'>) => void;
  colleagueRespond: (id: string, accept: boolean) => void;
  managerRespond: (id: string, accept: boolean) => void;
  checkIsOffShift: (employeeId: string) => boolean;
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
          // Chef Cuisine - Mamadou (DEMO 24/7)
          { id: 's01', employeeId: 'e1', date: d(0), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's02', employeeId: 'e1', date: d(1), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's03', employeeId: 'e1', date: d(2), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's04', employeeId: 'e1', date: d(3), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's05', employeeId: 'e1', date: d(4), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's05b', employeeId: 'e1', date: d(5), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's05c', employeeId: 'e1', date: d(6), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          // Second Cuisine - Oumar
          { id: 's26', employeeId: 'e7', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's27', employeeId: 'e7', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's28', employeeId: 'e7', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's29', employeeId: 'e7', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's30', employeeId: 'e7', date: d(4), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's31', employeeId: 'e7', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Commis - Moussa (coupure samedi)
          { id: 's32', employeeId: 'e8', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's33', employeeId: 'e8', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's34', employeeId: 'e8', date: d(2), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's35', employeeId: 'e8', date: d(4), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's36', employeeId: 'e8', date: d(5), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's37', employeeId: 'e8', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Awa - Serveuse (TOUJOURS EN SERVICE 24/7 pour la démo)
          { id: 's06', employeeId: 'e2', date: d(0), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's07', employeeId: 'e2', date: d(1), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's08', employeeId: 'e2', date: d(2), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's09', employeeId: 'e2', date: d(3), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's10', employeeId: 'e2', date: d(4), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's06b', employeeId: 'e2', date: d(5), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's06c', employeeId: 'e2', date: d(6), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          // Fatou Sarr - Serveuse (TOUJOURS HORS SHIFT — aucun shift assigné)
          // Abdou - Serveur (midi + soir samedi)
          { id: 's38', employeeId: 'e9', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's39', employeeId: 'e9', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's40', employeeId: 'e9', date: d(3), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's41', employeeId: 'e9', date: d(5), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's42', employeeId: 'e9', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Mariama - Serveuse soir
          { id: 's43', employeeId: 'e10', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's44', employeeId: 'e10', date: d(2), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's45', employeeId: 'e10', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's46', employeeId: 'e10', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's47', employeeId: 'e10', date: d(6), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Aminata - Hôtesse (journée complète)
          { id: 's48', employeeId: 'e11', date: d(0), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's49', employeeId: 'e11', date: d(2), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's50', employeeId: 'e11', date: d(4), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's51', employeeId: 'e11', date: d(5), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's52', employeeId: 'e11', date: d(6), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          // Ibrahima - Caissier (DEMO 24/7)
          { id: 's11', employeeId: 'e3', date: d(0), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's12', employeeId: 'e3', date: d(1), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's13', employeeId: 'e3', date: d(2), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's14', employeeId: 'e3', date: d(3), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's15', employeeId: 'e3', date: d(4), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's15b', employeeId: 'e3', date: d(5), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's15c', employeeId: 'e3', date: d(6), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          // Modou - Barman soir
          { id: 's53', employeeId: 'e12', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's54', employeeId: 'e12', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's55', employeeId: 'e12', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's56', employeeId: 'e12', date: d(4), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's57', employeeId: 'e12', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's58', employeeId: 'e12', date: d(6), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Boubacar - Plongeur (journée)
          { id: 's59', employeeId: 'e13', date: d(0), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's60', employeeId: 'e13', date: d(1), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's61', employeeId: 'e13', date: d(3), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's62', employeeId: 'e13', date: d(5), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's63', employeeId: 'e13', date: d(6), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          // Pape - Livreur (DEMO 24/7)
          { id: 's16', employeeId: 'e5', date: d(0), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's17', employeeId: 'e5', date: d(1), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's18', employeeId: 'e5', date: d(2), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's19', employeeId: 'e5', date: d(3), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's20', employeeId: 'e5', date: d(4), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's20b', employeeId: 'e5', date: d(5), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          { id: 's20c', employeeId: 'e5', date: d(6), type: 'journee' as ShiftType, hours: '00:00 - 23:59' },
          // Lamine - Livreur midi
          { id: 's64', employeeId: 'e14', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's65', employeeId: 'e14', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's66', employeeId: 'e14', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's67', employeeId: 'e14', date: d(4), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's68', employeeId: 'e14', date: d(5), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          // Hôtel, casino, spa, stock - profils métier de démo
          { id: 's69', employeeId: 'e16', date: d(0), type: 'journee' as ShiftType, hours: '08:00 - 17:00' },
          { id: 's70', employeeId: 'e16', date: d(1), type: 'journee' as ShiftType, hours: '08:00 - 17:00' },
          { id: 's71', employeeId: 'e16', date: d(2), type: 'journee' as ShiftType, hours: '08:00 - 17:00' },
          { id: 's72', employeeId: 'e17', date: d(1), type: 'journee' as ShiftType, hours: '09:00 - 18:00' },
          { id: 's73', employeeId: 'e17', date: d(2), type: 'journee' as ShiftType, hours: '09:00 - 18:00' },
          { id: 's74', employeeId: 'e18', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 02:00' },
          { id: 's75', employeeId: 'e18', date: d(2), type: 'soir' as ShiftType, hours: '18:00 - 02:00' },
          { id: 's76', employeeId: 'e19', date: d(1), type: 'journee' as ShiftType, hours: '10:00 - 19:00' },
          { id: 's77', employeeId: 'e19', date: d(2), type: 'journee' as ShiftType, hours: '10:00 - 19:00' },
          { id: 's78', employeeId: 'e20', date: d(1), type: 'journee' as ShiftType, hours: '08:00 - 17:00' },
          { id: 's79', employeeId: 'e21', date: d(1), type: 'journee' as ShiftType, hours: '08:00 - 17:00' },
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
      checkIsOffShift: (employeeId) => {
        const state = get();
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const shiftsToday = state.shifts.filter(s => s.employeeId === employeeId && s.date === dateStr);
        if (shiftsToday.length === 0) return true;
        
        const currentMinutes = today.getHours() * 60 + today.getMinutes();
        const TOLERANCE = 15;
        
        for (const shift of shiftsToday) {
          const [startStr, endStr] = shift.hours.split(' - ');
          if (!startStr || !endStr) continue;
          
          const [sH, sM] = startStr.split(':').map(Number);
          const [eH, eM] = endStr.split(':').map(Number);
          
          const startMinutes = sH * 60 + sM;
          let endMinutes = eH * 60 + eM;
          if (endMinutes < startMinutes) endMinutes += 24 * 60;
          
          let cm = currentMinutes;
          if (cm < startMinutes && endMinutes > 24 * 60) cm += 24 * 60;

          if (cm >= startMinutes - TOLERANCE && cm <= endMinutes + TOLERANCE) {
            return false;
          }
        }
        return true;
      },

      swapRequests: [
        { id: 'sw1', fromEmployeeId: 'e2', toEmployeeId: 'e6', shiftId: 's08', date: new Date().toISOString().split('T')[0], reason: 'RDV médical jeudi soir', status: 'pending_colleague' as const, createdAt: new Date().toISOString() },
        { id: 'sw2', fromEmployeeId: 'e3', toEmployeeId: 'e2', shiftId: 's14', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], reason: 'Empêchement familial', status: 'pending_manager' as const, createdAt: new Date().toISOString() },
        { id: 'sw3', fromEmployeeId: 'e5', toEmployeeId: 'e14', shiftId: 's20', date: new Date(Date.now() + 172800000).toISOString().split('T')[0], reason: 'Besoin de repos', status: 'pending_colleague' as const, createdAt: new Date().toISOString() },
      ],
      addSwapRequest: (req) => set((state) => ({
        swapRequests: [...state.swapRequests, { ...req, id: `sw${Date.now()}`, status: 'pending_colleague', createdAt: new Date().toISOString() }]
      })),
      // Step 2: Colleague accepts or declines
      colleagueRespond: (id, accept) => set((state) => ({
        swapRequests: state.swapRequests.map(r => r.id === id 
          ? { ...r, status: accept ? 'pending_manager' as const : 'rejected' as const } 
          : r
        ),
      })),
      // Step 3: Manager final approval
      managerRespond: (id, accept) => set((state) => {
        if (!accept) {
          return { swapRequests: state.swapRequests.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r) };
        }
        const req = state.swapRequests.find(r => r.id === id);
        if (req) {
          return {
            swapRequests: state.swapRequests.map(r => r.id === id ? { ...r, status: 'approved' as const } : r),
            shifts: state.shifts.map(s => s.id === req.shiftId ? { ...s, employeeId: req.toEmployeeId } : s),
          };
        }
        return {};
      }),
    }),
    { name: 'restauos-planning' }
  )
);
