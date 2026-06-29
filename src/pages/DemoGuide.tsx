import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BedDouble, Building2, CheckCircle2, CreditCard, Package, ShieldCheck, ShoppingBag, UserRound } from 'lucide-react';
import { DEMO_USERS } from '../stores/authStore';

const steps = [
  { title: 'Direction générale', detail: 'Ouvrir Accueil pour montrer la vision consolidée entreprise, sites et activités.', path: '/dashboard', icon: ShieldCheck, color: '#8B5CF6' },
  { title: 'Activités', detail: 'Entrer dans Restaurant, Hôtel, Casino, Spa ou Boutique selon le profil connecté.', path: '/modules', icon: Building2, color: '#06B6D4' },
  { title: 'Vente POS', detail: 'Créer une vente depuis un point de vente autorisé et vérifier le prix propre au POS.', path: '/commandes', icon: ShoppingBag, color: '#FF8A00' },
  { title: 'Caisse', detail: 'Encaisser, appliquer une remise contrôlée ou imputer la consommation à une chambre.', path: '/caisse', icon: CreditCard, color: '#22C55E' },
  { title: 'PMS Hôtel', detail: 'Afficher chambres, folios ouverts, charges manuelles et clôture de folio.', path: '/pms', icon: BedDouble, color: '#3B82F6' },
  { title: 'Stock', detail: 'Montrer le dépôt du site, les seuils, achats, réception fournisseur, mouvements et FIFO.', path: '/stocks', icon: Package, color: '#EC4899' },
];

const accessLabels: Record<string, string> = {
  direction: 'Toute entreprise',
  site_manager: 'Site uniquement',
  business_manager: 'Métier uniquement',
  pos_manager: 'POS uniquement',
  staff: 'Rôle + service',
  client: 'Espace client',
};

export default function DemoGuide() {
  const navigate = useNavigate();

  return (
    <div className="page-content pt-14 pb-28">
      <header className="mb-6">
        <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.18em]">Mode présentation</p>
        <h1 className="text-white font-black text-2xl mt-1">Parcours de démo</h1>
        <p className="text-text-secondary text-sm mt-2">
          Utilise cet écran comme fil conducteur : profils, périmètres, puis scénario POS → stock → PMS.
        </p>
      </header>

      <section className="glass-card-lg p-5 mb-5">
        <h2 className="text-white font-black text-base mb-4">Profils à tester</h2>
        <div className="space-y-3">
          {DEMO_USERS.map(user => (
            <div key={user.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" /> : <UserRound size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm truncate">{user.name}</p>
                <p className="text-text-secondary text-xs truncate">{user.demoTitle || user.role}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange/10 text-orange text-[9px] font-black uppercase">
                {accessLabels[user.accessLevel || 'staff']}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {steps.map((step, index) => (
          <motion.button
            key={step.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => navigate(step.path)}
            className="w-full glass-card p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${step.color}22`, color: step.color }}>
              <step.icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm">{index + 1}. {step.title}</p>
              <p className="text-text-secondary text-xs mt-1 leading-snug">{step.detail}</p>
            </div>
            <ArrowRight size={18} className="text-text-tertiary" />
          </motion.button>
        ))}
      </section>

      <div className="glass-card p-4 mt-5 flex gap-3">
        <CheckCircle2 size={20} className="text-green shrink-0 mt-0.5" />
        <p className="text-text-secondary text-xs leading-relaxed">
          Phrase de présentation : Sártal OS Hospi pilote la holding et chaque métier conserve son exploitation terrain, avec prix, stock, caisse, PMS et droits filtrés par périmètre.
        </p>
      </div>
    </div>
  );
}
