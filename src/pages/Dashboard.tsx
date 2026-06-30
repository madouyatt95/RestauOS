import { motion } from 'framer-motion';
import { useOrderStore, type Order } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore } from '../stores/hospiStore';
import { ShoppingBag, Users, Receipt, ArrowDown, Bell, ChevronRight, ShieldAlert, Store, BedDouble, Dice5, Sparkles, Package } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { canAccessModule, getAccessSummary, getVisiblePOS, getVisibleSites } from '../utils/accessControl';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const PAID_STATUSES: Order['status'][] = ['payee', 'terminee', 'servie'];

const getDayKey = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

const getScopedOrders = (orders: Order[], visiblePOSIds: Set<string>, canSeeLegacyRestaurant: boolean, isRootScope: boolean) => (
  orders.filter(order => {
    if (isRootScope) return true;
    if (order.posId) return visiblePOSIds.has(order.posId);
    return canSeeLegacyRestaurant;
  })
);

export default function Dashboard() {
  const { orders: allOrders } = useOrderStore();
  const { user } = useAuthStore();
  const { sites, posList, rooms, folios, warehouses, setActivePOS } = useHospiStore();
  const navigate = useNavigate();

  const visibleSites = getVisibleSites(user, sites);
  const visibleSiteIds = visibleSites.map(site => site.id);
  const visiblePOS = getVisiblePOS(user, posList);
  const visiblePOSIds = new Set(visiblePOS.map(pos => pos.id));
  const isRootScope = user?.accessLevel === 'direction' || user?.role === 'Admin';
  const canSeeLegacyRestaurant = canAccessModule(user, 'restaurant') && visiblePOS.some(pos => pos.type === 'restaurant');
  const scopedOrders = getScopedOrders(allOrders, visiblePOSIds, canSeeLegacyRestaurant, isRootScope);
  const todayOrders = scopedOrders.filter(order => order.date.startsWith(getDayKey(0)) && PAID_STATUSES.includes(order.status));
  const yesterdayOrders = scopedOrders.filter(order => order.date.startsWith(getDayKey(1)) && PAID_STATUSES.includes(order.status));
  const ca = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const caYesterday = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);
  const caChange = caYesterday > 0 ? ((ca - caYesterday) / caYesterday * 100).toFixed(1) : '0';
  const orders = todayOrders.length;
  const knownClients = new Set(todayOrders.flatMap(order => [order.clientId, order.loyaltyClientId, order.roomId].filter(Boolean) as string[]));
  const clients = knownClients.size || Math.floor(orders * 0.75);
  const avgTicket = orders > 0 ? Math.round(ca / orders) : 0;
  const caByDay = Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dayStr = date.toISOString().split('T')[0];
    const dayCA = scopedOrders
      .filter(order => order.date.startsWith(dayStr) && PAID_STATUSES.includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    return { day: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''), ca: dayCA };
  });
  const topProducts = Object.values(scopedOrders
    .filter(order => PAID_STATUSES.includes(order.status))
    .reduce<Record<string, { name: string; image: string; sales: number; revenue: number }>>((acc, order) => {
      order.items.forEach(item => {
        if (!acc[item.product.id]) {
          acc[item.product.id] = { name: item.product.name, image: item.product.image, sales: 0, revenue: 0 };
        }
        acc[item.product.id].sales += item.quantity;
        acc[item.product.id].revenue += item.product.price * item.quantity;
      });
      return acc;
    }, {})).sort((a, b) => b.revenue - a.revenue);
  const visibleRooms = rooms.filter(room => visibleSiteIds.includes(room.site_id));
  const visibleRoomIds = visibleRooms.map(room => room.id);
  const occupiedRooms = visibleRooms.filter(room => room.status === 'occupied').length;
  const openFolios = folios.filter(folio => folio.status === 'open' && visibleRoomIds.includes(folio.room_id)).length;
  const visibleWarehouses = warehouses.filter(warehouse => visibleSiteIds.includes(warehouse.site_id));
  const restaurantPOS = visiblePOS.find(pos => pos.type === 'restaurant');
  const casinoPOS = visiblePOS.find(pos => pos.type === 'bar' || pos.type === 'casino');

  const openBusinessModule = (module: 'restaurant' | 'hotel' | 'casino' | 'spa' | 'boutique') => {
    if (!canAccessModule(user, module)) {
      navigate('/modules');
      return;
    }
    if (module === 'hotel') {
      navigate('/pms');
      return;
    }
    const posByModule = {
      restaurant: restaurantPOS,
      casino: casinoPOS,
      spa: visiblePOS.find(pos => pos.type === 'spa'),
      boutique: visiblePOS.find(pos => pos.type === 'boutique'),
    }[module];
    if (posByModule) {
      setActivePOS(posByModule.id);
      navigate(posByModule.type === 'restaurant' ? '/commandes' : '/pos-metier');
      return;
    }
    navigate('/modules');
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-content pt-14 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-black text-white">Bonjour, {user?.name.split(' ')[0] || 'Cheikh'} ! 👋</h1>
          <p className="text-text-secondary text-xs mt-1">{user?.demoTitle || user?.role || 'Gérant'}</p>
        </div>
        <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center relative" onClick={() => navigate('/plus')}>
          <Bell size={18} className="text-text-secondary" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red rounded-full border-2 border-bg-primary" />
        </button>
      </motion.div>

      {/* Date + Filter */}
      <div className="flex gap-2 mb-6">
        <div className="glass-card px-3 py-2 text-xs text-text-secondary flex items-center gap-1.5">
          📅 <span className="capitalize">{dateStr}</span>
        </div>
        <div className="glass-card px-3 py-2 text-xs text-text-secondary flex items-center gap-1.5">
          📍 {getAccessSummary(user, sites, posList)}
        </div>
      </div>

      {/* Business Overview */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Vue rapide</p>
            <h2 className="text-white font-black text-lg">Activité par métier</h2>
          </div>
          <button onClick={() => navigate('/modules')} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary flex items-center justify-center gap-2">
            <Store size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Gérer</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'restaurant', label: 'Restaurant', sub: `${restaurantPOS?.name || 'RestauOS'} · salle, tables, caisse`, icon: Store, color: '#FF8A00', value: `${orders} commandes` },
            { key: 'hotel', label: 'Hôtel', sub: `PMS · chambres, folios, réception`, icon: BedDouble, color: '#06B6D4', value: `${occupiedRooms}/${visibleRooms.length} occupées · ${openFolios} folios` },
            { key: 'casino', label: 'Casino & Bars', sub: `${casinoPOS?.name || 'POS bar'} · tarifs dédiés`, icon: Dice5, color: '#8B5CF6', value: casinoPOS ? 'POS actif' : 'À configurer' },
            { key: 'spa', label: 'Spa', sub: 'Prestations, planning, forfaits', icon: Sparkles, color: '#22C55E', value: 'Module métier' },
            { key: 'boutique', label: 'Boutique', sub: 'Ventes comptoir, stock, reçus', icon: Package, color: '#EC4899', value: `${visibleWarehouses.length} dépôts` },
          ].filter(item => canAccessModule(user, item.key as 'restaurant' | 'hotel' | 'casino' | 'spa' | 'boutique')).map(item => (
            <button
              key={`${item.key}-${item.label}`}
              onClick={() => openBusinessModule(item.key as 'restaurant' | 'hotel' | 'casino' | 'spa' | 'boutique')}
              className="glass-card p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <ChevronRight size={16} className="text-text-tertiary" />
              </div>
              <p className="text-white font-black text-sm">{item.label}</p>
              <p className="text-text-secondary text-[11px] leading-snug mt-1 min-h-[32px]">{item.sub}</p>
              <p className="text-[10px] font-black uppercase tracking-wider mt-3" style={{ color: item.color }}>{item.value}</p>
            </button>
          ))}
        </div>
      </motion.section>

      {/* CA Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-lg p-5 mb-4"
      >
        <p className="text-text-secondary text-xs font-semibold mb-1">Chiffre d'affaires</p>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{fmt(ca)} <span className="text-sm font-bold text-text-secondary">FCFA</span></h2>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-bold ${Number(caChange) >= 0 ? 'text-green' : 'text-red'}`}>
                {Number(caChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(caChange))}%
              </span>
              <span className="text-text-tertiary text-[10px]">vs hier</span>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={caByDay.slice(-7)}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="ca" stroke="#22C55E" strokeWidth={2} fill="url(#caGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Commandes', value: fmt(orders), change: '+8%', color: 'orange', icon: ShoppingBag },
          { label: 'Clients', value: fmt(clients), change: '+5%', color: 'violet', icon: Users },
          { label: 'Ticket moyen', value: `${fmt(avgTicket)}`, change: '+3%', color: 'blue', icon: Receipt },
          { label: 'Dépenses', value: `${fmt(Math.round(ca * 0.3))}`, change: '-2%', color: 'red', icon: ArrowDown },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${kpi.color}-light`}
                style={{ background: `var(--color-${kpi.color}-light)` }}>
                <kpi.icon size={16} style={{ color: `var(--color-${kpi.color})` }} />
              </div>
              <span className="text-text-tertiary text-[10px] font-semibold">{kpi.label}</span>
            </div>
            <div className="text-white font-black text-lg">{kpi.value}</div>
            <span className={`text-[10px] font-bold`} style={{ color: `var(--color-${kpi.color})` }}>{kpi.change}</span>
          </motion.div>
        ))}
      </div>

      {/* Security Alerts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-4 mb-6 border-red/30 bg-red/5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red/20 flex items-center justify-center shrink-0 text-red">
          <ShieldAlert size={16} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm mb-1 flex justify-between">
            Alerte Anti-Fraude
            <span className="text-xs text-text-tertiary">Il y a 10 min</span>
          </h3>
          <p className="text-text-secondary text-xs">Le ticket <strong>#ord-1102</strong> a été annulé en caisse après son impression physique. Veuillez vérifier avec Ibrahima Ba.</p>
        </div>
      </motion.div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card-lg p-5"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-sm">Top produits</h3>
          <button className="text-orange text-xs font-semibold flex items-center gap-0.5" onClick={() => navigate('/rapports')}>
            Voir tout <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {topProducts.slice(0, 3).map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              {p.image.startsWith('/') ? (
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
              ) : (
                <span className="text-2xl w-10 text-center shrink-0">{p.image}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{p.name}</div>
                <div className="text-text-tertiary text-[10px]">{p.sales} ventes</div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <div className="text-white font-bold text-sm">{fmt(p.revenue)} FCFA</div>
                  <div className="text-green text-[10px] font-bold mt-0.5">Marge : 62%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
