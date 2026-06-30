import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS, useOrderStore, type CartItem } from '../stores/orderStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useHospiStore } from '../stores/hospiStore';
import { Search, ChefHat, Plus, Minus, ArrowRight, Check } from 'lucide-react';

const CATEGORIES = ['Toutes', 'Plats', 'Entrées', 'Desserts', 'Boissons'];
const fmt = (n: number) => n.toLocaleString('fr-FR');
const LEGACY_TO_HOSPI_PRODUCT: Record<string, string> = {
  p1: 'prod-thieboudienne',
  p10: 'prod-coca-33',
};

export default function ClientOrder() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Toutes');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // If no table is passed, maybe redirect or show error? We'll assume table='emporter' if empty
  }, [tableId]);

  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = activeCat === 'Toutes' || p.category === activeCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartTotal = cart.reduce((s, item) => s + (item.product.price * item.quantity), 0);

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, options: [] }];
    });

    if (tableId) {
      useNotificationStore.getState().addNotification({
        title: `Table ${tableId.replace('t', '')}`,
        message: `Le client a ajouté: ${product.name}`,
        type: 'order',
        targetRole: 'Serveur'
      });
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const confirmOrder = () => {
    if (cart.length === 0) return;
    const hospi = useHospiStore.getState();
    const restaurantPOS = hospi.posList.find(pos => pos.id === hospi.activePOSId && pos.type === 'restaurant')
      || hospi.posList.find(pos => pos.type === 'restaurant');
    const hospiLines = cart.flatMap(item => {
      const productId = LEGACY_TO_HOSPI_PRODUCT[item.product.id];
      return productId ? [{ productId, quantity: item.quantity }] : [];
    });
    const newOrder = {
      id: `o${Date.now()}`,
      tableId: tableId || undefined,
      posId: restaurantPOS?.id,
      hospiLines,
      type: tableId ? 'sur_place' : 'emporter',
      items: cart,
      total: cartTotal,
      status: 'en_preparation',
      payment: 'especes',
      date: new Date().toISOString(),
      serveurName: 'Commande QR',
      paidAmount: 0,
      payments: [],
      itemsReady: {},
    } as any;
    
    useOrderStore.setState(s => ({ orders: [...s.orders, newOrder] }));
    if (restaurantPOS && hospiLines.length > 0) {
      hospi.recordSale(newOrder.id, hospiLines, 'Commande QR', restaurantPOS.id);
    }
    setShowCart(false);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/client/review'); // Redirect to review after a while or back to client home
    }, 4000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mb-6">
          <Check size={48} className="text-green" />
        </motion.div>
        <h2 className="text-white font-black text-2xl mb-2">Commande Envoyée !</h2>
        <p className="text-text-secondary text-sm mb-8">Votre commande est en cours de préparation en cuisine.</p>
        <p className="text-orange font-bold">Total: {fmt(cartTotal)} F</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#070A0F]/90 backdrop-blur-md pt-12 pb-4 px-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-black text-2xl">Menu</h1>
            <p className="text-orange text-sm font-bold">{tableId ? `Table ${tableId.replace('t', '')}` : 'À Emporter'}</p>
          </div>
          <ChefHat size={32} className="text-white/20" />
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un plat..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-orange/50 transition-colors placeholder:text-text-tertiary" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCat === c ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(p => (
            <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-3 flex flex-col">
              <div className="w-full h-24 rounded-xl bg-white/5 mb-3 flex items-center justify-center overflow-hidden relative">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <ChefHat size={24} className="text-white/20" />}
                {p.allergens && p.allergens.length > 0 && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {p.allergens.map(a => <span key={a} className="w-5 h-5 rounded-full bg-black/50 backdrop-blur text-[10px] flex items-center justify-center">{a === 'arachide' ? '🥜' : a === 'poisson' ? '🐟' : a === 'lait' ? '🥛' : '🌾'}</span>)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm leading-tight mb-1">{p.name}</h3>
                <p className="text-orange font-black text-sm">{fmt(p.price)} <span className="text-[10px]">F</span></p>
              </div>
              <button onClick={() => addToCart(p)} className="w-full py-2.5 rounded-xl bg-white/5 text-white font-bold text-xs mt-3 active:bg-orange transition-colors">
                Ajouter
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && !showCart && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-6 left-5 right-5 z-20">
            <button onClick={() => setShowCart(true)} className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm flex items-center justify-between px-6 shadow-[0_8px_30px_rgba(255,138,0,0.3)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
                <span>Voir la commande</span>
              </div>
              <span className="flex items-center gap-2">{fmt(cartTotal)} F <ArrowRight size={18} /></span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <div className="modal-overlay z-50" onClick={() => setShowCart(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h2 className="text-white font-black text-xl mb-6">Votre Commande</h2>
              
              <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between glass-card p-3">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{item.product.name}</p>
                      <p className="text-orange font-bold text-xs">{fmt(item.product.price * item.quantity)} F</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center text-white"><Minus size={16} /></button>
                      <span className="text-white font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center text-white"><Plus size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-text-secondary">Total</span>
                <span className="text-white font-black text-2xl">{fmt(cartTotal)} F</span>
              </div>

              <button onClick={confirmOrder} className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase shadow-lg shadow-orange/20 active:scale-95 transition-transform">
                Envoyer en Cuisine
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
