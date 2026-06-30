import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
  key: index => [...storage.keys()][index] ?? null,
  get length() { return storage.size; },
};
globalThis.window = globalThis;
globalThis.window.localStorage = globalThis.localStorage;

const [{ useHospiStore }, { useOrderStore }, { useBusinessOperationsStore }, { completePOSSale }, { canAccessRoute, getHomePathForUser }, { DEMO_USERS }] = await Promise.all([
  import('../src/stores/hospiStore.ts'),
  import('../src/stores/orderStore.ts'),
  import('../src/stores/businessOperationsStore.ts'),
  import('../src/services/posTransaction.ts'),
  import('../src/utils/accessControl.ts'),
  import('../src/stores/authStore.ts'),
]);

const resetStores = () => {
  useHospiStore.setState(useHospiStore.getInitialState(), true);
  useOrderStore.setState(useOrderStore.getInitialState(), true);
  useBusinessOperationsStore.setState(useBusinessOperationsStore.getInitialState(), true);
};

resetStores();

const initial = useHospiStore.getState();
const cocaLevel = initial.stockLevels.find(level => level.product_id === 'prod-coca-33' && level.warehouse_id === 'wh-restaurant');
assert.ok(cocaLevel, 'restaurant Coca stock exists');
const cocaBefore = cocaLevel.quantity;

useHospiStore.setState(state => ({
  stockLots: [
    { id: 'test-lot-early', warehouse_id: 'wh-restaurant', product_id: 'prod-coca-33', lot_number: 'EARLY', expires_at: '2026-07-10', quantity: 2, unit_cost: 400, received_at: '2026-06-01' },
    { id: 'test-lot-late', warehouse_id: 'wh-restaurant', product_id: 'prod-coca-33', lot_number: 'LATE', expires_at: '2026-09-10', quantity: 5, unit_cost: 420, received_at: '2026-06-02' },
    ...state.stockLots,
  ],
}));

const saleMovements = useHospiStore.getState().recordSale(
  'regression-coca-sale',
  [{ productId: 'prod-coca-33', quantity: 3 }],
  'Regression',
  'pos-restaurant-jardin',
);
assert.equal(saleMovements.length, 1, 'real POS sale creates a stock movement');
assert.equal(useHospiStore.getState().getStockLevel('prod-coca-33', 'wh-restaurant')?.quantity, cocaBefore - 3, 'real POS sale decrements its linked warehouse');
assert.equal(useHospiStore.getState().stockLots.find(lot => lot.id === 'test-lot-early')?.quantity, 0, 'FIFO consumes earliest lot first');
assert.equal(useHospiStore.getState().stockLots.find(lot => lot.id === 'test-lot-late')?.quantity, 4, 'FIFO continues on the following lot');

const folioBefore = useHospiStore.getState().folios.find(folio => folio.id === 'folio-105-open')?.total_amount;
const boutiqueStockBefore = useHospiStore.getState().getStockLevel('prod-peignoir', 'wh-boutique')?.quantity;
const roomSale = completePOSSale({
  posId: 'pos-boutique-hotel',
  productId: 'prod-peignoir',
  payment: 'room_charge',
  actor: 'Regression',
  roomId: 'room-105',
});
assert.equal(roomSale.order.status, 'payee', 'room charge settles the POS ticket');
assert.equal(roomSale.order.paidAmount, 18000, 'room charge records the paid amount on the POS ticket');
assert.ok(roomSale.folioLineId, 'room charge creates a real folio line');
assert.equal(useHospiStore.getState().getStockLevel('prod-peignoir', 'wh-boutique')?.quantity, (boutiqueStockBefore || 0) - 1, 'business POS sale decrements business warehouse');
assert.equal(useHospiStore.getState().folios.find(folio => folio.id === 'folio-105-open')?.total_amount, (folioBefore || 0) + 18000, 'business POS sale increases the room folio');
assert.equal(useOrderStore.getState().orders[0].id, roomSale.order.id, 'transaction writes the real order store');

const purchase = useHospiStore.getState().addPurchaseOrder({
  supplier_id: 'sup-touba-distribution',
  warehouse_id: 'wh-restaurant',
  ordered_by: 'Regression',
  lines: [{ product_id: 'prod-coca-33', quantity_ordered: 12, unit_cost: 400, lot_number: 'RECEIPT-TEST', expires_at: '2027-01-01' }],
});
assert.ok(purchase, 'real purchase order is created');
const purchaseLine = useHospiStore.getState().purchaseOrderLines.find(line => line.purchase_order_id === purchase.id);
assert.ok(purchaseLine, 'real purchase line is created');
const stockBeforeReceipt = useHospiStore.getState().getStockLevel('prod-coca-33', 'wh-restaurant')?.quantity || 0;
const receipt = useHospiStore.getState().receivePurchaseOrderLines(purchase.id, 'Regression', { [purchaseLine.id]: 3 });
assert.ok(receipt, 'partial supplier receipt is recorded');
assert.equal(useHospiStore.getState().purchaseOrders.find(order => order.id === purchase.id)?.status, 'partially_received', 'partial receipt keeps order open');
assert.equal(useHospiStore.getState().getStockLevel('prod-coca-33', 'wh-restaurant')?.quantity, stockBeforeReceipt + 3, 'partial receipt increases real stock');
assert.equal(useHospiStore.getState().stockLots.some(lot => lot.lot_number === 'RECEIPT-TEST' && lot.quantity === 3), true, 'partial receipt creates the supplier lot');

const draft = useHospiStore.getState().createConfigDraft({
  title: 'Prix test', module: 'POS', change_type: 'price', before_value: '1500', after_value: '1600', created_by: 'Regression',
});
useHospiStore.getState().testConfigDraft(draft.id);
assert.equal(useHospiStore.getState().publishConfigDraft(draft.id, 'Regression')?.status, 'published', 'tested configuration can be published');
assert.equal(useHospiStore.getState().configHistoryEntries[0].after_value, '1600', 'publication writes real configuration history');

useHospiStore.getState().setPermissionPolicy('Serveur', 'Remise', 'manager');
assert.equal(useHospiStore.getState().getPermissionMode('Serveur', 'Remise'), 'manager', 'permission policy persists in the real store');
const rootAdmin = DEMO_USERS.find(user => user.accessLevel === 'direction');
assert.equal(canAccessRoute(rootAdmin, '/settings'), true, 'root admin keeps administration access');
assert.equal(getHomePathForUser(rootAdmin), '/dashboard', 'direction profile lands on holding dashboard');
assert.equal(getHomePathForUser(DEMO_USERS.find(user => user.id === 'u8')), '/pms', 'hotel manager lands on PMS');
assert.equal(getHomePathForUser(DEMO_USERS.find(user => user.id === 'u11')), '/pos-metier', 'spa manager lands on business POS');
assert.equal(getHomePathForUser(DEMO_USERS.find(user => user.id === 'u12')), '/pos-metier', 'boutique cashier lands on boutique POS');
assert.equal(getHomePathForUser(DEMO_USERS.find(user => user.id === 'u3')), '/caisse', 'restaurant/bar cashier lands on cash register');
assert.equal(getHomePathForUser(DEMO_USERS.find(user => user.id === 'u7')), '/pos-metier', 'room service server lands on room service POS');

const pack = useHospiStore.getState().createBusinessPack('bar', 'site-dakar', 'Rooftop Regression');
assert.ok(pack && pack.pos.default_warehouse_id === pack.warehouse.id, 'business pack creates a linked POS and warehouse');
const snapshot = useHospiStore.getState().createConfigSnapshot('Regression', 'Regression');
assert.equal(snapshot.payload.posList.length, useHospiStore.getState().posList.length, 'snapshot captures the real configuration');

const approval = useHospiStore.getState().createApprovalRequest({ title: 'Test', detail: 'Validation', module: 'POS', requested_by: 'Regression' });
assert.equal(useHospiStore.getState().resolveApprovalRequest(approval.id, 'approved', 'Direction')?.status, 'approved', 'approval workflow resolves a real request');
const badImport = useHospiStore.getState().importAdminCsv('products', 'name;sku\nProduit sans sku;', 'Regression');
assert.equal(badImport.errors.length, 1, 'real CSV import reports invalid rows');
const supplierImport = useHospiStore.getState().importAdminCsv('suppliers', 'name;phone;email\nFournisseur Regression;770000000;test@example.com', 'Regression');
assert.equal(supplierImport.imported, 1, 'supplier CSV import creates a real supplier');
assert.equal(useHospiStore.getState().suppliers.some(supplier => supplier.name === 'Fournisseur Regression'), true, 'imported supplier is persisted');
const roomImport = useHospiStore.getState().importAdminCsv('rooms', 'site_id;room_number;room_type;status\nsite-dakar;909;Suite;available', 'Regression');
assert.equal(roomImport.imported, 1, 'room CSV import creates a real room');
assert.equal(useHospiStore.getState().rooms.some(room => room.room_number === '909'), true, 'imported room is persisted');
const customerImport = useHospiStore.getState().importAdminCsv('customers', 'display_name;type;phone;credit_limit;balance\nClient Regression;vip;771111111;100000;25000', 'Regression');
assert.equal(customerImport.imported, 1, 'customer CSV import creates a real customer account');
assert.equal(useHospiStore.getState().customerAccounts.some(account => account.display_name === 'Client Regression' && account.balance === 25000), true, 'imported customer account is persisted');
const stockImport = useHospiStore.getState().importAdminCsv('stock', 'product_id;warehouse_id;quantity;threshold;lot_number;unit_cost\nprod-coca-33;wh-restaurant;88;20;IMPORT-FIFO;390', 'Regression');
assert.equal(stockImport.imported, 1, 'stock CSV import creates or updates a stock level');
assert.equal(useHospiStore.getState().getStockLevel('prod-coca-33', 'wh-restaurant')?.quantity, 88, 'imported stock quantity is applied');
assert.equal(useHospiStore.getState().stockLots.some(lot => lot.lot_number === 'IMPORT-FIFO'), true, 'stock import can create a lot for FIFO');
const spaAppointment = useBusinessOperationsStore.getState().addSpaAppointment({
  posId: 'pos-spa-wellness',
  guestName: 'Regression Spa',
  serviceName: 'Massage relaxant 60 min',
  therapist: 'Regression',
  startsAt: '2026-06-30T16:00:00.000Z',
  amount: 45000,
});
useBusinessOperationsStore.getState().updateSpaAppointmentStatus(spaAppointment.id, 'done');
assert.equal(useBusinessOperationsStore.getState().spaAppointments.find(item => item.id === spaAppointment.id)?.status, 'done', 'spa workflow persists appointment status');
const casinoSession = useBusinessOperationsStore.getState().openCasinoSession({
  posId: 'pos-casino-floor',
  tableName: 'Regression Blackjack',
  playerName: 'Regression Player',
  host: 'Regression',
  buyIn: 100000,
});
useBusinessOperationsStore.getState().closeCasinoSession(casinoSession.id);
assert.equal(useBusinessOperationsStore.getState().casinoSessions.find(item => item.id === casinoSession.id)?.status, 'closed', 'casino workflow closes real sessions');
const boutiqueReturn = useBusinessOperationsStore.getState().addBoutiqueReturn({
  posId: 'pos-boutique-hotel',
  productName: 'Peignoir hotel',
  reason: 'Regression exchange',
  amount: 18000,
});
assert.equal(useBusinessOperationsStore.getState().boutiqueReturns[0].id, boutiqueReturn.id, 'boutique workflow records returns');

const newSite = useHospiStore.getState().addSite({ company_id: 'comp-sartal-demo', name: 'Site Regression', address: 'Test', city: 'Dakar', country: 'Sénégal' });
assert.equal(useHospiStore.getState().deleteSite('site-dakar'), false, 'linked operational site cannot be deleted');
assert.equal(useHospiStore.getState().deleteSite(newSite.id), true, 'unused site can be deleted');

console.log('Regression checks passed on production stores: POS transaction, stock, FIFO, folio, purchasing, configuration, permissions, imports and sites.');
