import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { QrCode, ShoppingBag, Plus, Minus, MapPin, Check, Truck, Clock } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function ClientHome() {
  const { user } = useAuthStore();
  const { cart, addToCart, updateQuantity, checkout, orders } = useOrderStore();
  const { deliveries } = useDeliveryStore();
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Client's active orders from orderStore (not yet delivery)
  const myOrders = orders.filter(o => o.clientId === user?.id && o.status !== 'servi');
  // Client's deliveries
  const myDeliveries = deliveries.filter(d => d.clientName === user?.name && d.status !== 'livre');

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const getCartQty = (id: string) => cart.find(c => c.product.id === id)?.quantity || 0;

  const handleOrder = () => {
    useOrderStore.setState({ orderType: 'livraison' }); // Force type
    checkout('wave', user?.id);
    setShowCart(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="page-content pt-8 pb-32 bg-[#070A0F] min-h-screen">
      {/* Header Profile */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
          {user?.name.charAt(0)}
        </div>
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Bonjour,</p>
          <h1 className="text-white font-black text-xl">{user?.name}</h1>
        </div>
      </div>

      {/* Loyalty Card */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-orange to-amber-600 p-6 shadow-[0_8px_32px_rgba(255,138,0,0.3)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Points de Fidélité</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">450</span>
                <span className="text-white/80 font-bold mb-1">pts</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <QrCode size={40} className="text-orange" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-white/90 text-sm font-semibold">
            <span>Niveau Gold 🏆</span>
            <span>150 pts avant le prochain palier</span>
          </div>
          <div className="mt-3 w-full h-2 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full w-3/4" />
          </div>
        </div>
      </motion.div>

      {/* Active Orders Tracker */}
      {(myOrders.length > 0 || myDeliveries.length > 0) && (
        <div className="mb-8">
          <h2 className="text-white font-bold text-lg mb-4">Commandes en cours</h2>
          <div className="space-y-4">
            {myDeliveries.map(d => (
              <div key={d.id} className="glass-card p-4 border border-blue/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">Livraison #{d.orderId.slice(-4)}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue/20 text-blue">
                    {d.status === 'en_route' ? 'En route 🛵' : 'Préparation'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <Truck size={14} />
                  <span>Livreur: <strong className="text-white">{d.driverName}</strong></span>
                </div>
              </div>
            ))}
            
            {myOrders.map(o => {
              // Hide if there's already a delivery for this order
              if (myDeliveries.some(d => d.orderId === o.id)) return null;
              
              return (
                <div key={o.id} className="glass-card p-4 border border-orange/30">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-bold">Commande #{o.id.slice(-4)}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange/20 text-orange">
                      En cuisine 👨‍🍳
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Clock size={14} />
                    <span>En préparation par nos chefs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu / Order section */}
      <h2 className="text-white font-bold text-lg mb-4">Commander à nouveau</h2>
      <div className="space-y-3">
        {PRODUCTS.slice(0, 4).map(p => {
          const qty = getCartQty(p.id);
          return (
            <motion.div key={p.id} className="glass-card p-4 flex items-center gap-3">
              {p.image.startsWith('/') ? (
                <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <span className="text-3xl w-14 text-center shrink-0">{p.image}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{p.name}</div>
                <div className="text-orange font-bold text-sm">{fmt(p.price)} <span className="text-text-tertiary text-[10px] font-normal">FCFA</span></div>
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 && (
                  <>
                    <button onClick={() => updateQuantity(p.id, qty - 1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary">
                      <Minus size={14} />
                    </button>
                    <span className="text-white font-bold text-sm w-5 text-center">{qty}</span>
                  </>
                )}
                <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-lg bg-orange/20 flex items-center justify-center text-orange">
                  <Plus size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && !showCart && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-[9998] glass-card-lg p-4 flex items-center justify-between border-orange/30"
          >
            <div>
              <div className="text-white font-black text-lg">{fmt(cartTotal)} <span className="text-xs text-text-secondary">FCFA</span></div>
              <div className="text-text-tertiary text-xs">{cartCount} article{cartCount > 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => setShowCart(true)}
              className="px-6 py-3 rounded-2xl bg-orange text-white font-bold text-sm flex items-center gap-2">
              <ShoppingBag size={18} /> Voir panier
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && cartCount > 0 && (
          <div className="modal-overlay" onClick={() => setShowCart(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}
            >
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Votre Commande</h3>
              
              <div className="glass-card p-4 mb-6 border-orange/20 flex gap-3 items-center">
                <MapPin className="text-orange" />
                <div>
                  <p className="text-white font-semibold text-sm">Livraison à Domicile</p>
                  <p className="text-text-secondary text-xs">Mermoz, Dakar (Adresse par défaut)</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {cart.map(c => (
                  <div key={c.product.id} className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">{c.quantity}x {c.product.name}</span>
                    <span className="text-white font-semibold text-sm">{fmt(c.product.price * c.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-6 pt-4 border-t border-white/10">
                <span className="text-white font-bold">Total</span>
                <span className="text-orange font-black text-xl">{fmt(cartTotal)} <span className="text-xs text-text-secondary">FCFA</span></span>
              </div>

              <button onClick={handleOrder}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,138,0,0.4)]">
                Commander avec Wave
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-bg-primary/90 flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mb-6">
              <Check size={48} className="text-green" />
            </motion.div>
            <motion.p className="text-white text-xl font-bold">Commande envoyée !</motion.p>
            <motion.p className="text-text-secondary text-sm mt-2 text-center px-8">La cuisine prépare votre plat.<br/>Suivez l'avancement sur cette page.</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
