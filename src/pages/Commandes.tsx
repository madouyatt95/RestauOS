import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useTableStore, type Table } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { useReservationStore, type Reservation } from '../stores/reservationStore';
import { Search, ShoppingCart, X, ChefHat, Calendar, UserPlus, Phone, Plus, Minus, Trash2, Layout, Layers, Map as MapIcon, User } from 'lucide-react';


const Chairs = ({ count, shape }: { count: number, shape: 'round' | 'square' | 'rectangle' }) => {
  const chairs = [];
  
  if (shape === 'round') {
    // Round: distribute chairs evenly around the circle
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count - 90;
      const rad = (angle * Math.PI) / 180;
      const radius = 32;
      chairs.push(
        <div key={i} className="absolute w-[10px] h-[6px] bg-[#555] rounded-[3px] border border-[#666]" 
          style={{ 
            left: `calc(50% + ${Math.cos(rad) * radius}px - 5px)`, 
            top: `calc(50% + ${Math.sin(rad) * radius}px - 3px)`,
            transform: `rotate(${angle + 90}deg)`
          }} />
      );
    }
  } else if (shape === 'square') {
    // Square: 1 per side, clockwise from top
    const positions = [
      { x: 0, y: -30, rot: 0 },    // top
      { x: 30, y: 0, rot: 90 },     // right
      { x: 0, y: 30, rot: 180 },    // bottom
      { x: -30, y: 0, rot: 270 },   // left
    ];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const p = positions[i];
      chairs.push(
        <div key={i} className="absolute w-[10px] h-[6px] bg-[#555] rounded-[3px] border border-[#666]" 
          style={{ 
            left: `calc(50% + ${p.x}px - 5px)`, 
            top: `calc(50% + ${p.y}px - 3px)`,
            transform: `rotate(${p.rot}deg)`
          }} />
      );
    }
  } else {
    // Rectangle: distribute along long sides (top/bottom), then short sides
    const perSide = Math.ceil(count / 2);
    for (let i = 0; i < count; i++) {
      const isTop = i < perSide;
      const sideIndex = isTop ? i : i - perSide;
      const sideCount = isTop ? perSide : count - perSide;
      const spacing = 100 / (sideCount + 1);
      const xPct = spacing * (sideIndex + 1);
      
      chairs.push(
        <div key={i} className="absolute w-[10px] h-[6px] bg-[#555] rounded-[3px] border border-[#666]" 
          style={{ 
            left: `${xPct}%`, 
            top: isTop ? '-10px' : 'calc(100% + 4px)',
            transform: `translateX(-5px) rotate(${isTop ? 0 : 180}deg)`
          }} />
      );
    }
  }
  
  return <>{chairs}</>;
};

// Derive visual shape from capacity
const getVisualShape = (capacity: number): 'round' | 'square' | 'rectangle' => {
  if (capacity <= 2) return 'round';
  if (capacity <= 4) return 'square';
  return 'rectangle';
};

// Derive visual dimensions from capacity
const getTableDimensions = (capacity: number): { w: number, h: number } => {
  if (capacity <= 2) return { w: 48, h: 48 };
  if (capacity <= 4) return { w: 52, h: 52 };
  if (capacity <= 6) return { w: 90, h: 44 };
  if (capacity <= 8) return { w: 110, h: 46 };
  return { w: 130, h: 48 };
};


export default function Commandes() {
  const { cart, addToCart, updateQuantity, clearCart, checkout } = useOrderStore();
  const { tables, updateTableStatus, updateTablePosition, updateTableCapacity, updateTableFloor } = useTableStore();
  const { reservations, updateStatus, addReservation } = useReservationStore();
  const { user } = useAuthStore();
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [category, setCategory] = useState('tous');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);
  const [showResList, setShowResList] = useState(false);
  const [assigningRes, setAssigningRes] = useState<Reservation | null>(null);
  const [showTableOptions, setShowTableOptions] = useState<string | null>(null);
  
  const [selectedFloor, setSelectedFloor] = useState('RDC');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  const [designMode, setDesignMode] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const zones = useMemo(() => {
    const floorTables = tables.filter(t => t.floor === selectedFloor);
    const z = Array.from(new Set(floorTables.map(t => t.zone)));
    return z;
  }, [tables, selectedFloor]);

  // Set default zone if none selected
  if (!selectedZone && zones.length > 0) setSelectedZone(zones[0]);

  const floorTables = tables.filter(t => t.floor === selectedFloor && t.zone === selectedZone);

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
      updateStatus(assigningRes.id, 'confirmed', t.id);
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
    const g = prompt("Nombre de personnes ?", "2");
    if (!g) return;
    updateTableStatus(tableId, 'occupee');
    setSelectedTableId(tableId);
    setShowTableOptions(null);
  };

  const handleManualReservation = (tableId: string) => {
    const name = prompt("Nom du client ?") || "Client Téléphone";
    const guests = parseInt(prompt("Nombre de personnes ?", "2") || "2");
    
    addReservation({
      clientName: name,
      clientPhone: '000000000',
      status: 'pending',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      guests
    });
    setTimeout(() => {
      const state = useReservationStore.getState();
      const newRes = state.reservations[state.reservations.length - 1];
      if (newRes) updateStatus(newRes.id, 'confirmed', tableId);
      updateTableStatus(tableId, 'reservee');
      setShowTableOptions(null);
    }, 100);
  };

  const handleAddTable = () => {
    const nextNum = Math.max(...tables.map(t => t.number), 0) + 1;
    const newTable: Table = {
      id: `t${Date.now()}`,
      number: nextNum,
      capacity: 4,
      status: 'libre',
      shape: 'square',
      floor: selectedFloor,
      zone: selectedZone || 'Principale',
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
        const res = reservations.find(r => r.tableId === selectedTableId && r.status === 'confirmed');
        if (res) updateStatus(res.id, 'confirmed'); // Mark as arrived/served, let's keep confirmed or add a new status.

      }
      setSending(false);
      clearCart();
      setSelectedTableId(null);
      setShowCart(false);
    }, 1500);
  };

  const todayString = new Date().toISOString().split('T')[0];
  const todayRes = reservations.filter(r => r.date === todayString && (r.status === 'pending' || r.status === 'confirmed'));

  if (!selectedTableId) {
    return (
      <div className="page-content pt-8 pb-32 h-screen flex flex-col overflow-hidden bg-[#0a0c10]">
        <div className="flex items-center justify-between mb-4 px-4">
          <div>
            <h1 className="text-white font-black text-2xl mb-1">Plan de Salle</h1>
            <p className="text-text-secondary text-xs">
              {designMode ? '🎨 Studio Mode : Configurez vos zones' : assigningRes ? `Attribuer à ${assigningRes.clientName}` : 'Gérez vos tables en temps réel'}
            </p>
          </div>
          <div className="flex gap-2">
            {(user?.role === 'Gérant' || user?.role === 'Admin') && (
              <button 
                onClick={() => setDesignMode(!designMode)} 
                className={`px-4 h-11 rounded-xl flex items-center gap-2 shadow-lg transition-all ${designMode ? 'bg-orange text-white shadow-orange/30' : 'bg-white/10 text-white border border-white/10'}`}
              >
                <Layout size={18} />
                <span className="text-xs font-bold">{designMode ? 'Quitter Studio' : 'Studio'}</span>
              </button>
            )}
            <button onClick={() => setShowResList(true)} className="w-11 h-11 rounded-xl bg-blue/10 border border-blue/20 flex items-center justify-center text-blue relative">
              <Calendar size={20} />
              {todayRes.filter((r: Reservation) => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red rounded-full text-[10px] text-white font-bold flex items-center justify-center border-2 border-[#0a0c10]">
                  {todayRes.filter((r: Reservation) => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Level & Zone Navigation */}
        <div className="px-4 space-y-3 mb-4">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            {['RDC', 'ETAGE', 'TERRASSE'].map(f => (
              <button
                key={f}
                onClick={() => { setSelectedFloor(f); setSelectedZone(null); }}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${selectedFloor === f ? 'bg-white/10 text-white shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                {f === 'ETAGE' ? '1er Étage' : f}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all border ${selectedZone === z ? 'bg-blue/10 border-blue text-blue' : 'bg-white/5 border-transparent text-text-tertiary'}`}
              >
                {z}
              </button>
            ))}
            {designMode && (
              <button onClick={() => {
                const newZone = prompt("Nom de la nouvelle salle ?");
                if (newZone) setSelectedZone(newZone);
              }} className="px-3 py-2 rounded-xl bg-white/5 border border-dashed border-white/20 text-white/40"><Plus size={14} /></button>
            )}
          </div>
        </div>

        {/* Visual Floor Plan Canvas */}
        <div className="flex-1 relative bg-black/60 rounded-[3rem] border border-white/10 mx-4 mb-4 overflow-hidden shadow-2xl" ref={canvasRef}>
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="absolute top-4 left-6 flex items-center gap-2 opacity-40">
            <MapIcon size={14} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{selectedFloor} • {selectedZone}</span>
          </div>

          {floorTables.map(t => {
            const isSelected = showTableOptions === t.id;
            const isEditing = editingTable?.id === t.id;
            
            // Auto-derive visual shape and size from capacity
            const vShape = getVisualShape(t.capacity);
            const dims = getTableDimensions(t.capacity);

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
                <div className="relative" style={{ width: `${dims.w + 24}px`, height: `${dims.h + 24}px` }}>
                  <Chairs count={t.capacity} shape={vShape} />
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`absolute transition-all duration-300 border-2 flex items-center justify-center ${
                      vShape === 'round' ? 'rounded-full' : 'rounded-xl'
                    } ${
                    t.status === 'libre' ? 'bg-[#1a1c22] border-green/40 text-green shadow-[0_0_15px_rgba(34,197,94,0.05)]' :
                    t.status === 'occupee' ? 'bg-[#1a1c22] border-red/50 text-red shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                    'bg-[#1a1c22] border-blue/50 text-blue shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  } ${isSelected || isEditing ? 'border-white ring-4 ring-white/10' : ''}`}
                  style={{ 
                    width: `${dims.w}px`, 
                    height: `${dims.h}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}>
                    <div className="flex flex-col items-center">
                      <span className="font-black text-sm">{t.number}</span>
                      <span className="text-[8px] opacity-60 font-bold">{t.capacity}p</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}

        </div>

        {/* Legend & Stats */}
        <div className="px-8 flex justify-between items-center mb-6">
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green" /><span className="text-[10px] font-bold text-text-secondary uppercase">Libre</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red shadow-[0_0_8px_red]" /><span className="text-[10px] font-bold text-text-secondary uppercase">Occupée</span></div>
          </div>
          <div className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest">{floorTables.length} Tables dans cette salle</div>
        </div>

        {/* Studio Control Panel */}
        <AnimatePresence>
          {designMode && (
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="fixed bottom-24 left-4 right-4 z-[100] glass-card p-5 border-orange/40 shadow-2xl">
              {!editingTable ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-orange"><Layers size={24} /></div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-wider">Studio Salle</p>
                      <p className="text-text-tertiary text-[10px]">Configurez vos tables et zones</p>
                    </div>
                  </div>
                  <button onClick={handleAddTable} className="px-6 py-3 rounded-2xl bg-orange text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-orange/20"><Plus size={18} /> Ajouter Table</button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-black text-xl">Table {editingTable.number}</h3>
                      <span className="px-3 py-1 rounded-full bg-blue/10 text-blue text-[9px] font-black uppercase tracking-widest">{editingTable.floor} • {editingTable.zone}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteTable(editingTable.id)} className="w-10 h-10 rounded-xl bg-red/10 text-red flex items-center justify-center transition-colors hover:bg-red/20"><Trash2 size={18} /></button>
                      <button onClick={() => setEditingTable(null)} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center"><X size={18} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Capacité</label>
                      <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                        <button onClick={() => {
                          const newCap = Math.max(1, editingTable.capacity - 1);
                          const newShape = getVisualShape(newCap);
                          updateTableCapacity(editingTable.id, newCap);
                          setEditingTable({ ...editingTable, capacity: newCap, shape: newShape });
                        }} className="text-white"><Minus size={18} /></button>
                        <div className="text-center">
                          <span className="text-2xl font-black text-white">{editingTable.capacity}</span>
                          <span className="text-[8px] text-text-tertiary block uppercase font-bold">{getVisualShape(editingTable.capacity) === 'round' ? 'Ronde' : getVisualShape(editingTable.capacity) === 'square' ? 'Carrée' : 'Rectangle'}</span>
                        </div>
                        <button onClick={() => {
                          const newCap = editingTable.capacity + 1;
                          const newShape = getVisualShape(newCap);
                          updateTableCapacity(editingTable.id, newCap);
                          setEditingTable({ ...editingTable, capacity: newCap, shape: newShape });
                        }} className="text-white"><Plus size={18} /></button>
                      </div>

                    </div>
                    <div>
                      <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Déplacer vers Zone</label>
                      <div className="flex gap-1 bg-white/5 rounded-2xl p-1 border border-white/5 h-[52px] items-center px-2">
                        {zones.slice(0, 3).map(z => (
                          <button key={z} onClick={() => {
                            updateTableFloor(editingTable.id, editingTable.floor, z);
                            setEditingTable({ ...editingTable, zone: z });
                          }} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${editingTable.zone === z ? 'bg-orange text-white shadow-md' : 'text-text-tertiary hover:text-text-secondary'}`}>{z.substring(0, 4)}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Affecter Serveur (Planning)</label>
                    <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2">
                      <User size={16} className="text-orange" /> Choisir un responsable de zone
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals for Reservations/Options */}
        <AnimatePresence>
          {showTableOptions && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTableOptions(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-black text-xl mb-6 text-center">Table {tables.find(t => t.id === showTableOptions)?.number}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleInstallWalkIn(showTableOptions!)} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-2xl bg-green/10 flex items-center justify-center text-green shadow-inner"><UserPlus size={28} /></div>
                    <span className="text-white font-black text-sm uppercase tracking-wider">Installer</span>
                  </button>
                  <button onClick={() => handleManualReservation(showTableOptions!)} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 active:scale-95 transition-transform">
                    <div className="w-14 h-14 rounded-2xl bg-blue/10 flex items-center justify-center text-blue shadow-inner"><Phone size={28} /></div>
                    <span className="text-white font-black text-sm uppercase tracking-wider">Réserver</span>
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
                <h3 className="text-white font-black text-xl mb-6">Réservations attendues</h3>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {todayRes.length === 0 ? (
                    <div className="py-16 text-center text-text-tertiary italic">Aucune réservation pour le moment</div>
                  ) : (
                    todayRes.map((res: Reservation) => (
                      <div key={res.id} className="glass-card p-5 flex justify-between items-center border-white/5 hover:border-blue/30 transition-colors">
                        <div>
                          <h4 className="text-white font-black text-base">{res.clientName}</h4>
                          <div className="flex gap-4 mt-1 text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
                            <span>{res.time}</span>
                            <span>{res.guests} Personnes</span>
                          </div>
                        </div>
                        {res.status === 'pending' && (
                          <button onClick={() => { setAssigningRes(res); setShowResList(false); }} className="px-5 py-2.5 rounded-xl bg-blue text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue/20">Attribuer</button>
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
  const currentRes = reservations.find(r => r.tableId === selectedTableId && r.status === 'confirmed');

  return (
    <div className="page-content pt-8 pb-32">
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedTableId(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10"><X size={24} /></button>
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">Table {currentTable?.number}</h1>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">{currentRes ? `Réservée : ${currentRes.clientName}` : 'Prise de commande'}</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)} className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-orange to-amber-600 flex items-center justify-center text-white shadow-xl shadow-orange/20">
          <ShoppingCart size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-orange text-xs font-black flex items-center justify-center border-4 border-[#070A0F]">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-4 mb-8 px-4">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
          <input type="text" placeholder="Rechercher un plat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:border-orange/50 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['tous', 'plats', 'boissons', 'desserts'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'bg-white/5 text-text-secondary border border-white/5'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4">
        {filteredProducts.map(product => (
          <motion.div key={product.id} whileTap={{ scale: 0.96 }} onClick={() => addToCart(product)} className="glass-card overflow-hidden flex flex-col group active:border-orange/30">
            <div className="h-32 bg-white/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
              {product.image.startsWith('/') ? <img src={product.image} className="w-full h-full object-cover" /> : product.image}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-white font-black text-sm mb-1 leading-tight">{product.name}</h3>
              <p className="text-orange font-black text-sm mt-auto">{product.price.toLocaleString()} F</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowCart(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-black text-2xl">Panier • T{currentTable?.number}</h3>
                <button onClick={clearCart} className="text-text-tertiary text-xs font-black uppercase tracking-widest hover:text-red transition-colors">Vider</button>
              </div>
              <div className="space-y-5 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shrink-0 border border-white/10">
                      {item.product.image.startsWith('/') ? <img src={item.product.image} className="w-full h-full object-cover rounded-2xl" alt="" /> : item.product.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-sm truncate">{item.product.name}</h4>
                      <p className="text-text-tertiary text-xs font-bold uppercase tracking-wider">{(item.product.price * item.quantity).toLocaleString()} F</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 rounded-xl px-3 py-2 border border-white/5">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="text-white"><Minus size={18} /></button>
                      <span className="text-white font-black text-base w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="text-white"><Plus size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-text-secondary font-black uppercase tracking-[0.2em] text-xs">Total à payer</span>
                <span className="text-white font-black text-3xl">{cartTotal.toLocaleString()} <span className="text-sm opacity-40">F</span></span>
              </div>
              <button onClick={handleSendToKitchen} disabled={sending} className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-orange to-amber-600 text-white font-black text-lg shadow-xl shadow-orange/20 flex items-center justify-center gap-4 active:scale-95 transition-transform disabled:opacity-50">
                {sending ? 'Envoi en cours...' : <><ChefHat size={24} /> Envoyer en cuisine</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
