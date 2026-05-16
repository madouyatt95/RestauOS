import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { usePromoStore } from '../stores/promoStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useBroadcastStore, TARGET_LABELS, type BroadcastMessage } from '../stores/broadcastStore';
import { useThemeStore } from '../stores/themeStore';
import {
  User, Building2, CreditCard, Users, Settings, HelpCircle, LogOut,
  ChevronRight, BarChart3, Heart, Truck, QrCode, X, Database,
  Bell, Tag, Sun, Moon, Palette, Check, AlertCircle, ShoppingBag, Star, Trash2, Edit2, Megaphone, Send
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { PRODUCTS } from '../stores/orderStore';

const fmt = (n: number) => n.toLocaleString('fr-FR');

const ACCENT_COLORS = ['#FF8A00', '#EF4444', '#8B5CF6', '#3B82F6', '#22C55E', '#EC4899', '#06B6D4', '#F59E0B'];

const NOTIF_ICONS: Record<string, { icon: any; color: string }> = {
  order: { icon: ShoppingBag, color: '#3B82F6' },
  swap: { icon: Users, color: '#F59E0B' },
  stock: { icon: AlertCircle, color: '#EF4444' },
  review: { icon: Star, color: '#FF8A00' },
  delivery: { icon: Truck, color: '#22C55E' },
  promo: { icon: Tag, color: '#8B5CF6' },
  system: { icon: Settings, color: '#6B7280' },
  broadcast: { icon: Megaphone, color: '#EC4899' },
};

export default function Plus() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { promos, togglePromo, removePromo, updatePromo } = usePromoStore();
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [selectedPromoProducts, setSelectedPromoProducts] = useState<string[]>([]);
  const { notifications, markRead, markAllRead, getUnreadCount } = useNotificationStore();
  const { mode, accent, toggleMode, setAccent } = useThemeStore();
  const { messages: broadcasts, sendBroadcast } = useBroadcastStore();
  const { addNotification } = useNotificationStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showERPModal, setShowERPModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bcMessage, setBcMessage] = useState('');
  const [bcTarget, setBcTarget] = useState<BroadcastMessage['target']>('all');
  const [bcPriority, setBcPriority] = useState<BroadcastMessage['priority']>('normal');
  const [activeSection, setActiveSection] = useState<'menu' | 'notifs' | 'promos' | 'theme'>('menu');

  const isManager = ['Admin', 'Gérant'].includes(user?.role || '');
  const unread = getUnreadCount();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="page-content pt-14 pb-28">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-lg p-5 flex items-center gap-4 mb-4">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover shadow-[0_4px_20px_rgba(255,138,0,0.3)]" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange to-amber-600 flex items-center justify-center text-xl font-black text-white shadow-[0_4px_20px_rgba(255,138,0,0.3)]">
            {(user?.name || 'U').split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">{user?.name}</h2>
          <p className="text-text-secondary text-sm">{user?.role}</p>
        </div>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { id: 'menu', label: 'Menu', icon: Settings },
          { id: 'notifs', label: 'Notifs', icon: Bell, badge: unread },
          ...(isManager ? [
            { id: 'promos', label: 'Promos', icon: Tag, badge: 0 },
            { id: 'theme', label: 'Thème', icon: Palette, badge: 0 },
          ] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${activeSection === tab.id ? 'bg-white/10 text-white' : 'bg-transparent text-text-tertiary'}`}>
            <tab.icon size={14} /> {tab.label}
            {tab.badge && tab.badge > 0 ? <span className="w-5 h-5 rounded-full bg-red text-white text-[9px] font-black flex items-center justify-center">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* ─── MENU SECTION ─── */}
      {activeSection === 'menu' && (
        <>
          {isManager && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: BarChart3, label: 'Rapports', path: '/rapports', color: '#22C55E' },
                { icon: Heart, label: 'Fidélité', path: '/fidelite', color: '#EF4444' },
                { icon: Truck, label: 'Livraisons', path: '/livraisons', color: '#3B82F6' },
                { icon: ShoppingBag, label: 'Menu', path: '/menu-builder', color: '#8B5CF6' },
                { icon: Megaphone, label: 'Broadcast', action: 'broadcast', color: '#EC4899' },
                { icon: Database, label: 'Paramètres', path: '/settings', color: '#F59E0B' },
              ].map((link, i) => (
                <motion.button key={link.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => link.action === 'broadcast' ? setShowBroadcastModal(true) : navigate(link.path!)}
                  className="glass-card p-4 flex flex-col items-center gap-2 active:border-orange/30 transition-colors">
                  <link.icon size={22} style={{ color: link.color }} />
                  <span className="text-white text-xs font-semibold">{link.label}</span>
                </motion.button>
              ))}
            </div>
          )}

          <div className="glass-card-lg overflow-hidden mb-4">
            {[
              { icon: User, label: 'Mon profil', color: '#3B82F6' },
              ...(isManager ? [
                { icon: Building2, label: 'Mon restaurant', color: '#8B5CF6' },
                { icon: CreditCard, label: 'Abonnements', color: '#22C55E' },
                { icon: Users, label: 'Utilisateurs', color: '#06B6D4' },
                { icon: QrCode, label: 'Générer QR Menu', color: '#8B5CF6', action: 'qr' },
                { icon: Database, label: 'Connecteur ERP', color: '#3B82F6', action: 'erp' },
              ] : []),
              { icon: Users, label: 'Personnel & Plannings', color: '#EC4899', path: '/personnel' },
              { icon: HelpCircle, label: 'Aide & Support', color: '#F59E0B' },
            ].map((item, i) => (
              <motion.button key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.03 }}
                onClick={() => {
                  if (item.action === 'qr') setShowQRModal(true);
                  else if (item.action === 'erp') setShowERPModal(true);
                  else if (item.path) navigate(item.path);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/[0.03] transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}20` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <span className="text-white font-medium text-sm flex-1 text-left">{item.label}</span>
                <ChevronRight size={16} className="text-text-tertiary" />
              </motion.button>
            ))}
          </div>

          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleLogout}
            className="w-full py-4 rounded-2xl glass-card flex items-center justify-center gap-2 text-red font-semibold text-sm active:bg-red/5 transition-colors">
            <LogOut size={16} /> Déconnexion
          </motion.button>
          <p className="text-center text-text-tertiary text-[10px] mt-4">RestauOS Sénégal v5.0 · © 2026</p>
        </>
      )}

      {/* ─── NOTIFICATIONS SECTION ─── */}
      {activeSection === 'notifs' && (
        <div>
          {unread > 0 && (
            <button onClick={markAllRead} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-text-secondary font-bold text-xs mb-4 active:scale-95 transition-transform">
              Tout marquer comme lu ({unread})
            </button>
          )}
          <div className="space-y-2">
            {notifications.map(n => {
              const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
              const Icon = cfg.icon;
              return (
                <motion.div key={n.id} layout onClick={() => markRead(n.id)}
                  className={`glass-card p-4 flex items-start gap-3 cursor-pointer transition-all ${!n.read ? 'border-l-4' : 'opacity-50'}`}
                  style={{ borderLeftColor: !n.read ? cfg.color : 'transparent' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.color + '20' }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-xs">{n.title}</p>
                    <p className="text-text-secondary text-[11px] mt-0.5">{n.message}</p>
                    <p className="text-text-tertiary text-[9px] mt-1">
                      {(() => { const m = Math.floor((Date.now() - new Date(n.date).getTime()) / 60000); return m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m/60)}h`; })()}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: cfg.color }} />}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── PROMOS SECTION ─── */}
      {activeSection === 'promos' && isManager && (
        <div>
          <div className="space-y-3">
            {promos.map(p => (
              <div key={p.id} className={`glass-card p-4 border-white/5 ${!p.active ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-orange" />
                    <span className="text-white font-bold text-sm">{p.name}</span>
                  </div>
                  <button onClick={() => togglePromo(p.id)} className={`w-12 h-6 rounded-full transition-all flex items-center px-0.5 ${p.active ? 'bg-green' : 'bg-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${p.active ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-text-secondary text-xs">{p.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-orange font-black text-xs">
                    {p.discountType === 'percent' ? `-${p.discount}%` : `-${fmt(p.discount)} F`}
                    {p.productIds && p.productIds.length > 0 && ` • ${p.productIds.length} articles`}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => { setEditingPromoId(p.id); setSelectedPromoProducts(p.productIds || []); }} className="text-blue/80 hover:text-blue transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => removePromo(p.id)} className="text-red/50 hover:text-red transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── THEME SECTION ─── */}
      {activeSection === 'theme' && isManager && (
        <div className="space-y-6">
          {/* Dark/Light */}
          <div className="glass-card p-5">
            <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-4">Mode d'affichage</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => mode !== 'dark' && toggleMode()}
                className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${mode === 'dark' ? 'bg-white/10 ring-2 ring-orange' : 'bg-white/5'}`}>
                <Moon size={24} className="text-blue" />
                <span className="text-white font-bold text-xs">Sombre</span>
              </button>
              <button onClick={() => mode !== 'light' && toggleMode()}
                className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${mode === 'light' ? 'bg-white/10 ring-2 ring-orange' : 'bg-white/5'}`}>
                <Sun size={24} className="text-orange" />
                <span className="text-white font-bold text-xs">Clair</span>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="glass-card p-5">
            <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-4">Couleur d'accent</p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={() => setAccent(c)}
                  className={`w-12 h-12 rounded-xl transition-all ${accent === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }}>
                  {accent === c && <Check size={18} className="text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="glass-card p-5">
            <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-4">Infos restaurant</p>
            <div className="space-y-3">
              <input type="text" defaultValue="Chez Teranga" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange/50" />
              <input type="text" defaultValue="Rue 12 x Avenue Bourguiba, Dakar" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange/50" />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-lg p-6 m-4 relative max-w-sm w-full flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-text-tertiary"><X size={20} /></button>
              <h3 className="text-white font-black text-xl mb-1">Menu Digital</h3>
              <p className="text-text-secondary text-sm mb-6">Scannez pour consulter le menu</p>
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <QRCodeSVG value="https://restauos.app/menu/demo-senegal" size={200} level="H" />
              </div>
              <div className="w-full bg-orange/10 border border-orange/30 rounded-xl p-3 flex items-center justify-center gap-2 text-orange font-bold text-sm">
                <QrCode size={18} /> Code prêt
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ERP Modal */}
      <AnimatePresence>
        {showERPModal && (
          <div className="modal-overlay" onClick={() => setShowERPModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-lg p-6 m-4 relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowERPModal(false)} className="absolute top-4 right-4 text-text-tertiary"><X size={20} /></button>
              <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2"><Database size={24} className="text-blue" /> ERP Connect</h3>
              <p className="text-text-secondary text-sm mb-6">Synchronisation Odoo / ERPNext</p>
              <div className="space-y-4">
                <div><label className="text-text-tertiary text-xs font-semibold uppercase mb-1 block">Backend</label>
                  <select className="w-full px-4 py-3 glass-card text-white text-sm bg-bg-primary border border-white/10 rounded-xl"><option>Odoo Cloud</option><option>ERPNext</option></select></div>
                <div><label className="text-text-tertiary text-xs font-semibold uppercase mb-1 block">URL</label>
                  <input type="text" defaultValue="https://mon-restau.odoo.com" className="w-full px-4 py-3 glass-card text-white text-sm bg-bg-primary border border-white/10 rounded-xl" /></div>
                <button onClick={() => setShowERPModal(false)} className="w-full py-3.5 rounded-xl bg-blue text-white font-bold text-sm">Connecter</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── PROMO EDIT MODAL ─── */}
      <AnimatePresence>
        {editingPromoId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[100]" onClick={() => setEditingPromoId(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-black text-xl mb-2">Connecter Promo</h3>
              <p className="text-text-secondary text-sm mb-6">Sélectionnez les articles auxquels cette promotion s'applique.</p>
              
              <div className="space-y-2 mb-8 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {PRODUCTS.map(prod => (
                  <label key={prod.id} className="flex items-center gap-3 p-3 glass-card rounded-xl cursor-pointer active:scale-95 transition-transform">
                    <input type="checkbox" className="hidden" checked={selectedPromoProducts.includes(prod.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedPromoProducts([...selectedPromoProducts, prod.id]);
                      else setSelectedPromoProducts(selectedPromoProducts.filter(id => id !== prod.id));
                    }} />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPromoProducts.includes(prod.id) ? 'bg-orange border-orange text-white' : 'border-white/20 text-transparent'}`}>
                      <Check size={12} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{prod.name}</p>
                      <p className="text-text-tertiary text-[10px] uppercase">{prod.category}</p>
                    </div>
                  </label>
                ))}
              </div>
              
              <button onClick={() => {
                updatePromo(editingPromoId, { productIds: selectedPromoProducts });
                setEditingPromoId(null);
              }} className="w-full py-4 rounded-2xl bg-orange text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-orange/20 active:scale-95 transition-transform">
                Sauvegarder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Broadcast Compose Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay z-[100]" onClick={() => setShowBroadcastModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl">Broadcast</h3>
                  <p className="text-text-secondary text-xs">Envoyer un message à l'équipe</p>
                </div>
              </div>

              <textarea
                value={bcMessage}
                onChange={e => setBcMessage(e.target.value)}
                placeholder="Ex: Rupture de bissap, VIP table 8..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm h-24 resize-none focus:border-pink-400/50 transition-colors mb-4"
              />

              <div className="mb-4">
                <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2">Ciblage</p>
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'salle', 'cuisine', 'livraison', 'management'] as const).map(t => (
                    <button key={t} onClick={() => setBcTarget(t)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${bcTarget === t ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40' : 'bg-white/5 text-text-tertiary border border-transparent'}`}>
                      {TARGET_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2">Priorité</p>
                <div className="flex gap-2">
                  <button onClick={() => setBcPriority('normal')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${bcPriority === 'normal' ? 'bg-white/10 text-white' : 'bg-white/5 text-text-tertiary'}`}>
                    Normal
                  </button>
                  <button onClick={() => setBcPriority('urgent')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${bcPriority === 'urgent' ? 'bg-red/20 text-red border border-red/30' : 'bg-white/5 text-text-tertiary'}`}>
                    🚨 Urgent
                  </button>
                </div>
              </div>

              {/* Recent broadcasts */}
              {broadcasts.length > 0 && (
                <div className="mb-6">
                  <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest mb-2">Messages récents</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {broadcasts.slice(0, 3).map(b => (
                      <div key={b.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${b.priority === 'urgent' ? 'bg-red/20 text-red' : 'bg-pink-500/20 text-pink-400'}`}>{TARGET_LABELS[b.target]}</span>
                          <span className="text-text-tertiary text-[9px]">{new Date(b.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-white text-xs">{b.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (!bcMessage.trim()) return;
                  sendBroadcast({ from: user?.name || 'Gérant', message: bcMessage.trim(), target: bcTarget, priority: bcPriority });
                  addNotification({
                    type: 'broadcast',
                    title: bcPriority === 'urgent' ? '🚨 Broadcast URGENT' : '📢 Broadcast',
                    message: bcMessage.trim(),
                    targetRole: bcTarget === 'salle' ? 'Serveur' : bcTarget === 'cuisine' ? 'Chef cuisine' : bcTarget === 'livraison' ? 'Livreur' : undefined,
                  });
                  setBcMessage('');
                  setShowBroadcastModal(false);
                }}
                disabled={!bcMessage.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 disabled:opacity-40 active:scale-95 transition-transform">
                <Send size={16} /> Envoyer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
