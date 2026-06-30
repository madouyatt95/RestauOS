import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runtimeDateOffset, runtimeId } from '../utils/runtime';

export type SpaAppointmentStatus = 'booked' | 'in_progress' | 'done' | 'cancelled';
export type CasinoSessionStatus = 'open' | 'closed';
export type BoutiqueReturnStatus = 'received' | 'refunded' | 'exchanged';

export interface SpaAppointment {
  id: string;
  posId: string;
  guestName: string;
  roomNumber?: string;
  serviceName: string;
  therapist: string;
  startsAt: string;
  amount: number;
  status: SpaAppointmentStatus;
  createdAt: string;
}

export interface CasinoSession {
  id: string;
  posId: string;
  tableName: string;
  playerName: string;
  host: string;
  buyIn: number;
  status: CasinoSessionStatus;
  openedAt: string;
  closedAt?: string;
}

export interface BoutiqueReturn {
  id: string;
  posId: string;
  productName: string;
  reason: string;
  amount: number;
  status: BoutiqueReturnStatus;
  createdAt: string;
}

interface BusinessOperationsState {
  spaAppointments: SpaAppointment[];
  casinoSessions: CasinoSession[];
  boutiqueReturns: BoutiqueReturn[];
  addSpaAppointment: (input: Omit<SpaAppointment, 'id' | 'createdAt' | 'status'>) => SpaAppointment;
  updateSpaAppointmentStatus: (id: string, status: SpaAppointmentStatus) => void;
  openCasinoSession: (input: Omit<CasinoSession, 'id' | 'status' | 'openedAt' | 'closedAt'>) => CasinoSession;
  closeCasinoSession: (id: string) => void;
  addBoutiqueReturn: (input: Omit<BoutiqueReturn, 'id' | 'createdAt' | 'status'> & { status?: BoutiqueReturnStatus }) => BoutiqueReturn;
}

export const useBusinessOperationsStore = create<BusinessOperationsState>()(
  persist(
    (set) => ({
      spaAppointments: [
        {
          id: 'spa-demo-1',
          posId: 'pos-spa-wellness',
          guestName: 'Jean Dupont',
          roomNumber: '105',
          serviceName: 'Massage relaxant 60 min',
          therapist: 'Aminata Diallo',
          startsAt: runtimeDateOffset(0),
          amount: 45000,
          status: 'booked',
          createdAt: runtimeDateOffset(-1),
        },
      ],
      casinoSessions: [
        {
          id: 'casino-demo-1',
          posId: 'pos-casino-floor',
          tableName: 'Blackjack VIP',
          playerName: 'Client chambre 301',
          host: 'Mamadou Casino',
          buyIn: 250000,
          status: 'open',
          openedAt: runtimeDateOffset(-0.05),
        },
      ],
      boutiqueReturns: [
        {
          id: 'return-demo-1',
          posId: 'pos-boutique-hotel',
          productName: 'Peignoir hotel',
          reason: 'Taille a echanger',
          amount: 18000,
          status: 'exchanged',
          createdAt: runtimeDateOffset(-0.2),
        },
      ],
      addSpaAppointment: input => {
        const appointment: SpaAppointment = {
          ...input,
          id: runtimeId('spa'),
          status: 'booked',
          createdAt: runtimeDateOffset(0),
        };
        set(state => ({ spaAppointments: [appointment, ...state.spaAppointments] }));
        return appointment;
      },
      updateSpaAppointmentStatus: (id, status) => set(state => ({
        spaAppointments: state.spaAppointments.map(item => item.id === id ? { ...item, status } : item),
      })),
      openCasinoSession: input => {
        const session: CasinoSession = {
          ...input,
          id: runtimeId('casino'),
          status: 'open',
          openedAt: runtimeDateOffset(0),
        };
        set(state => ({ casinoSessions: [session, ...state.casinoSessions] }));
        return session;
      },
      closeCasinoSession: id => set(state => ({
        casinoSessions: state.casinoSessions.map(item => item.id === id ? { ...item, status: 'closed', closedAt: runtimeDateOffset(0) } : item),
      })),
      addBoutiqueReturn: input => {
        const item: BoutiqueReturn = {
          ...input,
          id: runtimeId('return'),
          status: input.status || 'received',
          createdAt: runtimeDateOffset(0),
        };
        set(state => ({ boutiqueReturns: [item, ...state.boutiqueReturns] }));
        return item;
      },
    }),
    { name: 'sartal-business-operations' },
  ),
);
