import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import {
  User, Building2, CreditCard, Users, Settings, HelpCircle, LogOut,
  ChevronRight, BarChart3, Heart, Truck, QrCode, X, Database
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

const menuItems = [
  { icon: User, label: 'Mon profil', color: '#3B82F6', path: '' },
  { icon: Building2, label: 'Mon restaurant', color: '#8B5CF6', path: '' },
  { icon: CreditCard, label: 'Abonnements', color: '#22C55E', path: '' },
  { icon: Users, label: 'Utilisateurs', color: '#06B6D4', path: '' },
  { icon: Settings, label: 'Paramètres', color: '#A1A1AA', path: '' },
  { icon: QrCode, label: 'Générer QR Menu', color: '#8B5CF6', action: 'qr', roles: ['Admin', 'Gérant'] },
  { icon: Database, label: 'Connecteur ERP (Odoo)', color: '#3B82F6', action: 'erp', roles: ['Admin'] },
  { icon: HelpCircle, label: 'Aide & Support', color: '#F59E0B', path: '' },
  { icon: Users, label: 'Personnel & Plannings', path: '/personnel', roles: ['Admin', 'Gérant', 'Caissier', 'Serveur', 'Chef cuisine'], color: '#EC4899' },
];

const quickLinks = [
  { icon: BarChart3, label: 'Rapports', path: '/rapports', color: '#22C55E' },
  { icon: Heart, label: 'Fidélité', path: '/fidelite', color: '#EF4444' },
  { icon: Truck, label: 'Livraisons', path: '/livraisons', color: '#3B82F6' },
];

export default function Plus() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showERPModal, setShowERPModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="page-content pt-14 pb-28">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg p-5 flex items-center gap-4 mb-6">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover shadow-[0_4px_20px_rgba(255,138,0,0.3)]" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-amber-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_4px_20px_rgba(255,138,0,0.3)]">
            {(user?.name || 'Cheikh Fall').split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">{user?.name || 'Cheikh Fall'}</h2>
          <p className="text-text-secondary text-sm">{user?.role || 'Gérant'}</p>
        </div>
        <button className="w-9 h-9 glass-card rounded-full flex items-center justify-center">
          <Settings size={16} className="text-text-secondary" />
        </button>
      </motion.div>

      {/* Quick Links */}
      {['Admin', 'Gérant'].includes(user?.role || '') && (
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
      )}

      {/* Menu Items */}
      <div className="glass-card-lg overflow-hidden">
        {menuItems.map((item, i) => {
          if (!['Admin', 'Gérant'].includes(user?.role || '') && ['Utilisateurs', 'Abonnements', 'Mon restaurant'].includes(item.label)) {
            return null;
          }
          if (item.roles && !item.roles.includes(user?.role || '')) {
            return null;
          }
          return (
            <motion.button key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              onClick={() => {
                if (item.action === 'qr') setShowQRModal(true);
                else if (item.action === 'erp') setShowERPModal(true);
                else if (item.path) navigate(item.path);
              }}
              className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/[0.03] transition-colors"
              style={{ borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}20` }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <span className="text-white font-medium text-sm flex-1 text-left">{item.label}</span>
              <ChevronRight size={16} className="text-text-tertiary" />
            </motion.button>
          );
        })}
      </div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleLogout}
        className="w-full mt-6 py-4 rounded-2xl glass-card flex items-center justify-center gap-2 text-red font-semibold text-sm active:bg-red/5 transition-colors">
        <LogOut size={16} />
        Déconnexion
      </motion.button>

      {/* Version */}
      <p className="text-center text-text-tertiary text-[10px] mt-6">RestauOS Sénégal v1.0 · © 2026</p>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-lg p-6 m-4 relative max-w-sm w-full flex flex-col items-center text-center"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-text-tertiary hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-white font-black text-xl mb-1">Menu Digital</h3>
              <p className="text-text-secondary text-sm mb-6">Demandez à vos clients de scanner ce code pour consulter le menu complet.</p>
              
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <QRCodeSVG value="https://restauos.app/menu/demo-senegal" size={200} level="H" />
              </div>

              <div className="w-full bg-orange/10 border border-orange/30 rounded-xl p-3 flex items-center justify-center gap-2 text-orange font-bold text-sm">
                <QrCode size={18} />
                Code prêt à être scanné
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ERP Connector Modal */}
      <AnimatePresence>
        {showERPModal && (
          <div className="modal-overlay" onClick={() => setShowERPModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-lg p-6 m-4 relative max-w-sm w-full"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowERPModal(false)} className="absolute top-4 right-4 text-text-tertiary hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2"><Database size={24} className="text-blue" /> ERP Connect</h3>
              <p className="text-text-secondary text-sm mb-6">Synchronisation Headless vers Odoo ou ERPNext.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider mb-1 block">Type de backend</label>
                  <select className="w-full px-4 py-3 glass-card text-white text-sm bg-bg-primary border border-white/10 rounded-xl">
                    <option value="odoo">Odoo Cloud / Local</option>
                    <option value="erpnext">ERPNext</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider mb-1 block">URL du Serveur</label>
                  <input type="text" defaultValue="https://mon-restau.odoo.com" className="w-full px-4 py-3 glass-card text-white text-sm bg-bg-primary border border-white/10 rounded-xl" />
                </div>
                <div>
                  <label className="text-text-tertiary text-xs font-semibold uppercase tracking-wider mb-1 block">Clé API (XML-RPC)</label>
                  <input type="password" defaultValue="****************" className="w-full px-4 py-3 glass-card text-white text-sm bg-bg-primary border border-white/10 rounded-xl" />
                </div>
                <button onClick={() => setShowERPModal(false)} className="w-full py-3.5 rounded-xl bg-blue text-white font-bold text-sm mt-4">
                  Enregistrer et Connecter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
