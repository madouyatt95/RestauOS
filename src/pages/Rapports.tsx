import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Award, Download } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const DONUT_COLORS = ['#FF8A00', '#8B5CF6', '#3B82F6'];

export default function Rapports() {
  const { getCAByDay, getOrderCount, getTypeDistribution, getTopProducts } = useOrderStore();
  const [period, setPeriod] = useState('Cette semaine');

  const caByDay = getCAByDay();
  const weekCA = caByDay.reduce((s, d) => s + d.ca, 0);
  const dist = getTypeDistribution();
  const topProducts = getTopProducts();

  const totalOrders = Array.from({ length: 7 }, (_, i) => getOrderCount(i)).reduce((a, b) => a + b, 0);
  const totalExpenses = Math.round(weekCA * 0.32);
  const margin = Math.round(weekCA * 0.68);

  const donutData = [
    { name: 'Sur place', value: dist.sur_place },
    { name: 'À emporter', value: dist.emporter },
    { name: 'Livraison', value: dist.livraison },
  ];

  const handleExport = () => {
    const text = `Rapport RestauOS — Semaine\n\nCA: ${fmt(weekCA)} FCFA\nCommandes: ${totalOrders}\nMarge: ${fmt(margin)} FCFA\nDépenses: ${fmt(totalExpenses)} FCFA\n\nTop Produits:\n${topProducts.map((p, i) => `${i + 1}. ${p.name} — ${fmt(p.revenue)} FCFA`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport-restauos.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Rapports</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="glass-card px-3 py-2 text-xs text-text-secondary bg-transparent border-none">
          <option>Cette semaine</option>
          <option>Ce mois</option>
        </select>
      </div>

      {/* Weekly CA Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg p-5 mb-5">
        <p className="text-text-secondary text-xs font-semibold mb-1">Chiffre d'affaires</p>
        <h2 className="text-2xl font-black text-white">{fmt(weekCA)} <span className="text-sm text-text-secondary">FCFA</span></h2>
        <div className="flex items-center gap-1 mt-1 mb-4">
          <span className="text-xs font-bold text-green">↑ 15.3%</span>
          <span className="text-text-tertiary text-[10px]">vs semaine passée</span>
        </div>

        {/* Bar Chart */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={caByDay} barCategoryGap="20%">
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="ca" radius={[6, 6, 0, 0]}>
                {caByDay.map((_, i) => (
                  <Cell key={i} fill={i === caByDay.length - 1 ? '#FF8A00' : '#8B5CF6'} fillOpacity={i === caByDay.length - 1 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Distribution Donut */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card-lg p-5 mb-5">
        <h3 className="text-white font-bold text-sm mb-4">Répartition</h3>
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                  {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                </Pie>
              </PieChart>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Marge estimée', value: `${fmt(margin)}`, icon: TrendingUp, color: 'green' },
          { label: 'Dépenses', value: `${fmt(totalExpenses)}`, icon: DollarSign, color: 'red' },
          { label: 'Commandes', value: `${fmt(totalOrders)}`, icon: ShoppingBag, color: 'blue' },
          { label: 'Meilleur produit', value: topProducts[0]?.name || '-', icon: Award, color: 'orange' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={14} style={{ color: `var(--color-${kpi.color})` }} />
              <span className="text-text-tertiary text-[10px] font-semibold">{kpi.label}</span>
            </div>
            <div className="text-white font-bold text-sm truncate">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Export */}
      <button onClick={handleExport}
        className="w-full py-4 rounded-2xl glass-card text-white font-bold text-sm flex items-center justify-center gap-2 active:bg-white/5 transition-colors">
        <Download size={16} className="text-orange" /> Exporter le rapport (PDF)
      </button>
    </div>
  );
}
