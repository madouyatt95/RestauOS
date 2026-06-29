import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';
import { useHospiStore } from '../stores/hospiStore';
import { useAuthStore } from '../stores/authStore';
import { useBusinessRulesStore } from '../stores/businessRulesStore';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Package, Settings, Warehouse, Truck, Activity, CreditCard } from 'lucide-react';

const purchaseStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  ordered: 'Commandée',
  partially_received: 'Réception partielle',
  received: 'Réceptionnée',
  cancelled: 'Annulée',
};

const stockMovementLabels: Record<string, string> = {
  sale: 'Vente POS',
  recipe_consumption: 'Recette',
  production: 'Production',
  purchase: 'Réception fournisseur',
  transfer_out: 'Transfert sorti',
  transfer_in: 'Transfert reçu',
  inventory_adjustment: 'Correction inventaire',
  loss: 'Perte',
};

type StockTab = 'pilotage' | 'depots' | 'achats' | 'mouvements' | 'pertes' | 'inventaire' | 'entrees' | 'sorties';

export default function Stocks() {
  const { items, movements, addMovement, addItem } = useStockStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    sites,
    posList,
    warehouses,
    products,
    stockLevels,
    stockMovements,
    suppliers,
    purchaseOrders,
    purchaseOrderLines,
    supplierReceipts,
    transferStock,
    adjustInventory,
    recordLoss,
    receivePurchaseOrder
  } = useHospiStore();
  const { canPerform, requiresManagerApproval, recordAudit } = useBusinessRulesStore();
  const [tab, setTab] = useState<StockTab>('pilotage');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState<{ type: 'entree' | 'sortie'; itemId: string } | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || 'site-dakar');
  const [moveQty, setMoveQty] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'kg', minStock: '', category: '' });
  const [transferForm, setTransferForm] = useState({ productId: 'prod-coca-33', fromWarehouseId: 'wh-central', toWarehouseId: 'wh-restaurant', quantity: '', reason: 'Réassort dépôt' });
  const [adjustForm, setAdjustForm] = useState({ productId: 'prod-coca-33', warehouseId: 'wh-restaurant', countedQuantity: '', reason: 'Inventaire physique' });
  const [lossForm, setLossForm] = useState({ productId: 'ing-steak', warehouseId: 'wh-dakar-viandes', quantity: '', reason: 'Erreur cuisine' });

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMoves = movements.filter(m =>
    tab === 'entrees' ? m.type === 'entree' : tab === 'sorties' ? m.type === 'sortie' : true
  );
  const siteWarehouses = warehouses.filter(warehouse => warehouse.site_id === selectedSiteId);
  const selectedSite = sites.find(site => site.id === selectedSiteId) || sites[0];
  const siteStockLevels = stockLevels.filter(level => {
    const warehouse = warehouses.find(item => item.id === level.warehouse_id);
    return warehouse?.site_id === selectedSiteId;
  });
  const lowHospiStocks = siteStockLevels.filter(level => level.quantity <= level.alert_threshold);
  const pendingPurchaseOrders = purchaseOrders.filter(order => order.status !== 'received' && order.status !== 'cancelled');
  const siteStockMovements = stockMovements.filter(move => warehouses.find(warehouse => warehouse.id === move.warehouse_id)?.site_id === selectedSiteId);
  const todayMovements = siteStockMovements.filter(move => new Date(move.created_at).toDateString() === new Date().toDateString());
  const stockValue = siteStockLevels.reduce((sum, level) => {
    const product = products.find(item => item.id === level.product_id);
    return sum + level.quantity * (product?.average_purchase_price || 0);
  }, 0);
  const stockProducts = useMemo(() => products
    .map(product => {
      const levels = siteStockLevels.filter(level => level.product_id === product.id);
      const total = levels.reduce((sum, level) => sum + level.quantity, 0);
      const low = levels.some(level => level.quantity <= level.alert_threshold);
      const locations = levels
        .map(level => warehouses.find(warehouse => warehouse.id === level.warehouse_id)?.name)
        .filter(Boolean) as string[];
      return { product, levels, total, low, locations };
    })
    .filter(row => row.levels.length > 0)
    .filter(row => !search.trim() || [row.product.name, row.product.sku, row.product.category_id, row.locations.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase())),
    [products, search, siteStockLevels, warehouses]
  );

  const handleMove = () => {
    if (!showMove || !moveQty) return;
    const item = items.find(i => i.id === showMove.itemId);
    if (!item) return;
    addMovement({
      itemId: showMove.itemId,
      itemName: item.name,
      type: showMove.type,
      quantity: Number(moveQty),
      date: new Date().toISOString(),
      note: moveNote || (showMove.type === 'entree' ? 'Réapprovisionnement' : 'Consommation cuisine'),
    });
    setShowMove(null);
    setMoveQty('');
    setMoveNote('');
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity) return;
    addItem({
      name: newItem.name,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      minStock: Number(newItem.minStock) || 5,
      category: newItem.category || 'Divers',
    });
    setNewItem({ name: '', quantity: '', unit: 'kg', minStock: '', category: '' });
    setShowAdd(false);
  };

  const handleTransfer = () => {
    if (!transferForm.productId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.quantity) return;
    const quantity = Number(transferForm.quantity);
    const needsApproval = requiresManagerApproval(user, 'stock_transfer', quantity);
    if (!canPerform(user, 'stock_transfer', quantity) && needsApproval) return;
    const movements = transferStock(
      transferForm.productId,
      transferForm.fromWarehouseId,
      transferForm.toWarehouseId,
      quantity,
      transferForm.reason || 'Transfert inter-dépôts',
      user?.name || 'Système'
    );
    if (movements.length > 0 && user) {
      recordAudit({
        action: 'stock_transfer',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetType: 'stock',
        targetId: movements[0].reference_id,
        amount: quantity,
        reason: transferForm.reason || 'Transfert inter-dépôts',
        managerApprovalRequired: needsApproval,
      });
    }
    setShowTransfer(false);
    setTransferForm(prev => ({ ...prev, quantity: '' }));
  };

  const handleAdjustment = () => {
    if (!adjustForm.productId || !adjustForm.warehouseId || !adjustForm.countedQuantity) return;
    const countedQuantity = Number(adjustForm.countedQuantity);
    const needsApproval = requiresManagerApproval(user, 'inventory_adjustment', countedQuantity);
    if (!canPerform(user, 'inventory_adjustment', countedQuantity) && needsApproval) return;
    const movement = adjustInventory(
      adjustForm.productId,
      adjustForm.warehouseId,
      countedQuantity,
      adjustForm.reason || 'Inventaire physique',
      user?.name || 'Système'
    );
    if (movement && user) {
      recordAudit({
        action: 'inventory_adjustment',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetType: 'stock',
        targetId: movement.id,
        amount: countedQuantity,
        reason: adjustForm.reason || 'Inventaire physique',
        managerApprovalRequired: needsApproval,
      });
    }
    setShowAdjustment(false);
    setAdjustForm(prev => ({ ...prev, countedQuantity: '' }));
  };

  const handleLoss = () => {
    if (!lossForm.productId || !lossForm.warehouseId || !lossForm.quantity) return;
    const quantity = Number(lossForm.quantity);
    const needsApproval = requiresManagerApproval(user, 'stock_loss', quantity);
    if (!canPerform(user, 'stock_loss', quantity) && needsApproval) return;
    const movement = recordLoss(
      lossForm.productId,
      lossForm.warehouseId,
      quantity,
      lossForm.reason || 'Perte déclarée',
      user?.name || 'Système'
    );
    if (movement && user) {
      recordAudit({
        action: 'stock_loss',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetType: 'stock',
        targetId: movement.id,
        amount: quantity,
        reason: lossForm.reason || 'Perte déclarée',
        managerApprovalRequired: needsApproval,
      });
    }
    setShowLoss(false);
    setLossForm(prev => ({ ...prev, quantity: '' }));
  };

  const handleReceivePurchase = (purchaseOrderId: string) => {
    receivePurchaseOrder(purchaseOrderId, user?.name || 'Système');
  };

  const getStockBadge = (item: typeof items[0]) => {
    if (item.quantity <= item.minStock * 0.5) return { label: 'Stock faible', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (item.quantity <= item.minStock) return { label: 'Stock faible', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    return { label: 'En stock', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-white">Stocks & dépôts</h1>
          <p className="text-text-tertiary text-xs mt-1">Piloter le stock réel du complexe, par dépôt et par point de vente.</p>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 glass-card flex items-center justify-center rounded-full">
            <AlertTriangle size={16} className="text-orange" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
        {([
          ['pilotage', 'Pilotage'],
          ['depots', 'Dépôts'],
          ['achats', 'Achats'],
          ['mouvements', 'Mouvements'],
          ['pertes', 'Pertes'],
          ['inventaire', 'Ancien stock'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === key
              ? 'bg-orange text-white shadow-[0_4px_16px_rgba(255,138,0,0.3)]'
              : 'glass-card text-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input type="text" placeholder="Rechercher un produit ou un article..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card text-sm text-white placeholder-text-tertiary bg-transparent border-none" />
      </div>

      <div className="glass-card-lg p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Site actif</p>
            <h2 className="text-white font-black text-base">{selectedSite?.name || 'Site principal'}</h2>
            <p className="text-text-secondary text-xs mt-1">{siteWarehouses.length} dépôts • {lowHospiStocks.length} alerte(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold outline-none">
              {sites.map(site => <option key={site.id} value={site.id} className="bg-[#111827]">{site.name}</option>)}
            </select>
            <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-text-secondary flex items-center justify-center" title="Modifier ou supprimer un dépôt">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {tab === 'pilotage' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Valeur stock', value: `${stockValue.toLocaleString('fr-FR')} F`, sub: 'au coût moyen', icon: CreditCard, color: '#22C55E' },
              { label: 'Alertes', value: lowHospiStocks.length, sub: 'références à traiter', icon: AlertTriangle, color: '#F59E0B' },
              { label: 'Dépôts', value: siteWarehouses.length, sub: 'sur le site actif', icon: Warehouse, color: '#3B82F6' },
              { label: 'Mouvements jour', value: todayMovements.length, sub: 'ventes, transferts, pertes', icon: Activity, color: '#8B5CF6' },
            ].map(card => (
              <div key={card.label} className="glass-card p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${card.color}20`, color: card.color }}>
                  <card.icon size={18} />
                </div>
                <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">{card.label}</p>
                <p className="text-white font-black text-lg mt-1">{card.value}</p>
                <p className="text-text-secondary text-[10px] mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowTransfer(true)} className="py-3 rounded-2xl bg-blue/10 border border-blue/20 text-blue font-black text-[10px] uppercase tracking-widest">
              Transférer
            </button>
            <button onClick={() => setShowAdjustment(true)} className="py-3 rounded-2xl bg-orange/10 border border-orange/20 text-orange font-black text-[10px] uppercase tracking-widest">
              Inventaire
            </button>
            <button onClick={() => setShowLoss(true)} className="py-3 rounded-2xl bg-red/10 border border-red/20 text-red font-black text-[10px] uppercase tracking-widest">
              Perte
            </button>
          </div>

          <section className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-sm">À traiter maintenant</h3>
                <p className="text-text-secondary text-xs">{pendingPurchaseOrders.length} réception(s) fournisseur • {lowHospiStocks.length} alerte(s) stock</p>
              </div>
              <button type="button" onClick={() => setTab('achats')} className="text-blue text-xs font-black">
                Achats
              </button>
            </div>
            <div className="space-y-2">
              {lowHospiStocks.slice(0, 5).map(level => {
                const product = products.find(item => item.id === level.product_id);
                const warehouse = warehouses.find(item => item.id === level.warehouse_id);
                return (
                  <div key={level.id} className="rounded-xl bg-orange/10 border border-orange/15 px-3 py-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-xs">{product?.name || level.product_id}</p>
                      <p className="text-text-secondary text-[10px]">{warehouse?.name} • seuil {level.alert_threshold} {level.unit}</p>
                    </div>
                    <span className="text-orange font-black text-xs">{level.quantity} {level.unit}</span>
                  </div>
                );
              })}
              {pendingPurchaseOrders.slice(0, 3).map(order => {
                const supplier = suppliers.find(item => item.id === order.supplier_id);
                const warehouse = warehouses.find(item => item.id === order.warehouse_id);
                return (
                  <button key={order.id} type="button" onClick={() => setTab('achats')} className="w-full rounded-xl bg-green/10 border border-green/15 px-3 py-2 flex items-center justify-between gap-3 text-left">
                    <div>
                      <p className="text-white font-bold text-xs">{supplier?.name || 'Fournisseur'}</p>
                      <p className="text-text-secondary text-[10px]">À réceptionner vers {warehouse?.name}</p>
                    </div>
                    <Truck size={16} className="text-green" />
                  </button>
                );
              })}
              {lowHospiStocks.length === 0 && pendingPurchaseOrders.length === 0 && (
                <p className="text-text-tertiary text-xs text-center py-5">Rien d’urgent sur ce site.</p>
              )}
            </div>
          </section>

          <section className="glass-card-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-black text-sm">Catalogue multi-dépôts</h3>
              <button type="button" onClick={() => setTab('depots')} className="text-blue text-xs font-black">Détails</button>
            </div>
            <div className="space-y-2">
              {stockProducts.slice(0, 8).map(row => (
                <div key={row.product.id} className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs truncate">{row.product.name}</p>
                      <p className="text-text-tertiary text-[10px] truncate">{row.locations.join(' • ')}</p>
                    </div>
                    <span className={`font-black text-xs ${row.low ? 'text-orange' : 'text-green'}`}>{row.total} {row.product.unit}</span>
                  </div>
                </div>
              ))}
              {stockProducts.length === 0 && (
                <p className="text-text-tertiary text-xs text-center py-5">Aucun produit trouvé.</p>
              )}
            </div>
          </section>
        </div>
      ) : tab === 'achats' ? (
        <div className="space-y-4">
          <section className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-sm">Réceptions fournisseur</h3>
                <p className="text-text-secondary text-xs">{pendingPurchaseOrders.length} commande(s) à réceptionner • {supplierReceipts.length} réception(s) enregistrée(s)</p>
              </div>
            </div>
            <div className="space-y-3">
              {purchaseOrders.map(order => {
                const supplier = suppliers.find(item => item.id === order.supplier_id);
                const warehouse = warehouses.find(item => item.id === order.warehouse_id);
                const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
                const total = lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_cost, 0);
                return (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-white font-black text-sm">{supplier?.name || 'Fournisseur'}</p>
                        <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {total.toLocaleString('fr-FR')} F</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${order.status === 'received' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                        {purchaseStatusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {lines.map(line => {
                        const product = products.find(item => item.id === line.product_id);
                        return (
                          <div key={line.id} className="flex justify-between text-[10px]">
                            <span className="text-text-secondary">{product?.name}</span>
                            <span className="text-white font-bold">{line.quantity_received}/{line.quantity_ordered}</span>
                          </div>
                        );
                      })}
                    </div>
                    {order.status !== 'received' && (
                      <button onClick={() => handleReceivePurchase(order.id)} className="w-full py-2.5 rounded-xl bg-green/10 text-green font-black text-[10px] uppercase tracking-widest">
                        Réceptionner vers dépôt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : tab === 'mouvements' ? (
        <div className="glass-card-lg p-4">
          <h3 className="text-white font-black text-sm mb-3">Traçabilité du stock</h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {siteStockMovements.map(move => {
              const product = products.find(item => item.id === move.product_id);
              const warehouse = warehouses.find(item => item.id === move.warehouse_id);
              const pos = move.pos_id ? posList.find(item => item.id === move.pos_id) : undefined;
              const isEntry = move.movement_type === 'production' || move.movement_type === 'purchase' || move.movement_type === 'transfer_in' || move.movement_type === 'inventory_adjustment';
              return (
                <div key={move.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-white font-bold text-xs">{product?.name || move.product_id}</p>
                    <p className="text-text-tertiary text-[10px]">{stockMovementLabels[move.movement_type] || move.movement_type} • {pos?.name || 'Back-office'} • {warehouse?.name}</p>
                  </div>
                  <span className={`${isEntry ? 'text-green' : 'text-red'} font-black text-xs`}>
                    {isEntry ? '+' : '-'}{move.quantity}
                  </span>
                </div>
              );
            })}
            {siteStockMovements.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucun mouvement pour ce site.</p>}
          </div>
        </div>
      ) : tab === 'depots' ? (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <p className="text-white font-black text-sm mb-2">Que voulez-vous faire ?</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
              <div className="rounded-xl bg-white/5 p-3">Voir les quantités disponibles dans chaque dépôt.</div>
              <div className="rounded-xl bg-white/5 p-3">Réceptionner une commande fournisseur vers un dépôt.</div>
              <div className="rounded-xl bg-white/5 p-3">Déplacer un produit d’un dépôt vers un autre.</div>
              <div className="rounded-xl bg-white/5 p-3">Corriger un inventaire ou déclarer une perte.</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowTransfer(true)} className="py-3 rounded-2xl bg-blue/10 border border-blue/20 text-blue font-black text-[10px] uppercase tracking-widest">
              Transférer
            </button>
            <button onClick={() => setShowAdjustment(true)} className="py-3 rounded-2xl bg-orange/10 border border-orange/20 text-orange font-black text-[10px] uppercase tracking-widest">
              Corriger
            </button>
            <button onClick={() => setShowLoss(true)} className="py-3 rounded-2xl bg-red/10 border border-red/20 text-red font-black text-[10px] uppercase tracking-widest">
              Perte
            </button>
          </div>

          <div className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-white font-black text-sm">Achats fournisseurs</h3>
                <p className="text-text-secondary text-xs">{suppliers.length} fournisseurs • {supplierReceipts.length} réception(s)</p>
              </div>
            </div>
            <div className="space-y-3">
              {purchaseOrders.map(order => {
                const supplier = suppliers.find(item => item.id === order.supplier_id);
                const warehouse = warehouses.find(item => item.id === order.warehouse_id);
                const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
                const total = lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_cost, 0);
                return (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-white font-black text-sm">{supplier?.name || 'Fournisseur'}</p>
                        <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {total.toLocaleString('fr-FR')} F</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${order.status === 'received' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                        {purchaseStatusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {lines.map(line => {
                        const product = products.find(item => item.id === line.product_id);
                        return (
                          <div key={line.id} className="flex justify-between text-[10px]">
                            <span className="text-text-secondary">{product?.name}</span>
                            <span className="text-white font-bold">{line.quantity_received}/{line.quantity_ordered}</span>
                          </div>
                        );
                      })}
                    </div>
                    {order.status !== 'received' && (
                      <button onClick={() => handleReceivePurchase(order.id)} className="w-full py-2.5 rounded-xl bg-green/10 text-green font-black text-[10px] uppercase tracking-widest">
                        Réceptionner vers dépôt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {siteWarehouses.map(warehouse => {
            const linkedPOS = posList.filter(pos => pos.default_warehouse_id === warehouse.id);
            const levels = stockLevels.filter(level => level.warehouse_id === warehouse.id);
            const lowLevels = levels.filter(level => level.quantity <= level.alert_threshold);
            return (
              <motion.div key={warehouse.id} layout className="glass-card p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-black text-sm">{warehouse.name}</h3>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest mt-1">{levels.length} référence(s) suivie(s)</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${lowLevels.length ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                      {lowLevels.length ? `${lowLevels.length} alerte(s)` : 'Stock OK'}
                    </span>
                    <button type="button" onClick={() => navigate('/settings')} className="text-[10px] font-black text-blue bg-blue/10 px-2.5 py-1 rounded-full">
                      Modifier
                    </button>
                  </div>
                </div>
                <p className="text-text-secondary text-xs mb-3">
                  Utilisé par : <span className="text-white font-bold">{linkedPOS.length ? linkedPOS.map(pos => pos.name).join(', ') : 'Aucun point de vente lié'}</span>
                </p>
                <div className="space-y-2">
                  {levels.map(level => {
                    const product = products.find(item => item.id === level.product_id);
                    const isLow = level.quantity <= level.alert_threshold;
                    return (
                      <div key={level.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <div>
                          <p className="text-white font-bold text-xs">{product?.name || level.product_id}</p>
                          <p className="text-text-tertiary text-[10px]">{isLow ? 'À réapprovisionner' : `Seuil : ${level.alert_threshold} ${level.unit}`}</p>
                        </div>
                        <span className={`font-black text-sm ${isLow ? 'text-orange' : 'text-green'}`}>
                          {level.quantity} {level.unit}
                        </span>
                      </div>
                    );
                  })}
                  {levels.length === 0 && <p className="text-text-tertiary text-xs">Aucun stock suivi dans ce dépôt.</p>}
                </div>
              </motion.div>
            );
          })}

          <div className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Historique des mouvements Hospi</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stockMovements.map(move => {
                const product = products.find(item => item.id === move.product_id);
                const warehouse = warehouses.find(item => item.id === move.warehouse_id);
                const pos = move.pos_id ? posList.find(item => item.id === move.pos_id) : undefined;
                const isEntry = move.movement_type === 'production' || move.movement_type === 'purchase' || move.movement_type === 'transfer_in';
                return (
                  <div key={move.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-white font-bold text-xs">{product?.name || move.product_id}</p>
                      <p className="text-text-tertiary text-[10px]">{stockMovementLabels[move.movement_type] || move.movement_type} • {pos?.name || 'Back-office'} • {warehouse?.name}</p>
                    </div>
                    <span className={`${isEntry ? 'text-green' : 'text-red'} font-black text-xs`}>
                      {isEntry ? '+' : '-'}{move.quantity}
                    </span>
                  </div>
                );
              })}
              {stockMovements.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucun mouvement Hospi pour le moment.</p>}
            </div>
          </div>
        </div>
      ) : tab === 'inventaire' ? (
        <>
          <div className="space-y-3 mb-6">
            {filtered.map(item => {
              const badge = getStockBadge(item);
              return (
                <motion.div key={item.id} layout className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-light flex items-center justify-center shrink-0">
                    <Package size={18} className="text-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">{item.name}</div>
                    <div className="text-text-tertiary text-xs">{item.quantity} {item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: badge.color, background: badge.bg }}>
                      {badge.label}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setShowMove({ type: 'entree', itemId: item.id })}
                        className="w-7 h-7 rounded-lg bg-green-light flex items-center justify-center">
                        <ArrowDownCircle size={14} className="text-green" />
                      </button>
                      <button onClick={() => setShowMove({ type: 'sortie', itemId: item.id })}
                        className="w-7 h-7 rounded-lg bg-red-light flex items-center justify-center">
                        <ArrowUpCircle size={14} className="text-red" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,138,0,0.3)]">
            <Plus size={16} className="inline mr-2" />Nouvel inventaire
          </button>
        </>
      ) : tab === 'pertes' ? (
        <div className="space-y-4">
          <button onClick={() => setShowLoss(true)}
            className="w-full py-4 rounded-2xl bg-red/10 border border-red/20 text-red font-black text-xs uppercase tracking-widest">
            Déclarer une perte
          </button>
          {stockMovements.filter(move => move.movement_type === 'loss').map(move => {
            const product = products.find(item => item.id === move.product_id);
            const warehouse = warehouses.find(item => item.id === move.warehouse_id);
            return (
              <div key={move.id} className="glass-card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-black text-sm">{product?.name || move.product_id}</p>
                  <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {move.reason}</p>
                  <p className="text-text-tertiary text-[10px]">{new Date(move.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="text-red font-black text-sm">-{move.quantity}</span>
              </div>
            );
          })}
          {stockMovements.filter(move => move.movement_type === 'loss').length === 0 && (
            <div className="text-center py-12 text-text-tertiary text-sm">Aucune perte déclarée</div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMoves.map(m => (
            <div key={m.id} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'entree' ? 'bg-green-light' : 'bg-red-light'}`}>
                {m.type === 'entree' ? <ArrowDownCircle size={18} className="text-green" /> : <ArrowUpCircle size={18} className="text-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{m.itemName}</div>
                <div className="text-text-tertiary text-[10px]">{m.note}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${m.type === 'entree' ? 'text-green' : 'text-red'}`}>
                  {m.type === 'entree' ? '+' : '-'}{m.quantity}
                </div>
                <div className="text-text-tertiary text-[10px]">{new Date(m.date).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          ))}
          {filteredMoves.length === 0 && (
            <div className="text-center py-12 text-text-tertiary text-sm">Aucun mouvement</div>
          )}
        </div>
      )}

      {/* Stock Movement Modal */}
      <AnimatePresence>
        {showMove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowMove(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">
                {showMove.type === 'entree' ? '📦 Entrée de stock' : '📤 Sortie de stock'}
              </h3>
              <p className="text-text-secondary text-sm mb-4">{items.find(i => i.id === showMove.itemId)?.name}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-text-tertiary text-xs font-semibold block mb-1.5">Quantité</label>
                  <input type="number" value={moveQty} onChange={e => setMoveQty(e.target.value)}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" placeholder="10" />
                </div>
                <div>
                  <label className="text-text-tertiary text-xs font-semibold block mb-1.5">Note</label>
                  <input type="text" value={moveNote} onChange={e => setMoveNote(e.target.value)}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" placeholder="Fournisseur, cuisine..." />
                </div>
                <button onClick={handleMove}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm">
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospi Transfer Modal */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTransfer(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Transfert entre dépôts</h3>
              <div className="space-y-3">
                <select value={transferForm.productId} onChange={e => setTransferForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {products.filter(p => p.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={transferForm.fromWarehouseId} onChange={e => setTransferForm(p => ({ ...p, fromWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    {warehouses.map(warehouse => {
                      const site = sites.find(item => item.id === warehouse.site_id);
                      return <option key={warehouse.id} value={warehouse.id}>{site?.city} • {warehouse.name}</option>;
                    })}
                  </select>
                  <select value={transferForm.toWarehouseId} onChange={e => setTransferForm(p => ({ ...p, toWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    {warehouses.map(warehouse => {
                      const site = sites.find(item => item.id === warehouse.site_id);
                      return <option key={warehouse.id} value={warehouse.id}>{site?.city} • {warehouse.name}</option>;
                    })}
                  </select>
                </div>
                <input type="number" placeholder="Quantité" value={transferForm.quantity} onChange={e => setTransferForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Motif" value={transferForm.reason} onChange={e => setTransferForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleTransfer}
                  className="w-full py-3.5 rounded-2xl bg-blue text-white font-bold text-sm">
                  Valider le transfert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospi Adjustment Modal */}
      <AnimatePresence>
        {showAdjustment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAdjustment(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Ajustement inventaire</h3>
              <div className="space-y-3">
                <select value={adjustForm.productId} onChange={e => setAdjustForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {products.filter(p => p.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <select value={adjustForm.warehouseId} onChange={e => setAdjustForm(p => ({ ...p, warehouseId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {siteWarehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
                <input type="number" placeholder="Quantité comptée" value={adjustForm.countedQuantity} onChange={e => setAdjustForm(p => ({ ...p, countedQuantity: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Motif" value={adjustForm.reason} onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleAdjustment}
                  className="w-full py-3.5 rounded-2xl bg-orange text-white font-bold text-sm">
                  Valider l’inventaire
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospi Loss Modal */}
      <AnimatePresence>
        {showLoss && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowLoss(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Déclarer une perte</h3>
              <p className="text-text-secondary text-xs mb-4">Exemples : steak brûlé, casse bouteille, péremption, erreur cuisine.</p>
              <div className="space-y-3">
                <select value={lossForm.productId} onChange={e => setLossForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {products.filter(p => p.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <select value={lossForm.warehouseId} onChange={e => setLossForm(p => ({ ...p, warehouseId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {siteWarehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
                <input type="number" placeholder="Quantité perdue" value={lossForm.quantity} onChange={e => setLossForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Motif" value={lossForm.reason} onChange={e => setLossForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleLoss}
                  className="w-full py-3.5 rounded-2xl bg-red text-white font-bold text-sm">
                  Valider la perte
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Nouvel article</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Nom de l'article" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Quantité" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                  <select value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    <option value="kg">kg</option><option value="L">L</option><option value="pcs">pcs</option><option value="boîte">boîte</option>
                  </select>
                </div>
                <input type="number" placeholder="Stock minimum alerte" value={newItem.minStock} onChange={e => setNewItem(p => ({ ...p, minStock: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleAddItem}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm">
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
