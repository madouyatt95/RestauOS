import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStaffStore, type Employee } from '../stores/staffStore';
import { useAuthStore } from '../stores/authStore';
import { usePlanningStore, type ShiftType } from '../stores/planningStore';
import { useHospiStore } from '../stores/hospiStore';
import { getVisiblePOS, getVisibleSites, isDirection } from '../utils/accessControl';
import { Phone, ChevronLeft, ChevronRight, Plus, X, Sun, Moon, Clock, Users, RefreshCw, Check, AlertCircle, UserPlus, Trash2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const { employees, updateStatus, addEmployee, removeEmployee } = useStaffStore();
  const { shifts, addShift, removeShift, swapRequests, addSwapRequest, colleagueRespond, managerRespond } = usePlanningStore();
  const { sites, posList } = useHospiStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'planning' | 'presences' | 'echanges'>('planning');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [addingShift, setAddingShift] = useState<{ empId: string; date: string } | null>(null);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [swapStep, setSwapStep] = useState(1);
  const [swapSelectedShift, setSwapSelectedShift] = useState<string | null>(null);
  const [swapTargetEmp, setSwapTargetEmp] = useState<string | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Serveur');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpAvatar, setNewEmpAvatar] = useState('🧑‍🍽️');
  const [presenceFilter, setPresenceFilter] = useState('Tous');
  const [showQREmp, setShowQREmp] = useState<Employee | null>(null);
  const [personnelNotice, setPersonnelNotice] = useState('');

  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');
  const visibleSiteIds = getVisibleSites(user, sites).map(site => site.id);
  const visiblePOSIds = getVisiblePOS(user, posList).map(pos => pos.id);
  const scopedEmployees = employees.filter(emp => {
    if (isDirection(user)) return true;
    const empSites = emp.siteIds || [];
    const empPOS = emp.posIds || [];
    const siteMatch = empSites.length === 0 || empSites.some(siteId => visibleSiteIds.includes(siteId));
    const posMatch = visiblePOSIds.length === 0 || empPOS.length === 0 || empPOS.some(posId => visiblePOSIds.includes(posId));
    return siteMatch && posMatch;
  });

  // Find current user's employee record
  const currentEmployee = employees.find(e => e.id === user?.employeeId) || employees.find(e => e.name === user?.name);
  const myShifts = currentEmployee ? shifts.filter(s => s.employeeId === currentEmployee.id) : [];
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayStr = new Date().toISOString().split('T')[0];

  const ROLE_GROUPS: Record<string, string[]> = {
    'Salle': ['Serveur', 'Serveuse', 'Hôtesse', 'Barman'],
    'Cuisine': ['Chef Cuisine', 'Second Cuisine', 'Commis', 'Plongeur', 'Plongeuse', 'Cuisinier'],
    'Livraison': ['Livreur', 'Livreur Indépendant'],
    'Management': ['Caissier', 'Gérant', 'Admin']
  };

  const moduleLabels: Record<string, string> = {
    restaurant: 'Restaurant',
    hotel: 'Hôtel',
    casino: 'Casino',
    spa: 'Spa',
    boutique: 'Boutique',
    stock: 'Stock',
    direction: 'Direction',
  };

  const accessLabels: Record<string, string> = {
    direction: 'Direction',
    manager: 'Gérant',
    supervisor: 'Responsable',
    staff: 'Équipe',
  };

  const getEmployeeScope = (emp: Employee) => {
    const siteNames = (emp.siteIds || []).map(id => sites.find(site => site.id === id)?.name).filter(Boolean);
    const posNames = (emp.posIds || []).map(id => posList.find(pos => pos.id === id)?.name).filter(Boolean);
    const moduleNames = (emp.businessModules || []).map(module => moduleLabels[module] || module);
    return {
      sites: siteNames.join(', ') || 'Site non affecté',
      pos: posNames.join(', ') || 'Aucun point de vente',
      modules: moduleNames.join(', ') || 'Aucune activité',
      access: emp.accessLevel ? accessLabels[emp.accessLevel] : 'Équipe',
    };
  };

  const availableRoles = ['Tous', 'Salle', 'Cuisine', 'Livraison', 'Management'];
  const filteredEmployees = useMemo(() => scopedEmployees.filter(e => {
    if (roleFilter === 'Tous') return true;
    return ROLE_GROUPS[roleFilter]?.includes(e.role);
  }), [scopedEmployees, roleFilter]);

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

  // Count actionable requests for the badge
  const actionableSwaps = swapRequests.filter(r => {
    if (isManager) return r.status === 'pending_manager';
    if (currentEmployee) return r.status === 'pending_colleague' && r.toEmployeeId === currentEmployee.id;
    return false;
  });

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#0a0c10]">

      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h1 className="text-white font-black text-2xl">Personnel</h1>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">{scopedEmployees.length} salariés visibles</p>
        </div>
        {isManager && (
          <button onClick={() => { setShowAddEmployee(true); setNewEmpName(''); setNewEmpPhone(''); setNewEmpRole('Serveur'); setNewEmpAvatar('🧑‍🍽️'); }}
            className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-orange/20">
            <UserPlus size={18} />
          </button>
        )}
      </div>
      {personnelNotice && (
        <button onClick={() => setPersonnelNotice('')} className="mx-4 mb-4 w-[calc(100%-2rem)] rounded-2xl bg-green/10 border border-green/20 text-green text-xs font-black px-4 py-3 text-left">
          {personnelNotice}
        </button>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 px-4">
        {[
          { id: 'planning', label: 'Planning', icon: Clock, badge: 0 },
          { id: 'presences', label: 'Présences', icon: Users, badge: 0 },
          { id: 'echanges', label: 'Échanges', icon: RefreshCw, badge: actionableSwaps.length },
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

          <div className="flex gap-2 overflow-x-auto px-4 mb-4 pb-2 custom-scrollbar">
            {availableRoles.map(role => (
              <button key={role} onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${roleFilter === role ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'bg-white/5 text-text-tertiary hover:bg-white/10'}`}>
                {role}
              </button>
            ))}
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

              {filteredEmployees.map(emp => (
                <div key={emp.id} className="flex items-stretch mb-1.5">
                  <div className="w-28 shrink-0 flex items-center gap-2 pr-2">
                    <span className="text-lg">{emp.avatar}</span>
                    <div className="min-w-0">
                      <span className="text-white font-bold text-[10px] block truncate">{emp.name.split(' ')[0]}</span>
                      <span className="text-text-tertiary text-[8px] font-bold uppercase">{emp.role}</span>
                      {isManager && (
                        <span className="text-orange text-[7px] font-black uppercase block truncate">
                          {getEmployeeScope(emp).access}
                        </span>
                      )}
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
          {/* Department Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
            {availableRoles.map(role => (
              <button key={role} onClick={() => setPresenceFilter(role)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${presenceFilter === role ? 'bg-orange text-white shadow-lg shadow-orange/20' : 'bg-white/5 text-text-tertiary hover:bg-white/10'}`}>
                {role}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/60 font-black text-[10px] uppercase tracking-widest">Équipe du jour</h3>
            <span className="text-orange font-black text-xs">{scopedEmployees.filter(e => e.status === 'present').length} / {scopedEmployees.length}</span>
          </div>
          {scopedEmployees.filter(e => {
            if (presenceFilter === 'Tous') return true;
            return ROLE_GROUPS[presenceFilter]?.includes(e.role);
          }).map(emp => {
            const sc = statusConfig[emp.status];
            const todayShifts = getTodayShifts(emp.id);
            return (
              <motion.div key={emp.id} layout className={`glass-card p-4 flex items-center gap-4 border-white/5 transition-all ${isManager ? 'active:scale-98 cursor-pointer' : ''}`} onClick={() => isManager && setSelectedEmp(emp)}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                  {emp.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black text-sm">{emp.name}</h4>
                  <p className="text-text-tertiary text-[10px] font-bold uppercase">{emp.role}</p>
                  {isManager && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue/10 text-blue text-[8px] font-black uppercase">
                        {getEmployeeScope(emp).modules}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-text-secondary text-[8px] font-black uppercase">
                        {getEmployeeScope(emp).pos}
                      </span>
                    </div>
                  )}
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
                <div className="text-right shrink-0 flex items-center gap-2">
                  <button onClick={(ev) => { ev.stopPropagation(); setShowQREmp(emp); }} className="w-8 h-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center active:scale-90 transition-transform">
                    <QrCode size={14} />
                  </button>
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
          {/* Button to create swap request (for non-managers) */}
          {!isManager && currentEmployee && myShifts.length > 0 && (
            <button onClick={() => { setShowSwapForm(true); setSwapStep(1); setSwapSelectedShift(null); setSwapTargetEmp(null); setSwapReason(''); }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange/20 to-blue/20 border border-orange/30 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 mb-6 active:scale-95 transition-transform">
              <Plus size={18} /> Demander un échange
            </button>
          )}

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

                // Status display
                const statusMap = {
                  pending_colleague: { label: 'Attente collègue', color: '#F59E0B', borderColor: 'border-l-orange' },
                  pending_manager: { label: 'Attente gérant', color: '#3B82F6', borderColor: 'border-l-blue' },
                  approved: { label: 'Approuvé ✓', color: '#22C55E', borderColor: 'border-l-green' },
                  rejected: { label: 'Refusé', color: '#EF4444', borderColor: 'border-l-red' },
                };
                const st = statusMap[req.status];
                const isDone = req.status === 'approved' || req.status === 'rejected';

                // Who can act?
                const isTargetColleague = currentEmployee && req.toEmployeeId === currentEmployee.id;
                const canColleagueAct = req.status === 'pending_colleague' && isTargetColleague;
                const canManagerAct = req.status === 'pending_manager' && isManager;

                return (
                  <motion.div key={req.id} layout className={`glass-card p-5 border-white/5 border-l-4 ${st.borderColor} ${isDone ? 'opacity-50' : ''}`}>
                    {/* Status + Step indicator */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} style={{ color: st.color }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: st.color }}>{st.label}</span>
                      </div>
                      <span className="text-text-tertiary text-[9px] font-bold">{new Date(req.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    </div>

                    {/* Progress steps */}
                    <div className="flex items-center gap-1 mb-4">
                      <div className={`h-1 flex-1 rounded-full ${req.status !== 'rejected' ? 'bg-orange' : 'bg-red/40'}`} />
                      <div className={`h-1 flex-1 rounded-full ${req.status === 'pending_manager' || req.status === 'approved' ? 'bg-blue' : 'bg-white/10'}`} />
                      <div className={`h-1 flex-1 rounded-full ${req.status === 'approved' ? 'bg-green' : 'bg-white/10'}`} />
                    </div>
                    
                    {/* From → To */}
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

                    {/* Confidentiality: only show reason to target employee, requester, and managers */}
                    {(isManager || (currentEmployee && (req.toEmployeeId === currentEmployee.id || req.fromEmployeeId === currentEmployee.id))) ? (
                      <p className="text-text-secondary text-[11px] italic mb-4">« {req.reason} »</p>
                    ) : (
                      <p className="text-text-tertiary text-[11px] italic mb-4 flex items-center gap-1.5">🔒 Motif confidentiel</p>
                    )}

                    {/* Colleague action */}
                    {canColleagueAct && (
                      <div className="flex gap-3">
                        <button onClick={() => colleagueRespond(req.id, true)} className="flex-1 py-3 rounded-2xl bg-green/10 text-green font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform border border-green/20">
                          <Check size={16} /> J'accepte
                        </button>
                        <button onClick={() => colleagueRespond(req.id, false)} className="flex-1 py-3 rounded-2xl bg-red/10 text-red font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red/20">
                          <X size={16} /> Refuser
                        </button>
                      </div>
                    )}

                    {/* Manager action */}
                    {canManagerAct && (
                      <div className="flex gap-3">
                        <button onClick={() => managerRespond(req.id, true)} className="flex-1 py-3 rounded-2xl bg-green/10 text-green font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform border border-green/20">
                          <Check size={16} /> Valider
                        </button>
                        <button onClick={() => managerRespond(req.id, false)} className="flex-1 py-3 rounded-2xl bg-red/10 text-red font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red/20">
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

      {/* ─── SWAP REQUEST FORM MODAL ─── */}
      <AnimatePresence>
        {showSwapForm && currentEmployee && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowSwapForm(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-2 text-center">Demander un échange</h3>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-6 px-4">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`flex-1 h-1 rounded-full transition-all ${swapStep >= s ? 'bg-orange' : 'bg-white/10'}`} />
                ))}
              </div>

              {/* Step 1: Choose shift */}
              {swapStep === 1 && (
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">1. Quel service voulez-vous échanger ?</p>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                    {myShifts.map(s => {
                      const cfg = shiftConfig[s.type];
                      const d = new Date(s.date);
                      return (
                        <button key={s.id} onClick={() => { setSwapSelectedShift(s.id); setSwapStep(2); }}
                          className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${swapSelectedShift === s.id ? 'border-orange bg-orange/10' : 'border-white/10 bg-white/5'}`}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                            <cfg.icon size={18} style={{ color: cfg.color }} />
                          </div>
                          <div className="text-left">
                            <span className="text-white font-bold text-xs block">{d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                            <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label} · {s.hours}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Choose colleague */}
              {swapStep === 2 && (
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">2. Avec qui souhaitez-vous échanger ?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {scopedEmployees.filter(e => e.id !== currentEmployee.id).map(emp => (
                      <button key={emp.id} onClick={() => { setSwapTargetEmp(emp.id); setSwapStep(3); }}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 ${swapTargetEmp === emp.id ? 'border-orange bg-orange/10' : 'border-white/10 bg-white/5'}`}>
                        <span className="text-2xl">{emp.avatar}</span>
                        <span className="text-white font-bold text-[10px]">{emp.name.split(' ')[0]}</span>
                        <span className="text-text-tertiary text-[8px] font-bold uppercase">{emp.role}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSwapStep(1)} className="mt-4 text-text-tertiary text-[10px] font-bold underline">← Retour</button>
                </div>
              )}

              {/* Step 3: Reason + Submit */}
              {swapStep === 3 && swapSelectedShift && swapTargetEmp && (
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-4">3. Raison de l'échange</p>
                  <textarea
                    value={swapReason}
                    onChange={e => setSwapReason(e.target.value)}
                    placeholder="Ex: RDV médical, contrainte personnelle..."
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm resize-none h-24 placeholder:text-white/20 focus:outline-none focus:border-orange/50"
                  />
                  <button
                    onClick={() => {
                      if (!swapReason.trim()) return;
                      const shift = shifts.find(s => s.id === swapSelectedShift);
                      addSwapRequest({
                        fromEmployeeId: currentEmployee.id,
                        toEmployeeId: swapTargetEmp,
                        shiftId: swapSelectedShift,
                        date: shift?.date || '',
                        reason: swapReason,
                      });
                      setShowSwapForm(false);
                    }}
                    disabled={!swapReason.trim()}
                    className="w-full mt-4 py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-orange/20">
                    <RefreshCw size={18} /> Envoyer la demande
                  </button>
                  <button onClick={() => setSwapStep(2)} className="mt-3 w-full text-text-tertiary text-[10px] font-bold underline text-center">← Retour</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

              {(() => {
                const scope = getEmployeeScope(selectedEmp);
                return (
                  <div className="glass-card p-4 mb-6">
                    <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3">Affectation & accès</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-text-tertiary text-[9px] font-bold uppercase">Site</p>
                        <p className="text-white text-xs font-black mt-1">{scope.sites}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-text-tertiary text-[9px] font-bold uppercase">Accès</p>
                        <p className="text-white text-xs font-black mt-1">{scope.access}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 col-span-2">
                        <p className="text-text-tertiary text-[9px] font-bold uppercase">Activités</p>
                        <p className="text-white text-xs font-black mt-1">{scope.modules}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 col-span-2">
                        <p className="text-text-tertiary text-[9px] font-bold uppercase">Points de vente</p>
                        <p className="text-white text-xs font-black mt-1">{scope.pos}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                {isManager && (
                  <button onClick={() => { if (confirm(`Retirer ${selectedEmp.name} de l'équipe ?`)) { removeEmployee(selectedEmp.id); setSelectedEmp(null); } }}
                    className="w-full py-3 rounded-2xl bg-red/5 border border-red/20 text-red font-bold text-xs flex items-center justify-center gap-3">
                    <Trash2 size={16} /> Retirer de l'équipe
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADD EMPLOYEE MODAL ─── */}
      <AnimatePresence>
        {showAddEmployee && isManager && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddEmployee(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-6 text-center">Nouveau Salarié</h3>
              
              <div className="space-y-5">
                {/* Avatar picker */}
                <div>
                  <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-3 block">Avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {['👨‍🍳', '👩‍🍳', '🧑‍🍳', '👩‍🍽️', '🧑‍🍽️', '🧑‍💼', '💁‍♀️', '🍸', '🛵', '👩', '🧑'].map(av => (
                      <button key={av} onClick={() => setNewEmpAvatar(av)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newEmpAvatar === av ? 'bg-orange shadow-lg shadow-orange/30 scale-110' : 'bg-white/5'}`}>
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                    {/* Name */}
                <div>
                  <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Nom complet</label>
                  <input type="text" value={newEmpName} onChange={e => setNewEmpName(e.target.value)}
                    placeholder="Ex: Ousmane Thiam"
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange/50" />
                </div>

                {/* Role */}
                <div>
                  <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Poste</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Chef Cuisine', 'Second Cuisine', 'Commis', 'Serveur', 'Serveuse', 'Hôtesse', 'Caissier', 'Barman', 'Plongeur', 'Livreur', 'Livreur Indépendant'].map(r => (
                      <button key={r} onClick={() => setNewEmpRole(r)}
                        className={`py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${newEmpRole === r ? 'bg-orange text-white' : 'bg-white/5 text-text-tertiary'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {newEmpRole === 'Livreur Indépendant' && (
                  <div className="p-3 bg-blue/10 border border-blue/20 rounded-xl flex gap-3 text-blue text-xs items-start">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p>Un "Lien Magique" (QR) sera généré. Le livreur y verra ses courses et ses frais sans compte complet.</p>
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2 block">Téléphone</label>
                  <input type="tel" value={newEmpPhone} onChange={e => setNewEmpPhone(e.target.value)}
                    placeholder="77 000 00 00"
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-orange/50" />
                </div>

                {/* Submit */}
                <button
                  onClick={() => {
                    if (!newEmpName.trim()) return;
                    addEmployee({
                      name: newEmpName.trim(),
                      role: newEmpRole,
                      phone: newEmpPhone || '00 000 00 00',
                      avatar: newEmpAvatar,
                      schedule: 'À planifier',
                      status: 'repos',
                      siteIds: user?.siteIds,
                      posIds: user?.posIds,
                      businessModules: user?.businessModules as Employee['businessModules'],
                      accessLevel: 'staff',
                    });
                    setShowAddEmployee(false);
                    setPersonnelNotice(newEmpRole === 'Livreur Indépendant'
                      ? `Lien magique généré pour ${newEmpName.trim()}.`
                      : `${newEmpName.trim()} ajouté à l'équipe visible.`
                    );
                  }}
                  disabled={!newEmpName.trim()}
                  className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-30 shadow-lg shadow-orange/20">
                  <UserPlus size={18} /> {newEmpRole === 'Livreur Indépendant' ? 'Ajouter & Générer Lien' : 'Ajouter à l\'équipe'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Employee QR Code Modal */}
      <AnimatePresence>
        {showQREmp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[100]" onClick={() => setShowQREmp(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-lg p-6 m-4 relative max-w-sm w-full flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowQREmp(null)} className="absolute top-4 right-4 text-text-tertiary"><X size={20} /></button>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-3xl border border-white/5 mb-4">
                {showQREmp.avatar}
              </div>
              <h3 className="text-white font-black text-xl mb-0.5">{showQREmp.name}</h3>
              <p className="text-text-secondary text-sm mb-1">{showQREmp.role}</p>
              <p className="text-text-tertiary text-[10px] font-mono mb-6">ID: {showQREmp.id}</p>
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <QRCodeSVG value={showQREmp.id} size={180} level="H" />
              </div>
              <p className="text-text-tertiary text-[10px]">Scannez ce QR code pour une connexion rapide</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
