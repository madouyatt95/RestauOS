import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryStore, type Delivery } from '../stores/deliveryStore';
import { MapPin, Clock, Truck, Check, ChefHat, Package } from 'lucide-react';

const statusConfig = {
  preparation: { label: 'En préparation', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: ChefHat },
  en_route: { label: 'En livraison', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
  livre: { label: 'Livré', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: Check },
};

export default function Livraisons() {
  const { deliveries, updateStatus } = useDeliveryStore();
  const [selected, setSelected] = useState<Delivery | null>(null);

  const enCours = deliveries.filter(d => d.status !== 'livre');
  const terminees = deliveries.filter(d => d.status === 'livre');

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Livraisons</h1>
        <div className="glass-card px-3 py-1.5 text-xs text-text-secondary flex items-center gap-1">
          <Truck size={14} className="text-orange" /> {enCours.length} en cours
        </div>
      </div>

      {/* Fake Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg mb-6 overflow-hidden relative" style={{ height: 200 }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 30% 40%, rgba(255,138,0,0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(59,130,246,0.1) 0%, transparent 40%),
            linear-gradient(135deg, #0a0f1a 0%, #111827 100%)
          `,
        }}>
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Delivery markers */}
          {enCours.map((d, i) => {
            const positions = [{ x: '30%', y: '35%' }, { x: '65%', y: '50%' }, { x: '45%', y: '70%' }];
            const pos = positions[i % 3];
            const cfg = statusConfig[d.status];
            return (
              <motion.div key={d.id}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="absolute flex flex-col items-center"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: cfg.color }}>
                  <cfg.icon size={14} className="text-white" />
                </div>
                <span className="mt-1 text-[8px] text-white font-bold bg-bg-card/80 px-1.5 py-0.5 rounded-full">{d.clientName.split(' ')[0]}</span>
              </motion.div>
            );
          })}

          {/* Restaurant marker */}
          <div className="absolute" style={{ left: '50%', top: '30%', transform: 'translate(-50%, -50%)' }}>
            <div className="w-6 h-6 rounded-full bg-orange flex items-center justify-center shadow-lg ring-4 ring-orange/20">
              <MapPin size={12} className="text-white" />
            </div>
          </div>

          {/* Label */}
          <div className="absolute bottom-3 left-3 glass-card px-3 py-1.5 text-[10px] text-text-secondary">
            📍 Dakar, Sénégal
          </div>
        </div>
      </motion.div>

      {/* En cours */}
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
        <Package size={16} className="text-orange" /> En cours ({enCours.length})
      </h3>
      <div className="space-y-3 mb-6">
        {enCours.map(d => {
          const cfg = statusConfig[d.status];
          return (
            <motion.div key={d.id} layout className="glass-card p-4 flex items-center gap-3 cursor-pointer active:border-orange/30 transition-colors"
              onClick={() => setSelected(d)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                <cfg.icon size={18} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{d.clientName}</div>
                <div className="text-text-tertiary text-xs flex items-center gap-1">
                  <MapPin size={10} /> {d.address}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                  {cfg.label}
                </span>
                <div className="text-text-tertiary text-[10px] mt-1 flex items-center gap-0.5 justify-end">
                  <Clock size={10} /> {d.estimatedTime} min
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Terminées */}
      <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
        <Check size={16} className="text-green" /> Terminées ({terminees.length})
      </h3>
      <div className="space-y-3">
        {terminees.slice(0, 3).map(d => (
          <div key={d.id} className="glass-card p-4 flex items-center gap-3 opacity-60">
            <div className="w-10 h-10 rounded-xl bg-green-light flex items-center justify-center shrink-0">
              <Check size={18} className="text-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">{d.clientName}</div>
              <div className="text-text-tertiary text-xs">{d.address}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-1">{selected.clientName}</h3>
              <p className="text-text-secondary text-sm mb-4 flex items-center gap-1"><MapPin size={14} /> {selected.address}</p>

              <div className="glass-card p-3 flex items-center gap-3 mb-4">
                <Truck size={16} className="text-blue" />
                <span className="text-white text-sm">Livreur : {selected.driverName}</span>
              </div>

              <p className="text-text-tertiary text-xs font-semibold mb-3 uppercase tracking-wider">Changer le statut</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(statusConfig) as [Delivery['status'], typeof statusConfig.preparation][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => { updateStatus(selected.id, key); setSelected({ ...selected, status: key }); }}
                    className={`py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${selected.status === key ? 'ring-2 ring-offset-1 ring-offset-bg-card' : ''}`}
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <cfg.icon size={16} />
                    {cfg.label}
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
