import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, DEMO_USERS } from '../stores/authStore';
import { ShoppingBag, Package, Users, BarChart3, Heart, Truck, ChefHat, X } from 'lucide-react';

const modules = [
  { icon: ShoppingBag, label: 'Caisse & Commandes', color: '#FF8A00' },
  { icon: Package, label: 'Stocks & Inventaires', color: '#8B5CF6' },
  { icon: Users, label: 'Gestion du personnel', color: '#3B82F6' },
  { icon: BarChart3, label: 'Analyses & Rapports', color: '#22C55E' },
  { icon: Heart, label: 'Fidélité & Clients', color: '#EF4444' },
  { icon: Truck, label: 'Livraisons', color: '#06B6D4' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (user: typeof DEMO_USERS[0]) => {
    login(user);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-orange to-amber-600 flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(255,138,0,0.3)]">
            <ChefHat size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Restau<span className="text-orange">OS</span>
          </h1>
          <p className="text-orange font-bold text-sm tracking-widest uppercase mt-1">Sénégal</p>
        </div>

        <p className="text-text-secondary text-base mb-10 leading-relaxed">
          La solution tout-en-un pour gérer votre restaurant comme un pro.
        </p>

        {/* Modules */}
        <div className="space-y-3 mb-10">
          {modules.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="glass-card flex items-center gap-4 px-5 py-4"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${m.color}20` }}>
                <m.icon size={20} style={{ color: m.color }} />
              </div>
              <span className="text-white font-semibold text-sm">{m.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-lg">🇸🇳</span>
          <span className="text-text-secondary text-xs font-medium">Conçu pour les restaurants au Sénégal</span>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLogin(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-lg shadow-[0_8px_32px_rgba(255,138,0,0.35)] active:shadow-[0_4px_16px_rgba(255,138,0,0.25)] transition-shadow"
        >
          Se connecter
        </motion.button>
      </motion.div>

      {/* Bottom features strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 grid grid-cols-3 gap-3 max-w-md w-full"
      >
        {[
          { icon: '🇸🇳', label: '100% adapté au Sénégal' },
          { icon: '📴', label: 'Fonctionne hors ligne' },
          { icon: '💳', label: 'Wave, Orange Money' },
        ].map((f) => (
          <div key={f.label} className="text-center">
            <div className="text-2xl mb-1">{f.icon}</div>
            <p className="text-[10px] text-text-tertiary leading-tight">{f.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowLogin(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet relative" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-text-tertiary">
                <X size={20} />
              </button>
              <h3 className="text-white font-bold text-lg mb-2">Comptes de démonstration</h3>
              <p className="text-text-secondary text-sm mb-6">Sélectionnez un profil pour vous connecter d'un simple clic.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {DEMO_USERS.map((user) => (
                  <button key={user.id} onClick={() => handleLogin(user)}
                    className="glass-card p-4 flex flex-col items-center gap-3 active:border-orange/30 transition-colors">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet to-blue flex items-center justify-center text-white font-black text-lg">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-white text-xs font-bold">{user.name}</div>
                      <div className="text-text-tertiary text-[10px] mt-0.5">{user.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
