import { motion } from 'framer-motion';
import { BedDouble, CalendarDays, CreditCard, ReceiptText, UserRound } from 'lucide-react';
import { useHospiStore } from '../stores/hospiStore';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const statusLabel: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Occupée',
  cleaning: 'Ménage',
  maintenance: 'Maintenance',
};

export default function PMS() {
  const {
    rooms,
    guests,
    stays,
    folios,
    folioLines,
    customerAccounts,
    getCustomerAccountBalance,
  } = useHospiStore();

  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const openFolios = folios.filter(folio => folio.status === 'open');
  const openFolioTotal = openFolios.reduce((sum, folio) => sum + folio.total_amount, 0);
  const customerBalance = customerAccounts.reduce((sum, account) => sum + getCustomerAccountBalance(account.id), 0);

  return (
    <div className="page-content pt-14 pb-28">
      <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-lg p-5 mb-5">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest mb-1">PMS hôtel intégré</p>
        <h1 className="text-white font-black text-2xl">Chambres, séjours et folios</h1>
        <p className="text-text-secondary text-xs mt-2">Les consommations POS peuvent être imputées directement sur une chambre, avec traçabilité caisse et folio.</p>
      </motion.section>

      <section className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Occupation', value: `${occupiedRooms}/${rooms.length}`, icon: BedDouble, color: '#06B6D4' },
          { label: 'Folios ouverts', value: openFolios.length, icon: ReceiptText, color: '#F59E0B' },
          { label: 'Total folios', value: `${fmt(openFolioTotal)} F`, icon: CreditCard, color: '#22C55E' },
          { label: 'Encours clients', value: `${fmt(customerBalance)} F`, icon: UserRound, color: '#EC4899' },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.04 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="text-text-tertiary text-[9px] font-black uppercase">{kpi.label}</p>
            </div>
            <p className="text-white font-black text-lg">{kpi.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-3">
        {rooms.map(room => {
          const stay = stays.find(item => item.room_id === room.id && item.status === 'checked_in');
          const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
          const folio = stay ? folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
          const lines = folio ? folioLines.filter(line => line.folio_id === folio.id) : [];

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
                </div>
              )}
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
