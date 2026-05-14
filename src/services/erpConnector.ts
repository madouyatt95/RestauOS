// ERP Connector - Architecture Headless RestauOS
// Ce fichier sert de pont de communication entre l'application React et le backend Odoo / ERPNext.

export type ERPType = 'odoo' | 'erpnext' | 'none';

export interface ERPSettings {
  type: ERPType;
  url: string;
  db?: string;
  username?: string;
  apiKey?: string;
}

// Simulation d'une configuration stockée (Dans la vraie vie, zustand ou localStorage)
let config: ERPSettings = {
  type: 'odoo',
  url: 'https://mon-restau.odoo.com',
};

/**
 * Pousse une commande vers le backend ERP pour la comptabilité et la gestion des stocks.
 */
export async function syncOrderToERP(orderId: string, total: number, items: any[]): Promise<boolean> {
  if (config.type === 'none') return true;

  console.log(`[ERP Sync] Préparation de la synchronisation vers ${config.type.toUpperCase()}`);
  console.log(`[ERP Sync] Payload:`, { orderId, total, items });

  // Simulation d'une requête API (Latence réseau)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[ERP Sync] Succès ! Ticket ${orderId} enregistré dans la comptabilité.`);
      resolve(true);
    }, 1500);
  });
}

/**
 * Récupère le stock réel depuis l'ERP (si connecté)
 */
export async function fetchStockFromERP(): Promise<any> {
  if (config.type === 'none') return null;
  // TODO: Implémenter l'appel API REST/XML-RPC vers Odoo
  return null;
}
