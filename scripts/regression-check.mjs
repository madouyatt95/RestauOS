import assert from 'node:assert/strict';

const state = {
  pos: { id: 'pos-restaurant-jardin', default_warehouse_id: 'wh-restaurant', name: 'Restaurant Le Jardin' },
  stockLevels: [
    { product_id: 'prod-coca-33', warehouse_id: 'wh-restaurant', quantity: 10 },
    { product_id: 'prod-coca-33', warehouse_id: 'wh-bar-casino', quantity: 8 },
  ],
  lots: [
    { product_id: 'prod-coca-33', warehouse_id: 'wh-restaurant', quantity: 4, expires_at: '2026-07-10' },
    { product_id: 'prod-coca-33', warehouse_id: 'wh-restaurant', quantity: 6, expires_at: '2026-09-10' },
  ],
  folio: { id: 'folio-101', room_id: 'room-101', total_amount: 0, status: 'open' },
  purchaseLine: { id: 'line-1', product_id: 'prod-coca-33', quantity_ordered: 12, quantity_received: 0, unit_cost: 400 },
};

function recordSale(productId, quantity) {
  const level = state.stockLevels.find(item => item.product_id === productId && item.warehouse_id === state.pos.default_warehouse_id);
  assert.ok(level, 'stock level exists for POS warehouse');
  level.quantity = Math.max(0, level.quantity - quantity);

  let remaining = quantity;
  state.lots
    .filter(lot => lot.product_id === productId && lot.warehouse_id === state.pos.default_warehouse_id)
    .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at))
    .forEach(lot => {
      const consumed = Math.min(lot.quantity, remaining);
      lot.quantity -= consumed;
      remaining -= consumed;
    });
}

function chargeOrderToRoom(amount) {
  assert.equal(state.folio.status, 'open', 'folio must be open');
  state.folio.total_amount += amount;
}

function receivePartial(quantity) {
  const received = Math.min(quantity, state.purchaseLine.quantity_ordered - state.purchaseLine.quantity_received);
  state.purchaseLine.quantity_received += received;
  const level = state.stockLevels.find(item => item.product_id === state.purchaseLine.product_id && item.warehouse_id === 'wh-restaurant');
  level.quantity += received;
  return state.purchaseLine.quantity_received === state.purchaseLine.quantity_ordered ? 'received' : 'partially_received';
}

recordSale('prod-coca-33', 5);
assert.equal(state.stockLevels.find(item => item.warehouse_id === 'wh-restaurant').quantity, 5, 'POS sale decrements restaurant warehouse');
assert.equal(state.lots[0].quantity, 0, 'FIFO consumes earliest expiring lot first');
assert.equal(state.lots[1].quantity, 5, 'FIFO continues on next lot');

chargeOrderToRoom(2500);
assert.equal(state.folio.total_amount, 2500, 'room charge increases folio total');

const status = receivePartial(3);
assert.equal(status, 'partially_received', 'partial receipt keeps purchase order partially received');
assert.equal(state.purchaseLine.quantity_received, 3, 'partial receipt records actual quantity');
assert.equal(state.stockLevels.find(item => item.warehouse_id === 'wh-restaurant').quantity, 8, 'partial receipt increases stock');

console.log('Regression checks passed: POS stock, FIFO lots, PMS folio, partial supplier receipt.');
