import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientStore, type Client } from '../stores/clientStore';
import { Star, Gift, History, QrCode, ArrowUp, ArrowDown, ChevronRight, Search } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const tierConfig = {
  bronze: { label: 'Bronze', color: '#CD7F32', bg: 'rgba(205,127,50,0.15)' },
  silver: { label: 'Silver', color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)' },
  gold: { label: 'Gold', color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
  platinum: { label: 'Platinum', color: '#E5E4E2', bg: 'rgba(229,228,226,0.15)' },
};

export default function Fidelite() {
  const { clients, usePoints } = useClientStore();
  const [selected, setSelected] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showUsePoints, setShowUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState('');

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleUsePoints = () => {
    if (!selected || !pointsToUse) return;
    const pts = Number(pointsToUse);
    if (pts > selected.points) return;
    usePoints(selected.id, pts, `Réduction ${fmt(pts * 5)} FCFA`);
    setSelected({ ...selected, points: selected.points - pts });
    setPointsToUse('');
    setShowUsePoints(false);
  };

  if (selected) {
    const tier = tierConfig[selected.tier];
    return (
      <div className="page-content pt-14 pb-28">
        <button onClick={() => setSelected(null)} className="text-text-secondary text-sm mb-4 flex items-center gap-1">
          ← Retour
        </button>

        {/* Client Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-lg p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: tier.color, filter: 'blur(40px)' }} />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-text-tertiary text-[10px] font-semibold">Client fidèle</p>
              <h2 className="text-white font-black text-xl">{selected.name}</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ color: tier.color, background: tier.bg }}>
              {tier.label}
            </span>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-text-tertiary text-[10px]">Points</p>
              <p className="text-2xl font-black" style={{ color: tier.color }}>{fmt(selected.points)} <span className="text-sm text-text-secondary">pts</span></p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px]">À utiliser</p>
              <p className="text-2xl font-black text-orange">{fmt(Math.min(selected.points, 650))} <span className="text-sm text-text-secondary">pts</span></p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setShowQR(true)}
            className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/30 transition-colors">
            <QrCode size={24} className="text-violet" />
            <span className="text-white text-xs font-semibold">QR Code</span>
          </button>
          <button onClick={() => setShowUsePoints(true)}
            className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/30 transition-colors">
            <Gift size={24} className="text-orange" />
            <span className="text-white text-xs font-semibold">Utiliser points</span>
          </button>
        </div>

        {/* History */}
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <History size={16} className="text-violet" /> Historique
        </h3>
        <div className="space-y-3">
          {selected.history.length === 0 && (
            <div className="text-center py-8 text-text-tertiary text-sm">Aucun historique</div>
          )}
          {selected.history.map(h => (
            <div key={h.id} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${h.type === 'gain' ? 'bg-green-light' : 'bg-red-light'}`}>
                {h.type === 'gain' ? <ArrowUp size={16} className="text-green" /> : <ArrowDown size={16} className="text-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold">
                  {h.type === 'gain' ? 'Gain de points' : 'Utilisation points'}
                </div>
                <div className="text-text-tertiary text-[10px]">{h.label}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${h.type === 'gain' ? 'text-green' : 'text-red'}`}>
                  {h.type === 'gain' ? '+' : '-'}{h.points} pts
                </div>
                <div className="text-text-tertiary text-[10px]">{new Date(h.date).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Use Points Button */}
        <button onClick={() => setShowUsePoints(true)}
          className="fixed bottom-24 left-4 right-4 z-[9998] py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,138,0,0.4)] text-center">
          Utiliser mes points
        </button>

        {/* QR Modal */}
        <AnimatePresence>
          {showQR && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowQR(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                className="modal-sheet text-center" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-bold text-lg mb-4">QR Code Client</h3>
                <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
                  <div className="w-full h-full rounded-lg" style={{
                    background: `repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 12px 12px`,
                    filter: 'blur(0.3px)',
                  }} />
                </div>
                <p className="text-text-secondary text-sm">{selected.name}</p>
                <p className="text-text-tertiary text-xs mt-1">ID: {selected.id}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Use Points Modal */}
        <AnimatePresence>
          {showUsePoints && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowUsePoints(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <h3 className="text-white font-bold text-lg mb-2">Utiliser des points</h3>
                <p className="text-text-secondary text-sm mb-4">Solde : {fmt(selected.points)} pts (= {fmt(selected.points * 5)} FCFA)</p>
                <input type="number" placeholder="Nombre de points" value={pointsToUse} onChange={e => setPointsToUse(e.target.value)}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none mb-3" />
                {pointsToUse && (
                  <p className="text-orange text-sm font-semibold mb-4">Réduction : {fmt(Number(pointsToUse) * 5)} FCFA</p>
                )}
                <button onClick={handleUsePoints}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm"
                  disabled={!pointsToUse || Number(pointsToUse) > selected.points}>
                  Confirmer
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Fidélité</h1>
        <div className="glass-card px-3 py-1.5 text-xs text-text-secondary flex items-center gap-1">
          <Star size={14} className="text-orange" /> {clients.length} clients
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input type="text" placeholder="Rechercher un client..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card text-sm text-white placeholder-text-tertiary bg-transparent border-none" />
      </div>

      <div className="space-y-3">
        {filtered.map(c => {
          const tier = tierConfig[c.tier];
          return (
            <motion.div key={c.id} layout
              className="glass-card p-4 flex items-center gap-3 cursor-pointer active:border-orange/30 transition-colors"
              onClick={() => setSelected(c)}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
                style={{ background: tier.bg, color: tier.color }}>
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{c.name}</div>
                <div className="text-text-tertiary text-xs">{fmt(c.points)} pts · {c.visits} visites</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: tier.color, background: tier.bg }}>
                  {tier.label}
                </span>
                <ChevronRight size={16} className="text-text-tertiary" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
