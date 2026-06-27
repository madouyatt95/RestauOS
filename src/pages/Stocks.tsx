import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';
import { useHospiStore } from '../stores/hospiStore';
import { useAuthStore } from '../stores/authStore';
import { Search, Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react';

export default function Stocks() {
  const { items, movements, addMovement, addItem } = useStockStore();
  const { user } = useAuthStore();
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
    receivePurchaseOrder
  } = useHospiStore();
  const [tab, setTab] = useState<'inventaire' | 'entrees' | 'sorties' | 'depots'>('inventaire');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState<{ type: 'entree' | 'sortie'; itemId: string } | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [moveQty, setMoveQty] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'kg', minStock: '', category: '' });
  const [transferForm, setTransferForm] = useState({ productId: 'prod-coca-33', fromWarehouseId: 'wh-central', toWarehouseId: 'wh-restaurant', quantity: '', reason: 'Réassort dépôt' });
  const [adjustForm, setAdjustForm] = useState({ productId: 'prod-coca-33', warehouseId: 'wh-restaurant', countedQuantity: '', reason: 'Inventaire physique' });

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMoves = movements.filter(m =>
    tab === 'entrees' ? m.type === 'entree' : tab === 'sorties' ? m.type === 'sortie' : true
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
    transferStock(
      transferForm.productId,
      transferForm.fromWarehouseId,
      transferForm.toWarehouseId,
      Number(transferForm.quantity),
      transferForm.reason || 'Transfert inter-dépôts',
      user?.name || 'Système'
    );
    setShowTransfer(false);
    setTransferForm(prev => ({ ...prev, quantity: '' }));
  };

  const handleAdjustment = () => {
    if (!adjustForm.productId || !adjustForm.warehouseId || !adjustForm.countedQuantity) return;
    adjustInventory(
      adjustForm.productId,
      adjustForm.warehouseId,
      Number(adjustForm.countedQuantity),
      adjustForm.reason || 'Inventaire physique',
      user?.name || 'Système'
    );
    setShowAdjustment(false);
    setAdjustForm(prev => ({ ...prev, countedQuantity: '' }));
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
        <h1 className="text-xl font-black text-white">Stocks</h1>
        <div className="flex gap-2">
          <button className="w-9 h-9 glass-card flex items-center justify-center rounded-full">
            <AlertTriangle size={16} className="text-orange" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([['inventaire', 'Inventaire'], ['depots', 'Dépôts'], ['entrees', 'Entrées'], ['sorties', 'Sorties']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === key
              ? 'bg-orange text-white shadow-[0_4px_16px_rgba(255,138,0,0.3)]'
              : 'glass-card text-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input type="text" placeholder="Rechercher un article..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card text-sm text-white placeholder-text-tertiary bg-transparent border-none" />
      </div>

      {tab === 'depots' ? (
        <div className="space-y-4">
          <div className="glass-card-lg p-4">
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-1">Site</p>
            <h2 className="text-white font-black text-lg">{sites[0]?.name || 'Site principal'}</h2>
            <p className="text-text-secondary text-xs mt-1">{posList.length} POS actifs • {warehouses.length} dépôts</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowTransfer(true)} className="py-3 rounded-2xl bg-blue/10 border border-blue/20 text-blue font-black text-[10px] uppercase tracking-widest">
              Transfert dépôt
            </button>
            <button onClick={() => setShowAdjustment(true)} className="py-3 rounded-2xl bg-orange/10 border border-orange/20 text-orange font-black text-[10px] uppercase tracking-widest">
              Ajustement inventaire
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
                        {order.status}
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

          {warehouses.map(warehouse => {
            const linkedPOS = posList.filter(pos => pos.default_warehouse_id === warehouse.id);
            const levels = stockLevels.filter(level => level.warehouse_id === warehouse.id);
            return (
              <motion.div key={warehouse.id} layout className="glass-card p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-black text-sm">{warehouse.name}</h3>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest mt-1">{warehouse.type}</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue/10 text-blue">
                    {linkedPOS.length ? linkedPOS.map(pos => pos.name).join(', ') : 'Aucun POS'}
                  </span>
                </div>
                <div className="space-y-2">
                  {levels.map(level => {
                    const product = products.find(item => item.id === level.product_id);
                    const isLow = level.quantity <= level.alert_threshold;
                    return (
                      <div key={level.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <div>
                          <p className="text-white font-bold text-xs">{product?.name || level.product_id}</p>
                          <p className="text-text-tertiary text-[10px]">Seuil : {level.alert_threshold} {level.unit}</p>
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
                      <p className="text-text-tertiary text-[10px]">{move.movement_type} • {pos?.name || 'Back-office'} • {warehouse?.name}</p>
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
                    {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                  <select value={transferForm.toWarehouseId} onChange={e => setTransferForm(p => ({ ...p, toWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
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
                  {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
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
