import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Sun,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore } from '../stores/hospiStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useThemeStore } from '../stores/themeStore';
import { canAccessRoute, getAccessSummary } from '../utils/accessControl';

const ACCENT_COLORS = ['#FF8A00', '#EF4444', '#8B5CF6', '#3B82F6', '#22C55E', '#EC4899', '#06B6D4', '#F59E0B'];

const NOTIF_ICONS: Record<string, { icon: any; color: string }> = {
  order: { icon: ShoppingBag, color: '#3B82F6' },
  swap: { icon: Calendar, color: '#F59E0B' },
  stock: { icon: AlertCircle, color: '#EF4444' },
  review: { icon: Star, color: '#FF8A00' },
  delivery: { icon: Truck, color: '#22C55E' },
  promo: { icon: Wallet, color: '#8B5CF6' },
  loyalty: { icon: Star, color: '#EC4899' },
  payment: { icon: Wallet, color: '#06B6D4' },
  broadcast: { icon: Bell, color: '#EC4899' },
  system: { icon: Settings, color: '#6B7280' },
};

type Section = 'profile' | 'notifications' | 'theme';

const timeAgo = (date: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 1440) return `il y a ${Math.floor(minutes / 60)} h`;
  return `il y a ${Math.floor(minutes / 1440)} j`;
};

export default function Plus() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { companies, sites, activePOSId, posList } = useHospiStore();
  const { notifications, markRead, markAllRead, getUnreadCount } = useNotificationStore();
  const { mode, accent, toggleMode, setAccent } = useThemeStore();
  const [activeSection, setActiveSection] = useState<Section>('profile');

  const company = companies[0];
  const activePOS = posList.find(pos => pos.id === activePOSId);
  const selectedSite = sites.find(site => site.id === activePOS?.site_id) || sites[0];
  const unread = getUnreadCount();
  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const profileLinks = [
    ...(isManager && canAccessRoute(user, '/settings') ? [
      { icon: Settings, label: 'Admin Hospi', description: 'Sites, POS, dépôts, prix, permissions', path: '/settings', color: '#8B5CF6' },
    ] : []),
    ...(isManager ? [
      { icon: BarChart3, label: 'Rapports consolidés', description: 'Vue holding, sites, métiers et équipes', path: '/rapports', color: '#22C55E' },
      { icon: Building2, label: 'Modules métiers', description: 'Restaurant, hôtel, casino, spa, boutique', path: '/modules', color: '#06B6D4' },
    ] : []),
    { icon: Calendar, label: 'Planning & équipe', description: 'Présences, rôles et services', path: '/personnel', color: '#EC4899' },
    { icon: HelpCircle, label: 'Parcours de démo', description: 'Profils, scénario et ordre de présentation', path: '/demo-guide', color: '#F59E0B' },
  ];

  return (
    <div className="page-content pt-14 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg p-5 mb-4"
      >
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-purple-600 flex items-center justify-center text-xl font-black text-white">
              {(user?.name || 'U').split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.18em]">Espace profil</p>
            <h1 className="text-white font-black text-xl leading-tight truncate">{user?.name || 'Utilisateur'}</h1>
            <p className="text-text-secondary text-sm truncate">{user?.demoTitle || user?.role || 'Profil'} · {selectedSite?.name || company?.name || 'Sártal OS'}</p>
          </div>
          {isManager && canAccessRoute(user, '/settings') && (
            <button
              onClick={() => navigate('/settings')}
              className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
              aria-label="Ouvrir Admin Hospi"
            >
              <ShieldCheck size={20} />
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { id: 'profile', label: 'Profil', icon: User },
          { id: 'notifications', label: 'Notifs', icon: Bell, badge: unread },
          { id: 'theme', label: 'Thème', icon: Palette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as Section)}
            className={`h-12 rounded-2xl flex items-center justify-center gap-2 text-xs font-black transition-all ${
              activeSection === tab.id ? 'bg-orange text-white shadow-[0_8px_24px_rgba(255,138,0,0.28)]' : 'bg-white/5 text-text-secondary border border-white/10'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            {'badge' in tab && tab.badge ? (
              <span className="min-w-5 h-5 px-1 rounded-full bg-red text-white text-[10px] flex items-center justify-center">{tab.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {activeSection === 'profile' && (
        <div className="space-y-4">
          <div className="glass-card-lg p-5">
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.16em] mb-3">Contexte actuel</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-text-tertiary text-[10px] font-bold uppercase">Entreprise</p>
                <p className="text-white font-black text-sm mt-1">{company?.name || 'Sártal Demo Hospitality'}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-text-tertiary text-[10px] font-bold uppercase">Site actif</p>
                <p className="text-white font-black text-sm mt-1">{selectedSite?.name || 'Tous les sites'}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mt-3">
              <p className="text-text-tertiary text-[10px] font-bold uppercase">Périmètre du profil</p>
              <p className="text-white font-black text-sm mt-1">{getAccessSummary(user, sites, posList)}</p>
            </div>
          </div>

          <div className="glass-card-lg overflow-hidden">
            {profileLinks.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/[0.04] transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${item.color}20` }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-bold text-sm">{item.label}</p>
                  <p className="text-text-tertiary text-xs truncate">{item.description}</p>
                </div>
                <ChevronRight size={17} className="text-text-tertiary" />
              </motion.button>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl glass-card flex items-center justify-center gap-2 text-red font-bold text-sm active:bg-red/5 transition-colors"
          >
            <LogOut size={17} />
            Déconnexion
          </button>

          <p className="text-center text-text-tertiary text-[10px]">Sártal OS Hospi · Cockpit holding</p>
        </div>
      )}

      {activeSection === 'notifications' && (
        <div className="space-y-3">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-text-secondary font-bold text-xs active:scale-95 transition-transform"
            >
              Tout marquer comme lu ({unread})
            </button>
          )}

          {notifications.length === 0 ? (
            <div className="glass-card-lg p-8 text-center">
              <Bell size={28} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-white font-bold">Aucune notification</p>
              <p className="text-text-secondary text-sm mt-1">Les alertes importantes arriveront ici.</p>
            </div>
          ) : (
            notifications.map(n => {
              const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
              const Icon = cfg.icon;
              return (
                <motion.button
                  key={n.id}
                  layout
                  onClick={() => markRead(n.id)}
                  className={`w-full glass-card p-4 flex items-start gap-3 text-left transition-all ${n.read ? 'opacity-55' : 'border-l-4'}`}
                  style={{ borderLeftColor: n.read ? 'transparent' : cfg.color }}
                >
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}22` }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />}
                    </div>
                    <p className="text-text-secondary text-xs mt-1">{n.message}</p>
                    <p className="text-text-tertiary text-[10px] mt-2">{timeAgo(n.date)}</p>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      )}

      {activeSection === 'theme' && (
        <div className="space-y-5">
          <div className="glass-card-lg p-5">
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.16em] mb-4">Mode d'affichage</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => mode !== 'dark' && toggleMode()}
                className={`py-5 rounded-2xl flex flex-col items-center gap-2 transition-all ${mode === 'dark' ? 'bg-white/10 ring-2 ring-orange' : 'bg-white/5 border border-white/10'}`}
              >
                <Moon size={24} className="text-blue" />
                <span className="text-white font-bold text-xs">Sombre</span>
              </button>
              <button
                onClick={() => mode !== 'light' && toggleMode()}
                className={`py-5 rounded-2xl flex flex-col items-center gap-2 transition-all ${mode === 'light' ? 'bg-white/10 ring-2 ring-orange' : 'bg-white/5 border border-white/10'}`}
              >
                <Sun size={24} className="text-orange" />
                <span className="text-white font-bold text-xs">Clair</span>
              </button>
            </div>
          </div>

          <div className="glass-card-lg p-5">
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-[0.16em] mb-4">Couleur d'accent</p>
            <div className="grid grid-cols-4 gap-3">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setAccent(color)}
                  className={`h-14 rounded-2xl transition-all ${accent === color ? 'ring-2 ring-white scale-105' : ''}`}
                  style={{ background: color }}
                  aria-label={`Choisir la couleur ${color}`}
                >
                  {accent === color && <Check size={20} className="text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
