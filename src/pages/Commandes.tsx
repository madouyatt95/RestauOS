import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useTableStore, type Table } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { useReservationStore, type Reservation } from '../stores/reservationStore';
import { Search, ShoppingCart, X, ChefHat, Calendar, Users, Clock, Check, UserPlus, Phone, Move, Plus, Minus } from 'lucide-react';

export default function Commandes() {
  const { cart, addToCart, updateQuantity, clearCart, checkout } = useOrderStore();
  const { tables, updateTableStatus, updateTablePosition, updateTableCapacity } = useTableStore();
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
  
  const [designMode, setDesignMode] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const filteredProducts = PRODUCTS.filter(p => 
    (category === 'tous' || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleTableClick = (t: Table) => {
    if (designMode) {
      setEditingTable(t);
      return;
    }
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
    setSelectedTableId(t.id);
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
    setTimeout(() => {
      const state = useReservationStore.getState();
      const newRes = state.reservations[0];
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
      <div className="page-content pt-8 pb-32 h-screen flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 px-4">
          <div>
            <h1 className="text-white font-black text-2xl mb-1">Plan de Salle</h1>
            <p className="text-text-secondary text-sm">
              {designMode ? '🎨 Mode Design : Déplacez les tables' : assigningRes ? `Attribuer à ${assigningRes.clientName}` : 'Gérez vos tables en temps réel'}
            </p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'Gérant' && (
              <button onClick={() => setDesignMode(!designMode)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${designMode ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>
                <Move size={20} />
              </button>
            )}
            <button onClick={() => setShowResList(true)} className="w-10 h-10 rounded-xl bg-blue/10 border border-blue/20 flex items-center justify-center text-blue relative">
              <Calendar size={20} />
              {todayRes.filter(r => r.status === 'en_attente').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red rounded-full text-[8px] text-white font-bold flex items-center justify-center border-2 border-[#070A0F]">
                  {todayRes.filter(r => r.status === 'en_attente').length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-black/40 rounded-[2.5rem] border border-white/5 mx-4 mb-4 overflow-hidden" ref={canvasRef}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/5 rounded-b-xl text-[8px] font-black uppercase text-text-tertiary tracking-widest">Entrée</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-white/5 rounded-t-xl text-[8px] font-black uppercase text-text-tertiary tracking-widest">Cuisine</div>
          
          {tables.map(t => {
            const isSelected = showTableOptions === t.id;
            return (
              <motion.div
                key={t.id}
                drag={designMode}
                dragMomentum={false}
                onDragEnd={(e: any) => {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    updateTablePosition(t.id, x, y);
                  }
                }}
                onClick={() => handleTableClick(t)}
                className="absolute cursor-pointer select-none"
                style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`relative flex items-center justify-center transition-all duration-300 ${
                  t.shape === 'round' ? 'rounded-full aspect-square w-16' : 
                  t.shape === 'rectangle' ? 'rounded-2xl w-24 h-14' : 'rounded-2xl w-16 h-16'
                } border-2 ${
                  t.status === 'libre' ? 'bg-green/10 border-green/30 text-green shadow-lg shadow-green/5' :
                  t.status === 'occupee' ? 'bg-red/20 border-red/40 text-red shadow-lg shadow-red/20 animate-pulse-slow' :
                  'bg-blue/20 border-blue/40 text-blue shadow-lg shadow-blue/20'
                } ${isSelected ? 'scale-110 border-white ring-4 ring-white/10' : ''}`}>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-black">{t.number}</span>
                    <div className="flex items-center gap-0.5 opacity-60">
                      <Users size={8} />
                      <span className="text-[8px] font-bold">{t.capacity}</span>
                    </div>
                  </div>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${
                    t.status === 'libre' ? 'bg-green' : t.status === 'occupee' ? 'bg-red' : 'bg-blue'
                  }`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-8 flex justify-center gap-6 mb-8 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 text-green"><div className="w-2 h-2 rounded-full bg-green" /> Libre</div>
          <div className="flex items-center gap-2 text-red"><div className="w-2 h-2 rounded-full bg-red animate-pulse" /> Occupée</div>
          <div className="flex items-center gap-2 text-blue"><div className="w-2 h-2 rounded-full bg-blue" /> Réservée</div>
        </div>

        <AnimatePresence>
          {showTableOptions && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTableOptions(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-black text-xl mb-6 text-center">Table {tables.find(t => t.id === showTableOptions)?.number}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleInstallWalkIn(showTableOptions)} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center text-green"><UserPlus size={24} /></div>
                    <span className="text-white font-bold text-sm">Installer</span>
                  </button>
                  <button onClick={() => handleManualReservation(showTableOptions)} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center text-blue"><Phone size={24} /></div>
                    <span className="text-white font-bold text-sm">Réserver</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {designMode && editingTable && (
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-28 left-4 right-4 z-[1000] glass-card p-6 border-orange/40">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black">Table {editingTable.number}</h3>
                <button onClick={() => setEditingTable(null)}><X size={20} className="text-text-tertiary" /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-text-secondary text-xs font-bold uppercase mb-3 block text-center">Capacité (Couverts)</label>
                  <div className="flex items-center justify-center gap-8">
                    <button onClick={() => updateTableCapacity(editingTable.id, Math.max(1, editingTable.capacity - 1))} className="w-12 h-12 rounded-xl bg-white/5 text-white flex items-center justify-center"><Minus size={20} /></button>
                    <span className="text-4xl font-black text-white">{editingTable.capacity}</span>
                    <button onClick={() => updateTableCapacity(editingTable.id, editingTable.capacity + 1)} className="w-12 h-12 rounded-xl bg-white/5 text-white flex items-center justify-center"><Plus size={20} /></button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['square', 'round', 'rectangle'] as const).map(shape => (
                    <button 
                      key={shape} 
                      onClick={() => {
                        const store = useTableStore.getState();
                        store.tables = store.tables.map(t => t.id === editingTable.id ? { ...t, shape } : t);
                        setEditingTable({ ...editingTable, shape });
                      }}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-colors ${editingTable.shape === shape ? 'bg-orange text-white' : 'bg-white/5 text-text-tertiary'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResList && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowResList(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-black text-xl mb-6">Réservations attendues</h3>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {todayRes.length === 0 ? (
                    <div className="py-12 text-center text-text-tertiary italic">Aucune réservation aujourd'hui</div>
                  ) : (
                    todayRes.map(res => (
                      <div key={res.id} className="glass-card p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-bold">{res.clientName}</h4>
                          <div className="flex gap-3 text-[10px] text-text-tertiary font-bold mt-1">
                            <span className="flex items-center gap-1"><Clock size={12} /> {res.time}</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {res.guests} pers.</span>
                          </div>
                        </div>
                        {res.status === 'en_attente' && (
                          <button onClick={() => { setAssigningRes(res); setShowResList(false); }} className="px-4 py-2 rounded-xl bg-blue text-white text-xs font-bold">Attribuer</button>
                        )}
                        {res.status === 'confirmee' && (
                          <span className="text-blue font-black text-xs">Table {tables.find(t => t.id === res.tableId)?.number}</span>
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
          <button onClick={() => setSelectedTableId(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"><X size={20} /></button>
          <div>
            <h1 className="text-white font-black text-xl">Table {currentTable?.number}</h1>
            <p className="text-text-secondary text-xs">{currentRes ? `Réservée : ${currentRes.clientName}` : 'Commande en cours'}</p>
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
        <div className="glass-card p-6 mb-6 border-blue/30 bg-blue/5 text-center">
          <div className="w-16 h-16 rounded-full bg-blue/20 flex items-center justify-center mx-auto mb-4"><Check size={32} className="text-blue" /></div>
          <h3 className="text-white font-bold mb-1">Arrivée de {currentRes?.clientName} ?</h3>
          <button onClick={() => updateTableStatus(selectedTableId, 'occupee')} className="w-full mt-4 py-3 rounded-xl bg-blue text-white font-bold text-sm">Lancer la commande</button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:border-orange/50" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['tous', 'plats', 'boissons', 'desserts'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${category === cat ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <motion.div key={product.id} whileTap={{ scale: 0.98 }} onClick={() => addToCart(product)} className="glass-card overflow-hidden flex flex-col">
            <div className="h-28 bg-white/5 flex items-center justify-center text-3xl">{product.image.startsWith('/') ? <img src={product.image} className="w-full h-full object-cover" /> : product.image}</div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-orange font-black text-xs mt-auto">{product.price.toLocaleString()} F</p>
            </div>
          </motion.div>
        ))}
      </div>

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
