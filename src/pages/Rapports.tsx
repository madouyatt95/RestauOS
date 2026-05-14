import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { useReviewStore } from '../stores/reviewStore';
import { useWasteStore } from '../stores/wasteStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Award, Download, Star, Users, Trash2, Clock, Flame, Sun, Moon } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const DONUT_COLORS = ['#FF8A00', '#8B5CF6', '#3B82F6'];
const HEAT_COLORS = ['#1a1a2e', '#2d1f4e', '#4c1d95', '#7c3aed', '#a78bfa', '#FF8A00', '#ef4444'];

export default function Rapports() {
  const { getCAByDay, getOrderCount, getTypeDistribution, getTopProducts } = useOrderStore();
  const { reviews, getAverage } = useReviewStore();
  const { getWeekTotal } = useWasteStore();
  const [activeTab, setActiveTab] = useState<'ca' | 'analytics' | 'avis'>('ca');

  const caByDay = getCAByDay();
  const weekCA = caByDay.reduce((s, d) => s + d.ca, 0);
  const dist = getTypeDistribution();
  const topProducts = getTopProducts();
  const totalOrders = Array.from({ length: 7 }, (_, i) => getOrderCount(i)).reduce((a, b) => a + b, 0);
  const avgRating = getAverage();
  const weekWaste = getWeekTotal();

  // Simulated heatmap data (hours x days)
  const heatmapData = useMemo(() => {
    const hours = ['11h', '12h', '13h', '14h', '15h', '18h', '19h', '20h', '21h', '22h'];
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return hours.map(h => ({
      hour: h,
      ...Object.fromEntries(days.map(d => [d, Math.floor(Math.random() * 6) + (h.includes('12') || h.includes('20') ? 4 : 1) + (d === 'Sam' || d === 'Ven' ? 2 : 0)]))
    }));
  }, []);

  // Midi vs Soir
  const midiCA = Math.round(weekCA * 0.42);
  const soirCA = Math.round(weekCA * 0.58);
  const panierMoyen = totalOrders > 0 ? Math.round(weekCA / totalOrders) : 0;

  const donutData = [
    { name: 'Sur place', value: dist.sur_place },
    { name: 'À emporter', value: dist.emporter },
    { name: 'Livraison', value: dist.livraison },
  ];

  const handleExport = () => {
    const text = `Rapport RestauOS\n\nCA: ${fmt(weekCA)} FCFA\nCommandes: ${totalOrders}\nPanier moyen: ${fmt(panierMoyen)} FCFA\nNote moyenne: ${avgRating.toFixed(1)}/5\n\nTop Produits:\n${topProducts.map((p, i) => `${i + 1}. ${p.name} — ${fmt(p.revenue)} FCFA`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rapport-restauos.txt'; a.click();
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
        {[
          { id: 'ca', label: 'Chiffres', icon: TrendingUp },
          { id: 'analytics', label: 'Analytics', icon: Flame },
          { id: 'avis', label: 'Avis', icon: Star },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
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
                    {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                      <th key={d} className="text-[8px] text-text-tertiary font-bold uppercase p-1 text-center">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map(row => (
                    <tr key={row.hour}>
                      <td className="text-[9px] text-text-tertiary font-bold p-1">{row.hour}</td>
                      {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => {
                        const val = (row as any)[d] as number;
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
