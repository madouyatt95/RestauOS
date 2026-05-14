import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, CreditCard, ArrowDownToLine, Check, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function Wallet() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(50000);
  const [showRecharge, setShowRecharge] = useState(false);
  const [amount, setAmount] = useState(10000);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRecharge = () => {
    setBalance(b => b + amount);
    setShowRecharge(false);
  };

  return (
    <div className="page-content pt-8 pb-32 bg-[#070A0F] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Portefeuille</p>
          <h1 className="text-white font-black text-2xl">RestauPay</h1>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-red">
          <LogOut size={18} />
        </button>
      </div>

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-800 p-6 shadow-[0_8px_32px_rgba(59,130,246,0.3)] mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <WalletIcon size={18} /> Solde actuel
          </div>
          <div className="text-4xl font-black text-white mb-6">
            {fmt(balance)} <span className="text-lg font-medium">FCFA</span>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setShowRecharge(true)} className="flex-1 py-3 bg-white text-blue-900 font-bold rounded-xl flex items-center justify-center gap-2">
              <ArrowDownToLine size={18} /> Recharger
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-white font-bold text-lg mb-4">Dernières transactions</h2>
      <div className="space-y-3">
        {[
          { id: 1, title: 'Commande #1204', date: "Aujourd'hui, 13:45", amount: -4500, type: 'out' },
          { id: 2, title: 'Recharge Wave', date: 'Hier, 10:20', amount: 20000, type: 'in' },
          { id: 3, title: 'Commande #1198', date: 'Lun 12 Mai', amount: -12500, type: 'out' },
        ].map(t => (
          <div key={t.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'in' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>
                {t.type === 'in' ? <ArrowDownToLine size={16} /> : <CreditCard size={16} />}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{t.title}</p>
                <p className="text-text-secondary text-xs">{t.date}</p>
              </div>
            </div>
            <div className={`font-bold ${t.type === 'in' ? 'text-green' : 'text-white'}`}>
              {t.type === 'in' ? '+' : ''}{fmt(t.amount)}
            </div>
          </div>
        ))}
      </div>

      {/* Recharge Modal */}
      <AnimatePresence>
        {showRecharge && (
          <div className="modal-overlay" onClick={() => setShowRecharge(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-6">Recharger mon compte</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[5000, 10000, 20000, 50000].map(val => (
                  <button key={val} onClick={() => setAmount(val)}
                    className={`p-4 rounded-xl border ${amount === val ? 'border-orange bg-orange/10 text-orange' : 'border-white/10 text-white'} font-bold`}>
                    {fmt(val)} F
                  </button>
                ))}
              </div>

              <button onClick={handleRecharge} className="w-full py-4 rounded-xl bg-[#3B82F6] text-white font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(59,130,246,0.4)]">
                Payer avec Wave
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
