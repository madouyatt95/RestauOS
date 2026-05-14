import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore, type ShiftType } from '../stores/planningStore';
import { Phone, ChevronLeft, ChevronRight, Plus, X, Sun, Moon, Clock, Users, RefreshCw, Check, AlertCircle } from 'lucide-react';

const statusConfig = {
  present: { label: 'Présent', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  retard: { label: 'Retard', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  absent: { label: 'Absent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  repos: { label: 'Repos', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

const shiftConfig: Record<ShiftType, { label: string; short: string; color: string; bg: string; icon: any; hours: string }> = {
  midi: { label: 'Service Midi', short: 'MIDI', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: Sun, hours: '11:00 - 16:00' },
  soir: { label: 'Service Soir', short: 'SOIR', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: Moon, hours: '18:00 - 23:00' },
  journee: { label: 'Coupure', short: 'CPR', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', icon: Clock, hours: '10:00 - 22:00' },
  repos: { label: 'Repos', short: 'OFF', color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: X, hours: '' },
};

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekDates(weekOffset: number): { label: string; date: string; isToday: boolean }[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  return JOURS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === now.toISOString().split('T')[0];
    return { label: `${label} ${d.getDate()}/${d.getMonth() + 1}`, date: dateStr, isToday };
  });
}

export default function Personnel() {
  const { employees, updateStatus } = useStaffStore();
  const { shifts, addShift, removeShift, swapRequests, updateSwapStatus } = usePlanningStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'planning' | 'presences' | 'echanges'>('planning');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [addingShift, setAddingShift] = useState<{ empId: string; date: string } | null>(null);

  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayStr = new Date().toISOString().split('T')[0];

  const getShifts = (empId: string, date: string) => {
    return shifts.filter(s => s.employeeId === empId && s.date === date);
  };

  // Get today's shifts for an employee (used in Presences tab)
  const getTodayShifts = (empId: string) => {
    return shifts.filter(s => s.employeeId === empId && s.date === todayStr);
  };

  const weekLabel = useMemo(() => {
    const fd = new Date(weekDates[0].date);
    const ld = new Date(weekDates[6].date);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${fd.getDate()} ${months[fd.getMonth()]} — ${ld.getDate()} ${months[ld.getMonth()]}`;
  }, [weekDates]);

  const weekShiftCount = useMemo(() => {
    const dates = weekDates.map(d => d.date);
    return shifts.filter(s => dates.includes(s.date)).length;
  }, [shifts, weekDates]);

  const pendingSwaps = swapRequests.filter(r => r.status === 'pending');

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#0a0c10]">

      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-white font-black text-2xl">Personnel</h1>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">Planning & Équipe</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 px-4">
        {[
          { id: 'planning', label: 'Planning', icon: Clock, badge: 0 },
          { id: 'presences', label: 'Présences', icon: Users, badge: 0 },
          { id: 'echanges', label: 'Échanges', icon: RefreshCw, badge: pendingSwaps.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border relative ${activeTab === tab.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-text-tertiary'}`}
          >
            <tab.icon size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red text-white text-[9px] font-black flex items-center justify-center animate-pulse">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── PLANNING TAB ─── */}
      {activeTab === 'planning' && (
        <div className="px-2">
          <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <span className="text-white font-black text-sm uppercase tracking-widest">{weekLabel}</span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-text-tertiary text-[10px] font-bold">{weekShiftCount} services planifiés</span>
                {weekOffset !== 0 && (
                  <button onClick={() => setWeekOffset(0)} className="text-orange text-[10px] font-black underline">Aujourd'hui</button>
                )}
              </div>
            </div>
            <button onClick={() => setWeekOffset(w => w + 1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="overflow-x-auto pb-4">
            <div style={{ minWidth: '700px' }}>
              <div className="flex mb-2">
                <div className="w-28 shrink-0" />
                {weekDates.map(d => (
                  <div key={d.date} className={`flex-1 text-center py-2 rounded-xl mx-0.5 ${d.isToday ? 'bg-orange/10 border border-orange/30' : ''}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${d.isToday ? 'text-orange' : 'text-text-tertiary'}`}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>

              {employees.map(emp => (
                <div key={emp.id} className="flex items-stretch mb-1.5">
                  <div className="w-28 shrink-0 flex items-center gap-2 pr-2">
                    <span className="text-lg">{emp.avatar}</span>
                    <div className="min-w-0">
                      <span className="text-white font-bold text-[10px] block truncate">{emp.name.split(' ')[0]}</span>
                      <span className="text-text-tertiary text-[8px] font-bold uppercase">{emp.role}</span>
                    </div>
                  </div>
                  {weekDates.map(d => {
                    const dayShifts = getShifts(emp.id, d.date);
                    return (
                      <div key={d.date} className={`flex-1 mx-0.5 rounded-xl min-h-[52px] flex flex-col items-center justify-center gap-0.5 p-0.5 transition-all ${d.isToday ? 'ring-1 ring-orange/20' : ''}`}>
                        {dayShifts.map(shift => {
                          const cfg = shiftConfig[shift.type];
                          return (
                            <motion.button
                              key={shift.id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-full rounded-lg flex items-center justify-center gap-1 py-1.5 active:scale-95 transition-transform"
                              style={{ background: cfg.bg }}
                              onClick={() => {
                                if (isManager && confirm(`Supprimer le service ${cfg.label} de ${emp.name} ?`)) {
                                  removeShift(shift.id);
                                }
                              }}
                            >
                              <cfg.icon size={10} style={{ color: cfg.color }} />
                              <span className="text-[7px] font-black uppercase" style={{ color: cfg.color }}>{cfg.short}</span>
                            </motion.button>
                          );
                        })}
                        {isManager && dayShifts.length < 2 && (
                          <button
                            onClick={() => setAddingShift({ empId: emp.id, date: d.date })}
                            className="w-full flex-1 min-h-[20px] rounded-lg border border-dashed border-white/10 flex items-center justify-center hover:border-orange/40 hover:bg-orange/5 transition-all"
                          >
                            <Plus size={10} className="text-white/20" />
                          </button>
                        )}
                        {!isManager && dayShifts.length === 0 && (
                          <div className="w-full flex-1 min-h-[20px] rounded-lg border border-dashed border-white/5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 px-2 mt-4">
            {Object.entries(shiftConfig).filter(([k]) => k !== 'repos').map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: cfg.bg }}>
                <cfg.icon size={10} style={{ color: cfg.color }} />
                <span className="text-[9px] font-black uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            ))}
          </div>

          {isManager && (
            <p className="text-[10px] text-text-tertiary text-center mt-6 px-4">
              Cliquez sur une case vide pour assigner un service · Cliquez sur un service pour le supprimer
            </p>
          )}
        </div>
      )}

      {/* ─── PRESENCES TAB (connected to Planning) ─── */}
      {activeTab === 'presences' && (
        <div className="px-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/60 font-black text-[10px] uppercase tracking-widest">Équipe du jour</h3>
            <span className="text-orange font-black text-xs">{employees.filter(e => e.status === 'present').length} / {employees.length}</span>
          </div>
          {employees.map(emp => {
            const sc = statusConfig[emp.status];
            const todayShifts = getTodayShifts(emp.id);
            return (
              <motion.div key={emp.id} layout className="glass-card p-4 flex items-center gap-4 border-white/5 active:scale-98 transition-all" onClick={() => setSelectedEmp(emp)}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                  {emp.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black text-sm">{emp.name}</h4>
                  <p className="text-text-tertiary text-[10px] font-bold uppercase">{emp.role}</p>
                  {todayShifts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {todayShifts.map(ts => {
                        const tc = shiftConfig[ts.type];
                        return (
                          <div key={ts.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: tc.bg }}>
                            <tc.icon size={9} style={{ color: tc.color }} />
                            <span className="text-[8px] font-black uppercase" style={{ color: tc.color }}>{tc.short} {ts.hours}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-text-tertiary mt-1 block">Pas de service aujourd'hui</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-black px-3 py-1 rounded-full" style={{ color: sc.color, background: sc.bg }}>
                    {sc.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── ECHANGES TAB ─── */}
      {activeTab === 'echanges' && (
        <div className="px-4">
          {swapRequests.length === 0 ? (
            <div className="py-16 text-center">
              <RefreshCw size={36} className="text-white/10 mx-auto mb-4" />
              <p className="text-text-tertiary text-sm font-bold">Aucune demande d'échange</p>
              <p className="text-text-tertiary text-[10px] mt-1">Les demandes de switch apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {swapRequests.map(req => {
                const fromEmp = employees.find(e => e.id === req.fromEmployeeId);
                const toEmp = employees.find(e => e.id === req.toEmployeeId);
                const shift = shifts.find(s => s.id === req.shiftId);
                const sCfg = shift ? shiftConfig[shift.type] : null;
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';

                return (
                  <motion.div key={req.id} layout className={`glass-card p-5 border-white/5 ${isPending ? 'border-l-4 border-l-orange' : isApproved ? 'border-l-4 border-l-green opacity-60' : 'border-l-4 border-l-red opacity-40'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className={isPending ? 'text-orange' : isApproved ? 'text-green' : 'text-red'} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isPending ? 'text-orange' : isApproved ? 'text-green' : 'text-red'}`}>
                          {isPending ? 'En attente' : isApproved ? 'Approuvé' : 'Refusé'}
                        </span>
                      </div>
                      <span className="text-text-tertiary text-[9px] font-bold">{new Date(req.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{fromEmp?.avatar}</span>
                        <span className="text-white font-bold text-xs truncate">{fromEmp?.name}</span>
                      </div>
                      <RefreshCw size={16} className="text-text-tertiary shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-white font-bold text-xs truncate">{toEmp?.name}</span>
                        <span className="text-lg">{toEmp?.avatar}</span>
                      </div>
                    </div>

                    {sCfg && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: sCfg.bg }}>
                        <sCfg.icon size={12} style={{ color: sCfg.color }} />
                        <span className="text-[10px] font-black uppercase" style={{ color: sCfg.color }}>{sCfg.label}</span>
                      </div>
                    )}

                    <p className="text-text-secondary text-[11px] italic mb-4">« {req.reason} »</p>

                    {isPending && isManager && (
                      <div className="flex gap-3">
                        <button onClick={() => updateSwapStatus(req.id, 'approved')} className="flex-1 py-3 rounded-2xl bg-green/10 text-green font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform border border-green/20">
                          <Check size={16} /> Accepter
                        </button>
                        <button onClick={() => updateSwapStatus(req.id, 'rejected')} className="flex-1 py-3 rounded-2xl bg-red/10 text-red font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red/20">
                          <X size={16} /> Refuser
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Shift Modal */}
      <AnimatePresence>
        {addingShift && isManager && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setAddingShift(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-2 text-center">Assigner un service</h3>
              <p className="text-text-tertiary text-xs text-center mb-8">
                {employees.find(e => e.id === addingShift.empId)?.name} — {new Date(addingShift.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(shiftConfig).filter(([k]) => k !== 'repos').map(([key, cfg]) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      addShift({
                        employeeId: addingShift.empId,
                        date: addingShift.date,
                        type: key as ShiftType,
                        hours: cfg.hours,
                      });
                      setAddingShift(null);
                    }}
                    className="p-5 rounded-2xl border border-white/10 flex flex-col items-center gap-3 active:scale-95 transition-all hover:border-opacity-50"
                    style={{ background: cfg.bg, borderColor: cfg.color + '40' }}
                  >
                    <cfg.icon size={28} style={{ color: cfg.color }} />
                    <div className="text-center">
                      <span className="text-white font-black text-xs uppercase block">{cfg.label}</span>
                      <span className="text-text-tertiary text-[10px]">{cfg.hours}</span>
                    </div>
                  </motion.button>
                ))}
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
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-5xl mx-auto mb-4 border border-white/10">{selectedEmp.avatar}</div>
                <h3 className="text-white font-black text-2xl">{selectedEmp.name}</h3>
                <p className="text-orange font-bold text-xs uppercase tracking-widest">{selectedEmp.role}</p>
              </div>

              {/* Show today's shifts info in the modal */}
              {(() => {
                const todayS = getTodayShifts(selectedEmp.id);
                return todayS.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    {todayS.map(ts => {
                      const tc = shiftConfig[ts.type];
                      return (
                        <div key={ts.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: tc.bg }}>
                          <tc.icon size={18} style={{ color: tc.color }} />
                          <div>
                            <span className="text-white font-bold text-xs block">{tc.label}</span>
                            <span className="text-text-tertiary text-[10px]">{ts.hours}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 bg-white/5">
                    <X size={18} className="text-text-tertiary" />
                    <span className="text-text-tertiary text-xs font-bold">Pas de service planifié aujourd'hui</span>
                  </div>
                );
              })()}

              <div className="space-y-4">
                <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Modifier le statut</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => { updateStatus(selectedEmp.id, key as any); setSelectedEmp({...selectedEmp, status: key as any}); }}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${selectedEmp.status === key ? 'ring-2 ring-white/50' : ''}`}
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
                <a href={`tel:${selectedEmp.phone}`} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-3">
                  <Phone size={18} /> Appeler {selectedEmp.name.split(' ')[0]}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
