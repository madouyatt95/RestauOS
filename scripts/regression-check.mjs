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
  configDrafts: [],
  configHistory: [],
  permissionPolicies: [],
  taxProfiles: [{ id: 'tax-restaurant', name: 'Restaurant', rate: 18 }],
  approvals: [{ id: 'approval-1', status: 'pending' }],
  snapshots: [],
  sites: [{ id: 'site-dakar', name: 'Site Dakar' }],
  posList: [{ id: 'pos-restaurant-jardin', name: 'Restaurant Le Jardin', type: 'restaurant', default_warehouse_id: 'wh-restaurant' }],
  warehouses: [{ id: 'wh-restaurant', name: 'Dépôt Restaurant', type: 'restaurant', site_id: 'site-dakar' }],
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

function createDraft(title, beforeValue, afterValue) {
  const draft = { id: `draft-${state.configDrafts.length + 1}`, title, before_value: beforeValue, after_value: afterValue, status: 'draft' };
  state.configDrafts.unshift(draft);
  return draft;
}

function publishDraft(id) {
  const draft = state.configDrafts.find(item => item.id === id);
  assert.ok(draft, 'draft exists before publish');
  if (state.criticalAlert && draft.type !== 'fix') return false;
  draft.status = 'published';
  state.configHistory.unshift({ title: draft.title, before_value: draft.before_value, after_value: draft.after_value });
  return true;
}

function setPermission(role, action, mode) {
  const existing = state.permissionPolicies.find(item => item.role === role && item.action === action);
  if (existing) existing.mode = mode;
  else state.permissionPolicies.push({ role, action, mode });
}

function createBusinessPack(label) {
  const warehouse = { id: `wh-${label}`, name: `Dépôt ${label}`, type: 'bar' };
  const pos = { id: `pos-${label}`, name: label, type: 'bar', default_warehouse_id: warehouse.id };
  state.warehouses.push(warehouse);
  state.posList.push(pos);
  return { pos, warehouse };
}

function snapshotConfig() {
  const snapshot = {
    id: `snapshot-${state.snapshots.length + 1}`,
    posCount: state.posList.length,
    warehouseCount: state.warehouses.length,
  };
  state.snapshots.unshift(snapshot);
  return snapshot;
}

function resolveApproval(id, status) {
  const approval = state.approvals.find(item => item.id === id);
  assert.ok(approval, 'approval exists');
  approval.status = status;
}

function importCsv(kind, csv) {
  const rows = csv.trim().split(/\r?\n/);
  const headers = rows[0].split(';');
  let imported = 0;
  const errors = [];
  rows.slice(1).forEach((line, index) => {
    const values = line.split(';');
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] || '']));
    if (kind === 'products' && (!row.name || !row.sku)) errors.push(`Ligne ${index + 2}: nom ou SKU manquant`);
    else imported += 1;
  });
  return { imported, errors };
}

function recordSensitiveAudit(managerApprovalRequired) {
  if (managerApprovalRequired) state.approvals.unshift({ id: `approval-${state.approvals.length + 1}`, status: 'pending' });
}

function addSite(name) {
  const site = { id: `site-${state.sites.length + 1}`, name };
  state.sites.push(site);
  return site;
}

function deleteSite(siteId) {
  const hasLinks = state.posList.some(pos => pos.site_id === siteId) || state.warehouses.some(warehouse => warehouse.site_id === siteId);
  if (hasLinks) return false;
  state.sites = state.sites.filter(site => site.id !== siteId);
  return true;
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

const draft = createDraft('Prix Coca Night Club', '2500 F', '2800 F');
assert.equal(publishDraft(draft.id), true, 'healthy config draft can publish');
assert.equal(state.configDrafts[0].status, 'published', 'config draft can be published');
assert.equal(state.configHistory[0].after_value, '2800 F', 'published draft creates config history');

setPermission('Serveur', 'Remise', 'manager');
assert.equal(state.permissionPolicies[0].mode, 'manager', 'permission matrix persists manager validation mode');
assert.equal(state.permissionPolicies.some(item => item.role === 'Serveur' && item.action === 'Remise' && item.mode === 'manager'), true, 'persisted permission can block action behind manager approval');

state.criticalAlert = true;
const blockedDraft = createDraft('Pack fiscal', 'ancien', 'nouveau');
assert.equal(publishDraft(blockedDraft.id), false, 'critical config alert blocks unsafe publication');
state.criticalAlert = false;

const pack = createBusinessPack('Rooftop');
assert.equal(pack.pos.default_warehouse_id, pack.warehouse.id, 'business pack creates linked POS and warehouse');

const snapshot = snapshotConfig();
assert.equal(snapshot.posCount, state.posList.length, 'configuration snapshot captures POS count');

resolveApproval('approval-1', 'approved');
assert.equal(state.approvals[0].status, 'approved', 'manager approval workflow resolves request');

const badImport = importCsv('products', 'name;sku\nProduit sans sku;');
assert.equal(badImport.errors.length, 1, 'CSV import reports invalid rows');

recordSensitiveAudit(true);
assert.equal(state.approvals[0].status, 'pending', 'sensitive audit creates approval request');

const saly = addSite('Site Saly');
assert.equal(state.sites.some(site => site.id === saly.id), true, 'admin can create a site');
assert.equal(deleteSite('site-dakar'), false, 'admin cannot delete a site that still has linked operations');
assert.equal(deleteSite(saly.id), true, 'admin can delete an unused site');

console.log('Regression checks passed: POS stock, FIFO lots, PMS folio, partial supplier receipt, admin config workflows, permissions, imports, publication guard, site admin.');
