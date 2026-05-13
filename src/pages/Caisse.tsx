import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { Search, Plus, Minus, ShoppingCart, Check, CreditCard, Smartphone, Banknote, Wallet } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const categories = ['Tout', 'Plats', 'Boissons', 'Desserts'] as const;
const orderTypes = [
  { key: 'sur_place' as const, label: 'Sur place' },
  { key: 'emporter' as const, label: 'À emporter' },
  { key: 'livraison' as const, label: 'Livraison' },
];

export default function Caisse() {
  const { cart, orderType, addToCart, updateQuantity, clearCart, setOrderType, checkout } = useOrderStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('Tout');
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filtered = PRODUCTS.filter(p => {
    const matchCat = catFilter === 'Tout' || p.category === catFilter.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const getCartQty = (id: string) => cart.find(c => c.product.id === id)?.quantity || 0;

  const handleCheckout = (payment: 'especes' | 'wave' | 'orange_money' | 'carte') => {
    checkout(payment);
    setShowPayment(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="page-content pt-14 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Caisse</h1>
        <div className="flex gap-2">
          <button className="w-9 h-9 glass-card flex items-center justify-center rounded-full">
            <Bell size={16} className="text-text-secondary" />
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
                <button onClick={() => addToCart(p)}
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

              <p className="text-text-tertiary text-xs font-semibold mb-3 uppercase tracking-wider">Mode de paiement</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'especes' as const, label: 'Espèces', icon: Banknote, color: '#22C55E' },
                  { key: 'wave' as const, label: 'Wave', icon: Smartphone, color: '#3B82F6' },
                  { key: 'orange_money' as const, label: 'Orange Money', icon: Wallet, color: '#FF8A00' },
                  { key: 'carte' as const, label: 'Carte bancaire', icon: CreditCard, color: '#8B5CF6' },
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
    </div>
  );
}

function Bell({ size, className }: { size: number; className: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
}
