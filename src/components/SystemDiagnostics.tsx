import { useState } from 'react';
import { Activity, CheckCircle2, Trash2, Wifi, WifiOff } from 'lucide-react';
import { clearTelemetryEvents, getTelemetryEvents } from '../services/telemetry';

export default function SystemDiagnostics() {
  const [events, setEvents] = useState(getTelemetryEvents);
  const online = navigator.onLine;
  const errors = events.filter(event => event.level === 'error').length;

  const clear = () => {
    clearTelemetryEvents();
    setEvents([]);
  };

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white/5 p-3">
          {online ? <Wifi size={16} className="text-green mb-2" /> : <WifiOff size={16} className="text-red mb-2" />}
          <p className="text-text-tertiary text-[9px] font-black uppercase">Réseau</p>
          <p className="text-white text-xs font-black">{online ? 'Connecté' : 'Hors ligne'}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <Activity size={16} className="text-blue mb-2" />
          <p className="text-text-tertiary text-[9px] font-black uppercase">Incidents</p>
          <p className="text-white text-xs font-black">{events.length}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <CheckCircle2 size={16} className={errors ? 'text-orange mb-2' : 'text-green mb-2'} />
          <p className="text-text-tertiary text-[9px] font-black uppercase">Erreurs</p>
          <p className="text-white text-xs font-black">{errors}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white text-xs font-black">Derniers incidents applicatifs</h4>
        {events.length > 0 && (
          <button type="button" onClick={clear} className="h-8 px-3 rounded-xl bg-red/10 text-red text-[10px] font-black flex items-center gap-1">
            <Trash2 size={12} /> Effacer
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {events.slice(0, 10).map(event => (
          <div key={event.id} className="rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[9px] font-black uppercase ${event.level === 'error' ? 'text-red' : event.level === 'warning' ? 'text-orange' : 'text-blue'}`}>{event.source}</span>
              <span className="text-text-tertiary text-[9px]">{new Date(event.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <p className="text-text-secondary text-[10px] mt-1 break-words">{event.message}</p>
          </div>
        ))}
        {events.length === 0 && <p className="text-text-tertiary text-xs text-center py-4">Aucun incident enregistré.</p>}
      </div>
    </section>
  );
}
