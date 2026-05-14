import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useTableStore, type Table } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { useReservationStore, type Reservation } from '../stores/reservationStore';
import { Search, ShoppingCart, X, ChefHat, Calendar, UserPlus, Phone, Move, Plus, Minus, Trash2, Layout } from 'lucide-react';

// Helper to render chairs around a table
const Chairs = ({ count, shape }: { count: number, shape: string }) => {
  const chairs = Array.from({ length: count });
  return (
    <>
      {chairs.map((_, i) => {
        let style = {};
        const angle = (i * 360) / count;
        if (shape === 'round') {
          style = { transform: `rotate(${angle}deg) translateY(-42px)` };
        } else if (shape === 'rectangle') {
          const side = i % 2 === 0 ? -1 : 1;
          const offset = Math.floor(i / 2) * 30 - ((count / 2 - 1) * 15);
          style = { transform: `translate(${offset}px, ${side * 35}px)` };
        } else {
          const sideAngle = Math.floor(i / (count / 4)) * 90;
          style = { transform: `rotate(${sideAngle}deg) translateY(-38px)` };
        }
        return (
          <div key={i} className="absolute w-4 h-3 bg-white/20 rounded-t-lg border border-white/10" style={style} />
        );
      })}
    </>
  );
};

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
    const guests = prompt("Nombre de personnes ?", "2") || "2";
    updateTableStatus(tableId, 'occupee');
    // We could store the guest count in the order later, but for now we just update the table capacity if needed?
    // Or just mark it as occupied.
    setSelectedTableId(tableId);
    setShowTableOptions(null);
  };


  const handleManualReservation = (tableId: string) => {
    const name = prompt("Nom du client ?") || "Client Téléphone";
    const guests = parseInt(prompt("Nombre de personnes ?", "2") || "2");
    
    addReservation({
      clientName: name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      guests
    });

    setTimeout(() => {
      const state = useReservationStore.getState();
      const newRes = state.reservations[0];
      updateReservationStatus(newRes.id, 'confirmee', tableId);
      updateTableStatus(tableId, 'reservee');
      setShowTableOptions(null);
    }, 100);
  };

  const handleAddTable = () => {
    const nextNum = Math.max(...tables.map(t => t.number)) + 1;
    const newTable: Table = {
      id: `t${Date.now()}`,
      number: nextNum,
      capacity: 4,
      status: 'libre',
      shape: 'square',
      x: 50,
      y: 50
    };
    useTableStore.getState().tables.push(newTable);
    setEditingTable(newTable);
  };

  const handleDeleteTable = (id: string) => {
    if (!confirm("Supprimer cette table ?")) return;
    const store = useTableStore.getState();
    store.tables = store.tables.filter(t => t.id !== id);
    setEditingTable(null);
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
      <div className="page-content pt-8 pb-32 h-screen flex flex-col overflow-hidden bg-[#0a0c10]">
        <div className="flex items-center justify-between mb-6 px-4">
          <div>
            <h1 className="text-white font-black text-2xl mb-1">Salle Live</h1>
            <p className="text-text-secondary text-sm">
              {designMode ? '🛠️ Studio Salle' : assigningRes ? `Attribuer à ${assigningRes.clientName}` : 'Plan de salle interactif'}
            </p>
          </div>
          <div className="flex gap-2">
            {(user?.role === 'Gérant' || user?.role === 'Admin') && (
              <button 
                onClick={() => setDesignMode(!designMode)} 
                className={`px-4 h-11 rounded-xl flex items-center gap-2 shadow-lg transition-all ${designMode ? 'bg-orange text-white shadow-orange/30' : 'bg-white/10 text-white border border-white/10'}`}
              >
                <Layout size={18} />
                <span className="text-xs font-bold">{designMode ? 'Quitter Studio' : 'Studio Salle'}</span>
              </button>
            )}
            <button onClick={() => setShowResList(true)} className="w-11 h-11 rounded-xl bg-blue/10 border border-blue/20 flex items-center justify-center text-blue relative">

              <Calendar size={20} />
              {todayRes.filter(r => r.status === 'en_attente').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red rounded-full text-[10px] text-white font-bold flex items-center justify-center border-2 border-[#0a0c10]">
                  {todayRes.filter(r => r.status === 'en_attente').length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-black/60 rounded-[3rem] border border-white/10 mx-4 mb-4 overflow-hidden shadow-2xl" ref={canvasRef}>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-white/5 border-x border-b border-white/10 rounded-b-2xl text-[10px] font-black uppercase text-text-tertiary tracking-[0.2em]">Entrée</div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-white/5 border-x border-t border-white/10 rounded-t-2xl text-[10px] font-black uppercase text-text-tertiary tracking-[0.2em]">Cuisine</div>
          
          {tables.map(t => {
            const isSelected = showTableOptions === t.id;
            const isEditing = editingTable?.id === t.id;
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
                className="absolute"
                style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)', zIndex: isEditing ? 50 : 10 }}
              >
                <div className="relative flex items-center justify-center">
                  <Chairs count={t.capacity} shape={t.shape} />
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center justify-center transition-all duration-300 ${
                    t.shape === 'round' ? 'rounded-full aspect-square w-14' : 
                    t.shape === 'rectangle' ? 'rounded-xl w-20 h-12' : 'rounded-xl w-14 h-14'
                  } border-2 ${
                    t.status === 'libre' ? 'bg-[#1a1c22] border-green/40 text-green' :
                    t.status === 'occupee' ? 'bg-[#1a1c22] border-red/50 text-red shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                    'bg-[#1a1c22] border-blue/50 text-blue shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  } ${isSelected || isEditing ? 'border-white ring-4 ring-white/10' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black">{t.number}</span>
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">{t.capacity}P</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-8 flex justify-center gap-8 mb-6">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green" /><span className="text-[10px] font-bold text-text-secondary uppercase">Libre</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red shadow-[0_0_8px_red]" /><span className="text-[10px] font-bold text-text-secondary uppercase">Occupée</span></div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue shadow-[0_0_8px_blue]" /><span className="text-[10px] font-bold text-text-secondary uppercase">Réservée</span></div>
        </div>

        {/* Design Mode Panel */}
        <AnimatePresence>
          {designMode && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-4 right-4 z-[100] glass-card p-4 border-orange/30">
              {!editingTable ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center text-orange"><Move size={20} /></div>
                    <div className="text-white font-bold text-sm">Studio Salle</div>
                  </div>
                  <button onClick={handleAddTable} className="px-6 py-2.5 rounded-xl bg-orange text-white text-xs font-bold flex items-center gap-2"><Plus size={16} /> Ajouter Table</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-black">Table {editingTable.number}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteTable(editingTable.id)} className="w-9 h-9 rounded-lg bg-red/10 text-red flex items-center justify-center"><Trash2 size={16} /></button>
                      <button onClick={() => setEditingTable(null)} className="w-9 h-9 rounded-lg bg-white/5 text-white flex items-center justify-center"><X size={16} /></button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-text-secondary text-[10px] font-bold uppercase mb-2">Capacité</p>
                      <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-2">
                        <button onClick={() => updateTableCapacity(editingTable.id, Math.max(1, editingTable.capacity - 1))}><Minus size={16} className="text-white" /></button>
                        <span className="text-xl font-black text-white flex-1 text-center">{editingTable.capacity}</span>
                        <button onClick={() => updateTableCapacity(editingTable.id, editingTable.capacity + 1)}><Plus size={16} className="text-white" /></button>
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-text-secondary text-[10px] font-bold uppercase mb-2">Forme</p>
                      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                        {(['square', 'round', 'rectangle'] as const).map(shape => (
                          <button key={shape} onClick={() => {
                            const store = useTableStore.getState();
                            store.tables = store.tables.map(t => t.id === editingTable.id ? { ...t, shape } : t);
                            setEditingTable({ ...editingTable, shape });
                          }} className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase ${editingTable.shape === shape ? 'bg-orange text-white' : 'text-text-tertiary'}`}>{shape}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
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
          {showResList && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowResList(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-black text-xl mb-6">Réservations du jour</h3>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {todayRes.length === 0 ? (
                    <div className="py-12 text-center text-text-tertiary italic">Aucune réservation</div>
                  ) : (
                    todayRes.map(res => (
                      <div key={res.id} className="glass-card p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-bold">{res.clientName}</h4>
                          <p className="text-text-tertiary text-[10px] mt-1">{res.time} • {res.guests} pers.</p>
                        </div>
                        {res.status === 'en_attente' && (
                          <button onClick={() => { setAssigningRes(res); setShowResList(false); }} className="px-4 py-2 rounded-xl bg-blue text-white text-xs font-bold">Attribuer</button>
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
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTableId(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"><X size={20} /></button>
          <div><h1 className="text-white font-black text-xl">Table {currentTable?.number}</h1><p className="text-text-secondary text-xs">{currentRes ? `Réservée : ${currentRes.clientName}` : 'Commande'}</p></div>
        </div>
        <button onClick={() => setShowCart(true)} className="relative w-12 h-12 rounded-2xl bg-orange flex items-center justify-center text-white"><ShoppingCart size={22} />{cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-orange text-[10px] font-bold flex items-center justify-center border-2 border-orange">{cart.length}</span>}</button>
      </div>

      <div className="space-y-4 mb-6 px-4">
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white" /></div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">{['tous', 'plats', 'boissons', 'desserts'].map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-5 py-2 rounded-xl text-xs font-bold ${category === cat ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>{cat}</button>))}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4">
        {filteredProducts.map(product => (
          <motion.div key={product.id} whileTap={{ scale: 0.98 }} onClick={() => addToCart(product)} className="glass-card overflow-hidden flex flex-col">
            <div className="h-28 bg-white/5 flex items-center justify-center text-3xl">{product.image.startsWith('/') ? <img src={product.image} className="w-full h-full object-cover" /> : product.image}</div>
            <div className="p-3 flex-1 flex flex-col"><h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{product.name}</h3><p className="text-orange font-black text-xs mt-auto">{product.price.toLocaleString()} F</p></div>
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
                <button onClick={clearCart} className="text-text-tertiary text-xs font-bold uppercase">Vider</button>
              </div>
              <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0"><h4 className="text-white font-bold text-sm truncate">{item.product.name}</h4><p className="text-text-tertiary text-xs">{(item.product.price * item.quantity).toLocaleString()} F</p></div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="text-white font-bold">-</button>
                      <span className="text-white font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="text-white font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-4"><span className="text-text-secondary font-bold">Total</span><span className="text-white font-black text-2xl">{cartTotal.toLocaleString()} F</span></div>
              <button onClick={handleSendToKitchen} disabled={sending} className="w-full py-4 rounded-2xl bg-orange text-white font-black flex items-center justify-center gap-3">{sending ? 'Envoi...' : <><ChefHat size={20} /> Envoyer en cuisine</>}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
