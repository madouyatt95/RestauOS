import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, DollarSign } from 'lucide-react';
import { useOrderStore } from '../stores/orderStore';

export default function Factures() {
  const { orders } = useOrderStore();
  const [filter, setFilter] = useState<'tous' | 'payee' | 'partiellement_payee'>('tous');
  const [dateFilter, setDateFilter] = useState<'aujourd_hui' | 'cette_semaine' | 'tous'>('tous');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const filteredOrders = orders.filter(o => {
    const oDate = new Date(o.date);
    const matchesStatus = filter === 'tous' || o.status === filter;
    let matchesDate = true;
    if (dateFilter === 'aujourd_hui') matchesDate = o.date.startsWith(todayStr);
    if (dateFilter === 'cette_semaine') matchesDate = oDate >= startOfWeek;
    return matchesStatus && matchesDate;
  });
  
  const totalRevenue = filteredOrders.filter(o => ['payee', 'terminee', 'servie'].includes(o.status)).reduce((s, o) => s + o.total, 0);

  return (
    <div className="page-content pt-14 pb-28 bg-[#0a0c10] min-h-screen">
      <div className="px-4 mb-8">
        <h1 className="text-white font-black text-2xl">Comptabilité</h1>
        <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">Factures & Bilan</p>
      </div>

      <div className="px-4 mb-8">
        <div className="glass-card p-5 border-white/5 bg-gradient-to-br from-green-900/20 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center text-green"><DollarSign size={20} /></div>
            <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Chiffre d'Affaires Brut</span>
          </div>
          <div className="text-white font-black text-3xl">{totalRevenue.toLocaleString()} F</div>
          <div className="flex items-center gap-1 text-green text-xs font-bold mt-2">
            <TrendingUp size={14} /> +12% ce mois-ci
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em]">Historique des Factures</h3>
          <button className="text-blue text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Download size={14} /> Exporter PDF</button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
          {['tous', 'aujourd_hui', 'cette_semaine'].map(df => (
            <button key={df} onClick={() => setDateFilter(df as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${dateFilter === df ? 'bg-orange/10 border-orange text-orange' : 'bg-transparent border-white/10 text-text-tertiary'}`}>
              {df === 'tous' ? 'Toujours' : df === 'aujourd_hui' ? "Aujourd'hui" : 'Cette Semaine'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
          {['tous', 'payee', 'partiellement_payee'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f ? 'bg-white text-[#0a0c10]' : 'bg-white/5 text-white'}`}>
              {f === 'tous' ? 'Tous les statuts' : f === 'payee' ? 'Encaissées' : 'Paiement Partiel'}
            </button>
          ))}
        </div>

        {filteredOrders.map(order => (
          <motion.div layout key={order.id} className="glass-card p-4 border-white/5 flex items-center justify-between active:scale-98 transition-transform">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${['payee', 'terminee', 'servie'].includes(order.status) ? 'bg-green/10 text-green' : order.status === 'partiellement_payee' ? 'bg-orange/10 text-orange' : 'bg-blue/10 text-blue'}`}>
                <FileText size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">#{order.id.split('-')[1] || order.id}</h4>
                <div className="flex items-center gap-2 text-text-tertiary text-[10px] font-bold uppercase mt-1">
                  <span>{new Date(order.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                  • <span className={order.payment === 'wave' ? 'text-blue' : 'text-green'}>{order.payment}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-black text-sm">{order.total.toLocaleString()} F</div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${['payee', 'terminee', 'servie'].includes(order.status) ? 'bg-green/10 text-green' : order.status === 'partiellement_payee' ? 'bg-orange/10 text-orange' : 'bg-blue/10 text-blue'}`}>
                {order.status === 'payee' || order.status === 'terminee' || order.status === 'servie' ? 'Payée' : order.status === 'partiellement_payee' ? 'Partiel' : order.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
