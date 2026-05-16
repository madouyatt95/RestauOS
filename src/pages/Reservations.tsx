import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReservationStore } from '../stores/reservationStore';
import { useAuthStore } from '../stores/authStore';
import { Calendar as CalIcon, Clock, Users, MessageSquare, Check, X, Bell, Trash2 } from 'lucide-react';

const DATES = [
  { day: 'Auj.', date: new Date().toISOString().split('T')[0] },
  { day: 'Demain', date: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
  { day: 'Samedi', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
];
const TIMES = ['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const OCCASIONS = ['Classique', 'Anniversaire', 'Affaires', 'Romantique', 'Famille'];

export default function Reservations() {
  const { user } = useAuthStore();
  const { reservations, addReservation, cancelReservation } = useReservationStore();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(DATES[0].date);
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [occasion, setOccasion] = useState('Classique');
  const [notes, setNotes] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const myReservations = reservations.filter(r => r.clientName === user?.name).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const handleBook = () => {
    // Simulate smart slots: 20:00 is often full
    const status = time === '20:00' ? 'waitlist' : 'pending';
    addReservation({
      clientName: user?.name || 'Client',
      clientPhone: '77 000 00 00',
      date, time, guests, status, notes, occasion: occasion.toLowerCase() as any
    });
    setStep(status === 'waitlist' ? 3 : 2);
  };

  return (
    <div className="page-content pt-8 pb-32 min-h-screen bg-[#070A0F]">
      <h1 className="text-white font-black text-2xl mb-6">Réserver une table</h1>

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {myReservations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-bold text-lg mb-3">Vos réservations</h2>
              <div className="space-y-3">
                {myReservations.map(r => (
                  <div key={r.id} className={`glass-card p-4 border ${r.status === 'cancelled' ? 'border-red/20 opacity-50' : 'border-white/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-white font-bold">{new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        r.status === 'confirmed' ? 'bg-green/20 text-green' : r.status === 'waitlist' ? 'bg-orange/20 text-orange' : r.status === 'cancelled' ? 'bg-red/20 text-red' : 'bg-blue/20 text-blue'
                      }`}>
                        {r.status === 'waitlist' ? "Liste d'attente" : r.status === 'confirmed' ? 'Confirmée' : r.status === 'cancelled' ? 'Annulée' : 'En attente'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-text-secondary text-xs">
                      <span className="flex items-center gap-1"><Clock size={12} /> {r.time}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {r.guests} pers.</span>
                    </div>
                    {r.status === 'cancelled' && r.cancelReason && (
                      <p className="text-red/60 text-[10px] mt-2 italic">Motif : {r.cancelReason}</p>
                    )}
                    {r.status !== 'cancelled' && (
                      <button onClick={() => { setCancelTarget(r.id); setCancelReason(''); }}
                        className="mt-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red/10 text-red text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">
                        <Trash2 size={10} /> Annuler
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-5 space-y-6">
            <div>
              <label className="text-text-tertiary text-xs font-bold uppercase mb-3 flex items-center gap-2"><CalIcon size={14}/> Date</label>
              <div className="flex gap-2">
                {DATES.map(d => (
                  <button key={d.date} onClick={() => setDate(d.date)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${date === d.date ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>
                    {d.day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-bold uppercase mb-3 flex items-center gap-2"><Clock size={14}/> Heure</label>
              <div className="grid grid-cols-3 gap-2">
                {TIMES.map(t => {
                  const isFull = t === '20:00';
                  return (
                    <button key={t} onClick={() => setTime(t)}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        time === t ? 'bg-orange border-orange text-white' : isFull ? 'bg-orange/10 border-orange/20 text-orange' : 'bg-white/5 border-transparent text-text-secondary'
                      }`}>
                      {t}
                      {isFull && <span className="block text-[8px] mt-0.5">Complet (Attente)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-bold uppercase mb-3 flex items-center gap-2"><Users size={14}/> Personnes</label>
              <div className="flex items-center justify-between bg-white/5 rounded-xl p-2">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white"><X className="rotate-45" size={16} /></button>
                <span className="text-white font-black text-xl">{guests}</span>
                <button onClick={() => setGuests(guests + 1)} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white"><Plus size={16} /></button>
              </div>
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-bold uppercase mb-3 block">Occasion</label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map(o => (
                  <button key={o} onClick={() => setOccasion(o)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${occasion === o ? 'bg-white/20 text-white ring-1 ring-white' : 'bg-white/5 text-text-tertiary'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-bold uppercase mb-3 flex items-center gap-2"><MessageSquare size={14}/> Note (Optionnel)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Allergies, demande spéciale..."
                className="w-full bg-white/5 border-none rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange placeholder:text-white/20 h-24 resize-none" />
            </div>

            <button disabled={!time} onClick={handleBook}
              className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase shadow-lg shadow-orange/20 active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100">
              Réserver la table
            </button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-6">
            <Check size={48} className="text-green" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Demande Envoyée !</h2>
          <p className="text-text-secondary text-sm mb-8">Le restaurant va confirmer votre réservation très bientôt. Vous recevrez une notification.</p>
          <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl bg-white/5 text-white font-bold text-sm">Retourner aux réservations</button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-orange/20 flex items-center justify-center mx-auto mb-6">
            <Bell size={48} className="text-orange" />
          </div>
          <h2 className="text-orange font-black text-2xl mb-2">Liste d'attente</h2>
          <p className="text-text-secondary text-sm mb-8">Ce créneau est actuellement complet. Vous êtes inscrit sur la liste d'attente, nous vous préviendrons si une table se libère.</p>
          <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl bg-orange/20 text-orange font-bold text-sm">Compris</button>
        </motion.div>
      )}

      {/* Cancel Reservation Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setCancelTarget(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-red/10 flex items-center justify-center text-red mb-4">
                  <Trash2 size={28} />
                </div>
                <h3 className="text-white font-black text-xl">Annuler la réservation ?</h3>
                <p className="text-text-secondary text-sm mt-2">Cette action est irréversible.</p>
              </div>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Motif d'annulation (facultatif)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm h-20 resize-none focus:border-red/50 transition-colors mb-6"
              />
              <div className="flex gap-3">
                <button onClick={() => setCancelTarget(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 text-text-secondary font-bold text-sm">
                  Retour
                </button>
                <button onClick={() => { cancelReservation(cancelTarget, cancelReason); setCancelTarget(null); }}
                  className="flex-1 py-3.5 rounded-2xl bg-red text-white font-black text-sm shadow-lg shadow-red/20 active:scale-95 transition-transform">
                  Confirmer l'annulation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Plus component definition inside this file for compiling reasons
const Plus = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
