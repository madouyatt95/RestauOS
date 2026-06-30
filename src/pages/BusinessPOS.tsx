import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BedDouble, CreditCard, Package, ReceiptText, Store, Warehouse } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore, type POSProduct } from '../stores/hospiStore';
import { useOrderStore, type Product } from '../stores/orderStore';
import { canAccessPOS } from '../utils/accessControl';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const typeLabels: Record<string, string> = {
  bar: 'Bar & casino',
  nightclub: 'Night club',
  casino: 'Casino',
  room_service: 'Room service',
  spa: 'Spa',
  boutique: 'Boutique',
  other: 'Point de vente',
};

const toOrderProduct = (row: POSProduct): Product => ({
  id: row.product.id,
  name: row.product.name,
  price: row.price.sale_price,
  category: row.product.category_id.includes('boisson') || row.product.category_id.includes('bar') || row.product.category_id.includes('minibar') ? 'boissons' : 'plats',
  image: row.product.category_id === 'spa' ? 'SPA' : row.product.category_id === 'boutique' ? 'BTQ' : 'POS',
  stock: row.stock?.quantity || 0,
  cost: row.product.average_purchase_price || 0,
});

export default function BusinessPOS() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activePOSId,
    posList,
    warehouses,
    getProductsForPOS,
    recordSale,
    getOccupiedRoomsWithOpenFolios,
    chargeOrderToRoom,
  } = useHospiStore();
  const [notice, setNotice] = useState('');

  const activePOS = posList.find(pos => pos.id === activePOSId);
  const warehouse = warehouses.find(item => item.id === activePOS?.default_warehouse_id);
  const products = useMemo(() => activePOS ? getProductsForPOS(activePOS.id) : [], [activePOS, getProductsForPOS]);
  const rooms = getOccupiedRoomsWithOpenFolios().filter(row => row.room.site_id === activePOS?.site_id);

  const recordOrder = (row: POSProduct, payment: 'carte' | 'especes' | 'wave' | 'room_charge', roomId?: string, roomNumber?: string) => {
    if (!activePOS) return;
    const orderId = `metier-${Date.now()}`;
    const orderProduct = toOrderProduct(row);
    const order = {
      id: orderId,
      items: [{ product: orderProduct, quantity: 1 }],
      total: row.price.sale_price,
      type: 'sur_place',
      payment,
      date: new Date().toISOString(),
      status: payment === 'room_charge' ? 'servie' : 'payee',
      paidAmount: payment === 'room_charge' ? 0 : row.price.sale_price,
      payments: [{ id: `pay-${orderId}`, amount: row.price.sale_price, method: payment, date: new Date().toISOString() }],
      itemsReady: {},
      posId: activePOS.id,
      roomId,
      roomNumber,
      hospiLines: [{ productId: row.product.id, quantity: 1 }],
      serveurName: user?.name || activePOS.name,
    };

    useOrderStore.setState(state => ({ orders: [order as any, ...state.orders] }));
    recordSale(orderId, [{ productId: row.product.id, quantity: 1 }], user?.name || activePOS.name, activePOS.id);
    return orderId;
  };

  const sellNow = (row: POSProduct) => {
    recordOrder(row, 'carte');
    setNotice(`${row.product.name} vendu sur ${activePOS?.name}. Stock déduit du dépôt ${warehouse?.name || 'lié'}.`);
  };

  const chargeRoom = (row: POSProduct) => {
    const target = rooms[0];
    if (!target) {
      setNotice('Aucune chambre occupée avec folio ouvert pour imputation.');
      return;
    }
    const orderId = recordOrder(row, 'room_charge', target.room.id, target.room.room_number);
    if (orderId) {
      chargeOrderToRoom(target.room.id, orderId, `${row.product.name} · ${activePOS?.name}`, row.price.sale_price);
      setNotice(`${row.product.name} imputé à la chambre ${target.room.room_number}. Stock, POS et folio sont reliés.`);
    }
  };

  if (!activePOS || !canAccessPOS(user, activePOS)) {
    return (
      <div className="page-content pt-14 pb-28">
        <button onClick={() => navigate('/modules')} className="h-11 px-4 rounded-2xl bg-white/5 text-white text-sm font-bold mb-6">
          Retour aux métiers
        </button>
        <div className="glass-card-lg p-6 text-center">
          <Store size={28} className="mx-auto text-text-tertiary mb-3" />
          <h1 className="text-white font-black text-xl">Point de vente non sélectionné</h1>
          <p className="text-text-secondary text-sm mt-2">Choisis un métier depuis la page Activités.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/modules')} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
          <ArrowLeft size={18} />
        </button>
        <button onClick={() => navigate('/stocks')} className="h-10 px-3 rounded-2xl bg-white/5 border border-white/10 text-text-secondary text-xs font-black flex items-center gap-2">
          <Warehouse size={15} /> Dépôt
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card-lg p-5 mb-4">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">{typeLabels[activePOS.type] || 'Point de vente'}</p>
        <h1 className="text-white font-black text-2xl mt-1">{activePOS.name}</h1>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-2xl bg-white/5 p-3">
            <Package size={16} className="text-orange mb-2" />
            <p className="text-text-tertiary text-[9px] font-black uppercase">Catalogue</p>
            <p className="text-white font-black text-sm">{products.length} offres</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <Warehouse size={16} className="text-blue mb-2" />
            <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôt</p>
            <p className="text-white font-black text-sm truncate">{warehouse?.name || 'Non lié'}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <CreditCard size={16} className="text-green mb-2" />
            <p className="text-text-tertiary text-[9px] font-black uppercase">Paiements</p>
            <p className="text-white font-black text-sm">{activePOS.payment_methods.length}</p>
          </div>
        </div>
      </motion.div>

      {notice && (
        <button onClick={() => setNotice('')} className="w-full rounded-2xl bg-green/10 border border-green/20 text-green text-xs font-bold px-4 py-3 text-left mb-4">
          {notice}
        </button>
      )}

      <div className="space-y-3">
        {products.map(row => (
          <motion.div key={row.price.id} layout className="glass-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-black text-sm">{row.product.name}</p>
                <p className="text-text-tertiary text-xs mt-1">{row.product.sku} · stock {row.stock?.quantity ?? 0} {row.stock?.unit || row.product.unit}</p>
              </div>
              <p className="text-orange font-black text-sm whitespace-nowrap">{fmt(row.price.sale_price)} F</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => sellNow(row)} className="h-11 rounded-xl bg-orange text-white text-xs font-black flex items-center justify-center gap-2">
                <ReceiptText size={15} /> Vendre
              </button>
              <button onClick={() => chargeRoom(row)} className="h-11 rounded-xl bg-blue/10 text-blue text-xs font-black flex items-center justify-center gap-2">
                <BedDouble size={15} /> Chambre
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="glass-card-lg p-8 text-center">
          <Package size={28} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-white font-bold">Aucun produit disponible</p>
          <p className="text-text-secondary text-sm mt-1">Ajoute les prix POS depuis Admin Hospi.</p>
        </div>
      )}
    </div>
  );
}
