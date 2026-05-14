import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Utensils, Star, Smartphone, Activity } from 'lucide-react';

const SLIDES = [
  {
    title: "Bienvenue sur RestauOS",
    subtitle: "L'intelligence artificielle au service de votre restaurant. Gérez tout, de la commande à la cuisine, avec une fluidité absolue.",
    icon: Utensils,
    color: "#FF8A00",
    bg: "rgba(255,138,0,0.1)",
  },
  {
    title: "Vendez plus, plus vite",
    subtitle: "Commandes par QR Code, Click & Collect, et livraisons par livreurs indépendants intégrées nativement.",
    icon: Smartphone,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
  },
  {
    title: "L'expérience parfaite",
    subtitle: "Recueillez les avis de vos clients après chaque repas et fidélisez-les avec des promotions ciblées.",
    icon: Star,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
  },
  {
    title: "Pilotage à 360°",
    subtitle: "Suivez votre chiffre d'affaires, vos pertes alimentaires, et l'efficacité de votre personnel en temps réel.",
    icon: Activity,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.1)",
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      // Finished onboarding
      localStorage.setItem('restauos_onboarded', 'true');
      navigate('/');
    }
  };

  const current = SLIDES[step];

  return (
    <div className="fixed inset-0 bg-[#0a0c10] flex flex-col z-50 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-30 transition-colors duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${current.color}30 0%, transparent 70%)` }} />
      
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="text-center flex flex-col items-center"
          >
            <div className="w-32 h-32 rounded-full mb-10 flex items-center justify-center border-4" style={{ background: current.bg, borderColor: current.color + '40' }}>
              <current.icon size={64} style={{ color: current.color }} />
            </div>
            
            <h1 className="text-white font-black text-3xl mb-4 leading-tight">{current.title}</h1>
            <p className="text-text-secondary text-sm font-bold leading-relaxed max-w-xs mx-auto">
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress & Controls */}
      <div className="p-8 pb-12 relative z-10 flex flex-col items-center">
        <div className="flex gap-2 mb-10">
          {SLIDES.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full py-5 rounded-[2rem] text-white font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform"
          style={{ background: current.color, boxShadow: `0 20px 40px -10px ${current.color}60` }}
        >
          {step === SLIDES.length - 1 ? 'Commencer' : 'Continuer'}
          <ChevronRight size={24} />
        </button>

        {step < SLIDES.length - 1 && (
          <button onClick={() => navigate('/')} className="mt-6 text-text-tertiary text-xs font-bold uppercase tracking-widest active:text-white transition-colors">
            Passer l'introduction
          </button>
        )}
      </div>
    </div>
  );
}
