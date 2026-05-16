import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, DEMO_USERS } from '../stores/authStore';

import { ShoppingBag, Package, Users, BarChart3, Heart, Truck, ChefHat, X, ScanLine } from 'lucide-react';

const modules = [
  { icon: ShoppingBag, label: 'Caisse & Commandes', color: '#FF8A00' },
  { icon: Package, label: 'Stocks & Inventaires', color: '#8B5CF6' },
  { icon: Users, label: 'Gestion du personnel', color: '#3B82F6' },
  { icon: BarChart3, label: 'Analyses & Rapports', color: '#22C55E' },
  { icon: Heart, label: 'Fidélité & Clients', color: '#EF4444' },
  { icon: Truck, label: 'Livraisons', color: '#06B6D4' },
];

// Onboarding slides with real app screenshots
const ONBOARDING_SLIDES = [
  { image: '/images/onboarding/salle.png', title: 'Plan de salle interactif', subtitle: 'Visualisez toutes vos tables en temps réel. Libre, occupée ou prête à servir — tout en un coup d\'œil.', color: '#22C55E' },
  { image: '/images/onboarding/cuisine.png', title: 'Cuisine connectée', subtitle: 'Tickets en temps réel, suivi de progression par plat et validation en un clic. La coordination parfaite.', color: '#FF8A00' },
  { image: '/images/onboarding/caisse.png', title: 'Encaissement rapide', subtitle: 'Division d\'addition, paiements multiples : Espèces, Wave, Orange Money ou carte. Simple et sécurisé.', color: '#F59E0B' },
  { image: '/images/onboarding/livraisons.png', title: 'Livraisons optimisées', subtitle: 'Carte Dakar en direct, suivi GPS, statuts en temps réel et encaissement à la livraison.', color: '#3B82F6' },
  { image: '/images/onboarding/personnel.png', title: 'Gestion du personnel', subtitle: 'Planning intelligent, présences en temps réel, échanges de shifts et vue par département.', color: '#8B5CF6' },
  { image: '/images/onboarding/dashboard.png', title: 'Pilotage & Performance', subtitle: 'Chiffre d\'affaires, panier moyen, répartition des ventes et satisfaction client — tout centralisé.', color: '#7C3AED' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [showLogin, setShowLogin] = useState(false);
  const [showQRInput, setShowQRInput] = useState(false);
  const [qrInput, setQRInput] = useState('');

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('restauos_onboarding_done'));
  const [slideIdx, setSlideIdx] = useState(0);

  const handleLogin = (user: typeof DEMO_USERS[0]) => {
    login(user);
    if (user.role === 'Admin' || user.role === 'Gérant') navigate('/dashboard');
    else if (user.role === 'Chef cuisine') navigate('/cuisine');
    else if (user.role === 'Livreur') navigate('/livraisons');
    else if (user.role === 'Client') navigate('/client');
    else if (user.role === 'Serveur') navigate('/commandes');
    else if (user.role === 'Caissier') navigate('/caisse');
    else navigate('/dashboard');
  };

  const handleQRLogin = () => {
    const user = DEMO_USERS.find(u => u.id === qrInput.trim() || u.employeeId === qrInput.trim());
    if (user) {
      handleLogin(user);
    } else {
      alert('Code invalide. Essayez un ID comme u1, u4, e2...');
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem('restauos_onboarding_done', 'true');
    setShowOnboarding(false);
  };

  // ==================== ONBOARDING ====================
  if (showOnboarding) {
    const slide = ONBOARDING_SLIDES[slideIdx];
    const isLast = slideIdx === ONBOARDING_SLIDES.length - 1;

    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-between px-6 py-10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]" style={{ background: slide.color }} />
        </div>

        {/* Skip button */}
        <div className="w-full flex justify-end relative z-20">
          <button onClick={finishOnboarding} className="text-text-tertiary text-xs font-bold uppercase tracking-widest px-3 py-1">
            Passer
          </button>
        </div>

        {/* Phone mockup with demo image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIdx}
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-[280px]"
          >
            {/* Phone frame */}
            <div className="rounded-[2rem] border-2 border-white/10 bg-black/40 p-2 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
              {/* Notch */}
              <div className="mx-auto w-24 h-5 bg-black rounded-b-2xl mb-1" />
              {/* Screen */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-[1.5rem] overflow-hidden"
              >
                <img src={slide.image} alt={slide.title} className="w-full aspect-[9/16] object-cover" />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Text + controls */}
        <div className="relative z-10 w-full max-w-sm text-center space-y-5">
          <AnimatePresence mode="wait">
            <motion.div key={`text-${slideIdx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h2 className="text-white font-black text-xl mb-2 tracking-tight">{slide.title}</h2>
              <p className="text-text-secondary text-sm leading-relaxed">{slide.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex gap-2 justify-center">
            {ONBOARDING_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                className={`transition-all duration-300 rounded-full ${i === slideIdx ? 'w-8 h-2' : 'w-2 h-2'}`}
                style={{ background: i === slideIdx ? slide.color : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          {/* Button */}
          {isLast ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={finishOnboarding}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-lg shadow-[0_8px_32px_rgba(255,138,0,0.35)]">
              Commencer 🚀
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSlideIdx(s => s + 1)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-lg shadow-[0_8px_32px_rgba(255,138,0,0.35)]">
              Suivant →
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  // ==================== MAIN LANDING ====================
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

        {/* QR Scan Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowQRInput(true)}
          className="w-full py-3 mt-3 rounded-2xl bg-white/5 border border-white/10 text-text-secondary font-bold text-sm flex items-center justify-center gap-2"
        >
          <ScanLine size={18} />
          Scanner un QR Code
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

      {/* QR Code Input Modal */}
      <AnimatePresence>
        {showQRInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowQRInput(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet relative" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <button onClick={() => setShowQRInput(false)} className="absolute top-4 right-4 text-text-tertiary"><X size={20} /></button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue/10 flex items-center justify-center text-blue mb-4">
                  <ScanLine size={32} />
                </div>
                <h3 className="text-white font-bold text-lg">Connexion par QR Code</h3>
                <p className="text-text-secondary text-xs mt-2">Scannez le QR Code de votre badge ou entrez votre identifiant.</p>
              </div>
              <input
                type="text"
                value={qrInput}
                onChange={e => setQRInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQRLogin()}
                placeholder="ID employé (ex: u4, e2...)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-center text-lg font-mono focus:border-blue/50 transition-colors mb-4"
                autoFocus
              />
              <button onClick={handleQRLogin} className="w-full py-4 rounded-2xl bg-blue text-white font-bold text-sm shadow-lg shadow-blue/20">
                Se connecter
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
