import { motion } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { ShoppingBag, Users, Receipt, ArrowDown, Bell, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function Dashboard() {
  const { getCA, getOrderCount, getClientCount, getAvgTicket, getTopProducts, getCAByDay } = useOrderStore();
  const navigate = useNavigate();

  const ca = getCA(0);
  const caYesterday = getCA(1);
  const caChange = caYesterday > 0 ? ((ca - caYesterday) / caYesterday * 100).toFixed(1) : '0';
  const orders = getOrderCount(0);
  const clients = getClientCount(0);
  const avgTicket = getAvgTicket(0);
  const topProducts = getTopProducts();
  const caByDay = getCAByDay();

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-content pt-14 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-black text-white">Bonjour, Cheikh ! 👋</h1>
          <p className="text-text-secondary text-xs mt-1">Gérant</p>
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
          📍 Tous les points de vente
        </div>
      </div>

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
              <span className="text-2xl w-10 text-center">{p.image}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">{p.name}</div>
                <div className="text-text-tertiary text-[10px]">{p.sales} ventes</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-sm">{fmt(p.revenue)} FCFA</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
