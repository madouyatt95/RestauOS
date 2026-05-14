import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useTableStore } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { useReservationStore, type Reservation } from '../stores/reservationStore';
import { Search, ShoppingCart, X, ChefHat, Calendar, Users, Clock, Check, UserPlus, Phone } from 'lucide-react';

export default function Commandes() {
  const { cart, addToCart, updateQuantity, clearCart, checkout } = useOrderStore();
  const { tables, updateTableStatus } = useTableStore();
  const { reservations, updateReservationStatus, addReservation, getTodayReservations } = useReservationStore();
  const { user } = useAuthStore();
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [category, setCategory] = useState('tous');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);
  const [showResList, setShowResList] = useState(false);
  const [assigningRes, setAssigningRes] = useState<Reservation | null>(null);
  const [showTableOptions, setShowTableOptions] = useState<string | null>(null);

  const filteredProducts = PRODUCTS.filter(p => 
    (category === 'tous' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleTableClick = (t: any) => {
    if (assigningRes) {
      if (t.status !== 'libre') return;
      updateReservationStatus(assigningRes.id, 'confirmee', t.id);
      updateTableStatus(t.id, 'reservee');
      setAssigningRes(null);
      return;
    }

    if (t.status === 'libre') {
      setShowTableOptions(t.id);
      return;
    }

    if (t.status === 'reservee' || t.status === 'occupee') {
      setSelectedTableId(t.id);
      return;
    }
  };

  const handleInstallWalkIn = (tableId: string) => {
    updateTableStatus(tableId, 'occupee');
    setSelectedTableId(tableId);
    setShowTableOptions(null);
  };

  const handleManualReservation = (tableId: string) => {
    const name = prompt("Nom du client ?") || "Client Téléphone";
    addReservation({
      clientName: name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      guests: 2
    });
    // Find the newly created res (it will be the first one)
    setTimeout(() => {
      const newRes = useReservationStore.getState().reservations[0];
      updateReservationStatus(newRes.id, 'confirmee', tableId);
      updateTableStatus(tableId, 'reservee');
      setShowTableOptions(null);
    }, 100);
  };

  const handleSendToKitchen = () => {
    if (!selectedTableId) return;
    setSending(true);
    
    setTimeout(() => {
      const order = checkout('especes', undefined, selectedTableId, user?.name);
      if (order) {
        updateTableStatus(selectedTableId, 'occupee', order.id);
        const res = reservations.find(r => r.tableId === selectedTableId && r.status === 'confirmee');
        if (res) updateReservationStatus(res.id, 'honoree');
      }
      setSending(false);
      clearCart();
      setSelectedTableId(null);
      setShowCart(false);
    }, 1500);
  };

  const todayRes = getTodayReservations().filter(r => r.status === 'en_attente' || r.status === 'confirmee');

  if (!selectedTableId) {
    return (
      <div className="page-content pt-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-black text-2xl mb-1">Plan de Salle</h1>
            <p className="text-text-secondary text-sm">
              {assigningRes ? `Attribuer à ${assigningRes.clientName}` : 'Gérez vos tables en temps réel'}
            </p>
          </div>
          <button 
            onClick={() => setShowResList(true)}
            className="w-12 h-12 rounded-2xl bg-blue/10 border border-blue/20 flex items-center justify-center text-blue relative"
          >
            <Calendar size={22} />
            {todayRes.filter(r => r.status === 'en_attente').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red rounded-full text-[10px] text-white font-bold flex items-center justify-center border-2 border-[#070A0F]">
                {todayRes.filter(r => r.status === 'en_attente').length}
              </span>
            )}
          </button>
        </div>

        {assigningRes && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-blue/10 border border-blue/30 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-blue font-bold text-sm">Sélectionnez une table</p>
              <p className="text-text-secondary text-xs">Pour {assigningRes.clientName}</p>
            </div>
            <button onClick={() => setAssigningRes(null)} className="text-text-tertiary text-xs font-bold uppercase">Annuler</button>
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {tables.map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTableClick(t)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all relative ${
                t.status === 'libre' ? 'bg-green/5 border-green/20 text-green' :
                t.status === 'occupee' ? 'bg-red/5 border-red/20 text-red' :
                'bg-blue/10 border-blue/40 text-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]'
              } ${assigningRes && t.status !== 'libre' ? 'opacity-30' : ''}`}
            >
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                {t.status === 'reservee' ? 'Réservée' : 'Table'}
              </span>
              <span className="text-2xl font-black">{t.number}</span>
              <span className="text-[10px] opacity-60">{t.capacity} pers.</span>
            </motion.button>
          ))}
        </div>

        {/* Table Options Modal (for walk-in or manual res) */}
        <AnimatePresence>
          {showTableOptions && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTableOptions(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-black text-xl mb-2 text-center">Table {tables.find(t => t.id === showTableOptions)?.number}</h3>
                <p className="text-text-secondary text-sm text-center mb-8">Que souhaitez-vous faire ?</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => handleInstallWalkIn(showTableOptions)}
                    className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 active:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center text-green">
                      <UserPlus size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">Installer un client</p>
                      <p className="text-text-tertiary text-xs">Client de passage (Walk-in)</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleManualReservation(showTableOptions)}
                    className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 active:bg-white/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center text-blue">
                      <Phone size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">Réserver la table</p>
                      <p className="text-text-tertiary text-xs">Réservation manuelle (Téléphone)</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reservations List Modal */}
        <AnimatePresence>
          {showResList && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowResList(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-black text-xl mb-6">Réservations attendues</h3>
                
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {todayRes.length === 0 ? (
                    <div className="py-12 text-center text-text-tertiary italic">Aucune réservation aujourd'hui</div>
                  ) : (
                    todayRes.map(res => (
                      <div key={res.id} className="glass-card p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-white font-bold">{res.clientName}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] text-text-tertiary font-bold"><Clock size={12} /> {res.time}</span>
                              <span className="flex items-center gap-1 text-[10px] text-text-tertiary font-bold"><Users size={12} /> {res.guests} pers.</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            res.status === 'confirmee' ? 'bg-blue/20 text-blue' : 'bg-orange/20 text-orange'
                          }`}>
                            {res.status === 'confirmee' ? `Table ${tables.find(t => t.id === res.tableId)?.number}` : 'En attente'}
                          </span>
                        </div>
                        {res.status === 'en_attente' && (
                          <button 
                            onClick={() => { setAssigningRes(res); setShowResList(false); }}
                            className="w-full py-2 rounded-xl bg-blue text-white text-xs font-bold"
                          >
                            Attribuer une table
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentTable = tables.find(t => t.id === selectedTableId);
  const currentRes = reservations.find(r => r.tableId === selectedTableId && r.status === 'confirmee');

  return (
    <div className="page-content pt-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTableId(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
            <X size={20} />
          </button>
          <div>
            <h1 className="text-white font-black text-xl">Table {currentTable?.number}</h1>
            {currentRes ? (
              <p className="text-blue font-bold text-[10px] uppercase">Réservée : {currentRes.clientName}</p>
            ) : (
              <p className="text-text-secondary text-xs">Commande en cours</p>
            )}
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

      {currentTable?.status === 'reservee' && cart.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 mb-6 border-blue/30 bg-blue/5 text-center">
          <div className="w-16 h-16 rounded-full bg-blue/20 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-blue" />
          </div>
          <h3 className="text-white font-bold mb-1">Arrivée de {currentRes?.clientName} ?</h3>
          <p className="text-text-secondary text-xs mb-6">Confirmez l'arrivée du client pour ouvrir la table.</p>
          <button 
            onClick={() => updateTableStatus(selectedTableId, 'occupee')}
            className="w-full py-3 rounded-xl bg-blue text-white font-bold text-sm"
          >
            Lancer la commande
          </button>
        </motion.div>
      )}

      {/* Menu and Search */}
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
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <motion.div key={product.id} whileTap={{ scale: 0.98 }} onClick={() => addToCart(product)} className="glass-card overflow-hidden flex flex-col">
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
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="modal-sheet" onClick={e => e.stopPropagation()}>
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
              </div>
              {cart.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-text-secondary font-bold">Total</span>
                    <span className="text-white font-black text-2xl">{cartTotal.toLocaleString()} <span className="text-xs">FCFA</span></span>
                  </div>
                  <button onClick={handleSendToKitchen} disabled={sending} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-black shadow-lg shadow-orange/20 flex items-center justify-center gap-3 disabled:opacity-50">
                    {sending ? 'Envoi en cours...' : <><ChefHat size={20} /> Envoyer en cuisine</>}
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
