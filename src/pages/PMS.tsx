import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, CalendarDays, CheckCircle2, Menu, Plus, ReceiptText, SlidersHorizontal, Sparkles, Wrench } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore } from '../stores/hospiStore';
import type { RoomStatus } from '../stores/hospiStore';
import { getVisibleSites } from '../utils/accessControl';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const statusLabel: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Occupée',
  cleaning: 'Ménage',
  maintenance: 'Maintenance',
};

const statusTileClass: Record<RoomStatus, string> = {
  available: 'bg-gradient-to-br from-emerald-500 to-emerald-800 text-white',
  occupied: 'bg-gradient-to-br from-purple to-indigo-900 text-white',
  cleaning: 'bg-gradient-to-br from-amber-500 to-orange-900 text-white',
  maintenance: 'bg-gradient-to-br from-slate-600 to-slate-950 text-white ring-1 ring-white/15',
};

const statusDotClass: Record<RoomStatus, string> = {
  available: 'bg-green',
  occupied: 'bg-purple',
  cleaning: 'bg-orange',
  maintenance: 'bg-slate-400',
};

export default function PMS() {
  const { user } = useAuthStore();
  const [selectedFolioId, setSelectedFolioId] = useState('');
  const [chargeDescription, setChargeDescription] = useState('Mini-bar');
  const [chargeAmount, setChargeAmount] = useState('');
  const [roomView, setRoomView] = useState<'plan' | 'list' | 'floors'>('plan');
  const [activeFloor, setActiveFloor] = useState('1er étage');
  const {
    sites,
    rooms,
    guests,
    stays,
    folios,
    folioLines,
    updateRoomStatus,
    addManualFolioCharge,
    closeFolio,
  } = useHospiStore();
  const visibleSites = getVisibleSites(user, sites);
  const visibleSiteIds = visibleSites.map(site => site.id);
  const visibleRooms = rooms.filter(room => visibleSiteIds.includes(room.site_id));
  const visibleRoomIds = visibleRooms.map(room => room.id);

  const openFolios = folios.filter(folio => folio.status === 'open' && visibleRoomIds.includes(folio.room_id));
  const selectedFolio = openFolios.find(folio => folio.id === selectedFolioId) || openFolios[0];
  const folioOptions = useMemo(() => openFolios.map(folio => {
    const room = rooms.find(item => item.id === folio.room_id);
    const guest = guests.find(item => item.id === folio.guest_id);
    return {
      folio,
      label: `Chambre ${room?.room_number || '-'} · ${guest ? `${guest.first_name} ${guest.last_name}` : 'Client'}`,
    };
  }), [guests, openFolios, rooms]);

  const roomStatusActions: { status: RoomStatus; label: string; icon: typeof CheckCircle2; className: string }[] = [
    { status: 'available', label: 'Disponible', icon: CheckCircle2, className: 'text-green bg-green/10' },
    { status: 'cleaning', label: 'Ménage', icon: Sparkles, className: 'text-amber-300 bg-amber-400/10' },
    { status: 'maintenance', label: 'Maintenance', icon: Wrench, className: 'text-red-300 bg-red-400/10' },
    { status: 'occupied', label: 'Occupée', icon: BedDouble, className: 'text-cyan-300 bg-cyan-400/10' },
  ];

  const handleAddCharge = () => {
    if (!selectedFolio) return;
    const amount = Number(chargeAmount);
    const line = addManualFolioCharge(selectedFolio.id, chargeDescription, amount, 'Réception');
    if (line) {
      setChargeAmount('');
      setChargeDescription('Mini-bar');
    }
  };

  const handleCloseFolio = (folioId: string) => {
    closeFolio(folioId, 'Réception');
    if (selectedFolioId === folioId) setSelectedFolioId('');
  };

  const roomsWithContext = visibleRooms.map(room => {
    const stay = stays.find(item => item.room_id === room.id && item.status === 'checked_in');
    const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
    const folio = stay ? folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
    const lines = folio ? folioLines.filter(line => line.folio_id === folio.id) : [];
    return { room, stay, guest, folio, lines };
  });

  return (
    <div className="page-content pt-9 pb-28">
      <header className="flex items-center justify-between mb-6">
        <button className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center">
          <Menu size={22} />
        </button>
        <h1 className="text-white font-black text-xl">Chambres</h1>
        <button className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center">
          <SlidersHorizontal size={20} />
        </button>
      </header>

      <section className="mb-5">
        <div className="h-14 rounded-2xl bg-white/5 border border-white/5 p-1 grid grid-cols-3 gap-1 mb-5">
          {[
            { id: 'plan', label: 'Plan' },
            { id: 'list', label: 'Liste' },
            { id: 'floors', label: 'Étages' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setRoomView(item.id as typeof roomView)}
              className={`rounded-xl text-sm font-bold transition-all ${roomView === item.id ? 'bg-purple text-white shadow-purple-glow' : 'text-text-secondary'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {['RDC', '1er étage', '2ème étage', '3ème étage'].map(floor => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`h-10 rounded-xl text-xs font-bold border transition-all ${activeFloor === floor ? 'bg-purple text-white border-purple shadow-purple-glow' : 'bg-white/5 text-text-secondary border-white/10'}`}
            >
              {floor}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-3 gap-3">
          {roomsWithContext.map(({ room }) => (
            <motion.button
              key={room.id}
              layout
              onClick={() => updateRoomStatus(room.id, room.status === 'available' ? 'occupied' : room.status === 'occupied' ? 'cleaning' : room.status === 'cleaning' ? 'available' : 'maintenance')}
              className={`aspect-square rounded-2xl p-4 text-left shadow-lg ${statusTileClass[room.status]}`}
            >
              <p className="text-2xl font-black leading-none">{room.room_number}</p>
              <p className="text-sm font-bold mt-3 opacity-90">{statusLabel[room.status]}</p>
            </motion.button>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5">
          {[
            { status: 'available' as RoomStatus, label: 'Libre' },
            { status: 'occupied' as RoomStatus, label: 'Occupée' },
            { status: 'cleaning' as RoomStatus, label: 'En nettoyage' },
            { status: 'maintenance' as RoomStatus, label: 'Hors service' },
          ].map(item => (
            <div key={item.status} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${statusDotClass[item.status]}`} />
              <span className="text-text-secondary text-xs font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card-lg p-4 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Réception</p>
            <h2 className="text-white font-black text-lg">Actions folio</h2>
          </div>
          <ReceiptText size={20} className="text-purple" />
        </div>

        {openFolios.length > 0 ? (
          <div className="space-y-3">
            <select
              value={selectedFolio?.id || ''}
              onChange={event => setSelectedFolioId(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none"
            >
              {folioOptions.map(option => (
                <option key={option.folio.id} value={option.folio.id} className="bg-background">
                  {option.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <input
                value={chargeDescription}
                onChange={event => setChargeDescription(event.target.value)}
                placeholder="Libellé"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none placeholder:text-text-tertiary"
              />
              <input
                value={chargeAmount}
                onChange={event => setChargeAmount(event.target.value)}
                inputMode="numeric"
                placeholder="Montant"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none placeholder:text-text-tertiary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleAddCharge} className="h-11 rounded-xl bg-purple text-white font-black text-xs flex items-center justify-center gap-2">
                <Plus size={16} />
                Ajouter charge
              </button>
              <button
                onClick={() => selectedFolio && handleCloseFolio(selectedFolio.id)}
                className="h-11 rounded-xl bg-white/10 text-white font-black text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Clôturer folio
              </button>
            </div>
          </div>
        ) : (
          <p className="text-text-secondary text-sm">Aucun folio ouvert pour le moment.</p>
        )}
      </section>

      <section className="space-y-3">
        {roomsWithContext.map(({ room, stay, guest, folio, lines }) => {
          return (
            <motion.div key={room.id} layout className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-black text-base">Chambre {room.room_number}</p>
                  <p className="text-text-tertiary text-[10px] uppercase tracking-widest">{room.room_type}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${room.status === 'occupied' ? 'bg-cyan-400/10 text-cyan-300' : 'bg-green/10 text-green'}`}>
                  {statusLabel[room.status] || room.status}
                </span>
              </div>

              {guest && stay ? (
                <div className="rounded-xl bg-white/5 p-3 mb-3">
                  <p className="text-white font-black text-sm">{guest.first_name} {guest.last_name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-2">
                    <CalendarDays size={12} />
                    <span>{new Date(stay.check_in_date).toLocaleDateString('fr-FR')} → {new Date(stay.check_out_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-text-tertiary text-xs mb-3">Aucun séjour actif.</p>
              )}

              {folio && (
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-tertiary text-[10px] font-black uppercase">Folio ouvert</span>
                    <span className="text-white font-black text-sm">{fmt(folio.total_amount)} F</span>
                  </div>
                  <div className="space-y-1">
                    {lines.slice(0, 5).map(line => (
                      <div key={line.id} className="flex justify-between gap-3 text-[10px]">
                        <span className="text-text-secondary truncate">{line.description}</span>
                        <span className="text-cyan-300 font-bold shrink-0">{fmt(line.amount)} F</span>
                      </div>
                    ))}
                    {lines.length === 0 && <p className="text-text-tertiary text-[10px]">Aucune consommation imputée.</p>}
                  </div>
                  <button
                    onClick={() => handleCloseFolio(folio.id)}
                    className="mt-3 w-full h-10 rounded-xl bg-purple/20 text-purple font-black text-xs"
                  >
                    Clôturer ce folio
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                {roomStatusActions.map(action => {
                  const Icon = action.icon;
                  const isActive = room.status === action.status;
                  return (
                    <button
                      key={action.status}
                      onClick={() => updateRoomStatus(room.id, action.status)}
                      className={`h-10 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 ${isActive ? action.className : 'bg-white/5 text-text-secondary'}`}
                    >
                      <Icon size={13} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
