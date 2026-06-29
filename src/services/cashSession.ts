import type { CashSession, CashSessionSummary, PaymentMethod } from '../stores/hospiStore';
import type { Order } from '../stores/orderStore';

const EMPTY_TOTALS: Record<PaymentMethod, number> = {
  especes: 0,
  wave: 0,
  orange_money: 0,
  carte: 0,
  room_charge: 0,
};

const CASH_SETTLED_STATUSES = ['payee', 'servie', 'terminee'] as const;

export function summarizeCashSession(session: CashSession | undefined, orders: Order[]): CashSessionSummary {
  if (!session) {
    return {
      orderCount: 0,
      grossSales: 0,
      byMethod: { ...EMPTY_TOTALS },
      expectedCash: 0,
      roomChargeTotal: 0,
    };
  }

  const openedAt = new Date(session.opened_at).getTime();
  const closedAt = session.closed_at ? new Date(session.closed_at).getTime() : Number.POSITIVE_INFINITY;
  const sessionOrders = orders.filter(order => {
    const orderTime = new Date(order.date).getTime();
    return order.posId === session.pos_id &&
      orderTime >= openedAt &&
      orderTime <= closedAt &&
      CASH_SETTLED_STATUSES.includes(order.status as typeof CASH_SETTLED_STATUSES[number]);
  });

  const byMethod = sessionOrders.reduce<Record<PaymentMethod, number>>((totals, order) => {
    order.payments.forEach(payment => {
      totals[payment.method] += payment.amount;
    });
    return totals;
  }, { ...EMPTY_TOTALS });

  const grossSales = Object.values(byMethod).reduce((sum, amount) => sum + amount, 0);
  const expectedCash = session.opening_float + byMethod.especes;

  return {
    orderCount: sessionOrders.length,
    grossSales,
    byMethod,
    expectedCash,
    roomChargeTotal: byMethod.room_charge,
  };
}

export function buildCashSessionTicket(params: {
  session: CashSession;
  summary: CashSessionSummary;
  posName: string;
  registerName: string;
}): string {
  const { session, summary, posName, registerName } = params;
  const diff = session.difference ?? ((session.closing_cash_count ?? 0) - summary.expectedCash);

  return [
    'RESTAUOS HOSPITALITY ERP',
    'TICKET DE CLOTURE Z',
    '',
    `POS: ${posName}`,
    `Caisse: ${registerName}`,
    `Session: ${session.id}`,
    `Ouverte par: ${session.opened_by}`,
    `Ouverte le: ${new Date(session.opened_at).toLocaleString('fr-FR')}`,
    `Cloturee par: ${session.closed_by || '-'}`,
    `Cloturee le: ${session.closed_at ? new Date(session.closed_at).toLocaleString('fr-FR') : '-'}`,
    '',
    'TOTAUX',
    `Tickets: ${summary.orderCount}`,
    `Ventes brutes: ${summary.grossSales.toLocaleString('fr-FR')} FCFA`,
    '',
    'PAR MOYEN DE PAIEMENT',
    `Especes: ${summary.byMethod.especes.toLocaleString('fr-FR')} FCFA`,
    `Wave: ${summary.byMethod.wave.toLocaleString('fr-FR')} FCFA`,
    `Orange Money: ${summary.byMethod.orange_money.toLocaleString('fr-FR')} FCFA`,
    `Carte: ${summary.byMethod.carte.toLocaleString('fr-FR')} FCFA`,
    `Imputation chambre: ${summary.byMethod.room_charge.toLocaleString('fr-FR')} FCFA`,
    '',
    'CONTROLE ESPECES',
    `Fond de caisse: ${session.opening_float.toLocaleString('fr-FR')} FCFA`,
    `Especes attendues: ${summary.expectedCash.toLocaleString('fr-FR')} FCFA`,
    `Especes comptees: ${(session.closing_cash_count ?? 0).toLocaleString('fr-FR')} FCFA`,
    `Ecart: ${diff.toLocaleString('fr-FR')} FCFA`,
    '',
    '--- FIN TICKET Z ---',
  ].join('\n');
}
