import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useOrderStore, PRODUCTS, type Order } from '../stores/orderStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { QrCode, ShoppingBag, Plus, Minus, MapPin, Check, Truck, Clock, LogOut, MessageCircle, ClipboardList, Home, ChefHat, CreditCard, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  en_preparation: { label: 'En préparation', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: ChefHat },
  prete: { label: 'Prête', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: Check },
  en_livraison: { label: 'En livraison', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
  servie: { label: 'Servie', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: Check },
  terminee: { label: 'Terminée', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: Check },
  payee: { label: 'Payée', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: CreditCard },
  non_payee: { label: 'Non payée', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: CreditCard },
  partiellement_payee: { label: 'Partiel', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: CreditCard },
};

export default function ClientHome() {
  const { user } = useAuthStore();
  const { cart, addToCart, updateQuantity, checkout, orders, setOrderType } = useOrderStore();
  const { deliveries, addDelivery } = useDeliveryStore();
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<Order['type']>('livraison');
  const [activeTab, setActiveTab] = useState<'accueil' | 'commandes'>('accueil');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/');
  };

  // Client's orders
  const myOrders = orders.filter(o => o.clientId === user?.id);
  const activeOrders = myOrders.filter(o => ['en_preparation', 'prete', 'en_livraison'].includes(o.status));
  const pastOrders = myOrders.filter(o => ['terminee', 'payee', 'servie'].includes(o.status));
  const myDeliveries = deliveries.filter(d => d.clientName === user?.name && d.status !== 'livre');

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const getCartQty = (id: string) => cart.find(c => c.product.id === id)?.quantity || 0;

  const handleOrder = () => {
    setOrderType(fulfillmentMode);
    const order = checkout('wave', user?.id);
    if (order && fulfillmentMode === 'livraison') {
      addDelivery({
        orderId: order.id,
        clientName: user?.name || 'Client',
        clientPhone: '77 000 00 00',
        address: 'Adresse client à confirmer',
        amount: order.total,
        deliveryFee: 1500,
        paymentMethod: 'wave',
        paymentStatus: 'paye',
        driverId: 'e5',
        driverName: 'Pape Sow',
        status: 'preparation',
        estimatedTime: 25,
        createdAt: order.date,
      });
    }
    setShowCart(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const paymentLabel = (m: string) => {
    const map: Record<string, string> = { especes: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', carte: 'Carte' };
    return map[m] || m;
  };

  return (
    <div className="page-content pt-8 pb-32 bg-[#070A0F] min-h-screen">
      {/* Header Profile */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
            {user?.name.charAt(0)}
          </div>
          <div>
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Bonjour,</p>
            <h1 className="text-white font-black text-xl">{user?.name}</h1>
          </div>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform">
          <LogOut size={18} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl">
        {([
          { id: 'accueil', label: 'Accueil', icon: Home },
          { id: 'commandes', label: 'Mes Commandes', icon: ClipboardList, badge: activeOrders.length },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-wider relative ${
              activeTab === tab.id ? 'bg-white/10 text-white shadow-sm' : 'text-text-tertiary'
            }`}>
            <tab.icon size={16} />
            {tab.label}
            {'badge' in tab && tab.badge! > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange text-white text-[9px] font-black flex items-center justify-center">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── ACCUEIL TAB ─── */}
      {activeTab === 'accueil' && (
        <>
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

          {/* WhatsApp Bot Banner */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8" onClick={() => navigate('/whatsapp-bot')}>
            <div className="bg-[#128C7E] rounded-2xl p-4 flex items-center gap-4 active:scale-95 cursor-pointer transition-transform shadow-[0_8px_32px_rgba(18,140,126,0.3)]">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
                <MessageCircle size={28} className="text-[#128C7E]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Tester le Bot WhatsApp</h3>
                <p className="text-white/80 text-xs mt-0.5">Commandez facilement via WhatsApp</p>
              </div>
            </div>
          </motion.div>

          {/* Active Orders Quick View */}
          {activeOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Commandes en cours</h2>
                <button onClick={() => setActiveTab('commandes')} className="text-orange text-xs font-bold">Voir tout →</button>
              </div>
              <div className="space-y-3">
                {activeOrders.slice(0, 2).map(o => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.en_preparation;
                  const delivery = myDeliveries.find(d => d.orderId === o.id);
                  return (
                    <motion.div key={o.id} layout className="glass-card p-4 border-l-4" style={{ borderLeftColor: cfg.color }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-bold text-sm">Commande #{o.id.slice(-4)}</span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                      {delivery && (
                        <div className="flex items-center gap-2 text-text-secondary text-xs">
                          <Truck size={14} />
                          <span>Livreur: <strong className="text-white">{delivery.driverName}</strong></span>
                        </div>
                      )}
                      {!delivery && o.status === 'en_preparation' && (
                        <div className="flex items-center gap-2 text-text-secondary text-xs">
                          <Clock size={14} />
                          <span>En préparation par nos chefs</span>
                        </div>
                      )}
                    </motion.div>
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
        </>
      )}

      {/* ─── MES COMMANDES TAB ─── */}
      {activeTab === 'commandes' && (
        <div>
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em] mb-4">En cours ({activeOrders.length})</h3>
              <div className="space-y-4">
                {activeOrders.map(o => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.en_preparation;
                  const delivery = myDeliveries.find(d => d.orderId === o.id);
                  const IconComp = cfg.icon;
                  return (
                    <motion.div key={o.id} layout onClick={() => setSelectedOrder(o)}
                      className="glass-card p-5 border-l-4 active:scale-[0.98] cursor-pointer transition-all" style={{ borderLeftColor: cfg.color }}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                            <IconComp size={20} style={{ color: cfg.color }} />
                          </div>
                          <div>
                            <span className="text-white font-bold text-sm">Commande #{o.id.slice(-4)}</span>
                            <p className="text-text-tertiary text-[10px]">{new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                      {/* Live tracking info */}
                      {delivery && o.status === 'en_livraison' && (
                        <div className="p-3 rounded-xl bg-blue/5 border border-blue/20 flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue/20 flex items-center justify-center">
                            <Truck size={16} className="text-blue" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-xs font-bold">{delivery.driverName} en route</p>
                            <p className="text-text-tertiary text-[10px]">Estimation : {delivery.estimatedTime} min</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-blue animate-pulse" />
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <span className="text-text-secondary text-xs">{o.items.length} article{o.items.length > 1 ? 's' : ''}</span>
                        <span className="text-white font-black">{fmt(o.total)} F</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Orders */}
          <div>
            <h3 className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Historique ({pastOrders.length})</h3>
            {pastOrders.length === 0 ? (
              <div className="py-16 text-center text-text-tertiary">
                <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
                <p className="font-bold text-sm">Aucune commande passée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastOrders.slice(0, 10).map(o => (
                  <motion.div key={o.id} layout onClick={() => setSelectedOrder(o)}
                    className="glass-card p-4 flex items-center gap-4 active:scale-[0.98] cursor-pointer transition-all opacity-70 hover:opacity-100">
                    <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green"><Check size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-bold text-sm">#{o.id.slice(-4)}</span>
                      <p className="text-text-tertiary text-[10px]">{new Date(o.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-black text-sm">{fmt(o.total)} F</span>
                      <p className="text-text-tertiary text-[9px] uppercase">{paymentLabel(o.payment)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-white font-black text-xl">Commande #{selectedOrder.id.slice(-4)}</h3>
                  <p className="text-text-tertiary text-xs">{new Date(selectedOrder.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center"><X size={20} /></button>
              </div>
              {/* Status */}
              {(() => {
                const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.en_preparation;
                return (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6" style={{ background: cfg.bg }}>
                    <cfg.icon size={18} style={{ color: cfg.color }} />
                    <span className="font-black text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                );
              })()}
              {/* Items */}
              <div className="space-y-3 mb-6">
                {selectedOrder.items.map(it => (
                  <div key={it.product.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-orange font-black text-xs">{it.quantity}</span>
                      <span className="text-white text-sm font-semibold">{it.product.name}</span>
                    </div>
                    <span className="text-white font-bold text-sm">{fmt(it.product.price * it.quantity)} F</span>
                  </div>
                ))}
              </div>
              {/* Summary */}
              <div className="glass-card p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Total</span>
                  <span className="text-white font-black">{fmt(selectedOrder.total)} F</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Paiement</span>
                  <span className="text-white font-semibold">{paymentLabel(selectedOrder.payment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Type</span>
                  <span className="text-white font-semibold">{selectedOrder.type === 'livraison' ? '🛵 Livraison' : selectedOrder.type === 'emporter' ? '📦 À emporter' : '🍽️ Sur place'}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && !showCart && activeTab === 'accueil' && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-[9998] glass-card-lg p-4 flex items-center justify-between border-orange/30">
            <div>
              <div className="text-white font-black text-lg">{fmt(cartTotal)} <span className="text-xs text-text-secondary">FCFA</span></div>
              <div className="text-text-tertiary text-xs">{cartCount} article{cartCount > 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => setShowCart(true)} className="px-6 py-3 rounded-2xl bg-orange text-white font-bold text-sm flex items-center gap-2">
              <ShoppingBag size={18} /> Voir panier
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && cartCount > 0 && (
          <div className="modal-overlay" onClick={() => setShowCart(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Votre Commande</h3>
              <div className="glass-card p-4 mb-6 border-orange/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><MapPin className="text-orange" /><p className="text-white font-semibold text-sm">Mode de réception</p></div>
                </div>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                  {([
                    { label: 'Livraison', value: 'livraison' },
                    { label: 'Click & Collect', value: 'emporter' },
                  ] as const).map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => setFulfillmentMode(mode.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${fulfillmentMode === mode.value ? 'bg-orange text-white' : 'text-text-tertiary'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
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
              <button onClick={handleOrder} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,138,0,0.4)] mb-3">
                {fulfillmentMode === 'livraison' ? 'Commander en livraison avec Wave' : 'Commander à retirer avec Wave'}
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
            <motion.p className="text-text-secondary text-sm mt-2 text-center px-8">La cuisine prépare votre plat.<br/>Suivez l'avancement dans "Mes Commandes".</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
