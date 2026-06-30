import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  BedDouble,
  Bell,
  CalendarDays,
  CreditCard,
  DoorOpen,
  Download,
  FileText,
  Hotel,
  Menu,
  Percent,
  ReceiptText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore } from '../stores/hospiStore';
import type { RoomStatus } from '../stores/hospiStore';
import { canAccessRoute, getVisibleSites } from '../utils/accessControl';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const money = (n: number) => `${fmt(n)} FCFA`;

const statusLabel: Record<RoomStatus, string> = {
  available: 'Libre',
  occupied: 'Occupee',
  cleaning: 'A nettoyer',
  maintenance: 'Hors service',
};

const statusClass: Record<RoomStatus, string> = {
  available: 'bg-green/15 text-green border-green/20',
  occupied: 'bg-purple/20 text-purple border-purple/30',
  cleaning: 'bg-orange/15 text-orange border-orange/20',
  maintenance: 'bg-red/15 text-red border-red/20',
};

const roomTileClass: Record<RoomStatus, string> = {
  available: 'bg-gradient-to-br from-emerald-500 to-emerald-800 text-white',
  occupied: 'bg-gradient-to-br from-purple to-indigo-900 text-white',
  cleaning: 'bg-gradient-to-br from-amber-500 to-orange-900 text-white',
  maintenance: 'bg-gradient-to-br from-slate-600 to-slate-950 text-white ring-1 ring-white/15',
};

type HotelTab = 'reception' | 'reservations' | 'availability' | 'planning' | 'rooms' | 'folios' | 'payments' | 'clients' | 'housekeeping' | 'rates' | 'maintenance' | 'documents' | 'alerts' | 'reports';

const tabs: Array<{ id: HotelTab; label: string; icon: any }> = [
  { id: 'reception', label: 'Reception', icon: DoorOpen },
  { id: 'reservations', label: 'Reservations', icon: CalendarDays },
  { id: 'availability', label: 'Disponibilite', icon: Hotel },
  { id: 'planning', label: 'Planning', icon: CalendarDays },
  { id: 'rooms', label: 'Chambres', icon: BedDouble },
  { id: 'folios', label: 'Folios', icon: ReceiptText },
  { id: 'payments', label: 'Paiements', icon: Banknote },
  { id: 'clients', label: 'Clients', icon: UserRound },
  { id: 'housekeeping', label: 'Menage', icon: Sparkles },
  { id: 'rates', label: 'Tarifs', icon: CreditCard },
  { id: 'maintenance', label: 'Technique', icon: Wrench },
  { id: 'documents', label: 'Documents', icon: Download },
  { id: 'alerts', label: 'Alertes', icon: Bell },
  { id: 'reports', label: 'Rapports', icon: FileText },
];

const rateRows = [
  { roomType: 'Standard', tonight: 65000, weekend: 78000, high: 90000, corporate: 58000 },
  { roomType: 'Deluxe', tonight: 95000, weekend: 115000, high: 140000, corporate: 85000 },
  { roomType: 'Suite', tonight: 165000, weekend: 195000, high: 240000, corporate: 145000 },
  { roomType: 'Villa', tonight: 280000, weekend: 350000, high: 420000, corporate: 250000 },
];

const maintenanceSeed = [
  { room: '203', title: 'Climatisation a verifier', owner: 'Mamadou maintenance', priority: 'Haute', status: 'En cours' },
  { room: '301', title: 'Inspection piscine villa', owner: 'Equipe technique', priority: 'Normale', status: 'Planifie' },
  { room: '103', title: 'Controle serrure', owner: 'Reception', priority: 'Basse', status: 'Ouvert' },
];

type DemoReservation = {
  id: string;
  guestName: string;
  channel: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: 'booked' | 'precheckin' | 'checkedin' | 'cancelled' | 'noshow';
  deposit: number;
  rate: number;
};

type DemoPayment = {
  id: string;
  folioId: string;
  label: string;
  amount: number;
  method: string;
  status: 'paid' | 'deposit' | 'refund';
};

export default function PMS() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<HotelTab>('reception');
  const [selectedFolioId, setSelectedFolioId] = useState('');
  const [search, setSearch] = useState('');
  const [chargeDescription, setChargeDescription] = useState('Mini-bar eau + snack');
  const [chargeAmount, setChargeAmount] = useState('3700');
  const [notice, setNotice] = useState('');
  const [activeFloor, setActiveFloor] = useState('Tous');
  const [reservationForm, setReservationForm] = useState({
    guestName: 'Mame Diarra',
    channel: 'Walk-in',
    roomType: 'Deluxe',
    checkIn: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    deposit: '50000',
  });
  const [demoReservations, setDemoReservations] = useState<DemoReservation[]>([
    { id: 'res-demo-1', guestName: 'Mame Diarra', channel: 'Telephone', roomType: 'Deluxe', checkIn: new Date(Date.now() + 86400000).toISOString().slice(0, 10), checkOut: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), status: 'booked', deposit: 50000, rate: 95000 },
    { id: 'res-demo-2', guestName: 'Societe Baobab', channel: 'Corporate', roomType: 'Suite', checkIn: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), checkOut: new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 10), status: 'precheckin', deposit: 180000, rate: 145000 },
  ]);
  const [payments, setPayments] = useState<DemoPayment[]>([]);
  const [editableRates, setEditableRates] = useState(rateRows);
  const [maintenanceTickets, setMaintenanceTickets] = useState(maintenanceSeed);
  const {
    sites,
    rooms,
    guests,
    stays,
    folios,
    folioLines,
    stockLevels,
    warehouses,
    posList,
    updateRoomStatus,
    checkInGuest,
    addManualFolioCharge,
    recordFolioPayment,
    closeFolio,
    recordSale,
  } = useHospiStore();

  const visibleSites = getVisibleSites(user, sites);
  const visibleSiteIds = visibleSites.map(site => site.id);
  const visibleRooms = rooms.filter(room => visibleSiteIds.includes(room.site_id));
  const visibleRoomIds = visibleRooms.map(room => room.id);
  const openFolios = folios.filter(folio => folio.status === 'open' && visibleRoomIds.includes(folio.room_id));
  const selectedFolio = openFolios.find(folio => folio.id === selectedFolioId) || openFolios[0];
  const minibarPOS = posList.find(pos => pos.id === 'pos-minibar');
  const roomServicePOS = posList.find(pos => pos.id === 'pos-room-service');
  const minibarStock = stockLevels
    .filter(level => warehouses.find(warehouse => warehouse.id === level.warehouse_id)?.id === 'wh-minibar')
    .reduce((sum, level) => sum + level.quantity, 0);

  const roomsWithContext = useMemo(() => visibleRooms.map(room => {
    const stay = stays.find(item => item.room_id === room.id && item.status === 'checked_in');
    const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
    const folio = stay ? folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
    const lines = folio ? folioLines.filter(line => line.folio_id === folio.id) : [];
    const floor = room.room_number.startsWith('1') ? '1er' : room.room_number.startsWith('2') ? '2e' : room.room_number.startsWith('3') ? '3e' : 'RDC';
    const nights = stay ? Math.max(1, Math.ceil((new Date(stay.check_out_date).getTime() - new Date(stay.check_in_date).getTime()) / 86400000)) : 0;
    return { room, stay, guest, folio, lines, floor, nights };
  }), [visibleRooms, stays, guests, folios, folioLines]);

  const filteredRooms = roomsWithContext.filter(row => {
    const q = search.toLowerCase();
    const matchesSearch = !q || row.room.room_number.includes(q) || row.guest?.first_name.toLowerCase().includes(q) || row.guest?.last_name.toLowerCase().includes(q);
    const matchesFloor = activeFloor === 'Tous' || row.floor === activeFloor;
    return matchesSearch && matchesFloor;
  });

  const occupied = roomsWithContext.filter(row => row.room.status === 'occupied').length;
  const departuresToday = roomsWithContext.filter(row => row.stay && new Date(row.stay.check_out_date).toDateString() === new Date(Date.now() + 86400000).toDateString()).length;
  const arrivalsToday = Math.max(2, roomsWithContext.filter(row => row.room.status === 'available').length);
  const revenueOpen = openFolios.reduce((sum, folio) => sum + folio.total_amount, 0);
  const occupancyRate = visibleRooms.length ? Math.round((occupied / visibleRooms.length) * 100) : 0;
  const adr = occupied ? Math.round(revenueOpen / occupied) : 0;
  const revPar = visibleRooms.length ? Math.round(revenueOpen / visibleRooms.length) : 0;
  const dirtyArrivals = demoReservations.filter(res => res.status !== 'cancelled').length && roomsWithContext.filter(row => row.room.status === 'cleaning').length;
  const vipArrivals = demoReservations.filter(res => res.guestName.toLowerCase().includes('societe') || res.roomType === 'Suite').length;
  const unpaidDepartures = openFolios.filter(folio => folio.total_amount > 0).length;

  const addFolioCharge = (kind: 'manual' | 'minibar' | 'room_service') => {
    if (!selectedFolio) return;
    const amount = Number(chargeAmount) || (kind === 'minibar' ? 3700 : 15000);
    const label = kind === 'minibar' ? 'Mini-bar chambre' : kind === 'room_service' ? 'Room service chambre' : chargeDescription;
    const line = addManualFolioCharge(selectedFolio.id, label, amount, user?.name || 'Reception');
    if (line && kind === 'minibar' && minibarPOS) {
      recordSale(`minibar-${Date.now()}`, [
        { productId: 'prod-eau-minibar', quantity: 1 },
        { productId: 'prod-snack-minibar', quantity: 1 },
      ], user?.name || 'Reception', minibarPOS.id);
    }
    if (line && kind === 'room_service' && roomServicePOS) {
      recordSale(`room-service-${Date.now()}`, [
        { productId: 'prod-thieboudienne', quantity: 1 },
      ], user?.name || 'Reception', roomServicePOS.id);
    }
    setNotice(`${label} ajoute au folio ${selectedFolio.id}. ${kind === 'manual' ? '' : 'Stock et POS relies.'}`);
    setChargeAmount('');
  };

  const createReservation = () => {
    const rate = editableRates.find(row => row.roomType === reservationForm.roomType)?.tonight || 75000;
    const reservation: DemoReservation = {
      id: `res-${Date.now()}`,
      guestName: reservationForm.guestName.trim() || 'Client walk-in',
      channel: reservationForm.channel,
      roomType: reservationForm.roomType,
      checkIn: reservationForm.checkIn,
      checkOut: reservationForm.checkOut,
      status: Number(reservationForm.deposit) > 0 ? 'precheckin' : 'booked',
      deposit: Number(reservationForm.deposit) || 0,
      rate,
    };
    setDemoReservations(prev => [reservation, ...prev]);
    setNotice(`Reservation creee pour ${reservation.guestName}. Acompte ${money(reservation.deposit)}.`);
  };

  const markReservation = (reservationId: string, status: DemoReservation['status']) => {
    setDemoReservations(prev => prev.map(res => res.id === reservationId ? { ...res, status } : res));
    const reservation = demoReservations.find(res => res.id === reservationId);
    if (reservation && status === 'checkedin') {
      const result = checkInGuest({
        guestName: reservation.guestName,
        roomType: reservation.roomType,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        deposit: reservation.deposit,
        rate: reservation.rate,
        channel: reservation.channel,
        createdBy: user?.name || 'Reception',
        siteId: visibleSites[0]?.id,
      });
      if (result) {
        setSelectedFolioId(result.folio.id);
        setNotice(`Check-in confirme en chambre ${result.room.room_number}. Séjour, folio, hébergement et compte client créés.`);
      } else {
        setNotice(`Aucune chambre ${reservation.roomType} libre pour ${reservation.guestName}.`);
      }
    } else if (reservation) {
      setNotice(`${reservation.guestName} : statut ${status}.`);
    }
  };

  const addPayment = (kind: DemoPayment['status']) => {
    if (!selectedFolio) return;
    const amount = kind === 'refund' ? -25000 : kind === 'deposit' ? 50000 : Math.min(selectedFolio.total_amount, 75000);
    const payment: DemoPayment = {
      id: `pay-${Date.now()}`,
      folioId: selectedFolio.id,
      label: kind === 'refund' ? 'Remboursement garantie' : kind === 'deposit' ? 'Acompte reservation' : 'Reglement folio',
      amount,
      method: kind === 'refund' ? 'Carte' : 'Wave / Carte',
      status: kind,
    };
    const ledgerEntry = recordFolioPayment(selectedFolio.id, amount, kind === 'refund' ? 'carte' : 'wave', user?.name || 'Reception');
    setPayments(prev => [payment, ...prev]);
    setNotice(ledgerEntry
      ? `${payment.label} enregistré : ${money(Math.abs(amount))}. Solde client mis à jour.`
      : `${payment.label} enregistré en liste, mais aucun compte client n'a été trouvé pour ce folio.`
    );
  };

  const exportInvoice = () => {
    if (!selectedFolio) return;
    const row = folioRows.find(item => item.folio.id === selectedFolio.id);
    const html = `
      <html><head><title>Facture ${selectedFolio.id}</title>
      <style>body{font-family:Arial;padding:32px;color:#111}h1{margin:0 0 8px}.line{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:8px 0}.total{font-size:22px;font-weight:800;margin-top:20px}</style></head>
      <body>
        <h1>Sartal OS Hospi</h1>
        <p>Facture folio ${selectedFolio.id} - Chambre ${row?.room?.room_number || '-'}</p>
        <p>Client : ${row?.guest?.first_name || ''} ${row?.guest?.last_name || ''}</p>
        ${(row?.lines || []).map(line => `<div class="line"><span>${line.description}</span><strong>${money(line.amount)}</strong></div>`).join('')}
        <p class="total">Total : ${money(selectedFolio.total_amount)}</p>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
    setNotice('Facture hotel generee pour impression/PDF.');
  };

  const createMaintenanceTicket = () => {
    const room = roomsWithContext.find(row => row.room.status === 'maintenance') || roomsWithContext[0];
    if (!room) return;
    updateRoomStatus(room.room.id, 'maintenance');
    setMaintenanceTickets(prev => [{ room: room.room.room_number, title: 'Ticket technique cree reception', owner: user?.name || 'Reception', priority: 'Haute', status: 'Ouvert' }, ...prev]);
    setNotice(`Ticket technique cree et chambre ${room.room.room_number} bloquee.`);
  };

  const folioRows = openFolios.map(folio => {
    const room = rooms.find(item => item.id === folio.room_id);
    const guest = guests.find(item => item.id === folio.guest_id);
    const lines = folioLines.filter(line => line.folio_id === folio.id);
    const extras = lines.filter(line => line.source_type !== 'manual_charge').reduce((sum, line) => sum + line.amount, 0);
    return { folio, room, guest, lines, extras };
  });

  const renderReception = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Arrivees', value: arrivalsToday, color: '#22C55E' },
          { label: 'Departs', value: departuresToday, color: '#F59E0B' },
          { label: 'Folios ouverts', value: openFolios.length, color: '#8B5CF6' },
          { label: 'Mini-bar stock', value: Math.round(minibarStock), color: '#06B6D4' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4">
            <p className="text-text-tertiary text-[10px] font-black uppercase">{item.label}</p>
            <p className="text-white font-black text-2xl mt-2" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <section className="glass-card-lg p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Cycle client</p>
            <h2 className="text-white font-black text-lg">Reservation → check-in → folio → check-out</h2>
          </div>
          <Hotel className="text-cyan-300" size={22} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['Pre-check-in', 'Check-in', 'Sejour actif', 'Check-out'].map((step, index) => (
            <button key={step} onClick={() => setNotice(`${step} valide pour la demonstration.`)} className={`min-h-16 rounded-2xl p-2 text-[9px] font-black uppercase ${index < 3 ? 'bg-green/10 text-green' : 'bg-white/5 text-text-secondary'}`}>
              {step}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card-lg p-4">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3">Imputation chambre</p>
        <select value={selectedFolio?.id || ''} onChange={event => setSelectedFolioId(event.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none mb-3">
          {folioRows.map(row => (
            <option key={row.folio.id} value={row.folio.id} className="bg-background">
              Chambre {row.room?.room_number} · {row.guest?.first_name} {row.guest?.last_name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-[1fr_110px] gap-2 mb-3">
          <input value={chargeDescription} onChange={event => setChargeDescription(event.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none" />
          <input value={chargeAmount} onChange={event => setChargeAmount(event.target.value)} inputMode="numeric" className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => addFolioCharge('manual')} className="h-12 rounded-xl bg-purple text-white font-black text-[10px]">Charge</button>
          <button onClick={() => addFolioCharge('minibar')} className="h-12 rounded-xl bg-cyan-500/15 text-cyan-200 font-black text-[10px]">Mini-bar</button>
          <button onClick={() => addFolioCharge('room_service')} className="h-12 rounded-xl bg-orange/15 text-orange font-black text-[10px]">Room service</button>
        </div>
      </section>
    </div>
  );

  const renderReservations = () => (
    <div className="space-y-4">
      <section className="glass-card-lg p-4">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3">Nouvelle reservation</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input value={reservationForm.guestName} onChange={event => setReservationForm(prev => ({ ...prev, guestName: event.target.value }))} className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none" placeholder="Client" />
          <select value={reservationForm.channel} onChange={event => setReservationForm(prev => ({ ...prev, channel: event.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none">
            {['Walk-in', 'Telephone', 'Booking', 'Expedia', 'Agence', 'Corporate', 'Site web'].map(channel => <option key={channel} className="bg-background">{channel}</option>)}
          </select>
          <select value={reservationForm.roomType} onChange={event => setReservationForm(prev => ({ ...prev, roomType: event.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none">
            {editableRates.map(rate => <option key={rate.roomType} className="bg-background">{rate.roomType}</option>)}
          </select>
          <input type="date" value={reservationForm.checkIn} onChange={event => setReservationForm(prev => ({ ...prev, checkIn: event.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none" />
          <input type="date" value={reservationForm.checkOut} onChange={event => setReservationForm(prev => ({ ...prev, checkOut: event.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none" />
          <input value={reservationForm.deposit} onChange={event => setReservationForm(prev => ({ ...prev, deposit: event.target.value }))} inputMode="numeric" className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none" placeholder="Acompte" />
        </div>
        <button onClick={createReservation} className="w-full h-12 rounded-2xl bg-purple text-white font-black text-sm">Creer reservation</button>
      </section>

      {demoReservations.map(reservation => (
        <div key={reservation.id} className="glass-card p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-white font-black text-sm">{reservation.guestName}</p>
              <p className="text-text-secondary text-xs">{reservation.channel} · {reservation.roomType} · {reservation.checkIn} → {reservation.checkOut}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue/10 text-blue text-[9px] font-black uppercase">{reservation.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Tarif</p><p className="text-white font-black text-xs">{money(reservation.rate)}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Acompte</p><p className="text-green font-black text-xs">{money(reservation.deposit)}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Canal</p><p className="text-white font-black text-xs">{reservation.channel}</p></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => markReservation(reservation.id, 'precheckin')} className="h-10 rounded-xl bg-white/5 text-white text-[9px] font-black">Pre-check</button>
            <button onClick={() => markReservation(reservation.id, 'checkedin')} className="h-10 rounded-xl bg-green/10 text-green text-[9px] font-black">Check-in</button>
            <button onClick={() => markReservation(reservation.id, 'noshow')} className="h-10 rounded-xl bg-orange/10 text-orange text-[9px] font-black">No-show</button>
            <button onClick={() => markReservation(reservation.id, 'cancelled')} className="h-10 rounded-xl bg-red/10 text-red text-[9px] font-black">Annuler</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-4">
      <section className="glass-card-lg p-4">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3">Disponibilite par periode</p>
        <div className="grid grid-cols-2 gap-3">
          {editableRates.map(rate => {
            const total = roomsWithContext.filter(row => row.room.room_type === rate.roomType).length;
            const free = roomsWithContext.filter(row => row.room.room_type === rate.roomType && row.room.status === 'available').length;
            return (
              <div key={rate.roomType} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-white font-black text-sm">{rate.roomType}</p>
                <p className="text-green font-black text-2xl mt-2">{free}/{total}</p>
                <p className="text-text-secondary text-xs mt-1">libres · surbooking controle {free === 0 ? 'a valider' : 'inutile'}</p>
              </div>
            );
          })}
        </div>
      </section>
      <button onClick={() => setNotice('Recherche disponibilite : conflits, allotements et surbooking controles.')} className="w-full h-12 rounded-2xl bg-cyan-500/15 text-cyan-200 font-black text-sm">Verifier sur 2 dates</button>
    </div>
  );

  const renderPlanning = () => (
    <div className="space-y-4">
      <div className="glass-card-lg p-4">
        <h2 className="text-white font-black text-lg mb-1">Planning sejour</h2>
        <p className="text-text-secondary text-xs mb-4">Vue type PMS : arrivees, nuitées, departs et prolongations.</p>
        <div className="space-y-3">
          {roomsWithContext.map(row => (
            <div key={row.room.id} className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-white font-black text-sm">Chambre {row.room.room_number} · {row.room.room_type}</p>
                  <p className="text-text-secondary text-xs">{row.guest ? `${row.guest.first_name} ${row.guest.last_name}` : 'Disponible a la vente'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${statusClass[row.room.status]}`}>{statusLabel[row.room.status]}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className={`h-8 rounded-lg ${row.stay && index < Math.min(row.nights, 7) ? 'bg-purple/50' : row.room.status === 'available' ? 'bg-green/20' : 'bg-white/5'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRooms = () => (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Tous', '1er', '2e', '3e'].map(floor => (
          <button key={floor} onClick={() => setActiveFloor(floor)} className={`h-10 px-4 rounded-xl text-xs font-black ${activeFloor === floor ? 'bg-purple text-white' : 'bg-white/5 text-text-secondary'}`}>
            {floor}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {filteredRooms.map(({ room }) => (
          <motion.button key={room.id} layout onClick={() => updateRoomStatus(room.id, room.status === 'available' ? 'occupied' : room.status === 'occupied' ? 'cleaning' : room.status === 'cleaning' ? 'available' : 'maintenance')} className={`aspect-square rounded-2xl p-4 text-left shadow-lg ${roomTileClass[room.status]}`}>
            <p className="text-2xl font-black leading-none">{room.room_number}</p>
            <p className="text-sm font-bold mt-3 opacity-90">{statusLabel[room.status]}</p>
          </motion.button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(['available', 'occupied', 'cleaning', 'maintenance'] as RoomStatus[]).map(status => (
          <div key={status} className={`rounded-xl border p-3 text-xs font-black ${statusClass[status]}`}>{statusLabel[status]}</div>
        ))}
      </div>
    </div>
  );

  const renderFolios = () => (
    <div className="space-y-3">
      {folioRows.map(row => (
        <div key={row.folio.id} className="glass-card p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-white font-black text-base">Folio chambre {row.room?.room_number}</p>
              <p className="text-text-secondary text-xs">{row.guest?.first_name} {row.guest?.last_name} · split hebergement / extras / societe</p>
            </div>
            <span className="text-white font-black">{money(row.folio.total_amount)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] uppercase font-black">Hebergement</p><p className="text-white font-black text-sm">{money(Math.max(0, row.folio.total_amount - row.extras))}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] uppercase font-black">Extras</p><p className="text-white font-black text-sm">{money(row.extras)}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] uppercase font-black">Societe</p><p className="text-white font-black text-sm">{row.guest?.last_name === 'Lee' ? money(165000) : '-'}</p></div>
          </div>
          <div className="space-y-1 mb-3">
            {row.lines.slice(0, 5).map(line => (
              <div key={line.id} className="flex justify-between gap-3 text-xs">
                <span className="text-text-secondary truncate">{line.description}</span>
                <span className="text-cyan-300 font-bold">{money(line.amount)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { closeFolio(row.folio.id, user?.name || 'Reception'); setNotice(`Folio chambre ${row.room?.room_number} cloture et pret a facturer.`); }} className="w-full h-11 rounded-xl bg-purple/20 text-purple font-black text-xs">
            Cloturer / facturer
          </button>
        </div>
      ))}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-4">
      <section className="glass-card-lg p-4">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-3">Paiements PMS</p>
        <select value={selectedFolio?.id || ''} onChange={event => setSelectedFolioId(event.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none mb-3">
          {folioRows.map(row => <option key={row.folio.id} value={row.folio.id} className="bg-background">Chambre {row.room?.room_number} · {money(row.folio.total_amount)}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => addPayment('deposit')} className="h-12 rounded-xl bg-blue/10 text-blue font-black text-[10px]">Acompte</button>
          <button onClick={() => addPayment('paid')} className="h-12 rounded-xl bg-green/10 text-green font-black text-[10px]">Reglement</button>
          <button onClick={() => addPayment('refund')} className="h-12 rounded-xl bg-orange/10 text-orange font-black text-[10px]">Remboursement</button>
        </div>
      </section>
      {payments.map(payment => (
        <div key={payment.id} className="glass-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-white font-black text-sm">{payment.label}</p>
            <p className="text-text-secondary text-xs">{payment.method} · {payment.folioId}</p>
          </div>
          <span className={`font-black ${payment.amount >= 0 ? 'text-green' : 'text-orange'}`}>{money(Math.abs(payment.amount))}</span>
        </div>
      ))}
    </div>
  );

  const renderClients = () => (
    <div className="space-y-3">
      {guests.map(guest => {
        const guestStays = stays.filter(stay => stay.guest_id === guest.id);
        const guestFolios = folios.filter(folio => folio.guest_id === guest.id);
        const total = guestFolios.reduce((sum, folio) => sum + folio.total_amount, 0);
        const vip = total > 100000 || guest.last_name === 'Lee';
        return (
          <div key={guest.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-white font-black text-sm">{guest.first_name} {guest.last_name}</p>
                <p className="text-text-secondary text-xs">{guest.phone} · {guest.email}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${vip ? 'bg-purple/20 text-purple' : 'bg-white/5 text-text-secondary'}`}>{vip ? 'VIP / Corporate' : 'Client'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Sejours</p><p className="text-white font-black">{guestStays.length}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Total</p><p className="text-green font-black text-xs">{money(total)}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Pref.</p><p className="text-white font-black text-xs">{vip ? 'Etage calme' : 'Standard'}</p></div>
            </div>
            <p className="text-text-secondary text-xs mt-3">Notes internes : allergies, incidents, statut fidelite et preferences de chambre centralises.</p>
          </div>
        );
      })}
    </div>
  );

  const renderHousekeeping = () => (
    <div className="space-y-3">
      {roomsWithContext.map(row => (
        <div key={row.room.id} className="glass-card p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-white font-black text-sm">Chambre {row.room.room_number}</p>
              <p className="text-text-secondary text-xs">Gouvernante : Aissatou · Checklist linge, salle d'eau, mini-bar, inspection</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase ${statusClass[row.room.status]}`}>{statusLabel[row.room.status]}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { status: 'cleaning' as RoomStatus, label: 'Sale' },
              { status: 'available' as RoomStatus, label: 'Propre' },
              { status: 'available' as RoomStatus, label: 'Inspectee' },
              { status: 'maintenance' as RoomStatus, label: 'HS' },
            ].map(action => (
              <button key={action.label} onClick={() => { updateRoomStatus(row.room.id, action.status); setNotice(`Chambre ${row.room.room_number} : ${action.label}.`); }} className="h-10 rounded-xl bg-white/5 text-white text-[10px] font-black">
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderRates = () => (
    <div className="space-y-3">
      {editableRates.map((row, rowIndex) => (
        <div key={row.roomType} className="glass-card p-4">
          <p className="text-white font-black text-sm mb-3">{row.roomType}</p>
          <div className="grid grid-cols-4 gap-2">
            {(['tonight', 'weekend', 'high', 'corporate'] as const).map(key => (
              <label key={key} className="rounded-xl bg-white/5 p-2">
                <p className="text-text-tertiary text-[9px] uppercase font-black">{key === 'tonight' ? 'Ce soir' : key === 'weekend' ? 'Week-end' : key === 'high' ? 'Haute' : 'Corporate'}</p>
                <input
                  value={row[key]}
                  onChange={event => {
                    const value = Number(event.target.value) || 0;
                    setEditableRates(prev => prev.map((item, index) => index === rowIndex ? { ...item, [key]: value } : item));
                  }}
                  className="w-full bg-transparent text-white font-black text-xs outline-none mt-1"
                  inputMode="numeric"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent size={16} className="text-orange" />
          <p className="text-white font-black text-sm">Taxes hotel</p>
        </div>
        <p className="text-text-secondary text-xs">TVA hebergement, taxe de sejour, TVA restauration et exonérations corporate sont separees au folio.</p>
      </div>
      <button onClick={() => setNotice('Simulation tarifaire : prix ajuste selon occupation, saison et canal.')} className="w-full h-12 rounded-2xl bg-orange/10 text-orange font-black text-sm">
        Simuler prix dynamique
      </button>
    </div>
  );

  const renderMaintenance = () => (
    <div className="space-y-3">
      {maintenanceTickets.map(ticket => (
        <div key={`${ticket.room}-${ticket.title}`} className="glass-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-white font-black text-sm">Chambre {ticket.room} · {ticket.title}</p>
              <p className="text-text-secondary text-xs mt-1">{ticket.owner} · Priorite {ticket.priority}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange/10 text-orange text-[9px] font-black uppercase">{ticket.status}</span>
          </div>
        </div>
      ))}
      <button onClick={createMaintenanceTicket} className="w-full h-12 rounded-2xl bg-red/10 text-red font-black text-sm">
        Creer ticket technique
      </button>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-3">
      {[
        { title: 'Facture hotel PDF', detail: 'Hebergement, extras POS, taxes, paiements, solde', action: exportInvoice },
        { title: 'Confirmation reservation', detail: 'Dates, type chambre, acompte et conditions', action: () => setNotice('Confirmation de reservation generee.') },
        { title: 'Recu acompte', detail: 'Recu paiement PMS avec moyen de paiement', action: () => setNotice('Recu acompte genere.') },
        { title: 'Fiche police', detail: 'Document reception client et piece identite', action: () => setNotice('Fiche police preparee.') },
        { title: 'Pro forma corporate', detail: 'Facture previsionnelle societe', action: () => setNotice('Facture pro forma generee.') },
      ].map(doc => (
        <button key={doc.title} onClick={doc.action} className="w-full glass-card p-4 flex items-center justify-between gap-3 text-left">
          <div>
            <p className="text-white font-black text-sm">{doc.title}</p>
            <p className="text-text-secondary text-xs mt-1">{doc.detail}</p>
          </div>
          <Download size={18} className="text-blue" />
        </button>
      ))}
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-3">
      {[
        { title: 'Depart non solde', value: unpaidDepartures, tone: 'red', detail: 'Folios ouverts avec solde avant depart.' },
        { title: 'Chambre sale avec arrivee', value: dirtyArrivals, tone: 'orange', detail: 'A prioriser par la gouvernante.' },
        { title: 'VIP attendu', value: vipArrivals, tone: 'purple', detail: 'Preparer accueil, preference et rooming.' },
        { title: 'Folio au-dessus plafond', value: openFolios.filter(folio => folio.total_amount > 120000).length, tone: 'blue', detail: 'Validation manager recommandee.' },
      ].map(alert => (
        <div key={alert.title} className="glass-card p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-white font-black text-sm">{alert.title}</p>
            <p className="text-text-secondary text-xs mt-1">{alert.detail}</p>
          </div>
          <span className="text-2xl font-black" style={{ color: alert.tone === 'red' ? '#EF4444' : alert.tone === 'orange' ? '#FF8A00' : alert.tone === 'purple' ? '#8B5CF6' : '#3B82F6' }}>{alert.value}</span>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Occupation', value: `${occupancyRate}%`, icon: BedDouble, color: '#8B5CF6' },
          { label: 'ADR', value: money(adr), icon: CreditCard, color: '#22C55E' },
          { label: 'RevPAR', value: money(revPar), icon: FileText, color: '#06B6D4' },
          { label: 'CA folios', value: money(revenueOpen), icon: ReceiptText, color: '#FF8A00' },
        ].map(card => (
          <div key={card.label} className="glass-card p-4">
            <card.icon size={18} style={{ color: card.color }} />
            <p className="text-text-tertiary text-[10px] font-black uppercase mt-3">{card.label}</p>
            <p className="text-white font-black text-lg mt-1">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="glass-card-lg p-4">
        <p className="text-white font-black text-base mb-3">Permissions hotel</p>
        {[
          'Reception : check-in, folio, room charge',
          'Gouvernante : menage, inspection, mini-bar',
          'Maintenance : tickets techniques',
          'Manager hotel : tarifs, clotures, remises',
          'Direction : consolidation multi-sites',
        ].map(rule => (
          <div key={rule} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-b-0">
            <ShieldCheck size={14} className="text-green" />
            <span className="text-text-secondary text-xs">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-content pt-9 pb-28">
      <header className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/modules')} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center" aria-label="Retour aux activites">
          <Menu size={22} />
        </button>
        <div className="text-center">
          <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">PMS Hotel</p>
          <h1 className="text-white font-black text-xl">Reception & sejour</h1>
        </div>
        <button onClick={() => navigate(canAccessRoute(user, '/settings') ? '/settings' : '/plus')} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center" aria-label="Reglages hotel">
          <SlidersHorizontal size={20} />
        </button>
      </header>

      {notice && (
        <button onClick={() => setNotice('')} className="w-full mb-4 rounded-2xl bg-green/10 border border-green/20 text-green text-xs font-black px-4 py-3 text-left">
          {notice}
        </button>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Chambre, client, folio..." className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 text-white text-sm outline-none placeholder:text-text-tertiary" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {tabs.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`h-11 px-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase whitespace-nowrap ${tab === item.id ? 'bg-purple text-white shadow-purple-glow' : 'bg-white/5 text-text-secondary border border-white/10'}`}>
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'reception' && renderReception()}
      {tab === 'reservations' && renderReservations()}
      {tab === 'availability' && renderAvailability()}
      {tab === 'planning' && renderPlanning()}
      {tab === 'rooms' && renderRooms()}
      {tab === 'folios' && renderFolios()}
      {tab === 'payments' && renderPayments()}
      {tab === 'clients' && renderClients()}
      {tab === 'housekeeping' && renderHousekeeping()}
      {tab === 'rates' && renderRates()}
      {tab === 'maintenance' && renderMaintenance()}
      {tab === 'documents' && renderDocuments()}
      {tab === 'alerts' && renderAlerts()}
      {tab === 'reports' && renderReports()}

      <div className="glass-card p-4 mt-5 flex gap-3">
        <AlertTriangle size={18} className="text-orange shrink-0 mt-0.5" />
        <p className="text-text-secondary text-xs leading-relaxed">
          Demo connectee : les charges folio utilisent le PMS, le mini-bar et room service declenchent aussi le moteur POS/stock, et les droits restent limites par le profil connecte.
        </p>
      </div>
    </div>
  );
}
