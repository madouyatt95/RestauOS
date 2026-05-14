import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { Plus, ChevronLeft, ChevronRight, Phone, Clock, RefreshCw, Check } from 'lucide-react';

const statusConfig = {
  present: { label: 'Présent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  retard: { label: 'Retard', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  repos: { label: 'Repos', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export default function Personnel() {
  const { employees, addEmployee, updateStatus } = useStaffStore();
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<'employes' | 'plannings'>('employes');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', phone: '', schedule: '' });
  const [swapRequests, setSwapRequests] = useState([
    { id: 1, from: 'Awa Fall', role: 'Serveur/se', date: 'Jeudi Soir', status: 'pending' }
  ]);

  const now = new Date();
  const month = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Generate calendar days around today
  const days: { num: number; day: string; isToday: boolean }[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push({
      num: d.getDate(),
      day: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3),
      isToday: i === 0,
    });
  }

  const handleAdd = () => {
    if (!newEmp.name || !newEmp.role) return;
    addEmployee({
      name: newEmp.name,
      role: newEmp.role,
      phone: newEmp.phone || '77 000 00 00',
      avatar: '👤',
      schedule: newEmp.schedule || '08:00 - 16:00',
      status: 'present',
    });
    setNewEmp({ name: '', role: '', phone: '', schedule: '' });
    setShowAdd(false);
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-white">Personnel</h1>
        {activeTab === 'employes' && (
          <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full bg-orange flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl">
        <button onClick={() => setActiveTab('employes')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'employes' ? 'bg-bg-card shadow text-white' : 'text-text-secondary'}`}>
          Équipe
        </button>
        <button onClick={() => setActiveTab('plannings')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'plannings' ? 'bg-bg-card shadow text-white' : 'text-text-secondary'}`}>
          Échange de shifts
        </button>
      </div>

      {activeTab === 'employes' ? (
        <>
          {/* Calendar */}
          <div className="glass-card-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button className="text-text-tertiary"><ChevronLeft size={18} /></button>
          <span className="text-white font-bold text-sm capitalize">{month}</span>
          <button className="text-text-tertiary"><ChevronRight size={18} /></button>
        </div>
        <div className="flex justify-between">
          {days.map((d) => (
            <div key={d.num} className={`flex flex-col items-center gap-1 py-2 px-2.5 rounded-2xl transition-all ${d.isToday ? 'bg-orange text-white' : ''}`}>
              <span className={`text-[10px] font-semibold ${d.isToday ? 'text-white' : 'text-text-tertiary'}`}>{d.day}</span>
              <span className={`text-sm font-black ${d.isToday ? 'text-white' : 'text-text-secondary'}`}>{d.num}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Employee List */}
      <div className="space-y-3">
        {employees.map(emp => {
          const sc = statusConfig[emp.status];
          return (
            <motion.div key={emp.id} layout
              className="glass-card p-4 flex items-center gap-3 cursor-pointer active:border-orange/30 transition-colors"
              onClick={() => setSelectedEmp(emp)}>
              <span className="text-2xl w-10 text-center shrink-0">{emp.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{emp.name}</div>
                <div className="text-text-tertiary text-xs">{emp.role}</div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: sc.color, background: sc.bg }}>
                  {sc.label}
                </span>
                <span className="text-text-tertiary text-[10px] flex items-center gap-0.5">
                  <Clock size={10} /> {emp.schedule}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedEmp(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="text-center mb-6">
                <span className="text-5xl">{selectedEmp.avatar}</span>
                <h3 className="text-white font-bold text-lg mt-3">{selectedEmp.name}</h3>
                <p className="text-text-secondary text-sm">{selectedEmp.role}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="glass-card p-3 flex items-center gap-3">
                  <Phone size={16} className="text-blue" />
                  <span className="text-white text-sm">{selectedEmp.phone}</span>
                </div>
                <div className="glass-card p-3 flex items-center gap-3">
                  <Clock size={16} className="text-violet" />
                  <span className="text-white text-sm">{selectedEmp.schedule}</span>
                </div>
              </div>

              <p className="text-text-tertiary text-xs font-semibold mb-3 uppercase tracking-wider">Marquer la présence</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(statusConfig) as [Employee['status'], typeof statusConfig.present][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => { updateStatus(selectedEmp.id, key); setSelectedEmp({ ...selectedEmp, status: key }); }}
                    className={`py-3 rounded-xl text-xs font-bold transition-all ${selectedEmp.status === key ? 'ring-2 ring-offset-1 ring-offset-bg-card' : ''}`}
                    style={{ background: cfg.bg, color: cfg.color, '--tw-ring-color': cfg.color } as React.CSSProperties}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Nouvel employé</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Nom complet" value={newEmp.name} onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <select value={newEmp.role} onChange={e => setNewEmp(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  <option value="">Poste</option>
                  <option value="Cuisinier">Cuisinier</option>
                  <option value="Serveur/se">Serveur/se</option>
                  <option value="Caissier/ère">Caissier/ère</option>
                  <option value="Plongeur/se">Plongeur/se</option>
                  <option value="Livreur">Livreur</option>
                  <option value="Chef cuisine">Chef cuisine</option>
                </select>
                <input type="tel" placeholder="Téléphone" value={newEmp.phone} onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Horaires (ex: 07:00 - 15:00)" value={newEmp.schedule} onChange={e => setNewEmp(p => ({ ...p, schedule: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleAdd}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm">
                  Ajouter l'employé
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      ) : (
        /* Shift Swapping Tab */
        <div className="space-y-6">
          <div className="glass-card p-5 border-blue/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue/20 text-blue flex items-center justify-center">
                <RefreshCw size={18} />
              </div>
              <div>
                <h3 className="text-white font-bold">Demandes en attente</h3>
                <p className="text-text-secondary text-xs">Échange de services</p>
              </div>
            </div>

            {swapRequests.map(req => (
              <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-white font-bold text-sm">{req.from}</span>
                    <p className="text-text-tertiary text-xs">{req.role}</p>
                  </div>
                  <span className="px-3 py-1 bg-orange/20 text-orange rounded-full text-xs font-bold">{req.date}</span>
                </div>
                
                {req.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg bg-white/10 text-white font-bold text-xs" onClick={() => {
                      setSwapRequests(r => r.filter(x => x.id !== req.id));
                    }}>Refuser</button>
                    <button className="flex-1 py-2 rounded-lg bg-green text-white font-bold text-xs flex items-center justify-center gap-1"
                      onClick={() => {
                        setSwapRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'accepted' } : x));
                      }}>
                      <Check size={14} /> Accepter
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-center text-green font-bold text-xs bg-green/10 rounded-lg">
                    Remplacement accepté ✓
                  </div>
                )}
              </div>
            ))}

            {swapRequests.length === 0 && (
              <div className="text-center py-6 text-text-tertiary text-sm">
                Aucune demande en attente.
              </div>
            )}
          </div>

          <button className="w-full py-4 rounded-xl border border-dashed border-white/20 text-white font-bold text-sm hover:bg-white/5">
            + Demander un remplacement
          </button>
        </div>
      )}
    </div>
  );
}
