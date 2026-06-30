import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOrderStore, type Order } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { useReviewStore } from '../stores/reviewStore';
import { useWasteStore } from '../stores/wasteStore';
import { useHospiStore } from '../stores/hospiStore';
import { canAccessModule, getVisiblePOS, getVisibleSites } from '../utils/accessControl';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Award, Download, Star, Users, Trash2, Clock, Flame, Sun, Moon, Building2, BedDouble, Warehouse, Store, ReceiptText, LockKeyhole, UnlockKeyhole } from 'lucide-react';
import { buildCashSessionTicket, summarizeCashSession } from '../services/cashSession';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const DONUT_COLORS = ['#FF8A00', '#8B5CF6', '#3B82F6'];
const HEAT_COLORS = ['#1a1a2e', '#2d1f4e', '#4c1d95', '#7c3aed', '#a78bfa', '#FF8A00', '#ef4444'];
const PAID_STATUSES: Order['status'][] = ['payee', 'terminee', 'servie'];
const HEAT_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
type HeatDay = typeof HEAT_DAYS[number];
type HeatRow = { hour: string } & Record<HeatDay, number>;

export default function Rapports() {
  const { orders: allOrders } = useOrderStore();
  const { user } = useAuthStore();
  const { sites, posList, warehouses, products, stockLevels, stockMovements, folios, folioLines, rooms, guests, stays, cashSessions, getRegisterForPOS } = useHospiStore();
  const { reviews, getAverage } = useReviewStore();
  const { getWeekTotal } = useWasteStore();
  const [activeTab, setActiveTab] = useState<'ca' | 'hospi' | 'caisse' | 'analytics' | 'avis'>('ca');

  const visibleSites = getVisibleSites(user, sites);
  const visibleSiteIds = new Set(visibleSites.map(site => site.id));
  const visiblePOS = getVisiblePOS(user, posList);
  const visiblePOSIds = new Set(visiblePOS.map(pos => pos.id));
  const isRootScope = user?.accessLevel === 'direction' || user?.role === 'Admin';
  const canSeeLegacyRestaurant = canAccessModule(user, 'restaurant') && visiblePOS.some(pos => pos.type === 'restaurant');
  const scopedOrders = allOrders.filter(order => {
    if (isRootScope) return true;
    if (order.posId) return visiblePOSIds.has(order.posId);
    return canSeeLegacyRestaurant;
  });
  const caByDay = Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dayStr = date.toISOString().split('T')[0];
    const ca = scopedOrders
      .filter(order => order.date.startsWith(dayStr) && PAID_STATUSES.includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    return { day: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''), ca };
  });
  const weekCA = caByDay.reduce((s, d) => s + d.ca, 0);
  const paidScopedOrders = scopedOrders.filter(order => PAID_STATUSES.includes(order.status));
  const distTotal = paidScopedOrders.length || 1;
  const dist = {
    sur_place: Math.round(paidScopedOrders.filter(order => order.type === 'sur_place').length / distTotal * 100),
    emporter: Math.round(paidScopedOrders.filter(order => order.type === 'emporter').length / distTotal * 100),
    livraison: Math.round(paidScopedOrders.filter(order => order.type === 'livraison').length / distTotal * 100),
  };
  const topProducts = Object.values(paidScopedOrders.reduce<Record<string, { name: string; image: string; sales: number; revenue: number }>>((acc, order) => {
    order.items.forEach(item => {
      if (!acc[item.product.id]) {
        acc[item.product.id] = { name: item.product.name, image: item.product.image, sales: 0, revenue: 0 };
      }
      acc[item.product.id].sales += item.quantity;
      acc[item.product.id].revenue += item.product.price * item.quantity;
    });
    return acc;
  }, {})).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const totalOrders = paidScopedOrders.filter(order => new Date(order.date) >= weekStart).length;
  const avgRating = getAverage();
  const weekWaste = getWeekTotal();

  const heatmapData: HeatRow[] = (() => {
    const hours = [11, 12, 13, 14, 15, 18, 19, 20, 21, 22];
    return hours.map(hour => {
      const row = Object.fromEntries(HEAT_DAYS.map(day => [day, 0])) as Record<HeatDay, number>;
      scopedOrders.forEach(order => {
        const orderDate = new Date(order.date);
        const dayIndex = (orderDate.getDay() + 6) % 7;
        if (orderDate.getHours() === hour) row[HEAT_DAYS[dayIndex]] += 1;
      });
      return { hour: `${hour}h`, ...row };
    });
  })();

  // Midi vs Soir
  const midiCA = Math.round(weekCA * 0.42);
  const soirCA = Math.round(weekCA * 0.58);
  const panierMoyen = totalOrders > 0 ? Math.round(weekCA / totalOrders) : 0;

  const donutData = [
    { name: 'Sur place', value: dist.sur_place },
    { name: 'À emporter', value: dist.emporter },
    { name: 'Livraison', value: dist.livraison },
  ];

  const hospiPaidOrders = paidScopedOrders;
  const revenueByPOS = visiblePOS.map(pos => {
    const posOrders = hospiPaidOrders.filter(order => order.posId === pos.id);
    const revenue = posOrders.reduce((sum, order) => sum + order.total, 0);
    const roomCharge = posOrders
      .flatMap(order => order.payments)
      .filter(payment => payment.method === 'room_charge')
      .reduce((sum, payment) => sum + payment.amount, 0);
    return { pos, revenue, count: posOrders.length, roomCharge };
  });
  const unassignedRevenue = hospiPaidOrders
    .filter(order => !order.posId)
    .reduce((sum, order) => sum + order.total, 0);
  const totalRoomCharge = folioLines.reduce((sum, line) => sum + line.amount, 0);
  const openFolioTotal = folios.filter(folio => folio.status === 'open').reduce((sum, folio) => sum + folio.total_amount, 0);
  const visibleWarehouses = warehouses.filter(warehouse => isRootScope || visibleSiteIds.has(warehouse.site_id));
  const lowHospiStocks = stockLevels.filter(level => {
    const warehouse = warehouses.find(item => item.id === level.warehouse_id);
    return level.quantity <= level.alert_threshold && (!!warehouse && (isRootScope || visibleSiteIds.has(warehouse.site_id)));
  });
  const cashReports = cashSessions.filter(session => visiblePOSIds.has(session.pos_id) || isRootScope).map(session => {
    const pos = posList.find(item => item.id === session.pos_id);
    const register = getRegisterForPOS(session.pos_id);
    const summary = summarizeCashSession(session, scopedOrders);
    return { session, pos, register, summary };
  }).sort((a, b) => new Date(b.session.closed_at || b.session.opened_at).getTime() - new Date(a.session.closed_at || a.session.opened_at).getTime());
  const openCashReports = cashReports.filter(report => report.session.status === 'open');
  const closedCashReports = cashReports.filter(report => report.session.status === 'closed');
  const cashTotals = cashReports.reduce((totals, report) => ({
    sales: totals.sales + report.summary.grossSales,
    expectedCash: totals.expectedCash + report.summary.expectedCash,
    roomCharge: totals.roomCharge + report.summary.roomChargeTotal,
    tickets: totals.tickets + report.summary.orderCount,
  }), { sales: 0, expectedCash: 0, roomCharge: 0, tickets: 0 });

  const handleExport = () => {
    const text = `Rapport RestauOS\n\nCA: ${fmt(weekCA)} FCFA\nCommandes: ${totalOrders}\nPanier moyen: ${fmt(panierMoyen)} FCFA\nNote moyenne: ${avgRating.toFixed(1)}/5\n\nTop Produits:\n${topProducts.map((p, i) => `${i + 1}. ${p.name} — ${fmt(p.revenue)} FCFA`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rapport-restauos.txt'; a.click();
  };

  const handleExportCashSession = (report: typeof cashReports[number]) => {
    const ticket = buildCashSessionTicket({
      session: report.session,
      summary: report.summary,
      posName: report.pos?.name || 'POS',
      registerName: report.register?.name || 'Caisse',
    });
    const blob = new Blob([ticket], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-z-${report.session.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-white">Rapports</h1>
        <button onClick={handleExport} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-orange active:scale-90 transition-transform">
          <Download size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'ca', label: 'Chiffres', icon: TrendingUp },
          { id: 'hospi', label: 'Hospi', icon: Building2 },
          { id: 'caisse', label: 'Caisses', icon: ReceiptText },
          { id: 'analytics', label: 'Analytics', icon: Flame },
          { id: 'avis', label: 'Avis', icon: Star },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border text-[10px] font-black uppercase tracking-wider ${activeTab === tab.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-text-tertiary'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── CA TAB ─── */}
      {activeTab === 'ca' && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-lg p-5 mb-5">
            <p className="text-text-secondary text-xs font-semibold mb-1">Chiffre d'affaires</p>
            <h2 className="text-2xl font-black text-white">{fmt(weekCA)} <span className="text-sm text-text-secondary">FCFA</span></h2>
            <div className="flex items-center gap-1 mt-1 mb-4">
              <span className="text-xs font-bold text-green">↑ 15.3%</span>
              <span className="text-text-tertiary text-[10px]">vs semaine passée</span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caByDay} barCategoryGap="20%">
                  <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="ca" radius={[6, 6, 0, 0]}>
                    {caByDay.map((_, i) => (<Cell key={i} fill={i === caByDay.length - 1 ? '#FF8A00' : '#8B5CF6'} fillOpacity={i === caByDay.length - 1 ? 1 : 0.6} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Midi vs Soir */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="glass-card p-4 border-orange/10">
              <div className="flex items-center gap-2 mb-2"><Sun size={14} className="text-orange" /><span className="text-text-tertiary text-[9px] font-black uppercase">Midi</span></div>
              <p className="text-white font-black text-lg">{fmt(midiCA)} <span className="text-[10px] text-text-tertiary">F</span></p>
            </div>
            <div className="glass-card p-4 border-blue/10">
              <div className="flex items-center gap-2 mb-2"><Moon size={14} className="text-blue" /><span className="text-text-tertiary text-[9px] font-black uppercase">Soir</span></div>
              <p className="text-white font-black text-lg">{fmt(soirCA)} <span className="text-[10px] text-text-tertiary">F</span></p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Panier moyen', value: `${fmt(panierMoyen)} F`, icon: ShoppingBag, color: '#3B82F6' },
              { label: 'Commandes', value: `${totalOrders}`, icon: DollarSign, color: '#22C55E' },
              { label: 'Pertes cuisine', value: `${fmt(weekWaste)} F`, icon: Trash2, color: '#EF4444' },
              { label: 'Note clients', value: `${avgRating.toFixed(1)}/5 ⭐`, icon: Star, color: '#F59E0B' },
            ].map(kpi => (
              <div key={kpi.label} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                  <span className="text-text-tertiary text-[9px] font-bold uppercase">{kpi.label}</span>
                </div>
                <p className="text-white font-bold text-sm">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Distribution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-lg p-5 mb-5">
            <h3 className="text-white font-bold text-sm mb-4">Répartition</h3>
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                    {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-text-secondary text-xs">{d.name}</span>
                    <span className="text-white text-xs font-bold ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Top Products */}
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Award size={16} className="text-orange" /> Top Produits</h3>
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-orange text-white' : 'bg-white/5 text-text-tertiary'}`}>{i + 1}</span>
                  <span className="text-white font-bold text-sm flex-1">{p.name}</span>
                  <span className="text-text-secondary text-xs font-bold">{fmt(p.revenue)} F</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── HOSPI TAB ─── */}
      {activeTab === 'hospi' && (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card-lg p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue/10 text-blue flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Site consolidé</p>
                <h2 className="text-white font-black text-lg">{visibleSites[0]?.name || 'Complexe hôtelier'}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">CA POS suivis</p>
                <p className="text-white font-black text-xl">{fmt(revenueByPOS.reduce((s, item) => s + item.revenue, 0))} F</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Imputé chambres</p>
                <p className="text-cyan-300 font-black text-xl">{fmt(totalRoomCharge || openFolioTotal)} F</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôts</p>
                <p className="text-white font-black text-xl">{visibleWarehouses.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Alertes stock</p>
                <p className={lowHospiStocks.length ? 'text-orange font-black text-xl' : 'text-green font-black text-xl'}>{lowHospiStocks.length}</p>
              </div>
            </div>
            {unassignedRevenue > 0 && (
              <p className="text-text-tertiary text-[10px] mt-3">Anciennes ventes sans POS : {fmt(unassignedRevenue)} F conservées séparément.</p>
            )}
          </motion.div>

          <div className="glass-card-lg p-5 mb-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Store size={16} className="text-blue" /> Chiffre d'affaires par POS</h3>
            <div className="space-y-3">
              {revenueByPOS.map(({ pos, revenue, count, roomCharge }) => {
                const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
                return (
                  <div key={pos.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex justify-between gap-3 mb-2">
                      <div>
                        <p className="text-white font-black text-sm">{pos.name}</p>
                        <p className="text-text-tertiary text-[10px]">{warehouse?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange font-black text-sm">{fmt(revenue)} F</p>
                        <p className="text-text-tertiary text-[10px]">{count} ticket{count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {roomCharge > 0 && <p className="text-cyan-300 text-[10px] font-bold">Dont chambre : {fmt(roomCharge)} F</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card-lg p-5 mb-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Warehouse size={16} className="text-green" /> Stock par dépôt</h3>
            <div className="space-y-3">
              {visibleWarehouses.map(warehouse => {
                const levels = stockLevels.filter(level => level.warehouse_id === warehouse.id);
                return (
                  <div key={warehouse.id} className="rounded-2xl bg-white/5 p-4">
                    <p className="text-white font-black text-sm mb-2">{warehouse.name}</p>
                    {levels.map(level => {
                      const product = products.find(item => item.id === level.product_id);
                      const low = level.quantity <= level.alert_threshold;
                      return (
                        <div key={level.id} className="flex justify-between text-xs">
                          <span className="text-text-secondary">{product?.name || level.product_id}</span>
                          <span className={low ? 'text-orange font-black' : 'text-green font-black'}>{level.quantity} {level.unit}</span>
                        </div>
                      );
                    })}
                    {levels.length === 0 && <p className="text-text-tertiary text-xs">Aucun stock suivi.</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card-lg p-5 mb-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><BedDouble size={16} className="text-cyan-300" /> Folios ouverts</h3>
            <div className="space-y-3">
              {folios.filter(folio => folio.status === 'open').map(folio => {
                const room = rooms.find(item => item.id === folio.room_id);
                const stay = stays.find(item => item.id === folio.stay_id);
                const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
                const lines = folioLines.filter(line => line.folio_id === folio.id);
                return (
                  <div key={folio.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-white font-black text-sm">Chambre {room?.room_number}</p>
                        <p className="text-text-secondary text-xs">{guest?.first_name} {guest?.last_name}</p>
                      </div>
                      <p className="text-cyan-300 font-black text-sm">{fmt(folio.total_amount)} F</p>
                    </div>
                    {lines.length === 0 ? (
                      <p className="text-text-tertiary text-[10px]">Aucune consommation POS imputée.</p>
                    ) : lines.slice(0, 3).map(line => (
                      <div key={line.id} className="flex justify-between text-[10px]">
                        <span className="text-text-secondary">{line.description}</span>
                        <span className="text-white font-bold">{fmt(line.amount)} F</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card-lg p-5">
            <h3 className="text-white font-bold text-sm mb-4">Derniers mouvements de stock</h3>
            <div className="space-y-2">
              {stockMovements.slice(0, 8).map(move => {
                const product = products.find(item => item.id === move.product_id);
                const warehouse = warehouses.find(item => item.id === move.warehouse_id);
                const pos = posList.find(item => item.id === move.pos_id);
                return (
                  <div key={move.id} className="flex justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-white font-bold text-xs">{product?.name || move.product_id}</p>
                      <p className="text-text-tertiary text-[10px]">{pos?.name} • {warehouse?.name}</p>
                    </div>
                    <span className="text-red font-black text-xs">-{move.quantity}</span>
                  </div>
                );
              })}
              {stockMovements.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucune vente Hospi enregistrée pour le moment.</p>}
            </div>
          </div>
        </>
      )}

      {/* ─── CAISSE TAB ─── */}
      {activeTab === 'caisse' && (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card-lg p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-orange/10 text-orange flex items-center justify-center">
                <ReceiptText size={22} />
              </div>
              <div>
                <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Rapports X/Z</p>
                <h2 className="text-white font-black text-lg">Contrôle des caisses par POS</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Ventes sessions</p>
                <p className="text-white font-black text-xl">{fmt(cashTotals.sales)} F</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Espèces attendues</p>
                <p className="text-green font-black text-xl">{fmt(cashTotals.expectedCash)} F</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Imputé chambre</p>
                <p className="text-cyan-300 font-black text-xl">{fmt(cashTotals.roomCharge)} F</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase">Tickets</p>
                <p className="text-white font-black text-xl">{cashTotals.tickets}</p>
              </div>
            </div>
          </motion.div>

          <div className="glass-card-lg p-5 mb-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><UnlockKeyhole size={16} className="text-green" /> Rapports X ouverts</h3>
            <div className="space-y-3">
              {openCashReports.map(report => (
                <div key={report.session.id} className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-black text-sm">{report.pos?.name || 'POS'}</p>
                      <p className="text-text-tertiary text-[10px]">{report.register?.name || 'Caisse'} • ouverte par {report.session.opened_by}</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green/10 text-green">Ouverte</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-black/10 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">CA</p>
                      <p className="text-white font-black text-sm">{fmt(report.summary.grossSales)} F</p>
                    </div>
                    <div className="rounded-xl bg-black/10 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">Espèces attendues</p>
                      <p className="text-green font-black text-sm">{fmt(report.summary.expectedCash)} F</p>
                    </div>
                  </div>
                </div>
              ))}
              {openCashReports.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucune caisse ouverte.</p>}
            </div>
          </div>

          <div className="glass-card-lg p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><LockKeyhole size={16} className="text-red" /> Clôtures Z</h3>
            <div className="space-y-3">
              {closedCashReports.map(report => (
                <div key={report.session.id} className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-black text-sm">{report.pos?.name || 'POS'}</p>
                      <p className="text-text-tertiary text-[10px]">
                        {report.session.closed_at ? new Date(report.session.closed_at).toLocaleString('fr-FR') : 'Clôturée'} • {report.session.closed_by || '-'}
                      </p>
                    </div>
                    <button onClick={() => handleExportCashSession(report)} className="w-9 h-9 rounded-xl bg-white/5 text-orange flex items-center justify-center">
                      <Download size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl bg-black/10 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">CA</p>
                      <p className="text-white font-black text-sm">{fmt(report.summary.grossSales)} F</p>
                    </div>
                    <div className="rounded-xl bg-black/10 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">Écart</p>
                      <p className={`${(report.session.difference || 0) === 0 ? 'text-green' : 'text-orange'} font-black text-sm`}>{fmt(report.session.difference || 0)} F</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <span className="rounded-xl bg-white/5 px-3 py-2 text-text-secondary">Espèces {fmt(report.summary.byMethod.especes)} F</span>
                    <span className="rounded-xl bg-white/5 px-3 py-2 text-text-secondary">Carte {fmt(report.summary.byMethod.carte)} F</span>
                    <span className="rounded-xl bg-white/5 px-3 py-2 text-text-secondary">Chambre {fmt(report.summary.byMethod.room_charge)} F</span>
                  </div>
                </div>
              ))}
              {closedCashReports.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucune clôture Z pour le moment.</p>}
            </div>
          </div>
        </>
      )}

      {/* ─── ANALYTICS TAB ─── */}
      {activeTab === 'analytics' && (
        <>
          {/* Heatmap */}
          <div className="glass-card-lg p-5 mb-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Flame size={16} className="text-orange" /> Heatmap Affluence</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr>
                    <th className="text-[8px] text-text-tertiary font-bold uppercase p-1 text-left w-10"></th>
                    {HEAT_DAYS.map(d => (
                      <th key={d} className="text-[8px] text-text-tertiary font-bold uppercase p-1 text-center">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map(row => (
                    <tr key={row.hour}>
                      <td className="text-[9px] text-text-tertiary font-bold p-1">{row.hour}</td>
                      {HEAT_DAYS.map(d => {
                        const val = row[d];
                        const ci = Math.min(Math.floor(val / 1.5), HEAT_COLORS.length - 1);
                        return (
                          <td key={d} className="p-0.5">
                            <div className="w-full aspect-square rounded-md flex items-center justify-center" style={{ background: HEAT_COLORS[ci] }}>
                              <span className="text-[7px] font-black text-white/60">{val}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-[8px] text-text-tertiary">Calme</span>
              {HEAT_COLORS.map((c, i) => <div key={i} className="w-4 h-3 rounded-sm" style={{ background: c }} />)}
              <span className="text-[8px] text-text-tertiary">Intense</span>
            </div>
          </div>

          {/* Forecast */}
          <div className="glass-card-lg p-5 mb-5 border-blue/10 bg-blue/5">
            <h3 className="text-blue font-bold text-sm mb-3 flex items-center gap-2">🤖 Prévision IA</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue/20 flex items-center justify-center text-blue"><Users size={16} /></div>
                <div>
                  <p className="text-white font-bold text-xs">Demain samedi — 92 couverts prévus</p>
                  <p className="text-text-tertiary text-[10px]">+18% vs samedi dernier</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green/20 flex items-center justify-center text-green"><TrendingUp size={16} /></div>
                <div>
                  <p className="text-white font-bold text-xs">CA projeté: {fmt(Math.round(weekCA * 1.15))} FCFA</p>
                  <p className="text-text-tertiary text-[10px]">Basé sur la tendance +15%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange/20 flex items-center justify-center text-orange"><Clock size={16} /></div>
                <div>
                  <p className="text-white font-bold text-xs">Pic de rush prévu: 12h30 - 14h</p>
                  <p className="text-text-tertiary text-[10px]">Prévoir 4 serveurs minimum</p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Stats (Gamification) */}
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">🏆 Classement Équipe</h3>
            <div className="space-y-3">
              {[
                { name: 'Awa Fall', role: 'Serveuse', avatar: '👩‍🍽️', metric: '32 tables', score: 95, badge: '🥇' },
                { name: 'Seynabou Kane', role: 'Serveuse', avatar: '👩‍🍽️', metric: '28 tables', score: 88, badge: '🥈' },
                { name: 'Abdou Mbaye', role: 'Serveur', avatar: '🧑‍🍽️', metric: '24 tables', score: 82, badge: '🥉' },
                { name: 'Mamadou Diop', role: 'Chef', avatar: '👨‍🍳', metric: '12 min moy.', score: 90, badge: '⚡' },
                { name: 'Pape Sow', role: 'Livreur', avatar: '🛵', metric: '18 livraisons', score: 85, badge: '🚀' },
              ].map((emp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{emp.badge}</span>
                  <span className="text-lg">{emp.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-xs truncate">{emp.name}</p>
                    <p className="text-text-tertiary text-[9px]">{emp.metric}</p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange to-yellow-400" style={{ width: `${emp.score}%` }} />
                    </div>
                  </div>
                  <span className="text-orange font-black text-xs w-8 text-right">{emp.score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── AVIS TAB ─── */}
      {activeTab === 'avis' && (
        <>
          {/* Average Score */}
          <div className="glass-card-lg p-6 mb-5 text-center">
            <p className="text-5xl font-black text-white mb-2">{avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={20} className={s <= Math.round(avgRating) ? 'text-orange fill-orange' : 'text-white/20'} />
              ))}
            </div>
            <p className="text-text-tertiary text-xs">{reviews.length} avis clients</p>
          </div>

          {/* Category Bars */}
          <div className="glass-card p-5 mb-5 space-y-4">
            {[
              { label: 'Cuisine', avg: reviews.length > 0 ? reviews.reduce((a,r) => a+r.cuisine, 0) / reviews.length : 0 },
              { label: 'Service', avg: reviews.length > 0 ? reviews.reduce((a,r) => a+r.service, 0) / reviews.length : 0 },
              { label: 'Ambiance', avg: reviews.length > 0 ? reviews.reduce((a,r) => a+r.ambiance, 0) / reviews.length : 0 },
              { label: 'Rapport Q/P', avg: reviews.length > 0 ? reviews.reduce((a,r) => a+r.rapport, 0) / reviews.length : 0 },
            ].map(cat => (
              <div key={cat.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary font-bold">{cat.label}</span>
                  <span className="text-white font-black">{cat.avg.toFixed(1)}/5</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange to-yellow-400" style={{ width: `${(cat.avg / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.slice().reverse().map(r => (
              <div key={r.id} className="glass-card p-4 border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">{r.clientName}</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= r.rating ? 'text-orange fill-orange' : 'text-white/10'} />)}
                  </div>
                </div>
                <p className="text-text-secondary text-xs italic">"{r.comment}"</p>
                <p className="text-text-tertiary text-[9px] mt-2">{new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
