import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from './authStore';

export type SensitiveAction = 'discount' | 'cancel_order' | 'staff_meal' | 'void_payment';

export interface AuditLogEntry {
  id: string;
  action: SensitiveAction;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetType: 'order' | 'payment' | 'stock' | 'staff';
  targetId: string;
  amount?: number;
  reason: string;
  managerApprovalRequired: boolean;
  createdAt: string;
}

interface BusinessRulesState {
  auditLogs: AuditLogEntry[];
  canPerform: (user: UserProfile | null, action: SensitiveAction, amount?: number) => boolean;
  requiresManagerApproval: (user: UserProfile | null, action: SensitiveAction, amount?: number) => boolean;
  recordAudit: (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => void;
}

const MANAGER_ROLES = ['Admin', 'Gérant'];
const DISCOUNT_LIMIT_BY_ROLE: Record<string, number> = {
  Admin: Number.POSITIVE_INFINITY,
  Gérant: Number.POSITIVE_INFINITY,
  Caissier: 5000,
  Serveur: 2000,
};

export const useBusinessRulesStore = create<BusinessRulesState>()(
  persist(
    (set) => ({
      auditLogs: [],
      canPerform: (user, action, amount = 0) => {
        if (!user) return false;
        if (MANAGER_ROLES.includes(user.role)) return true;
        if (action === 'discount') return amount <= (DISCOUNT_LIMIT_BY_ROLE[user.role] || 0);
        return false;
      },
      requiresManagerApproval: (user, action, amount = 0) => {
        if (!user) return true;
        if (MANAGER_ROLES.includes(user.role)) return false;
        if (action === 'discount') return amount > (DISCOUNT_LIMIT_BY_ROLE[user.role] || 0);
        return true;
      },
      recordAudit: (entry) => set((state) => ({
        auditLogs: [{
          ...entry,
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }, ...state.auditLogs]
      })),
    }),
    { name: 'sartal-business-rules' }
  )
);
