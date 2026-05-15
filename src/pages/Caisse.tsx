import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../stores/orderStore';
import { useTableStore } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { useClientStore } from '../stores/clientStore';
import { useNotificationStore } from '../stores/notificationStore';
import { Check, CreditCard, Smartphone, Banknote, Wallet, Wifi, CloudUpload, ClipboardList, Clock, User, Edit2, Gift, Shield } from 'lucide-react';
import { syncOrderToERP } from '../services/erpConnector';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function Caisse() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, addPayment } = useOrderStore();
  const { tables, updateTableStatus } = useTableStore();
  const { clients, usePoints } = useClientStore();
  const { addNotification } = useNotificationStore();
  
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [splitMode, setSplitMode] = useState<'egal' | 'item' | 'custom'>('egal');
  const [selectedItemsForSplit, setSelectedItemsForSplit] = useState<Record<string, boolean>>({});
  const [customAmount, setCustomAmount] = useState('');
  const [showSoftPOS, setShowSoftPOS] = useState(false);
  const [isSyncingERP, setIsSyncingERP] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const pendingOrders = orders.filter(o => ['en_preparation', 'prete', 'non_payee', 'partiellement_payee'].includes(o.status));
  const activeOrder = orders.find(o => o.id === selectedOrder);
  const loyaltyClient = activeOrder?.loyaltyClientId ? clients.find(c => c.id === activeOrder.loyaltyClientId) : null;

  const getRemainingAmount = () => {
    if (!activeOrder) return 0;
    return activeOrder.total - activeOrder.paidAmount;
  };

  const getPayAmount = () => {
    if (!activeOrder) return 0;
    const remaining = getRemainingAmount();
    if (splitMode === 'egal' && splitCount > 1) return Math.ceil(remaining / splitCount);
    if (splitMode === 'item') {
      return activeOrder.items
        .filter(it => selectedItemsForSplit[it.product.id])
        .reduce((s, it) => s + (it.product.price * it.quantity), 0);
    }
    if (splitMode === 'custom' && customAmount) return Math.min(parseInt(customAmount), remaining);
    return remaining;
  };

  const handleCheckout = (method: 'especes' | 'wave' | 'orange_money' | 'carte') => {
    if (!activeOrder) return;
    const amount = getPayAmount();
    if (amount <= 0) return;

    if (method === 'carte') {
      setShowSoftPOS(true);
      setTimeout(() => { setShowSoftPOS(false); finalizePayment(amount, method); }, 3000);
      return;
    }
    finalizePayment(amount, method);
  };

  const finalizePayment = async (amount: number, method: 'especes' | 'wave' | 'orange_money' | 'carte') => {
    if (!activeOrder) return;

    addPayment(activeOrder.id, amount, method);

    const newPaidAmount = activeOrder.paidAmount + amount;
    const isFullyPaid = newPaidAmount >= activeOrder.total;

    if (isFullyPaid && activeOrder.tableId) {
      updateTableStatus(activeOrder.tableId, 'libre');
    }

    if (!isFullyPaid) {
      addNotification({
        type: 'payment',
        title: '💳 Paiement partiel',
        message: `Commande #${activeOrder.id.slice(-4)} — ${fmt(amount)} F réglés, reste ${fmt(activeOrder.total - newPaidAmount)} F`,
        targetRole: 'Gérant',
        orderId: activeOrder.id,
      });
    }

    setIsSyncingERP(true);
    await syncOrderToERP(activeOrder.id, amount, activeOrder.items);
    setIsSyncingERP(false);

    setShowPayment(false);
    setShowSuccess(true);
    setSplitCount(1);
    setSplitMode('egal');
    setSelectedItemsForSplit({});
    setCustomAmount('');
    setTimeout(() => {
      setShowSuccess(false);
      if (isFullyPaid) setSelectedOrder(null);
    }, 2000);
  };

  const handleUseLoyaltyPoints = () => {
    if (!loyaltyClient || !loyaltyPoints) return;
    setShowLoyalty(false);
    setShowOTP(true);
    setOtpCode('');
  };

  const handleValidateOTP = () => {
    if (!activeOrder || !loyaltyClient || otpCode.length < 4) return;
    const pts = Number(loyaltyPoints);
    const reduction = pts * 5;
    usePoints(loyaltyClient.id, pts, `Réduction ${fmt(reduction)} FCFA — Commande #${activeOrder.id.slice(-4)}`);
    addPayment(activeOrder.id, reduction, 'especes');
    addNotification({
      type: 'loyalty',
      title: '🎁 Points fidélité utilisés',
      message: `${loyaltyClient.name} a utilisé ${pts} pts (-${fmt(reduction)} F) sur commande #${activeOrder.id.slice(-4)}`,
      targetRole: 'Gérant',
      orderId: activeOrder.id,
    });
    setShowOTP(false);
    setLoyaltyPoints('');
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      en_preparation: { label: 'En cuisine', color: '#3B82F6', bg: 'bg-blue/20 text-blue' },
      prete: { label: 'Prêt', color: '#22C55E', bg: 'bg-green/20 text-green' },
      non_payee: { label: 'Non payée', color: '#EF4444', bg: 'bg-red/20 text-red' },
      partiellement_payee: { label: 'Partiel', color: '#F59E0B', bg: 'bg-orange/20 text-orange' },
    };
    return map[s] || { label: s, color: '#6B7280', bg: 'bg-white/10 text-white' };
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
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4"><Check size={32} /></div>
          <p className="font-bold">Tous les tickets sont réglés</p>
          <p className="text-xs">Aucun encaissement en attente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(o => {
            const sl = statusLabel(o.status);
            const remaining = o.total - o.paidAmount;
            return (
              <motion.div key={o.id} layout onClick={() => setSelectedOrder(o.id)}
                className={`glass-card p-5 cursor-pointer border-2 transition-all ${selectedOrder === o.id ? 'border-orange shadow-lg shadow-orange/10 scale-[1.02]' : 'border-transparent'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${o.status === 'prete' ? 'bg-green/10 text-green' : o.status === 'partiellement_payee' ? 'bg-orange/10 text-orange' : 'bg-blue/10 text-blue'}`}>
                      {o.tableId ? tables.find(t => t.id === o.tableId)?.number : '🛒'}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">{o.tableId ? `Table ${tables.find(t => t.id === o.tableId)?.number}` : 'Vente directe'}</h3>
                      <p className="text-text-tertiary text-xs flex items-center gap-1"><User size={10} /> {o.serveurName || 'Système'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${sl.bg}`}>{sl.label}</span>
                    <div className="text-text-tertiary text-[10px] mt-1 flex items-center gap-1 justify-end">
                      <Clock size={10} /> {Math.floor((Date.now() - new Date(o.date).getTime()) / 60000)} min
                    </div>
                  </div>
                </div>

                {/* Payment progress for partial payments */}
                {o.paidAmount > 0 && o.paidAmount < o.total && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-orange font-black uppercase tracking-widest">Partiellement payée</span>
                      <span className="text-white font-bold">{fmt(o.paidAmount)} / {fmt(o.total)} F</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange to-amber-500 rounded-full" style={{ width: `${(o.paidAmount / o.total) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div>
                    <span className="text-white font-black text-lg">{fmt(remaining)} <span className="text-xs">F</span></span>
                    {o.paidAmount > 0 && <span className="text-text-tertiary text-[10px] ml-2">restant</span>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(o.id); setShowPayment(true); }}
                    className="px-6 py-2.5 rounded-xl bg-orange text-white font-bold text-xs shadow-lg shadow-orange/20">
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
                    {o.payments.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-white/5">
                        <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-1">Paiements effectués</p>
                        {o.payments.map(p => (
                          <div key={p.id} className="flex justify-between text-[10px]">
                            <span className="text-green">{p.method === 'wave' ? 'Wave' : p.method === 'orange_money' ? 'OM' : p.method === 'carte' ? 'Carte' : 'Espèces'}</span>
                            <span className="text-green font-bold">-{fmt(p.amount)} F</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && activeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowPayment(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="text-center mb-6 relative">
                {['Admin', 'Gérant'].includes(user?.role || '') && (
                  <button onClick={() => { setShowPayment(false); navigate('/commandes'); }} className="absolute -top-4 right-0 p-2 text-text-tertiary hover:text-orange transition-colors">
                    <Edit2 size={18} />
                  </button>
                )}
                <p className="text-text-secondary text-sm mb-1">{activeOrder.paidAmount > 0 ? 'Reste à encaisser' : 'Total à encaisser'}</p>
                <h2 className="text-white font-black text-4xl">{fmt(getRemainingAmount())} <span className="text-sm">FCFA</span></h2>
                {activeOrder.paidAmount > 0 && (
                  <p className="text-orange text-xs mt-1 font-bold">Déjà payé : {fmt(activeOrder.paidAmount)} F sur {fmt(activeOrder.total)} F</p>
                )}
                <div className="mt-2 text-text-tertiary text-xs">Table {tables.find(t => t.id === activeOrder.tableId)?.number}</div>
              </div>

              {/* Loyalty section */}
              {loyaltyClient && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet/10 to-purple/10 border border-violet/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gift size={16} className="text-violet" />
                      <span className="text-white font-bold text-sm">{loyaltyClient.name}</span>
                    </div>
                    <span className="text-violet font-black text-sm">{fmt(loyaltyClient.points)} pts</span>
                  </div>
                  <button onClick={() => { setShowLoyalty(true); setLoyaltyPoints(''); }}
                    className="w-full py-2.5 rounded-xl bg-violet/20 text-violet font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform">
                    Utiliser des points ({fmt(loyaltyClient.points * 5)} F disponibles)
                  </button>
                </div>
              )}

              {/* Split Bill */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-bold">Division de l'addition</span>
                </div>
                <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-xl">
                  {[{ id: 'egal', label: 'Égale' }, { id: 'item', label: 'Par article' }, { id: 'custom', label: 'Montant libre' }].map(m => (
                    <button key={m.id} onClick={() => setSplitMode(m.id as any)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${splitMode === m.id ? 'bg-orange text-white shadow-lg' : 'text-text-tertiary'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>

                {splitMode === 'egal' && (
                  <div className="glass-card p-4 flex items-center justify-between">
                    <span className="text-text-secondary text-xs">Diviser par</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-8 h-8 rounded-lg bg-white/5 text-white font-bold">-</button>
                      <span className="text-white font-black text-lg w-6 text-center">{splitCount}</span>
                      <button onClick={() => setSplitCount(splitCount + 1)} className="w-8 h-8 rounded-lg bg-white/5 text-white font-bold">+</button>
                    </div>
                  </div>
                )}
                {splitMode === 'item' && (
                  <div className="glass-card p-4 space-y-3 max-h-40 overflow-y-auto">
                    {activeOrder.items.map(it => (
                      <div key={it.product.id} className="flex items-center justify-between" onClick={() => setSelectedItemsForSplit(s => ({ ...s, [it.product.id]: !s[it.product.id] }))}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedItemsForSplit[it.product.id] ? 'bg-orange border-orange text-white' : 'border-white/20'}`}>
                            {selectedItemsForSplit[it.product.id] && <Check size={12} />}
                          </div>
                          <span className="text-white text-xs">{it.quantity}x {it.product.name}</span>
                        </div>
                        <span className="text-white font-bold text-xs">{fmt(it.product.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {splitMode === 'custom' && (
                  <div className="glass-card p-4">
                    <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="Saisir un montant..."
                      className="w-full bg-transparent border-b border-white/20 text-white text-2xl font-black focus:outline-none focus:border-orange text-center pb-2 placeholder:text-white/20" />
                  </div>
                )}
                <div className="mt-4 text-center p-3 bg-orange/10 border border-orange/20 rounded-xl">
                  <p className="text-orange font-black text-xl">
                    {fmt(getPayAmount())} F <span className="text-xs">à payer maintenant</span>
                  </p>
                  {getPayAmount() < getRemainingAmount() && (
                    <p className="text-text-tertiary text-[10px] mt-1">Restera {fmt(getRemainingAmount() - getPayAmount())} F à régler</p>
                  )}
                </div>
              </div>

              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">Mode de règlement</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { key: 'especes' as const, label: 'Espèces', icon: Banknote, color: '#22C55E' },
                  { key: 'wave' as const, label: 'Wave', icon: Smartphone, color: '#3B82F6' },
                  { key: 'orange_money' as const, label: 'Orange Money', icon: Wallet, color: '#FF8A00' },
                  { key: 'carte' as const, label: 'SoftPOS / Carte', icon: CreditCard, color: '#8B5CF6' },
                ].map(pm => (
                  <motion.button key={pm.key} whileTap={{ scale: 0.95 }} onClick={() => handleCheckout(pm.key)}
                    className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/40 transition-colors">
                    <pm.icon size={28} style={{ color: pm.color }} />
                    <span className="text-white text-xs font-bold">{pm.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loyalty Points Modal */}
      <AnimatePresence>
        {showLoyalty && loyaltyClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[10002]" onClick={() => setShowLoyalty(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-2">Utiliser des points</h3>
              <p className="text-text-secondary text-sm mb-4">Solde : {fmt(loyaltyClient.points)} pts (= {fmt(loyaltyClient.points * 5)} FCFA)</p>
              <input type="number" placeholder="Nombre de points" value={loyaltyPoints} onChange={e => setLoyaltyPoints(e.target.value)}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none mb-3" />
              {loyaltyPoints && <p className="text-orange text-sm font-semibold mb-4">Réduction : {fmt(Number(loyaltyPoints) * 5)} FCFA</p>}
              <button onClick={handleUseLoyaltyPoints} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet to-purple-600 text-white font-bold text-sm"
                disabled={!loyaltyPoints || Number(loyaltyPoints) > loyaltyClient.points}>
                <span className="flex items-center justify-center gap-2"><Shield size={16} /> Valider avec OTP</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOTP && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[10003]" onClick={() => setShowOTP(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-2 text-center">Validation Sécurité</h3>
              <p className="text-text-secondary text-sm mb-6 text-center">Code SMS envoyé au client.<br/>Demandez-lui de vous le dicter.</p>
              <input type="text" placeholder="Code OTP (ex: 1234)" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={4}
                className="w-full px-4 py-4 glass-card text-white text-center font-black text-2xl tracking-[1em] bg-transparent border-orange/50 mb-6" />
              <button onClick={handleValidateOTP} className="w-full py-3.5 rounded-2xl bg-green text-white font-bold text-sm" disabled={otpCode.length < 4}>
                Valider et déduire
              </button>
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
            <p className="text-text-secondary text-sm mb-4">
              {activeOrder && activeOrder.paidAmount + getPayAmount() >= activeOrder.total ? 'La table est maintenant libérée.' : 'Paiement partiel enregistré.'}
            </p>
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
              <span className="text-white font-black text-xl">{fmt(getPayAmount())} F</span>
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
