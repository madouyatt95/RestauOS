import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, PRODUCTS } from '../stores/orderStore';
import { useTableStore, type Table, type TableStatus } from '../stores/tableStore';
import { useAuthStore } from '../stores/authStore';
import { useReservationStore, type Reservation } from '../stores/reservationStore';
import { useClientStore } from '../stores/clientStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useHospiStore } from '../stores/hospiStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, X, ChefHat, Calendar, UserPlus, Phone, Plus, Minus, Trash2, Layout, Layers, Map as MapIcon, QrCode, Gift, Wallet, CheckCircle2, Store, Warehouse, CreditCard, Percent } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';


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
  const { cart, addToCart, updateQuantity, clearCart, checkout, orders, setLoyaltyClient, updateOrderStatus } = useOrderStore();
  const { posList, warehouses, activePOSId, setActivePOS, getProductsForPOS, recordSale } = useHospiStore();
  const { tables, addTable, removeTable, updateTableStatus, updateTablePosition, updateTableCapacity, updateTableFloor, updateTableDetails } = useTableStore();
  const { reservations, updateStatus, addReservation, cancelReservation } = useReservationStore();
  const { clients } = useClientStore();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();
  const [showLoyaltySearch, setShowLoyaltySearch] = useState(false);
  const [loyaltySearch, setLoyaltySearch] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [category, setCategory] = useState('tous');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);
  const [showResList, setShowResList] = useState(false);
  const [assigningRes, setAssigningRes] = useState<Reservation | null>(null);
  const [showTableOptions, setShowTableOptions] = useState<string | null>(null);
  const [tableToDeleteId, setTableToDeleteId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  
  const [selectedFloor, setSelectedFloor] = useState('RDC');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  const [designMode, setDesignMode] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tableId = params.get('tableId');
    if (tableId) {
      const table = tables.find(t => t.id === tableId);
      if (table) {
        setSelectedTableId(tableId);
        setShowCart(true);
      }
    }
  }, [location.search, tables]);

  const zones = useMemo(() => {
    const floorTables = tables.filter(t => t.floor === selectedFloor);
    const z = Array.from(new Set(floorTables.map(t => t.zone)));
    return z;
  }, [tables, selectedFloor]);

  // Set default zone if none selected
  if (!selectedZone && zones.length > 0) setSelectedZone(zones[0]);

  const floorTables = tables.filter(t => t.floor === selectedFloor && t.zone === selectedZone);
  const allZones = Array.from(new Set(tables.map(t => t.zone)));

  const activePOS = posList.find(pos => pos.id === activePOSId);
  const activeWarehouse = warehouses.find(warehouse => warehouse.id === activePOS?.default_warehouse_id);
  const hospiProducts = getProductsForPOS(activePOSId);
  const productsForActivePOS = PRODUCTS.map(product => {
    const hospiProduct = hospiProducts.find(item => item.product.legacy_product_id === product.id);
    if (!hospiProduct) return product;
    return {
      ...product,
      name: hospiProduct.product.name,
      price: hospiProduct.price.sale_price,
      stock: hospiProduct.stock?.quantity ?? product.stock,
    };
  });

  const filteredProducts = productsForActivePOS.filter(p => 
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

      // VIP Alert: check if client is Gold or Platinum
      const vipClient = clients.find(c => 
        c.name.toLowerCase() === assigningRes.clientName.toLowerCase() &&
        (c.tier === 'gold' || c.tier === 'platinum')
      );
      if (vipClient) {
        const tierLabel = vipClient.tier === 'platinum' ? 'Platinum 💎' : 'Gold ⭐';
        addNotification({
          title: `⭐ Alerte VIP — Table ${t.number}`,
          message: `${vipClient.name} (${tierLabel}) vient de s'installer. ${vipClient.visits} visites, ${vipClient.points} pts.`,
          type: 'order',
          targetRole: 'Serveur',
        });
      }

      setAssigningRes(null);
      return;
    }
    // Check if table has an active order even if its status is technically 'libre'
    const hasActiveOrder = orders.some(o => o.tableId === t.id && ['en_preparation', 'prete', 'servie', 'non_payee', 'partiellement_payee'].includes(o.status));

    if (t.status === 'libre' && !hasActiveOrder) {
      setShowTableOptions(t.id);
      return;
    }

    // Auto-correct status if there's an active order but table is marked libre
    if (t.status === 'libre' && hasActiveOrder) {
      updateTableStatus(t.id, 'occupee');
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
    addTable(newTable);
    setEditingTable(newTable);
  };

  const requestDeleteTable = (id: string) => {
    const table = tables.find(t => t.id === id);
    const activeOrder = orders.find(order => order.tableId === id && !['servie', 'annulee'].includes(order.status));
    if (!table) return;
    if (table.currentOrderId || activeOrder) {
      addNotification({
        type: 'system',
        title: 'Table non supprimée',
        message: `La table ${table.number} a une commande active. Libérez ou encaissez la table avant suppression.`,
      });
      return;
    }
    setTableToDeleteId(id);
  };

  const confirmDeleteTable = () => {
    if (!tableToDeleteId) return;
    const table = tables.find(t => t.id === tableToDeleteId);
    reservations
      .filter(reservation => reservation.tableId === tableToDeleteId && ['pending', 'confirmed', 'waitlist'].includes(reservation.status))
      .forEach(reservation => cancelReservation(reservation.id, `Table ${table?.number || ''} supprimée du plan`));
    removeTable(tableToDeleteId);
    setEditingTable(null);
    setShowTableOptions(null);
    setTableToDeleteId(null);
    addNotification({
      type: 'system',
      title: 'Table supprimée',
      message: table ? `La table ${table.number} a été retirée du plan de salle.` : 'La table a été retirée du plan de salle.',
    });
  };

  const handleDeleteTable = (id: string) => {
    requestDeleteTable(id);
  };

  const updateEditingTable = (input: Partial<Omit<Table, 'id'>>) => {
    if (!editingTable) return;
    updateTableDetails(editingTable.id, input);
    setEditingTable({ ...editingTable, ...input });
  };

  const handleSendToKitchen = () => {
    if (!selectedTableId) return;
    setSending(true);
    setTimeout(() => {
      const order = checkout('especes', undefined, selectedTableId, user?.name);
      if (order) {
        const hospiLines = cart.flatMap(item => {
          const hospiProduct = hospiProducts.find(product => product.product.legacy_product_id === item.product.id);
          return hospiProduct ? [{ productId: hospiProduct.product.id, quantity: item.quantity }] : [];
        });
        if (hospiLines.length > 0) {
          recordSale(order.id, hospiLines, user?.name, activePOSId);
          useOrderStore.getState().updateOrderHospiContext(order.id, {
            posId: activePOSId,
            hospiLines,
          });
        } else {
          useOrderStore.getState().updateOrderHospiContext(order.id, { posId: activePOSId });
        }
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
  const activePOSRevenue = orders
    .filter(order => order.posId === activePOSId)
    .reduce((sum, order) => sum + order.total, 0);

  if (!selectedTableId) {
    return (
      <div className="page-content pt-8 pb-32 h-screen flex flex-col overflow-hidden bg-[#0a0c10]">
        <div className="flex items-center justify-between mb-4 px-4">
          <div>
            <h1 className="text-white font-black text-2xl mb-1">Plan de Salle</h1>
            <p className="text-text-secondary text-xs">
              {designMode ? 'Studio Mode : Configurez vos zones' : assigningRes ? `Attribuer à ${assigningRes.clientName}` : activePOS?.name || 'Gérez vos tables en temps réel'}
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

        <div className="px-4 mb-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">POS actif</p>
                <h2 className="text-white font-black text-sm mt-0.5">{activePOS?.name || 'POS non sélectionné'}</h2>
              </div>
              <select
                value={activePOSId}
                onChange={event => setActivePOS(event.target.value)}
                className="max-w-[155px] bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none"
              >
                {posList.filter(pos => pos.is_active).map(pos => (
                  <option key={pos.id} value={pos.id} className="bg-[#111827] text-white">{pos.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {[
                { label: activeWarehouse?.name || 'Dépôt non configuré', icon: Warehouse, color: 'text-green' },
                { label: activePOS?.payment_methods.join(', ') || 'Espèces', icon: CreditCard, color: 'text-blue' },
                { label: activePOS?.tax_profile || 'TVA standard', icon: Percent, color: 'text-orange' },
                { label: `${activePOSRevenue.toLocaleString('fr-FR')} F`, icon: Store, color: 'text-purple' },
              ].map(item => (
                <span key={item.label} className="shrink-0 rounded-full bg-black/20 border border-white/5 px-2.5 py-1.5 text-[10px] font-bold text-text-secondary flex items-center gap-1.5">
                  <item.icon size={12} className={item.color} />
                  {item.label}
                </span>
              ))}
            </div>
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

            // Check if this table has a ready order
            const readyOrder = orders.find(o => o.tableId === t.id && o.status === 'prete');
            const hasReadyOrder = !!readyOrder;

            // Check if it has an order in preparation
            const prepOrder = orders.find(o => o.tableId === t.id && o.status === 'en_preparation');
            const hasPrepOrder = !!prepOrder;

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
                  {/* Ready badge */}
                  {hasReadyOrder && (
                    <div className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-green text-white text-[8px] font-black flex items-center justify-center animate-bounce shadow-lg shadow-green/40">
                      ✓
                    </div>
                  )}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`absolute transition-all duration-300 border-2 flex items-center justify-center ${
                      vShape === 'round' ? 'rounded-full' : 'rounded-xl'
                    } ${
                    hasReadyOrder ? 'bg-[#1a1c22] border-green text-green shadow-[0_0_25px_rgba(34,197,94,0.4)] animate-pulse' :
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
                      {hasReadyOrder ? (
                        <span className="text-[7px] font-black uppercase text-green">PRÊT</span>
                      ) : hasPrepOrder ? (
                        <span className="text-[7px] font-black uppercase text-blue">EN CUISINE</span>
                      ) : (
                        <span className="text-[8px] opacity-60 font-bold">{t.capacity}p</span>
                      )}
                    </div>
                  </motion.div>
                  {/* VIP Badge */}
                  {(() => {
                    const tableRes = reservations.find(r => r.tableId === t.id && r.status === 'confirmed');
                    if (!tableRes) return null;
                    const vipC = clients.find(c => c.name.toLowerCase() === tableRes.clientName.toLowerCase() && (c.tier === 'gold' || c.tier === 'platinum'));
                    if (!vipC) return null;
                    return <div className="absolute -top-1 -left-1 z-20 w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center shadow-lg shadow-amber-500/40" title={`VIP ${vipC.tier}`}>👑</div>;
                  })()}
                </div>
              </motion.div>
            );
          })}

        </div>

        {/* Legend & Stats */}
        <div className="px-8 flex justify-between items-center mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green" /><span className="text-[10px] font-bold text-text-secondary uppercase">Libre</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red shadow-[0_0_8px_red]" /><span className="text-[10px] font-bold text-text-secondary uppercase">Occupée</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green animate-pulse shadow-[0_0_8px_green]" /><span className="text-[10px] font-bold text-text-secondary uppercase">Prêt à servir</span></div>
          </div>
          <div className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest">{floorTables.length} Tables</div>
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
                      <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Numéro</label>
                      <input
                        type="number"
                        value={editingTable.number}
                        onChange={event => updateEditingTable({ number: Number(event.target.value) || editingTable.number })}
                        className="w-full h-[52px] bg-white/5 rounded-2xl px-4 text-white font-black text-sm border border-white/5 outline-none"
                      />
                    </div>
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
                      <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Étage</label>
                      <select
                        value={editingTable.floor}
                        onChange={event => {
                          updateTableFloor(editingTable.id, event.target.value, editingTable.zone);
                          setEditingTable({ ...editingTable, floor: event.target.value });
                        }}
                        className="w-full h-[52px] bg-white/5 rounded-2xl px-4 text-white font-black text-xs border border-white/5 outline-none"
                      >
                        {['RDC', 'ETAGE', 'TERRASSE'].map(floor => <option key={floor} value={floor}>{floor === 'ETAGE' ? '1er Étage' : floor}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Zone</label>
                      <input
                        value={editingTable.zone}
                        list="table-zones"
                        onChange={event => {
                          updateTableFloor(editingTable.id, editingTable.floor, event.target.value);
                          setEditingTable({ ...editingTable, zone: event.target.value });
                        }}
                        className="w-full h-[52px] bg-white/5 rounded-2xl px-4 text-white font-black text-xs border border-white/5 outline-none"
                      />
                      <datalist id="table-zones">
                        {allZones.map(zone => <option key={zone} value={zone} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Statut</label>
                      <select
                        value={editingTable.status}
                        onChange={event => updateEditingTable({ status: event.target.value as TableStatus })}
                        className="w-full h-[52px] bg-white/5 rounded-2xl px-4 text-white font-black text-xs border border-white/5 outline-none"
                      >
                        <option value="libre">Libre</option>
                        <option value="reservee">Réservée</option>
                        <option value="occupee">Occupée</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals for Reservations/Options */}
        <AnimatePresence>
          {tableToDeleteId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setTableToDeleteId(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div className="w-14 h-14 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={26} />
                </div>
                <h3 className="text-white font-black text-xl text-center mb-2">
                  Supprimer la table {tables.find(t => t.id === tableToDeleteId)?.number}
                </h3>
                <p className="text-text-secondary text-sm text-center mb-6">
                  Cette action retire la table du plan. Les réservations liées seront annulées pour éviter un plan incohérent.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTableToDeleteId(null)} className="py-4 rounded-2xl bg-white/5 text-white font-black text-sm">
                    Annuler
                  </button>
                  <button onClick={confirmDeleteTable} className="py-4 rounded-2xl bg-red text-white font-black text-sm">
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

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
                <h3 className="text-white font-black text-xl mb-1">Réservations du jour</h3>
                <p className="text-text-tertiary text-xs mb-5">{todayRes.length} réservation{todayRes.length > 1 ? 's' : ''} • {todayRes.filter(r => r.status === 'pending').length} en attente</p>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {todayRes.length === 0 ? (
                    <div className="py-16 text-center text-text-tertiary italic">Aucune réservation pour le moment</div>
                  ) : (
                    todayRes.map((res: Reservation) => {
                      const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
                        pending: { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                        confirmed: { label: 'Confirmée', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
                        waitlist: { label: 'Liste d\'attente', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                        cancelled: { label: 'Annulée', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
                        noshow: { label: 'No-show', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
                      };
                      const sc = statusCfg[res.status] || statusCfg.pending;
                      const occasionLabels: Record<string, string> = { anniversaire: '🎂 Anniversaire', affaires: '💼 Affaires', romantique: '❤️ Romantique', famille: '👨‍👩‍👧‍👦 Famille' };
                      return (
                        <div key={res.id} className={`glass-card p-4 border ${res.status === 'cancelled' ? 'border-red/10 opacity-50' : 'border-white/5'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-black text-sm">{res.clientName}</h4>
                              <p className="text-text-tertiary text-[10px] font-mono mt-0.5">{res.clientPhone}</p>
                            </div>
                            <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ color: sc.color, background: sc.bg }}>
                              {sc.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[10px] font-bold text-text-secondary bg-white/5 px-2 py-0.5 rounded-md">🕐 {res.time}</span>
                            <span className="text-[10px] font-bold text-text-secondary bg-white/5 px-2 py-0.5 rounded-md">👥 {res.guests} pers.</span>
                            {res.occasion && <span className="text-[10px] font-bold text-text-secondary bg-white/5 px-2 py-0.5 rounded-md">{occasionLabels[res.occasion] || res.occasion}</span>}
                            {res.tableId && <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-md">Table {tables.find(t => t.id === res.tableId)?.number}</span>}
                          </div>
                          {res.notes && <p className="text-text-tertiary text-[10px] italic mb-2">📝 {res.notes}</p>}
                          {res.cancelReason && <p className="text-red/60 text-[10px] italic mb-2">Motif : {res.cancelReason}</p>}

                          {/* Actions */}
                          {res.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => { updateStatus(res.id, 'confirmed'); }}
                                className="flex-1 py-2.5 rounded-xl bg-green/10 text-green font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-green/20">
                                ✓ Confirmer
                              </button>
                              <button onClick={() => { setAssigningRes(res); setShowResList(false); }}
                                className="flex-1 py-2.5 rounded-xl bg-blue/10 text-blue font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-blue/20">
                                📍 Attribuer table
                              </button>
                              <button onClick={() => { updateStatus(res.id, 'cancelled'); }}
                                className="py-2.5 px-3 rounded-xl bg-red/10 text-red font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-red/20">
                                ✕
                              </button>
                            </div>
                          )}
                          {res.status === 'waitlist' && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => { updateStatus(res.id, 'confirmed'); }}
                                className="flex-1 py-2.5 rounded-xl bg-green/10 text-green font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-green/20">
                                ✓ Confirmer (table libre)
                              </button>
                              <button onClick={() => { updateStatus(res.id, 'cancelled'); }}
                                className="py-2.5 px-3 rounded-xl bg-red/10 text-red text-[10px] font-black active:scale-95 transition-transform border border-red/20">
                                ✕
                              </button>
                            </div>
                          )}
                          {res.status === 'confirmed' && !res.tableId && (
                            <button onClick={() => { setAssigningRes(res); setShowResList(false); }}
                              className="w-full py-2.5 mt-3 rounded-xl bg-blue/10 text-blue font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-blue/20">
                              📍 Attribuer une table
                            </button>
                          )}
                          {res.status === 'confirmed' && (
                            <button onClick={() => { updateStatus(res.id, 'noshow'); }}
                              className="w-full py-2 mt-2 rounded-xl bg-white/5 text-text-tertiary font-bold text-[9px] uppercase tracking-widest active:scale-95 transition-transform">
                              Marquer No-show
                            </button>
                          )}
                        </div>
                      );
                    })
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
  const activeOrderForTable = orders.find(o => o.tableId === selectedTableId && ['en_preparation', 'prete', 'servie', 'non_payee', 'partiellement_payee'].includes(o.status));

  return (
    <div className="page-content pt-8 pb-32">
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedTableId(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10"><X size={24} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-white font-black text-2xl tracking-tight">Table {currentTable?.number}</h1>
              <button onClick={() => setShowQR(currentTable!.id)} className="w-8 h-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center active:scale-95 transition-transform"><QrCode size={16} /></button>
              <button onClick={() => {
                if(confirm("Libérer cette table ? Les commandes en cours ne seront pas effacées.")) {
                  updateTableStatus(currentTable!.id, 'libre');
                  setSelectedTableId(null);
                }
              }} className="px-2 py-1 rounded-lg bg-red/10 text-red text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform">Libérer</button>
            </div>
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
          {posList.filter(pos => pos.is_active).map(pos => (
            <button
              key={pos.id}
              onClick={() => setActivePOS(pos.id)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activePOSId === pos.id ? 'bg-blue text-white shadow-lg shadow-blue/20' : 'bg-white/5 text-text-secondary border border-white/5'}`}
            >
              {pos.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['tous', 'plats', 'boissons', 'desserts'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'bg-white/5 text-text-secondary border border-white/5'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4">
        {filteredProducts.map(product => {
          const cartItem = cart.find(c => c.product.id === product.id);
          const qty = cartItem?.quantity || 0;
          return (
            <motion.div key={product.id} whileTap={{ scale: 0.96 }} className="glass-card overflow-hidden flex flex-col group active:border-orange/30 relative">
              {qty > 0 && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-orange rounded-full px-1 py-0.5 shadow-lg shadow-orange/30">
                  <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, qty - 1); }} className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center active:scale-90"><Minus size={12} /></button>
                  <span className="text-white font-black text-xs min-w-[20px] text-center">{qty}</span>
                  <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center active:scale-90"><Plus size={12} /></button>
                </div>
              )}
              <div onClick={() => addToCart(product)} className="h-32 bg-white/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                {product.image.startsWith('/') ? <img src={product.image} className="w-full h-full object-cover" /> : product.image}
              </div>
              <div className="p-4 flex-1 flex flex-col" onClick={() => addToCart(product)}>
                <h3 className="text-white font-black text-sm mb-1 leading-tight">{product.name}</h3>
                <p className="text-orange font-black text-sm mt-auto">{product.price.toLocaleString()} F</p>
              </div>
            </motion.div>
          );
        })}
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

              {/* VIP Info Banner */}
              {(() => {
                const tableRes = reservations.find(r => r.tableId === selectedTableId && r.status === 'confirmed');
                if (!tableRes) return null;
                const vipC = clients.find(c => c.name.toLowerCase() === tableRes.clientName.toLowerCase() && (c.tier === 'gold' || c.tier === 'platinum'));
                if (!vipC) return null;
                return (
                  <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">👑</span>
                      <span className="text-amber-400 font-black text-sm uppercase tracking-wider">Client VIP — {vipC.tier}</span>
                    </div>
                    <div className="text-white text-xs font-bold">{vipC.name}</div>
                    <div className="text-text-tertiary text-[10px] mt-1">{vipC.visits} visites • {vipC.points.toLocaleString()} pts • {vipC.totalSpent.toLocaleString()} F dépensés</div>
                    {vipC.preferences && <div className="text-amber-300/80 text-[10px] mt-2 italic">💡 {vipC.preferences}</div>}
                  </div>
                );
              })()}

              {/* Loyalty client banner */}
              {activeOrderForTable?.loyaltyClientId && (() => {
                const lc = clients.find(c => c.id === activeOrderForTable.loyaltyClientId);
                if (!lc) return null;
                return (
                  <div className="mb-4 p-4 rounded-2xl bg-violet/10 border border-violet/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center text-violet font-black text-sm">
                      {lc.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-xs font-bold">{lc.name}</div>
                      <div className="text-text-tertiary text-[10px]">{lc.points.toLocaleString()} pts • {lc.tier} • {lc.visits} visites</div>
                    </div>
                    <Gift size={16} className="text-violet" />
                  </div>
                );
              })()}

              {/* Loyalty association */}
              <button onClick={() => { setShowLoyaltySearch(true); setLoyaltySearch(''); }}
                className="w-full py-3 rounded-2xl bg-violet/10 border border-violet/20 text-violet font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-6 active:scale-95 transition-transform">
                <Gift size={16} /> {activeOrderForTable?.loyaltyClientId ? 'Changer le compte fidélité' : 'Associer un compte fidélité'}
              </button>

              <div className="space-y-5 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Existing Order Items */}
                {activeOrderForTable && (
                  <div className="mb-6">
                    <h4 className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-3">Déjà commandé</h4>
                    <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                      {activeOrderForTable.items.map(item => {
                        const isReady = activeOrderForTable.status === 'prete' || 
                                        activeOrderForTable.status === 'servie' || 
                                        activeOrderForTable.itemsReady?.[item.product.id];
                        return (
                          <div key={item.product.id} className="flex justify-between items-center opacity-80">
                            <span className="text-white text-sm">{item.quantity}x {item.product.name}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isReady ? 'bg-green/20 text-green' : 'bg-blue/20 text-blue'}`}>
                              {isReady ? 'Prêt' : 'En cuisine'}
                            </span>
                          </div>
                        );
                      })}
                      <div className="pt-3 mt-3 border-t border-white/10 flex justify-between">
                        <span className="text-text-secondary text-xs">Total actuel</span>
                        <span className="text-white font-bold">{activeOrderForTable.total.toLocaleString()} F</span>
                      </div>
                    </div>
                    {cart.length > 0 && <h4 className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-6 mb-3">Nouveaux articles</h4>}
                  </div>
                )}
                
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
              
              {activeOrderForTable?.status === 'prete' && cart.length === 0 && (
                <button onClick={() => { updateOrderStatus(activeOrderForTable.id, 'servie'); setShowCart(false); }} className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-green to-emerald-500 text-white font-black text-lg shadow-xl shadow-green/20 flex items-center justify-center gap-4 active:scale-95 transition-transform mb-4">
                  <CheckCircle2 size={24} /> Marquer comme Servie
                </button>
              )}
              
              {cart.length === 0 && activeOrderForTable ? (
                <button onClick={() => { setShowCart(false); navigate('/caisse'); }} className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-blue to-cyan-500 text-white font-black text-lg shadow-xl shadow-blue/20 flex items-center justify-center gap-4 active:scale-95 transition-transform">
                  <Wallet size={24} /> Aller à l'encaissement
                </button>
              ) : (
                <button onClick={handleSendToKitchen} disabled={sending} className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-orange to-amber-600 text-white font-black text-lg shadow-xl shadow-orange/20 flex items-center justify-center gap-4 active:scale-95 transition-transform disabled:opacity-50">
                  {sending ? 'Envoi en cours...' : <><ChefHat size={24} /> Envoyer en cuisine</>}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[200]" onClick={() => setShowQR(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-3xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-200 rounded-full mb-4 opacity-50" />
              <h3 className="text-[#0a0c10] font-black text-xl mb-6 text-center">Table {tables.find(t => t.id === showQR)?.number}<br/><span className="text-sm font-bold text-gray-500">Commande Autonome</span></h3>
              <div className="p-4 bg-gray-50 rounded-2xl shadow-inner border border-gray-100">
                <QRCodeSVG value={`${window.location.origin}/client-order?table=${showQR}`} size={200} />
              </div>
              <p className="text-[#0a0c10]/60 text-xs mt-6 max-w-[200px] text-center font-bold">Le client peut scanner ce code pour rejoindre la commande.</p>
              <button onClick={() => setShowQR(null)} className="mt-6 w-full py-3 bg-[#0a0c10] text-white rounded-xl font-black text-xs uppercase tracking-widest">Fermer</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loyalty Search Modal */}
      <AnimatePresence>
        {showLoyaltySearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[200]" onClick={() => setShowLoyaltySearch(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-2 text-center">Associer un compte fidélité</h3>
              <p className="text-text-tertiary text-xs text-center mb-6">Recherchez par nom ou téléphone</p>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                <input type="text" value={loyaltySearch} onChange={e => setLoyaltySearch(e.target.value)} placeholder="Nom ou téléphone..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet/50" />
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {clients.filter(c => c.name.toLowerCase().includes(loyaltySearch.toLowerCase()) || c.phone.includes(loyaltySearch)).map(c => (
                  <button key={c.id} onClick={() => {
                    // We'll set loyalty on the next order for this table
                    const tableOrder = orders.find(o => o.tableId === selectedTableId && ['en_preparation', 'prete', 'servie', 'non_payee', 'partiellement_payee'].includes(o.status));
                    if (tableOrder) setLoyaltyClient(tableOrder.id, c.id);
                    setShowLoyaltySearch(false);
                  }}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 active:scale-95 transition-all hover:border-violet/30">
                    <div className="w-10 h-10 rounded-full bg-violet/20 flex items-center justify-center text-violet font-black text-sm">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-white font-bold text-sm">{c.name}</span>
                      <p className="text-text-tertiary text-[10px]">{c.phone} • {c.points} pts</p>
                    </div>
                    <Gift size={16} className="text-violet" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
