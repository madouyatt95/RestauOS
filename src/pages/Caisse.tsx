import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { useTableStore } from '../stores/tableStore';
import { Check, CreditCard, Smartphone, Banknote, Wallet, Wifi, CloudUpload, ClipboardList, Clock, User } from 'lucide-react';
import { syncOrderToERP } from '../services/erpConnector';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function Caisse() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { tables, updateTableStatus } = useTableStore();
  
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [showSoftPOS, setShowSoftPOS] = useState(false);
  const [isSyncingERP, setIsSyncingERP] = useState(false);

  // Filter orders that need payment: 'en_attente' or 'pret'
  const pendingOrders = orders.filter(o => o.status === 'en_attente' || o.status === 'pret');
  const activeOrder = orders.find(o => o.id === selectedOrder);

  const handleCheckout = (payment: 'especes' | 'wave' | 'orange_money' | 'carte') => {
    if (payment === 'carte') {
      setShowSoftPOS(true);
      setTimeout(() => {
        setShowSoftPOS(false);
        finalizeOrder();
      }, 3000);
      return;
    }
    finalizeOrder();
  };

  const finalizeOrder = async () => {
    if (!activeOrder) return;


    // Update order status to 'paye'
    updateOrderStatus(activeOrder.id, 'paye');
    
    // Free the table if it was a table order
    if (activeOrder.tableId) {
      updateTableStatus(activeOrder.tableId, 'libre');
    }

    // Sync to ERP
    setIsSyncingERP(true);
    await syncOrderToERP(activeOrder.id, activeOrder.total, activeOrder.items);
    setIsSyncingERP(false);

    setShowPayment(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedOrder(null);
    }, 2000);
  };

  return (
    <div className="page-content pt-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white font-black text-2xl mb-1">Encaissement</h1>
          <p className="text-text-secondary text-sm">Tickets en attente de règlement</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue relative">
          <ClipboardList size={22} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue rounded-full text-[10px] text-white font-bold flex items-center justify-center border-2 border-[#070A0F]">
            {pendingOrders.length}
          </span>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Check size={32} />
          </div>
          <p className="font-bold">Tous les tickets sont réglés</p>
          <p className="text-xs">Aucun encaissement en attente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(o => (
            <motion.div 
              key={o.id}
              layout
              onClick={() => setSelectedOrder(o.id)}
              className={`glass-card p-5 cursor-pointer border-2 transition-all ${
                selectedOrder === o.id ? 'border-orange shadow-lg shadow-orange/10 scale-[1.02]' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    o.status === 'pret' ? 'bg-green/10 text-green' : 'bg-blue/10 text-blue'
                  }`}>
                    {o.tableId ? tables.find(t => t.id === o.tableId)?.number : '🛒'}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      {o.tableId ? `Table ${tables.find(t => t.id === o.tableId)?.number}` : 'Vente directe'}
                    </h3>
                    <p className="text-text-tertiary text-xs flex items-center gap-1">
                      <User size={10} /> {o.serveurName || 'Système'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    o.status === 'pret' ? 'bg-green/20 text-green' : 'bg-blue/20 text-blue'
                  }`}>
                    {o.status === 'pret' ? 'Prêt' : 'En cuisine'}
                  </span>
                  <div className="text-text-tertiary text-[10px] mt-1 flex items-center gap-1 justify-end">
                    <Clock size={10} /> {Math.floor((Date.now() - new Date(o.date).getTime()) / 60000)} min
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-white font-black text-lg">{fmt(o.total)} <span className="text-xs">F</span></span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(o.id); setShowPayment(true); }}
                  className="px-6 py-2.5 rounded-xl bg-orange text-white font-bold text-xs shadow-lg shadow-orange/20"
                >
                  Encaisser
                </button>
              </div>

              {selectedOrder === o.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  {o.items.map(item => (
                    <div key={item.product.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{item.quantity}x {item.product.name}</span>
                      <span className="text-white font-semibold">{fmt(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && activeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowPayment(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="text-center mb-8">
                <p className="text-text-secondary text-sm mb-1">Total à encaisser</p>
                <h2 className="text-white font-black text-4xl">{fmt(activeOrder.total)} <span className="text-sm">FCFA</span></h2>
                <div className="mt-2 text-text-tertiary text-xs">Table {tables.find(t => t.id === activeOrder.tableId)?.number}</div>
              </div>

              {/* Split Bill */}
              <div className="glass-card p-4 mb-8 flex items-center justify-between">
                <span className="text-white text-sm font-bold">Division de l'addition</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-10 h-10 rounded-xl bg-white/5 text-white font-bold">-</button>
                  <span className="text-white font-black text-xl w-6 text-center">{splitCount}</span>
                  <button onClick={() => setSplitCount(splitCount + 1)} className="w-10 h-10 rounded-xl bg-white/5 text-white font-bold">+</button>
                </div>
              </div>
              {splitCount > 1 && (
                <div className="mb-6 text-center p-3 bg-orange/10 border border-orange/20 rounded-xl">
                  <p className="text-orange font-black text-xl">{fmt(activeOrder.total / splitCount)} F <span className="text-xs">/ personne</span></p>
                </div>
              )}

              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">Mode de règlement</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { key: 'especes' as const, label: 'Espèces', icon: Banknote, color: '#22C55E' },
                  { key: 'wave' as const, label: 'Wave', icon: Smartphone, color: '#3B82F6' },
                  { key: 'orange_money' as const, label: 'Orange Money', icon: Wallet, color: '#FF8A00' },
                  { key: 'carte' as const, label: 'SoftPOS / Carte', icon: CreditCard, color: '#8B5CF6' },
                ].map(pm => (
                  <motion.button 
                    key={pm.key} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCheckout(pm.key)}
                    className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/40 transition-colors"
                  >
                    <pm.icon size={28} style={{ color: pm.color }} />
                    <span className="text-white text-xs font-bold">{pm.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success & SoftPOS Overlays */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10001] bg-[#070A0F]/95 flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mb-6">
              <Check size={48} className="text-green" />
            </motion.div>
            <h2 className="text-white font-black text-2xl mb-1">Encaissement réussi</h2>
            <p className="text-text-secondary text-sm mb-4">La table est maintenant libérée.</p>
          </motion.div>
        )}
        {showSoftPOS && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10001] bg-[#070A0F]/95 flex flex-col items-center justify-center p-6 text-center">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-32 h-32 rounded-full border-4 border-violet/30 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-violet/10 scale-150 animate-ping" />
              <Wifi size={48} className="text-violet" />
            </motion.div>
            <h2 className="text-white font-black text-2xl mb-2">Paiement sans contact</h2>
            <p className="text-text-secondary text-sm mb-8">Approchez la carte au dos de l'appareil</p>
            <div className="glass-card p-4 rounded-2xl w-full max-w-xs flex justify-between items-center">
              <span className="text-text-secondary text-sm font-bold">À payer</span>
              <span className="text-white font-black text-xl">{fmt(activeOrder?.total || 0)} F</span>
            </div>
          </motion.div>
        )}
        {isSyncingERP && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10005] bg-bg-card border border-blue/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
            <CloudUpload size={20} className="text-blue animate-bounce" />
            <span className="text-white font-bold text-sm">Synchronisation Odoo...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
