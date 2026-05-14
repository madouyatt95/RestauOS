import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useReservationStore } from '../stores/reservationStore';
import { Calendar as CalendarIcon, Clock, Users, Check } from 'lucide-react';

export default function Reservations() {
  const { user } = useAuthStore();
  const { addReservation } = useReservationStore();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    
    addReservation({
      clientName: user?.name || 'Client Web',
      date,
      time,
      guests
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setDate('');
      setTime('');
      setGuests(2);
    }, 3000);
  };


  return (
    <div className="page-content pt-8 pb-32 bg-[#070A0F] min-h-screen">
      <div className="mb-8">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Réservation</p>
        <h1 className="text-white font-black text-2xl">Réserver une table</h1>
      </div>

      <form onSubmit={handleReserve} className="space-y-6">
        <div className="glass-card p-5 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <CalendarIcon size={16} /> Date
            </label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange/50 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <Clock size={16} /> Heure d'arrivée
            </label>
            <input 
              type="time" 
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange/50 transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-text-secondary text-sm mb-2">
              <Users size={16} /> Nombre de personnes
            </label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white text-xl">-</button>
              <span className="flex-1 text-center text-2xl font-bold text-white">{guests}</span>
              <button type="button" onClick={() => setGuests(guests + 1)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white text-xl">+</button>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold shadow-[0_4px_20px_rgba(255,138,0,0.4)] active:scale-[0.98] transition-transform">
          Confirmer la réservation
        </button>
      </form>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-bg-primary/90 flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mb-6">
              <Check size={48} className="text-green" />
            </motion.div>
            <motion.p className="text-white text-xl font-bold">Table réservée !</motion.p>
            <motion.p className="text-text-secondary text-sm mt-2 text-center px-8">Nous avons hâte de vous recevoir, {user?.name}.</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
