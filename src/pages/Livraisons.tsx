import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryStore, type Delivery } from '../stores/deliveryStore';
import { useAuthStore } from '../stores/authStore';
import { MapPin, Clock, Truck, Check, ChefHat, Phone, Navigation, Wallet, X } from 'lucide-react';

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
  const { deliveries, updateStatus, updatePaymentStatus } = useDeliveryStore();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);

  const isGerant = ['Admin', 'Gérant'].includes(user?.role || '');

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
    if (selected) {
      updateStatus(selected.id, 'livre');
      if (selected.paymentStatus === 'en_attente') updatePaymentStatus(selected.id, 'paye');
    }
    setShowSignature(false);
    setSelected(null);
  };

  return (
    <div className="page-content pt-14 pb-28 bg-[#0a0c10] min-h-screen">
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-white font-black text-2xl">Courses</h1>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">Logistique & Livraisons</p>
        </div>
        {!isGerant && user?.role === 'Livreur' && enCours.length > 1 && (
          <button 
            onClick={handleOptimize}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${optimized ? 'bg-green text-white shadow-green/20' : 'bg-white/10 text-white border border-white/10'}`}
          >
            {isOptimizing ? 'Calcul...' : optimized ? 'Optimisé ✓' : 'Optimiser'}
          </button>
        )}
      </div>

      {/* Map Preview */}
      <div className="px-4 mb-8">
        <div className="rounded-[2.5rem] overflow-hidden h-52 border border-white/10 shadow-2xl relative z-0">
          <MapContainer center={[14.6928, -17.4467]} zoom={13} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {enCours.map((d, i) => {
              const offsets = [[0.01, 0.02], [-0.015, 0.01], [0.02, -0.01]];
              const pos = [14.6928 + offsets[i % 3][0], -17.4467 + offsets[i % 3][1]] as [number, number];
              return (
                <Marker key={d.id} position={pos}>
                  <Popup>
                    <div className="p-1 font-bold">{d.clientName}</div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="px-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em]">En cours de traitement</h3>
            <span className="text-orange font-black text-xs">{enCours.length} Commandes</span>
          </div>
          <div className="space-y-4">
            {enCours.map(d => {
              const cfg = statusConfig[d.status];
              return (
                <motion.div key={d.id} layout className="glass-card p-5 border-white/5 active:scale-98 transition-all" onClick={() => setSelected(d)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5" style={{ background: cfg.bg }}>
                        <cfg.icon size={22} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <h4 className="text-white font-black text-base">{d.clientName}</h4>
                        <div className="flex items-center gap-1.5 text-text-tertiary text-[10px] font-bold uppercase mt-0.5">
                          <MapPin size={10} /> {d.address}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className={d.paymentStatus === 'paye' ? 'text-green' : 'text-orange'} />
                      <span className="text-white font-black text-sm">{d.amount.toLocaleString()} F</span>
                      <span className={`text-[9px] font-bold uppercase ${d.paymentStatus === 'paye' ? 'text-green' : 'text-orange'}`}>
                        • {d.paymentStatus === 'paye' ? 'Payé' : 'À encaisser'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">{d.estimatedTime} min</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {terminees.length > 0 && (
          <div>
            <h3 className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Livraisons terminées</h3>
            <div className="space-y-3">
              {terminees.slice(0, 3).map(d => (
                <div key={d.id} className="glass-card p-4 flex items-center gap-4 opacity-50 border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green border border-green/10">
                    <Check size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">{d.clientName}</h4>
                    <p className="text-text-tertiary text-[10px]">{d.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-white font-black text-2xl mb-1">{selected.clientName}</h3>
                  <p className="text-text-secondary text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={12} /> {selected.address}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <a href={`tel:${selected.clientPhone}`} className="p-4 rounded-2xl bg-blue/10 border border-blue/20 flex flex-col items-center gap-2 text-blue active:scale-95 transition-transform">
                  <Phone size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Appeler</span>
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer" className="p-4 rounded-2xl bg-orange/10 border border-orange/20 flex flex-col items-center gap-2 text-orange active:scale-95 transition-transform">
                  <Navigation size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Itinéraire</span>
                </a>
              </div>

              <div className="glass-card p-5 mb-8 border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Total Commande</span>
                  <span className="text-white font-black text-xl">{selected.amount.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">État du paiement</span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selected.paymentStatus === 'paye' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                    {selected.paymentStatus === 'paye' ? 'Déjà Payé' : 'À encaisser'}
                  </span>
                </div>
              </div>

              {!isGerant && user?.role === 'Livreur' && (
                <div className="space-y-3">
                  {selected.status === 'preparation' && (
                    <button onClick={() => updateStatus(selected.id, 'en_route')} className="w-full py-5 rounded-[2rem] bg-blue text-white font-black text-base shadow-xl shadow-blue/20 active:scale-95 transition-transform">
                      Récupérer & Commencer la livraison
                    </button>
                  )}
                  {selected.status === 'en_route' && (
                    <button onClick={() => setShowSignature(true)} className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-green-600 to-green-500 text-white font-black text-base shadow-xl shadow-green/20 active:scale-95 transition-transform">
                      Valider la livraison (Signature)
                    </button>
                  )}
                </div>
              )}
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
              <h3 className="text-white font-black text-xl mb-2 text-center">Preuve de Livraison</h3>
              <p className="text-text-secondary text-sm mb-6 text-center">Faites signer le client pour confirmer le paiement de <span className="text-white font-bold">{selected?.amount.toLocaleString()} F</span></p>
              
              <div className="w-full h-48 bg-white/5 border border-white/10 rounded-[2.5rem] mb-8 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-text-tertiary text-[10px] font-black uppercase tracking-widest absolute opacity-20">Zone de signature</span>
                <svg className="w-full h-full relative z-10 opacity-60" viewBox="0 0 200 100">
                  <path d="M 30 60 Q 50 30 70 60 T 110 60 T 150 40 T 170 60" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowSignature(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-black text-sm border border-white/10 uppercase tracking-widest">
                  Annuler
                </button>
                <button onClick={handleSignAndComplete} className="flex-1 py-4 rounded-2xl bg-green text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-green/20 uppercase tracking-widest">
                  <Check size={20} /> Valider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
