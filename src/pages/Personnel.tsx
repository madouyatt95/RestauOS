import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { useAuthStore } from '../stores/authStore';
import { Plus, Phone, Clock, RefreshCw, Check } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const statusConfig = {
  present: { label: 'Présent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  retard: { label: 'Retard', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  repos: { label: 'Repos', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export default function Personnel() {
  const { employees, addEmployee, updateStatus } = useStaffStore();
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showRequestSwap, setShowSwapRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'employes' | 'calendrier' | 'remplacements'>('employes');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', phone: '', schedule: '' });
  const [swapRequests, setSwapRequests] = useState([
    { id: 1, from: 'Awa Fall', role: 'Serveur/se', date: 'Jeudi Soir', status: 'pending' }
  ]);

  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');

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
        {activeTab === 'employes' && isManager && (
          <button onClick={() => setShowAdd(true)} className="w-9 h-9 rounded-full bg-orange flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => setActiveTab('employes')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'employes' ? 'bg-bg-card shadow text-white' : 'text-text-secondary'}`}>
          Présences
        </button>
        <button onClick={() => setActiveTab('calendrier')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'calendrier' ? 'bg-bg-card shadow text-white' : 'text-text-secondary'}`}>
          Planning complet
        </button>
        <button onClick={() => setActiveTab('remplacements')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'remplacements' ? 'bg-bg-card shadow text-white' : 'text-text-secondary'}`}>
          Échanges
        </button>
      </div>

      {activeTab === 'employes' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">Aujourd'hui, {new Date().toLocaleDateString('fr-FR')}</h3>
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
        </>
      )}

      {activeTab === 'calendrier' && (
        <div className="glass-card-lg p-4 bg-white rounded-2xl overflow-hidden">
          <style>{`
            .fc { font-family: 'Inter', sans-serif; }
            .fc-toolbar-title { font-size: 1.1rem !important; font-weight: 900 !important; color: #111827 !important; text-transform: capitalize; }
            .fc-button-primary { background: var(--color-orange) !important; border: none !important; font-weight: bold !important; text-transform: capitalize; border-radius: 8px !important; }
            .fc-button-primary:not(:disabled):active, .fc-button-primary:not(:disabled).fc-button-active { background: #E67A00 !important; }
            .fc-daygrid-day-number { color: #4B5563 !important; font-weight: 600; text-decoration: none; }
            .fc-col-header-cell-cushion { color: #111827 !important; font-weight: 800; padding: 8px !important; text-transform: uppercase; font-size: 0.75rem; }
            .fc-theme-standard td, .fc-theme-standard th { border-color: #E5E7EB; }
            .fc-event { border-radius: 4px; border: none; padding: 2px 4px; font-size: 0.7rem; font-weight: bold; cursor: pointer; }
            .fc-h-event .fc-event-main { color: white; }
          `}</style>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="fr"
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            height={500}
            editable={isManager}
            selectable={isManager}
            events={[
              { title: 'Awa F. (08h-16h)', date: new Date().toISOString().split('T')[0], color: '#3B82F6' },
              { title: 'Ibrahima B. (16h-23h)', date: new Date().toISOString().split('T')[0], color: '#F59E0B' },
              { title: 'Fatou N. (08h-16h)', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], color: '#EC4899' },
            ]}
          />
        </div>
      )}

      {activeTab === 'remplacements' && (
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
                
                {req.status === 'pending' && isManager ? (
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
                ) : req.status === 'pending' ? (
                  <div className="py-2 text-center text-orange font-bold text-xs bg-orange/10 rounded-lg">
                    En attente de validation
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

          {!isManager && (
            <button onClick={() => setShowSwapRequest(true)} className="w-full py-4 rounded-xl border border-dashed border-white/20 text-white font-bold text-sm hover:bg-white/5">
              + Demander un remplacement
            </button>
          )}
        </div>
      )}

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

              {isManager && (
                <>
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
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Swap Modal */}
      <AnimatePresence>
        {showRequestSwap && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowSwapRequest(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Demande de remplacement</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Date et Service (ex: Jeudi Soir)" 
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <textarea placeholder="Raison de l'absence..." rows={3}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none resize-none" />
                <button onClick={() => {
                  setSwapRequests([{ id: Date.now(), from: user?.name || 'Moi', role: user?.role || 'Employé', date: 'Bientôt', status: 'pending' }, ...swapRequests]);
                  setShowSwapRequest(false);
                }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm mt-2">
                  Envoyer la demande
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAdd && isManager && (
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
