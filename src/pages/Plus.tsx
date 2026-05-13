import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Building2, CreditCard, Users, Settings, HelpCircle, LogOut,
  ChevronRight, BarChart3, Heart, Truck
} from 'lucide-react';

const menuItems = [
  { icon: User, label: 'Mon profil', color: '#3B82F6', path: '' },
  { icon: Building2, label: 'Mon restaurant', color: '#8B5CF6', path: '' },
  { icon: CreditCard, label: 'Abonnements', color: '#22C55E', path: '' },
  { icon: Users, label: 'Utilisateurs', color: '#06B6D4', path: '' },
  { icon: Settings, label: 'Paramètres', color: '#A1A1AA', path: '' },
  { icon: HelpCircle, label: 'Aide & Support', color: '#F59E0B', path: '' },
];

const quickLinks = [
  { icon: BarChart3, label: 'Rapports', path: '/rapports', color: '#22C55E' },
  { icon: Heart, label: 'Fidélité', path: '/fidelite', color: '#EF4444' },
  { icon: Truck, label: 'Livraisons', path: '/livraisons', color: '#3B82F6' },
];

export default function Plus() {
  const navigate = useNavigate();

  return (
    <div className="page-content pt-14 pb-28">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg p-5 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-amber-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_4px_20px_rgba(255,138,0,0.3)]">
          CF
        </div>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">Cheikh Fall</h2>
          <p className="text-text-secondary text-sm">Gérant</p>
        </div>
        <button className="w-9 h-9 glass-card rounded-full flex items-center justify-center">
          <Settings size={16} className="text-text-secondary" />
        </button>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {quickLinks.map((link, i) => (
          <motion.button key={link.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => navigate(link.path)}
            className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/30 transition-colors">
            <link.icon size={22} style={{ color: link.color }} />
            <span className="text-white text-xs font-semibold">{link.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="glass-card-lg overflow-hidden">
        {menuItems.map((item, i) => (
          <motion.button key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.04 }}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/[0.03] transition-colors"
            style={{ borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${item.color}20` }}>
              <item.icon size={18} style={{ color: item.color }} />
            </div>
            <span className="text-white font-medium text-sm flex-1 text-left">{item.label}</span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </motion.button>
        ))}
      </div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate('/')}
        className="w-full mt-6 py-4 rounded-2xl glass-card flex items-center justify-center gap-2 text-red font-semibold text-sm active:bg-red/5 transition-colors">
        <LogOut size={16} />
        Déconnexion
      </motion.button>

      {/* Version */}
      <p className="text-center text-text-tertiary text-[10px] mt-6">RestauOS Sénégal v1.0 · © 2026</p>
    </div>
  );
}
