import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { Plus, ChevronLeft, ChevronRight, Phone, Clock } from 'lucide-react';

const statusConfig = {
  present: { label: 'Présent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  retard: { label: 'Retard', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  repos: { label: 'Repos', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export default function Personnel() {
  const { employees, addEmployee, updateStatus } = useStaffStore();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', phone: '', schedule: '' });

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
        <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full bg-orange flex items-center justify-center">
          <Plus size={16} className="text-white" />
        </button>
      </div>

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
    </div>
  );
}
