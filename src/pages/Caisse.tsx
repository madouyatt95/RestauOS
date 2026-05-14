import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useStockStore } from '../stores/stockStore';
import { Search, Plus, Minus, ShoppingCart, Check, CreditCard, Smartphone, Banknote, Wallet, Wifi, Flame, CloudUpload, ClipboardList } from 'lucide-react';
import { syncOrderToERP } from '../services/erpConnector';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const categories = ['Tout', 'Plats', 'Boissons', 'Desserts'] as const;
const orderTypes = [
  { key: 'sur_place' as const, label: 'Sur place' },
  { key: 'emporter' as const, label: 'À emporter' },
  { key: 'livraison' as const, label: 'Livraison' },
];

export default function Caisse() {
  const { cart, orderType, addToCart, updateQuantity, clearCart, setOrderType, checkout } = useOrderStore();
  const { consumeStockForOrder } = useStockStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('Tout');
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showSoftPOS, setShowSoftPOS] = useState(false);
  const [showPingChef, setShowPingChef] = useState(false);
  const [isSyncingERP, setIsSyncingERP] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // Mockup data for pending server orders
  const pendingOrders = [
    { id: 'ORD-102', server: 'Awa F.', table: 'Table 4', total: 12500, time: 'Il y a 2 min' },
    { id: 'ORD-103', server: 'Ibrahima B.', table: 'Table 12', total: 34000, time: 'Il y a 5 min' },
  ];

  const handleAddToCart = (p: typeof PRODUCTS[0]) => {
    addToCart(p);
    if (p.name.includes('Thiéboudienne') || p.name.includes('Yassa')) {
      const hasBissap = cart.some(c => c.product.name.includes('Bissap'));
      if (!hasBissap) {
        setShowUpsell(true);
        setTimeout(() => setShowUpsell(false), 4000);
      }
    }
  };

  const filtered = PRODUCTS.filter(p => {
    const matchCat = catFilter === 'Tout' || p.category === catFilter.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const getCartQty = (id: string) => cart.find(c => c.product.id === id)?.quantity || 0;

  const handleCheckout = (payment: 'especes' | 'wave' | 'orange_money' | 'carte') => {
    if (payment === 'carte') {
      setShowPayment(false);
      setShowSoftPOS(true);
      setTimeout(() => {
        setShowSoftPOS(false);
        finalizeOrder(payment);
      }, 4000);
      return;
    }
    finalizeOrder(payment);
  };

  const finalizeOrder = async (payment: 'especes' | 'wave' | 'orange_money' | 'carte') => {
    const newOrder = checkout(payment);
    if (newOrder) {
      consumeStockForOrder(newOrder.items, newOrder.id);
      
      setShowPayment(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Lancement de la synchro ERP en arrière-plan
      setIsSyncingERP(true);
      await syncOrderToERP(newOrder.id, newOrder.total, newOrder.items);
      setTimeout(() => setIsSyncingERP(false), 2000);
    }
  };

  return (
    <div className="page-content pt-14 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Caisse</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowPending(true)} className="w-9 h-9 glass-card flex items-center justify-center rounded-full relative">
            <ClipboardList size={16} className="text-blue" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue rounded-full text-[9px] text-white font-bold flex items-center justify-center">2</span>
          </button>
          <button onClick={() => { setShowPingChef(true); setTimeout(() => setShowPingChef(false), 3000); }}
            className="w-9 h-9 glass-card flex items-center justify-center rounded-full active:bg-red/20 transition-colors">
            <Flame size={16} className="text-red" />
          </button>
          <button className="w-9 h-9 rounded-full bg-orange flex items-center justify-center relative" onClick={() => setShowPayment(true)}>
            <ShoppingCart size={16} className="text-white" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red rounded-full text-[9px] text-white font-bold flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* Order Type Tabs */}
      <div className="flex gap-2 mb-5">
        {orderTypes.map(t => (
          <button key={t.key} onClick={() => setOrderType(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${orderType === t.key
              ? 'bg-orange text-white shadow-[0_4px_16px_rgba(255,138,0,0.3)]'
              : 'glass-card text-text-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input type="text" placeholder="Rechercher un produit"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card text-sm text-white placeholder-text-tertiary bg-transparent border-none" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${catFilter === c
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-text-tertiary'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {filtered.map(p => {
          const qty = getCartQty(p.id);
          return (
            <motion.div key={p.id} layout className="glass-card p-4 flex items-center gap-3">
              {p.image.startsWith('/') ? (
                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
              ) : (
                <span className="text-3xl w-12 text-center shrink-0">{p.image}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{p.name}</div>
                <div className="text-orange font-bold text-sm">{fmt(p.price)} <span className="text-text-tertiary text-[10px] font-normal">FCFA</span></div>
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 && (
                  <>
                    <button onClick={() => updateQuantity(p.id, qty - 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary active:bg-white/10">
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-bold text-sm w-5 text-center">{qty}</span>
                  </>
                )}
                <button onClick={() => handleAddToCart(p)}
                  className="w-8 h-8 rounded-lg bg-orange/20 flex items-center justify-center text-orange active:bg-orange/30">
                  <Plus size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[9998] glass-card-lg p-4 flex items-center justify-between"
          style={{ background: 'rgba(17,24,39,0.95)', borderColor: 'rgba(255,138,0,0.3)' }}
        >
          <div>
            <div className="text-white font-black text-lg">{fmt(cartTotal)} <span className="text-xs font-semibold text-text-secondary">FCFA</span></div>
            <div className="text-text-tertiary text-xs">{cartCount} article{cartCount > 1 ? 's' : ''}</div>
          </div>
          <button onClick={() => setShowPayment(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,138,0,0.4)] active:scale-[0.97] transition-transform">
            Encaisser
          </button>
        </motion.div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && cartCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowPayment(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-2">Encaissement</h3>
              <p className="text-text-secondary text-sm mb-1">Total</p>
              <p className="text-3xl font-black text-white mb-6">{fmt(cartTotal)} <span className="text-sm text-text-secondary">FCFA</span></p>

              {/* Cart items */}
              <div className="space-y-2 mb-6 max-h-32 overflow-y-auto">
                {cart.map(c => (
                  <div key={c.product.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      {c.product.image.startsWith('/') ? (
                        <img src={c.product.image} className="w-6 h-6 rounded object-cover" />
                      ) : (
                        <span>{c.product.image}</span>
                      )}
                      <span className="text-text-secondary">{c.product.name} x{c.quantity}</span>
                    </div>
                    <span className="text-white font-semibold">{fmt(c.product.price * c.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Split Bill */}
              <div className="glass-card p-3 mb-6 flex items-center justify-between border-blue/30">
                <span className="text-white text-sm font-semibold">Diviser l'addition</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-8 h-8 rounded bg-white/10 text-white">-</button>
                  <span className="text-white font-bold">{splitCount}</span>
                  <button onClick={() => setSplitCount(splitCount + 1)} className="w-8 h-8 rounded bg-white/10 text-white">+</button>
                </div>
              </div>
              {splitCount > 1 && (
                <div className="mb-4 text-center text-orange font-bold">
                  {fmt(cartTotal / splitCount)} FCFA / personne
                </div>
              )}

              <p className="text-text-tertiary text-xs font-semibold mb-3 uppercase tracking-wider">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'especes' as const, label: 'Espèces', icon: Banknote, color: '#22C55E' },
                  { key: 'wave' as const, label: 'Wave', icon: Smartphone, color: '#3B82F6' },
                  { key: 'orange_money' as const, label: 'Orange Money', icon: Wallet, color: '#FF8A00' },
                  { key: 'carte' as const, label: 'Tap-to-Pay (SoftPOS)', icon: CreditCard, color: '#8B5CF6' },
                ].map(pm => (
                  <motion.button key={pm.key} whileTap={{ scale: 0.95 }}
                    onClick={() => handleCheckout(pm.key)}
                    className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/40 transition-colors">
                    <pm.icon size={24} style={{ color: pm.color }} />
                    <span className="text-white text-xs font-semibold">{pm.label}</span>
                  </motion.button>
                ))}
              </div>

              <button onClick={() => { clearCart(); setShowPayment(false); }}
                className="mt-4 w-full text-center text-red text-xs font-semibold py-2">
                Vider le panier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Orders Modal */}
      <AnimatePresence>
        {showPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowPending(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Commandes Serveurs</h3>
                <span className="bg-blue/20 text-blue px-2 py-1 rounded text-xs font-bold">Live Synchro</span>
              </div>
              <p className="text-text-secondary text-sm mb-6">Ces commandes ont été prises par les serveurs en salle. Validez-les pour l'encaissement.</p>
              
              <div className="space-y-3">
                {pendingOrders.map(o => (
                  <div key={o.id} className="glass-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-white font-bold text-sm">{o.table}</span>
                        <span className="text-text-tertiary text-xs ml-2">par {o.server}</span>
                      </div>
                      <span className="text-text-secondary text-xs">{o.time}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-orange font-bold text-lg">{fmt(o.total)} FCFA</span>
                      <button onClick={() => { setShowPending(false); setShowPayment(true); }} className="px-4 py-2 rounded-xl bg-blue text-white text-xs font-bold">
                        Encaisser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-bg-primary/90 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}
              className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mb-6">
              <Check size={48} className="text-green" />
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-white text-xl font-bold">Paiement confirmé !</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-text-secondary text-sm mt-2">Ticket généré avec succès</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SoftPOS Animation */}
      <AnimatePresence>
        {showSoftPOS && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10002] bg-[#0a0f1a] flex flex-col items-center justify-center p-6 text-center">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-32 h-32 rounded-full border-4 border-violet/30 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-violet/10 scale-150 animate-ping" />
              <Wifi size={48} className="text-violet" />
            </motion.div>
            <h2 className="text-white font-black text-2xl mb-2">Tap-to-Pay</h2>
            <p className="text-text-secondary text-sm mb-8">Veuillez approcher la carte bancaire du client au dos de votre téléphone.</p>
            <div className="glass-card p-4 rounded-2xl w-full max-w-xs flex justify-between items-center">
              <span className="text-text-secondary text-sm">Montant à régler</span>
              <span className="text-white font-black text-xl">{fmt(cartTotal)} <span className="text-xs">FCFA</span></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upsell Toast */}
      <AnimatePresence>
        {showUpsell && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 z-[10002] glass-card p-4 border border-violet/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center">
              <span className="text-xl">🍹</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">IA Suggestion</p>
              <p className="text-text-secondary text-xs">80% des clients prennent un Jus de Bissap avec ce plat !</p>
            </div>
            <button onClick={() => {
              const bissap = PRODUCTS.find(p => p.name.includes('Bissap'));
              if (bissap) addToCart(bissap);
              setShowUpsell(false);
            }} className="px-3 py-1.5 rounded-lg bg-violet text-white text-xs font-bold">
              Ajouter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ping Chef Toast */}
      <AnimatePresence>
        {showPingChef && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 z-[10002] glass-card p-4 border border-red/50 bg-red/10 flex items-center gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.4)]">
            <div className="w-10 h-10 rounded-full bg-red/20 flex items-center justify-center animate-pulse">
              <Flame size={20} className="text-red" />
            </div>
            <div className="flex-1">
              <p className="text-red font-black text-sm uppercase tracking-wide">Alerte envoyée</p>
              <p className="text-white text-xs font-semibold">La cuisine vient d'être notifiée de l'urgence !</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERP Sync Toast */}
      <AnimatePresence>
        {isSyncingERP && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10005] bg-bg-card border border-blue/30 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_4px_20px_rgba(59,130,246,0.3)]">
            <CloudUpload size={16} className="text-blue animate-bounce" />
            <span className="text-white text-xs font-bold">Synchro Odoo en cours...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
