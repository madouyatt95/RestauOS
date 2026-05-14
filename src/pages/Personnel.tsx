import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore, type ShiftType } from '../stores/planningStore';
import { Plus, Phone, Clock, RefreshCw, Check, Calendar as CalendarIcon, UserPlus, X } from 'lucide-react';

const statusConfig = {
  present: { label: 'Présent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  retard: { label: 'Retard', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  repos: { label: 'Repos', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

const shiftTypes: { type: ShiftType; label: string; hours: string; color: string }[] = [
  { type: 'midi', label: 'Service Midi', hours: '11:00 - 15:30', color: 'bg-orange' },
  { type: 'soir', label: 'Service Soir', hours: '18:30 - 23:30', color: 'bg-blue' },
  { type: 'journee', label: 'Coupure/Journée', hours: '10:00 - 22:00', color: 'bg-violet' },
  { type: 'repos', label: 'Repos', hours: 'OFF', color: 'bg-zinc-600' },
];

export default function Personnel() {
  const { employees, addEmployee, updateStatus } = useStaffStore();
  const { shifts, addShift, removeShift } = usePlanningStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'presences' | 'planning' | 'echanges'>('presences');
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', phone: '' });
  
  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');

  const handleAddEmployee = () => {
    if (!newEmp.name || !newEmp.role) return;
    addEmployee({
      name: newEmp.name,
      role: newEmp.role,
      phone: newEmp.phone || '77 000 00 00',
      avatar: '👤',
      schedule: 'À définir',
      status: 'repos',
    });
    setShowAddEmp(false);
  };

  const currentShifts = shifts.filter(s => s.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#0a0c10]">
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-white font-black text-2xl">Gestion RH</h1>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">Équipe & Planning</p>
        </div>
        {isManager && activeTab === 'presences' && (
          <button onClick={() => setShowAddEmp(true)} className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center text-white shadow-lg shadow-orange/20">
            <UserPlus size={20} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 px-4">
        {[
          { id: 'presences', label: 'Présences', icon: Check },
          { id: 'planning', label: 'Planning', icon: CalendarIcon },
          { id: 'echanges', label: 'Échanges', icon: RefreshCw },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all border ${activeTab === tab.id ? 'bg-white/10 border-white/20 text-white shadow-xl' : 'bg-transparent border-transparent text-text-tertiary'}`}
          >
            <tab.icon size={18} />
            <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'presences' && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/60 font-bold text-[10px] uppercase tracking-widest">En poste aujourd'hui</h3>
            <span className="text-orange font-black text-xs">{employees.filter(e => e.status === 'present').length} / {employees.length}</span>
          </div>
          {employees.map(emp => {
            const sc = statusConfig[emp.status];
            const hasShift = currentShifts.find(s => s.employeeId === emp.id);
            return (
              <motion.div key={emp.id} layout className="glass-card p-4 flex items-center gap-4 border-white/5 active:scale-98 transition-all" onClick={() => setSelectedEmp(emp)}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                  {emp.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black text-sm">{emp.name}</h4>
                  <p className="text-text-tertiary text-[10px] font-bold uppercase">{emp.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black px-3 py-1 rounded-full shadow-sm" style={{ color: sc.color, background: sc.bg }}>
                    {sc.label}
                  </span>
                  {hasShift && (
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-text-tertiary">
                      <Clock size={10} />
                      <span className="text-[9px] font-bold">{hasShift.hours}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="px-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-lg">Rotation Semaine</h3>
            {isManager && (
              <button onClick={() => setShowAddShift(true)} className="px-4 py-2 rounded-xl bg-blue text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue/20">
                <Plus size={14} /> Établir Planning
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, idx) => {
              const date = new Date();
              date.setDate(date.getDate() + idx);
              const dateStr = date.toISOString().split('T')[0];
              const dayShifts = shifts.filter(s => s.date === dateStr);

              return (
                <div key={day} className="relative pl-6 border-l border-white/10">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue" />
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">{day} <span className="text-text-tertiary ml-2">{date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span></h4>
                    <span className="text-[10px] font-bold text-text-tertiary">{dayShifts.length} Services</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {dayShifts.map(s => {
                      const emp = employees.find(e => e.id === s.employeeId);
                      const type = shiftTypes.find(t => t.type === s.type);
                      return (
                        <div key={s.id} className="glass-card p-3 border-white/5 flex flex-col gap-2 relative group">
                          {isManager && (
                            <button onClick={() => removeShift(s.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} />
                            </button>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{emp?.avatar}</span>
                            <span className="text-white font-bold text-xs truncate">{emp?.name}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-lg ${type?.color} bg-opacity-20 text-[8px] font-black uppercase flex items-center justify-between`}>
                            <span style={{ color: 'white' }}>{type?.label}</span>
                            <span className="opacity-60">{s.hours}</span>
                          </div>
                        </div>
                      );
                    })}
                    {dayShifts.length === 0 && (
                      <div className="col-span-2 py-4 text-center text-text-tertiary italic text-[10px]">Aucun shift planifié</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Shift Modal (Manager) */}
      <AnimatePresence>
        {showAddShift && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddShift(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-6">Attribuer un Shift</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3 block">1. Choisir l'employé</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {employees.map(emp => (
                      <button key={emp.id} onClick={() => setSelectedEmp(emp)} className={`flex flex-col items-center gap-2 min-w-[70px] p-3 rounded-2xl border transition-all ${selectedEmp?.id === emp.id ? 'bg-orange/10 border-orange' : 'bg-white/5 border-transparent'}`}>
                        <span className="text-2xl">{emp.avatar}</span>
                        <span className="text-[10px] font-bold text-white truncate w-full text-center">{emp.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3 block">2. Type de Service</label>
                  <div className="grid grid-cols-2 gap-3">
                    {shiftTypes.map(st => (
                      <button 
                        key={st.type} 
                        onClick={() => {
                          if (!selectedEmp) { alert("Choisissez d'abord un employé"); return; }
                          addShift({
                            employeeId: selectedEmp.id,
                            date: new Date().toISOString().split('T')[0], // Simplicity: for today/tomorrow in demo
                            type: st.type,
                            hours: st.hours
                          });
                          setShowAddShift(false);
                        }}
                        className={`p-4 rounded-2xl border border-white/10 bg-white/5 text-left flex flex-col gap-1 active:scale-95 transition-all`}
                      >
                        <span className="text-white font-black text-xs uppercase">{st.label}</span>
                        <span className="text-text-tertiary text-[10px]">{st.hours}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddEmp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddEmp(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-6">Nouvel Employé</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Nom complet" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white" />
                <select value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white appearance-none">
                  <option value="">Choisir un poste</option>
                  <option value="Serveur">Serveur</option>
                  <option value="Chef cuisine">Chef cuisine</option>
                  <option value="Caissier">Caissier</option>
                </select>
                <button onClick={handleAddEmployee} className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm shadow-lg shadow-orange/20">Ajouter à l'équipe</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {selectedEmp && activeTab === 'presences' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedEmp(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-5xl mx-auto mb-4 border border-white/10">{selectedEmp.avatar}</div>
                <h3 className="text-white font-black text-2xl">{selectedEmp.name}</h3>
                <p className="text-orange font-bold text-xs uppercase tracking-widest">{selectedEmp.role}</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">Statut actuel</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button 
                        key={key} 
                        onClick={() => { updateStatus(selectedEmp.id, key as any); setSelectedEmp({...selectedEmp, status: key as any}); }}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedEmp.status === key ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-[#1a1c22]' : ''}`}
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-3">
                  <Phone size={18} /> Contacter {selectedEmp.name.split(' ')[0]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
