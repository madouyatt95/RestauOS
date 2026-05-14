import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore } from '../stores/planningStore';
import { Phone, Clock, RefreshCw, Check, Calendar as CalendarIcon } from 'lucide-react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

const statusConfig = {
  present: { label: 'Présent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  retard: { label: 'Retard', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  repos: { label: 'Repos', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export default function Personnel() {
  const { employees, updateStatus } = useStaffStore();
  const { shifts, addShift, removeShift } = usePlanningStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'presences' | 'calendrier' | 'remplacements'>('presences');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShift, setNewShift] = useState({ empId: '', date: '', type: 'midi' as any });

  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');

  const calendarEvents = useMemo(() => {
    return shifts.map(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      return {
        id: s.id,
        title: `${emp?.name || 'Inconnu'} (${s.type.toUpperCase()})`,
        start: `${s.date}${s.type === 'midi' ? 'T11:00:00' : 'T18:00:00'}`,
        end: `${s.date}${s.type === 'midi' ? 'T16:00:00' : 'T23:00:00'}`,
        color: s.type === 'midi' ? '#F59E0B' : s.type === 'soir' ? '#3B82F6' : '#8B5CF6',
        extendedProps: { employeeId: s.employeeId }
      };
    });
  }, [shifts, employees]);

  const handleDateClick = (info: any) => {
    if (!isManager) return;
    setNewShift({ ...newShift, date: info.dateStr });
    setShowAddShift(true);
  };

  const handleEventClick = (info: any) => {
    if (!isManager) return;
    if (confirm("Supprimer ce service du planning ?")) {
      removeShift(info.event.id);
    }
  };

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#0a0c10]">
      <style>{`
        .fc { font-family: 'Inter', sans-serif; color: white; background: transparent !important; }
        .fc-toolbar-title { font-size: 0.9rem !important; font-weight: 900 !important; color: white !important; text-transform: capitalize; }
        .fc-button-primary { background: #ff8a00 !important; border: none !important; font-weight: bold !important; border-radius: 12px !important; font-size: 0.7rem !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.05) !important; }
        .fc-list-day-cushion { background: rgba(255,138,0,0.1) !important; }
        .fc-list-event:hover td { background: rgba(255,255,255,0.05) !important; }
        .fc-list-event-title { color: white !important; font-weight: 600 !important; }
        .fc-col-header-cell-cushion { color: #A1A1AA !important; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; text-decoration: none !important; }
        .fc-daygrid-day-number { color: white !important; font-size: 0.7rem; font-weight: 600; text-decoration: none !important; }
      `}</style>

      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-white font-black text-2xl">Personnel</h1>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">Équipe & Planning</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 px-4">
        {[
          { id: 'presences', label: 'Présences', icon: Check },
          { id: 'calendrier', label: 'Calendrier', icon: CalendarIcon },
          { id: 'remplacements', label: 'Échanges', icon: RefreshCw },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all border ${activeTab === tab.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-text-tertiary'}`}
          >
            <tab.icon size={18} />
            <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'presences' && (
        <div className="px-4 space-y-3">
          {employees.map(emp => {
            const sc = statusConfig[emp.status];
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
                  <span className="text-[9px] font-black px-3 py-1 rounded-full" style={{ color: sc.color, background: sc.bg }}>
                    {sc.label}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1 text-text-tertiary">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold">{emp.schedule}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'calendrier' && (
        <div className="px-2">
          <div className="glass-card p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="listWeek"
              locale="fr"
              headerToolbar={{
                left: 'prev,next',
                center: 'title',
                right: 'listWeek,dayGridMonth'
              }}
              height="auto"
              events={calendarEvents}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              editable={false}
            />
          </div>
          {isManager && (
            <p className="text-[10px] text-text-tertiary italic text-center mt-4">
              * Cliquez sur une date pour ajouter un service. Cliquez sur un service pour le supprimer.
            </p>
          )}
        </div>
      )}

      {activeTab === 'remplacements' && (
        <div className="px-4 py-12 text-center text-text-tertiary italic text-sm">
          Aucune demande d'échange en cours.
        </div>
      )}

      {/* Add Shift Modal (Manager) */}
      <AnimatePresence>
        {showAddShift && isManager && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddShift(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-6">Ajouter au Planning</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3 block">Employé</label>
                  <div className="grid grid-cols-3 gap-2">
                    {employees.map(emp => (
                      <button key={emp.id} onClick={() => setNewShift({ ...newShift, empId: emp.id })} className={`p-3 rounded-xl border transition-all text-center ${newShift.empId === emp.id ? 'bg-orange/20 border-orange text-orange' : 'bg-white/5 border-transparent text-white'}`}>
                        <span className="text-xl block mb-1">{emp.avatar}</span>
                        <span className="text-[8px] font-bold uppercase truncate block">{emp.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3 block">Type de Service</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'midi', label: 'Service Midi', hours: '11:00 - 16:00' },
                      { id: 'soir', label: 'Service Soir', hours: '18:00 - 23:00' },
                    ].map(st => (
                      <button key={st.id} onClick={() => {
                        if (!newShift.empId) return alert("Sélectionnez un employé");
                        addShift({
                          employeeId: newShift.empId,
                          date: newShift.date,
                          type: st.id as any,
                          hours: st.hours
                        });
                        setShowAddShift(false);
                      }} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left active:scale-95 transition-all">
                        <span className="text-white font-black text-xs uppercase block">{st.label}</span>
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
              <div className="space-y-4">
                <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">Statut actuel</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => { updateStatus(selectedEmp.id, key as any); setSelectedEmp({...selectedEmp, status: key as any}); }}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedEmp.status === key ? 'ring-2 ring-white/50' : ''}`}
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </button>
                  ))}
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
