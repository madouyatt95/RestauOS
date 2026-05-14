import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useTableStore } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { Search, ShoppingCart, X, ChefHat } from 'lucide-react';

export default function Commandes() {
  const { cart, addToCart, updateQuantity, clearCart, checkout } = useOrderStore();

  const { tables, updateTableStatus } = useTableStore();
  const { user } = useAuthStore();
  
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [category, setCategory] = useState('tous');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);

  const filteredProducts = PRODUCTS.filter(p => 
    (category === 'tous' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSendToKitchen = () => {
    if (!selectedTable) return;
    setSending(true);
    
    // Simulate sending
    setTimeout(() => {
      const order = checkout('especes', undefined, selectedTable, user?.name);
      if (order) {
        updateTableStatus(selectedTable, 'occupee', order.id);
      }
      setSending(false);
      clearCart();
      setSelectedTable(null);
      setShowCart(false);
    }, 1500);
  };

  if (!selectedTable) {
    return (
      <div className="page-content pt-8 pb-32">
        <div className="mb-8">
          <h1 className="text-white font-black text-2xl mb-1">Plan de Salle</h1>
          <p className="text-text-secondary text-sm">Sélectionnez une table pour commencer</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {tables.map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTable(t.id)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                t.status === 'libre' ? 'bg-green/10 border-green/30 text-green' :
                t.status === 'occupee' ? 'bg-red/10 border-red/30 text-red' :
                'bg-blue/10 border-blue/30 text-blue'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-tighter">Table</span>
              <span className="text-2xl font-black">{t.number}</span>
              <span className="text-[10px] opacity-60">{t.capacity} pers.</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const currentTable = tables.find(t => t.id === selectedTable);

  return (
    <div className="page-content pt-8 pb-32">
      {/* Header with table info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTable(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
            <X size={20} />
          </button>
          <div>
            <h1 className="text-white font-black text-xl">Table {currentTable?.number}</h1>
            <p className="text-text-secondary text-xs">Prise de commande</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)} className="relative w-12 h-12 rounded-2xl bg-orange flex items-center justify-center text-white shadow-lg shadow-orange/20">
          <ShoppingCart size={22} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-orange text-[10px] font-bold flex items-center justify-center border-2 border-orange">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Search & Categories */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un plat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:border-orange/50 transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['tous', 'plats', 'boissons', 'desserts'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === cat ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <motion.div 
            key={product.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => addToCart(product)}
            className="glass-card overflow-hidden flex flex-col"
          >
            <div className="h-28 bg-white/5 flex items-center justify-center text-3xl">
              {product.image.startsWith('/') ? <img src={product.image} className="w-full h-full object-cover" alt="" /> : product.image}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-orange font-black text-xs mt-auto">{product.price.toLocaleString()} F</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowCart(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-xl">Panier - Table {currentTable?.number}</h3>
                <button onClick={clearCart} className="text-text-tertiary text-xs font-bold uppercase tracking-wider">Vider</button>
              </div>

              <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">
                      {item.product.image.startsWith('/') ? <img src={item.product.image} className="w-full h-full object-cover rounded-xl" alt="" /> : item.product.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{item.product.name}</h4>
                      <p className="text-text-tertiary text-xs">{(item.product.price * item.quantity).toLocaleString()} F</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="text-white font-bold">-</button>
                      <span className="text-white font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="text-white font-bold">+</button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="py-12 text-center text-text-tertiary italic">Le panier est vide</div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-text-secondary font-bold">Total</span>
                    <span className="text-white font-black text-2xl">{cartTotal.toLocaleString()} <span className="text-xs">FCFA</span></span>
                  </div>
                  <button 
                    onClick={handleSendToKitchen}
                    disabled={sending}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-black shadow-lg shadow-orange/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">Envoi en cours...</span>
                    ) : (
                      <>
                        <ChefHat size={20} /> Envoyer en cuisine
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
