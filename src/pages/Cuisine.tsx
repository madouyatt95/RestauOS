import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useTableStore } from '../stores/tableStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useWasteStore, type WasteEntry } from '../stores/wasteStore';
import { useAuthStore } from '../stores/authStore';
import { Check, Clock, ChefHat, Bell, Trash2, AlertTriangle, Plus, CheckCircle2, Circle } from 'lucide-react';
import { runtimeTimestamp } from '../utils/runtime';
import { getKitchenActionCards, getProfileWorkspace, workspaceToneClasses } from '../utils/profileWorkspace';

const getWaitMinutes = (dateString: string) => Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);

const timerStyle = (mins: number) => {
  if (mins >= 25) return { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'border-red/40', label: 'CRITIQUE', pulse: true };
  if (mins >= 15) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'border-orange/30', label: 'URGENT', pulse: false };
  if (mins >= 8) return { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'border-blue/20', label: 'EN COURS', pulse: false };
  return { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'border-green/20', label: 'OK', pulse: false };
};

const POSTE_FILTERS = ['Tous', 'Entrées', 'Plats', 'Desserts', 'Boissons'];
const WASTE_REASONS: Record<WasteEntry['reason'], { label: string; color: string }> = {
  surproduction: { label: 'Surproduction', color: '#F59E0B' },
  peremption: { label: 'Péremption', color: '#EF4444' },
  retour_client: { label: 'Retour client', color: '#8B5CF6' },
  accident: { label: 'Accident', color: '#3B82F6' },
  autre: { label: 'Autre', color: '#6B7280' },
};

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function Cuisine() {
  const { orders, updateOrderStatus, toggleItemReady } = useOrderStore();
  const { addDelivery } = useDeliveryStore();
  const { tables } = useTableStore();
  const { addNotification } = useNotificationStore();
  const { entries: wasteEntries, addEntry: addWaste, getWeekTotal } = useWasteStore();
  const { user } = useAuthStore();
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'tickets' | 'gaspillage'>('tickets');
  const [posteFilter, setPosteFilter] = useState('Tous');
  const [showWasteForm, setShowWasteForm] = useState(false);
  const [wasteName, setWasteName] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState<WasteEntry['reason']>('surproduction');
  const [wasteCost, setWasteCost] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTick((t: number) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'en_preparation').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const summary: Record<string, number> = {};
  activeOrders.forEach(o => o.items.forEach(it => { summary[it.product.name] = (summary[it.product.name] || 0) + it.quantity; }));

  const weekWaste = getWeekTotal();
  const workspace = getProfileWorkspace(user);
  const workspaceTone = workspaceToneClasses[workspace.tone];
  const kitchenCards = getKitchenActionCards(activeOrders.length, weekWaste);

  const handleMarkReady = (order: typeof orders[0]) => {
    updateOrderStatus(order.id, 'prete');
    
    // Send notification to server
    const tableNum = order.tableId ? tables.find(t => t.id === order.tableId)?.number : null;
    addNotification({
      type: 'order',
      title: '🍽️ Commande prête !',
      message: tableNum ? `Table T${tableNum} — Commande prête à servir` : `Commande #${order.id.slice(-4)} prête (${order.type === 'emporter' ? 'À emporter' : 'Livraison'})`,
      targetRole: 'Serveur',
      orderId: order.id,
      actionUrl: order.tableId ? `/commandes?tableId=${order.tableId}` : undefined,
    });

    if (order.type === 'livraison') {
      addDelivery({
        orderId: order.id, clientName: order.clientId ? 'Ousmane Thiam' : 'Client Inconnu',
        clientPhone: '77 000 00 00', address: 'Dakar', amount: order.total,
        deliveryFee: 1500, paymentMethod: 'especes',
        paymentStatus: order.paidAmount >= order.total ? 'paye' : 'en_attente',
        driverId: 'u6', driverName: 'Pape Sow', status: 'preparation',
        estimatedTime: 25, createdAt: new Date().toISOString()
      });
    }
  };

  const handleToggleItem = (orderId: string, productId: string, order: typeof orders[0]) => {
    toggleItemReady(orderId, productId);
    
    // Check if this toggle will make all items ready
    const updatedReady = { ...order.itemsReady, [productId]: !order.itemsReady[productId] };
    const allReady = order.items.every(it => updatedReady[it.product.id]);
    
    if (allReady) {
      // The store already sets status to 'prete', but we need to send notifications
      const tableNum = order.tableId ? tables.find(t => t.id === order.tableId)?.number : null;
      addNotification({
        type: 'order',
        title: '🍽️ Commande prête !',
        message: tableNum ? `Table T${tableNum} — Commande prête à servir` : `Commande #${order.id.slice(-4)} prête (${order.type === 'emporter' ? 'À emporter' : 'Livraison'})`,
        targetRole: 'Serveur',
        orderId: order.id,
        actionUrl: order.tableId ? `/commandes?tableId=${order.tableId}` : undefined,
      });

      if (order.type === 'livraison') {
        addDelivery({
          orderId: order.id, clientName: order.clientId ? 'Ousmane Thiam' : 'Client Inconnu',
          clientPhone: '77 000 00 00', address: 'Dakar', amount: order.total,
          deliveryFee: 1500, paymentMethod: 'especes',
          paymentStatus: order.paidAmount >= order.total ? 'paye' : 'en_attente',
          driverId: 'u6', driverName: 'Pape Sow', status: 'preparation',
          estimatedTime: 25, createdAt: new Date().toISOString()
        });
      }
    }
  };

  const handleCallService = (order: typeof orders[0]) => {
    const tableNum = order.tableId ? tables.find(t => t.id === order.tableId)?.number : null;
    addNotification({
      type: 'order',
      title: 'Relance cuisine',
      message: tableNum
        ? `Table T${tableNum} - besoin d'un passage côté cuisine`
        : `Commande #${order.id.slice(-4)} - besoin d'un passage côté cuisine`,
      targetRole: 'Serveur',
      orderId: order.id,
      actionUrl: order.tableId ? `/commandes?tableId=${order.tableId}` : undefined,
    });
  };

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#070A0F]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ChefHat className="text-orange" /> Cuisine
        </h1>
        <div className="glass-card px-3 py-1.5 text-xs text-text-secondary">
          {activeOrders.length} tickets
        </div>
      </div>

      <div className={`rounded-[1.75rem] border p-5 mb-5 ${workspaceTone.bg} ${workspaceTone.border}`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${workspaceTone.text}`}>{workspace.eyebrow}</p>
        <h2 className="text-white font-black text-xl mt-1">{workspace.title}</h2>
        <p className="text-text-secondary text-xs mt-1 leading-snug">{workspace.subtitle}</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {kitchenCards.map(card => {
            const tone = workspaceToneClasses[card.tone];
            return (
              <div key={card.label} className="rounded-2xl bg-black/15 border border-white/10 p-3">
                <p className={`text-[9px] font-black uppercase tracking-widest ${tone.text}`}>{card.label}</p>
                <p className="text-white font-black text-sm mt-1">{card.value}</p>
                <p className="text-text-tertiary text-[10px] leading-tight mt-0.5">{card.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'tickets', label: 'Tickets', icon: ChefHat, badge: activeOrders.length },
          { id: 'gaspillage', label: 'Pertes', icon: Trash2, badge: 0 },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border text-[10px] font-black uppercase tracking-wider ${activeTab === tab.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-text-tertiary'}`}>
            <tab.icon size={14} /> {tab.label}
            {tab.badge > 0 && <span className="w-5 h-5 rounded-full bg-red text-white text-[9px] font-black flex items-center justify-center">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ─── TICKETS TAB ─── */}
      {activeTab === 'tickets' && (
        <>
          {/* Production Summary */}
          {activeOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-5 border-orange/20 bg-orange/5">
              <h3 className="text-orange font-black text-[9px] uppercase tracking-widest mb-3">Récapitulatif production</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(summary).map(([name, qty]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-orange text-white font-black text-xs flex items-center justify-center">{qty}</span>
                    <span className="text-white text-xs font-bold">{name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Poste Filter */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {POSTE_FILTERS.map(p => (
              <button key={p} onClick={() => setPosteFilter(p)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${posteFilter === p ? 'bg-orange text-white' : 'bg-white/5 text-text-tertiary'}`}>
                {p}
              </button>
            ))}
          </div>

          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
              <ChefHat size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Cuisine calme</p>
              <p className="text-xs">Aucune commande en attente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {activeOrders.map(order => {
                  const waitMins = getWaitMinutes(order.date);
                  const ts = timerStyle(waitMins);
                  const tableNum = order.tableId ? tables.find(t => t.id === order.tableId)?.number : null;
                  const readyCount = order.items.filter(it => order.itemsReady[it.product.id]).length;
                  const totalItems = order.items.length;
                  const progressPct = totalItems > 0 ? (readyCount / totalItems) * 100 : 0;

                  return (
                    <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className={`glass-card p-5 border-2 transition-colors ${ts.border}`}>
                      <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black text-lg">
                            {tableNum || '📦'}
                          </div>
                          <div>
                            <span className="text-white font-black text-sm">{tableNum ? `Table ${tableNum}` : 'À Emporter'}</span>
                            <p className="text-text-tertiary text-[10px] uppercase font-bold">Ticket #{order.id.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {/* Timer with visual urgency */}
                          <div className={`flex items-center gap-1.5 font-black text-sm px-3 py-1 rounded-lg ${ts.pulse ? 'animate-pulse' : ''}`} style={{ color: ts.color, background: ts.bg }}>
                            <Clock size={14} />
                            {waitMins}:{String(Math.floor((runtimeTimestamp() - new Date(order.date).getTime()) / 1000) % 60).padStart(2, '0')}
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest mt-1 block" style={{ color: ts.color }}>{ts.label}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">Progression</span>
                          <span className="text-[10px] font-black" style={{ color: readyCount === totalItems ? '#22C55E' : '#F59E0B' }}>
                            {readyCount}/{totalItems} articles
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ background: readyCount === totalItems ? '#22C55E' : 'linear-gradient(90deg, #F59E0B, #FF8A00)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Items with individual checkboxes */}
                      <div className="space-y-2 mb-5">
                        {order.items.map(item => {
                          const isReady = order.itemsReady[item.product.id] || false;
                          return (
                            <motion.div 
                              key={item.product.id} 
                              layout
                              onClick={() => handleToggleItem(order.id, item.product.id, order)}
                              className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                                isReady ? 'bg-green/10 border border-green/20' : 'bg-white/5 border border-white/5 hover:border-white/15'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isReady ? (
                                  <CheckCircle2 size={20} className="text-green shrink-0" />
                                ) : (
                                  <Circle size={20} className="text-white/30 shrink-0" />
                                )}
                                <div className={`flex items-center gap-2 text-sm font-bold transition-all ${isReady ? 'text-green line-through opacity-60' : 'text-white'}`}>
                                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                                    isReady ? 'bg-green/20 text-green' : 'bg-white/10 text-orange'
                                  }`}>{item.quantity}</span>
                                  {item.product.name}
                                </div>
                              </div>
                              {isReady ? (
                                <span className="text-[9px] font-black text-green uppercase tracking-widest">✔ Prêt</span>
                              ) : (
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">⏳ En attente</span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkReady(order)}
                          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green to-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-green/10">
                          <Check size={20} /> TOUT PRÊT
                        </button>
                        <button onClick={() => handleCallService(order)} className="w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange active:scale-95 transition-transform" title="Appeler le service">
                          <Bell size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ─── GASPILLAGE TAB ─── */}
      {activeTab === 'gaspillage' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass-card p-4 border-orange/10">
              <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">Pertes semaine</p>
              <p className="text-orange font-black text-2xl mt-1">{fmt(weekWaste)} <span className="text-xs">F</span></p>
            </div>
            <div className="glass-card p-4 border-white/5">
              <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">Déclarations</p>
              <p className="text-white font-black text-2xl mt-1">{wasteEntries.length}</p>
            </div>
          </div>

          <button onClick={() => setShowWasteForm(true)} className="w-full py-4 rounded-2xl bg-orange/10 border border-orange/30 text-orange font-black text-xs uppercase flex items-center justify-center gap-3 mb-6 active:scale-95 transition-transform">
            <Plus size={18} /> Déclarer une perte
          </button>

          <div className="space-y-3">
            {wasteEntries.slice().reverse().map(e => {
              const r = WASTE_REASONS[e.reason];
              return (
                <div key={e.id} className="glass-card p-4 flex items-center gap-4 border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: r.color + '20' }}>
                    <AlertTriangle size={18} style={{ color: r.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{e.productName} ({e.quantity})</p>
                    <p className="text-[10px] font-bold" style={{ color: r.color }}>{r.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-red font-black text-sm">-{fmt(e.costEstimate)} F</p>
                    <p className="text-text-tertiary text-[9px]">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Waste Form Modal */}
      <AnimatePresence>
        {showWasteForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowWasteForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-6 text-center">Déclarer une perte</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Produit</label>
                  <input type="text" value={wasteName} onChange={e => setWasteName(e.target.value)} placeholder="Ex: Riz cuit, Yassa..."
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Quantité</label>
                    <input type="text" value={wasteQty} onChange={e => setWasteQty(e.target.value)} placeholder="2kg, 3 portions..."
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange/50" />
                  </div>
                  <div>
                    <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Coût estimé (F)</label>
                    <input type="number" value={wasteCost} onChange={e => setWasteCost(e.target.value)} placeholder="1500"
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange/50" />
                  </div>
                </div>
                <div>
                  <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Raison</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(WASTE_REASONS).map(([key, cfg]) => (
                      <button key={key} onClick={() => setWasteReason(key as WasteEntry['reason'])}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${wasteReason === key ? 'ring-2' : ''}`}
                        style={{ background: cfg.color + '15', color: cfg.color, ...(wasteReason === key ? { ringColor: cfg.color } : {}) }}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { if (!wasteName.trim()) return; addWaste({ productName: wasteName, quantity: wasteQty || '?', reason: wasteReason, costEstimate: parseInt(wasteCost) || 0, employeeId: 'e1' }); setShowWasteForm(false); setWasteName(''); setWasteQty(''); setWasteCost(''); }}
                  disabled={!wasteName.trim()} className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-30 shadow-lg shadow-orange/20">
                  <AlertTriangle size={18} /> Déclarer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
