import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from './authStore';
import { useHospiStore, type PermissionMode } from './hospiStore';

export type SensitiveAction =
  | 'discount'
  | 'cancel_order'
  | 'staff_meal'
  | 'void_payment'
  | 'stock_transfer'
  | 'inventory_adjustment'
  | 'stock_loss'
  | 'cash_close';

export interface AuditLogEntry {
  id: string;
  action: SensitiveAction;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetType: 'order' | 'payment' | 'stock' | 'staff' | 'cash_session';
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

const ACTION_LABEL_BY_SENSITIVE_ACTION: Record<SensitiveAction, string> = {
  discount: 'Remise',
  cancel_order: 'Annuler',
  staff_meal: 'Consommation personnel',
  void_payment: 'Annuler paiement',
  stock_transfer: 'Transférer stock',
  inventory_adjustment: 'Corriger inventaire',
  stock_loss: 'Perte stock',
  cash_close: 'Clôturer caisse',
};

const ROLE_ALIAS: Record<string, string[]> = {
  Admin: ['Direction'],
  Gérant: ['Direction', 'Manager'],
  Caissier: ['Caissier'],
  Serveur: ['Serveur'],
  'Chef cuisine': ['Chef cuisine'],
  Livreur: ['Livreur'],
  Client: ['Client'],
};

const getConfiguredPermission = (user: UserProfile | null, action: SensitiveAction): PermissionMode | undefined => {
  if (!user) return undefined;
  const actionLabel = ACTION_LABEL_BY_SENSITIVE_ACTION[action];
  const roles = ROLE_ALIAS[user.role] || [user.role];
  const policies = useHospiStore.getState().permissionPolicies;
  return roles.map(role => policies.find(policy => policy.role === role && policy.action === actionLabel)?.mode).find(Boolean);
};

export const useBusinessRulesStore = create<BusinessRulesState>()(
  persist(
    (set) => ({
      auditLogs: [],
      canPerform: (user, action, amount = 0) => {
        if (!user) return false;
        const configured = getConfiguredPermission(user, action);
        if (configured === 'allow') return true;
        if (configured === 'manager' || configured === 'deny') return false;
        if (MANAGER_ROLES.includes(user.role)) return true;
        if (action === 'discount') return amount <= (DISCOUNT_LIMIT_BY_ROLE[user.role] || 0);
        if (action === 'stock_loss') return ['Chef cuisine', 'Caissier'].includes(user.role) && amount <= 5000;
        if (action === 'inventory_adjustment') return user.role === 'Chef cuisine' && amount <= 10000;
        return false;
      },
      requiresManagerApproval: (user, action, amount = 0) => {
        if (!user) return true;
        const configured = getConfiguredPermission(user, action);
        if (configured === 'allow') return false;
        if (configured === 'manager') return true;
        if (configured === 'deny') return false;
        if (MANAGER_ROLES.includes(user.role)) return false;
        if (action === 'discount') return amount > (DISCOUNT_LIMIT_BY_ROLE[user.role] || 0);
        if (action === 'stock_loss') return !(['Chef cuisine', 'Caissier'].includes(user.role) && amount <= 5000);
        if (action === 'inventory_adjustment') return !(user.role === 'Chef cuisine' && amount <= 10000);
        return true;
      },
      recordAudit: (entry) => set((state) => {
        if (entry.managerApprovalRequired) {
          useHospiStore.getState().createApprovalRequest({
            title: `${entry.action} - ${entry.targetType}`,
            detail: entry.reason,
            module: entry.targetType,
            requested_by: entry.actorName,
          });
        }
        return {
          auditLogs: [{
          ...entry,
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }, ...state.auditLogs]
        };
      }),
    }),
    { name: 'sartal-business-rules' }
  )
);
