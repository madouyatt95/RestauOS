import { useHospiStore, type POSProduct, type PaymentMethod } from '../stores/hospiStore';
import { useOrderStore, type Order, type Product } from '../stores/orderStore';
import { runtimeId, runtimeIso } from '../utils/runtime';

export interface POSSaleInput {
  posId: string;
  productId: string;
  quantity?: number;
  payment: PaymentMethod;
  actor: string;
  roomId?: string;
}

export interface POSSaleResult {
  order: Order;
  movements: ReturnType<typeof useHospiStore.getState>['stockMovements'];
  folioLineId?: string;
}

const toOrderProduct = (row: POSProduct): Product => ({
  id: row.product.id,
  name: row.product.name,
  price: row.price.sale_price,
  category: row.product.category_id.includes('boisson') || row.product.category_id.includes('bar') || row.product.category_id.includes('minibar') ? 'boissons' : 'plats',
  image: row.product.category_id === 'spa' ? 'SPA' : row.product.category_id === 'boutique' ? 'BTQ' : 'POS',
  stock: row.stock?.quantity || 0,
  cost: row.product.average_purchase_price || 0,
});

export function completePOSSale(input: POSSaleInput): POSSaleResult {
  const hospi = useHospiStore.getState();
  const pos = hospi.posList.find(item => item.id === input.posId && item.is_active);
  if (!pos) throw new Error('Point de vente indisponible.');
  if (!pos.payment_methods.includes(input.payment)) throw new Error('Moyen de paiement non autorisé sur ce point de vente.');

  const row = hospi.getProductsForPOS(pos.id).find(item => item.product.id === input.productId);
  if (!row) throw new Error('Produit indisponible sur ce point de vente.');

  const quantity = Math.max(1, Math.floor(input.quantity || 1));
  const roomContext = input.payment === 'room_charge'
    ? hospi.getOccupiedRoomsWithOpenFolios().find(item => item.room.id === input.roomId)
    : undefined;
  if (input.payment === 'room_charge' && !roomContext) throw new Error('Aucun folio ouvert pour cette chambre.');

  const orderId = runtimeId('pos');
  const createdAt = runtimeIso();
  const movements = hospi.recordSale(orderId, [{ productId: row.product.id, quantity }], input.actor, pos.id);
  const requiresStockMovement = row.product.is_stockable || Boolean(hospi.getRecipeForProduct(row.product.id));
  if (requiresStockMovement && movements.length === 0) throw new Error('Le stock lié à cette vente est incomplet.');

  const total = row.price.sale_price * quantity;
  const folioLine = roomContext
    ? useHospiStore.getState().chargeOrderToRoom(roomContext.room.id, orderId, `${row.product.name} · ${pos.name}`, total)
    : undefined;
  if (roomContext && !folioLine) throw new Error('L’imputation sur la chambre a échoué.');

  const orderProduct = toOrderProduct(row);
  const order: Order = {
    id: orderId,
    items: [{ product: orderProduct, quantity }],
    total,
    type: 'sur_place',
    payment: input.payment,
    date: createdAt,
    status: 'payee',
    paidAmount: total,
    payments: [{ id: runtimeId('payment'), amount: total, method: input.payment, date: createdAt }],
    itemsReady: {},
    posId: pos.id,
    roomId: roomContext?.room.id,
    roomNumber: roomContext?.room.room_number,
    hospiLines: [{ productId: row.product.id, quantity }],
    serveurName: input.actor,
  };

  useOrderStore.setState(state => ({ orders: [order, ...state.orders] }));
  return { order, movements, folioLineId: folioLine?.id };
}
