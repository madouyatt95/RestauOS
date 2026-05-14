import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryStore, type Delivery } from '../stores/deliveryStore';
import { useAuthStore } from '../stores/authStore';
import { MapPin, Clock, Truck, Check, ChefHat, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusConfig = {
  preparation: { label: 'En préparation', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: ChefHat },
  en_route: { label: 'En livraison', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
  livre: { label: 'Livré', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: Check },
};

export default function Livraisons() {
  const { deliveries, updateStatus } = useDeliveryStore();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  const filteredDeliveries = user?.role === 'Livreur' 
    ? deliveries.filter(d => d.driverName === user.name)
    : deliveries;

  const enCours = filteredDeliveries.filter(d => d.status !== 'livre');
  const terminees = filteredDeliveries.filter(d => d.status === 'livre');

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimized(true);
    }, 1500);
  };

  const handleSignAndComplete = () => {
    if (selected) updateStatus(selected.id, 'livre');
    setShowSignature(false);
    setSelected(null);
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Livraisons</h1>
        <div className="flex gap-2">
          {user?.role === 'Livreur' && enCours.length > 1 && (
            <button 
              onClick={handleOptimize}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${optimized ? 'bg-green/20 text-green' : 'glass-card text-white'}`}
            >
              {isOptimizing ? 'Calcul IA...' : optimized ? 'Trajet Optimisé ✓' : 'Optimiser Trajet'}
            </button>
          )}
          <div className="glass-card px-3 py-1.5 text-xs text-text-secondary flex items-center gap-1">
            <Truck size={14} className="text-orange" /> {enCours.length} en cours
          </div>
        </div>
      </div>

      {/* GPS Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg mb-6 overflow-hidden relative z-0" style={{ height: 250 }}>
        <MapContainer center={[14.6928, -17.4467]} zoom={13} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[14.6928, -17.4467]}>
            <Popup>📍 RestauOS (Cuisine)</Popup>
          </Marker>
          {enCours.map((d, i) => {
            const offsets = [[0.01, 0.02], [-0.015, 0.01], [0.02, -0.01]];
            const pos = [14.6928 + offsets[i % 3][0], -17.4467 + offsets[i % 3][1]] as [number, number];
            return (
              <Marker key={d.id} position={pos}>
                <Popup>
                  <strong>{d.clientName}</strong><br/>
                  {d.address}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
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
              <div className="flex gap-2">
                {selected.status === 'en_route' && (
                  <button
                    onClick={() => setShowSignature(true)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue to-indigo-600 text-white font-bold text-sm"
                  >
                    Remettre au client
                  </button>
                )}
                {selected.status !== 'livre' && selected.status !== 'en_route' && (
                  <button
                    onClick={() => updateStatus(selected.id, 'en_route')}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm"
                  >
                    Commencer la course
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignature && (
          <div className="modal-overlay" onClick={() => setShowSignature(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-2">Preuve de livraison</h3>
              <p className="text-text-secondary text-sm mb-4">Veuillez faire signer le client pour confirmer la réception.</p>
              
              <div className="w-full h-40 bg-white/5 border border-white/10 rounded-xl mb-6 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-text-tertiary text-sm absolute">Zone de signature</span>
                {/* Fake signature line for demo */}
                <svg className="w-full h-full relative z-10 opacity-50" viewBox="0 0 200 100">
                  <path d="M 20 50 Q 40 20 60 50 T 100 50 T 140 30 T 180 50" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowSignature(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold">
                  Annuler
                </button>
                <button onClick={handleSignAndComplete} className="flex-1 py-3 rounded-xl bg-green text-white font-bold flex items-center justify-center gap-2">
                  <Check size={18} /> Valider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
