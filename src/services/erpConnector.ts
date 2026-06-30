// ERP Connector - Architecture Headless RestauOS
// Ce pont reste volontairement inactif tant qu'aucun ERP externe n'est réellement configuré.
import type { CartItem } from '../stores/orderStore';

export type ERPType = 'odoo' | 'erpnext' | 'none';

export interface ERPSettings {
  type: ERPType;
  url: string;
  db?: string;
  username?: string;
  apiKey?: string;
}

const config: ERPSettings = {
  type: 'none',
  url: '',
};

/**
 * Pousse une commande vers le backend ERP pour la comptabilité et la gestion des stocks.
 */
export async function syncOrderToERP(orderId: string, total: number, items: CartItem[]): Promise<boolean> {
  void orderId;
  void total;
  void items;
  return false;
}

/**
 * Récupère le stock réel depuis l'ERP (si connecté)
 */
export async function fetchStockFromERP(): Promise<unknown> {
  if (config.type === 'none') return null;
  return null;
}
