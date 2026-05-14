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
          // Chef Cuisine - Mamadou
          { id: 's01', employeeId: 'e1', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's02', employeeId: 'e1', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's03', employeeId: 'e1', date: d(2), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's04', employeeId: 'e1', date: d(3), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's05', employeeId: 'e1', date: d(5), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
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
          // Awa - Serveuse
          { id: 's06', employeeId: 'e2', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's07', employeeId: 'e2', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's08', employeeId: 'e2', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's09', employeeId: 'e2', date: d(4), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's10', employeeId: 'e2', date: d(5), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Seynabou - Serveuse
          { id: 's21', employeeId: 'e6', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's22', employeeId: 'e6', date: d(1), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's23', employeeId: 'e6', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's24', employeeId: 'e6', date: d(4), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's25', employeeId: 'e6', date: d(6), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
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
          // Ibrahima - Caissier midi
          { id: 's11', employeeId: 'e3', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's12', employeeId: 'e3', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's13', employeeId: 'e3', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's14', employeeId: 'e3', date: d(4), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's15', employeeId: 'e3', date: d(5), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
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
          // Pape - Livreur soir
          { id: 's16', employeeId: 'e5', date: d(0), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's17', employeeId: 'e5', date: d(2), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's18', employeeId: 'e5', date: d(3), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          { id: 's19', employeeId: 'e5', date: d(5), type: 'journee' as ShiftType, hours: '10:00 - 22:00' },
          { id: 's20', employeeId: 'e5', date: d(6), type: 'soir' as ShiftType, hours: '18:00 - 23:00' },
          // Lamine - Livreur midi
          { id: 's64', employeeId: 'e14', date: d(0), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's65', employeeId: 'e14', date: d(1), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's66', employeeId: 'e14', date: d(2), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's67', employeeId: 'e14', date: d(4), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
          { id: 's68', employeeId: 'e14', date: d(5), type: 'midi' as ShiftType, hours: '11:00 - 16:00' },
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

      swapRequests: [
        { id: 'sw1', fromEmployeeId: 'e2', toEmployeeId: 'e6', shiftId: 's08', date: new Date().toISOString().split('T')[0], reason: 'RDV médical jeudi soir', status: 'pending_colleague' as const, createdAt: new Date().toISOString() },
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
