import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  ChevronRight,
  CreditCard,
  Dice5,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Warehouse,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { UserProfile } from '../stores/authStore';
import { useHospiStore, type POS } from '../stores/hospiStore';
import { canAccessModule, canAccessRoute, getVisiblePOS, getVisibleSites } from '../utils/accessControl';

const businessGroups = [
  {
    key: 'restaurant',
    title: 'Restaurant',
    description: 'RestauOS complet : salle, tables, commandes, caisse, cuisine, réservations.',
    types: ['restaurant'],
    icon: Store,
    color: '#FF8A00',
  },
  {
    key: 'bars-casino',
    title: 'Bars & Casino',
    description: 'Points de vente casino, bars, night-club, tarifs et caisses séparées.',
    types: ['bar', 'nightclub', 'casino'],
    icon: Dice5,
    color: '#8B5CF6',
  },
  {
    key: 'spa',
    title: 'Spa',
    description: 'Prestations, ventes, stock cabine et paiements client ou chambre.',
    types: ['spa'],
    icon: Sparkles,
    color: '#22C55E',
  },
  {
    key: 'boutique',
    title: 'Boutique',
    description: 'Ventes comptoir, stock boutique, reçus et tarifs dédiés.',
    types: ['boutique'],
    icon: Package,
    color: '#EC4899',
  },
];

export default function BusinessModules() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    sites,
    posList,
    warehouses,
    products,
    stockLevels,
    rooms,
    folios,
    setActivePOS,
  } = useHospiStore();
  const visibleSites = getVisibleSites(user, sites);
  const visibleSiteIds = visibleSites.map(site => site.id);
  const visiblePOS = getVisiblePOS(user, posList);
  const visibleRooms = rooms.filter(room => visibleSiteIds.includes(room.site_id));
  const visibleRoomIds = visibleRooms.map(room => room.id);

  const openPOS = (pos: POS, target: 'sales' | 'cash' | 'stock' | 'settings') => {
    setActivePOS(pos.id);
    if (target === 'sales') navigate(pos.type === 'restaurant' ? '/commandes' : '/pos-metier');
    if (target === 'cash') navigate('/caisse');
    if (target === 'stock') navigate('/stocks');
    if (target === 'settings') navigate('/settings');
  };

  const occupiedRooms = visibleRooms.filter(room => room.status === 'occupied').length;
  const openFolios = folios.filter(folio => folio.status === 'open' && visibleRoomIds.includes(folio.room_id)).length;

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Activités du complexe</p>
          <h1 className="text-white font-black text-2xl">Restaurant, hôtel, casino, spa</h1>
          <p className="text-text-secondary text-xs mt-1">Entrer dans un métier, choisir son point de vente, puis ouvrir ses ventes, sa caisse, son stock ou ses réglages.</p>
        </div>
        {canAccessRoute(user, '/settings') && (
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-text-secondary flex items-center justify-center"
            title="Configurer les modules"
          >
            <Settings size={18} />
          </button>
        )}
      </div>

      {canAccessModule(user, 'hotel') && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-lg p-4 mb-5"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                <BedDouble size={22} />
              </div>
              <div>
                <h2 className="text-white font-black text-base">Hôtel / PMS</h2>
                <p className="text-text-secondary text-xs">Chambres, folios, réception, imputations POS.</p>
              </div>
            </div>
            <ChevronRight size={17} className="text-text-tertiary mt-3" />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-text-tertiary text-[9px] font-black uppercase">Chambres</p>
              <p className="text-white font-black">{occupiedRooms}/{visibleRooms.length}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-text-tertiary text-[9px] font-black uppercase">Folios ouverts</p>
              <p className="text-white font-black">{openFolios}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-text-tertiary text-[9px] font-black uppercase">Sites</p>
              <p className="text-white font-black">{visibleSites.length}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pms')}
            className="w-full h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-200 font-black text-sm"
          >
            Ouvrir le module hôtel
          </button>
        </motion.section>
      )}

      <div className="space-y-4">
        {businessGroups.filter(group => canAccessModule(user, (group.key === 'bars-casino' ? 'casino' : group.key) as NonNullable<UserProfile['businessModules']>[number])).map((group, index) => {
          const GroupIcon = group.icon;
          const groupPOS = visiblePOS.filter(pos => group.types.includes(pos.type));
          return (
            <motion.section
              key={group.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.04 }}
              className="glass-card-lg p-4"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${group.color}20`, color: group.color }}>
                  <GroupIcon size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-black text-base">{group.title}</h2>
                  <p className="text-text-secondary text-xs leading-snug mt-1">{group.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {groupPOS.map(pos => {
                  const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
                  const linkedStock = stockLevels.filter(level => level.warehouse_id === warehouse?.id);
                  const lowStock = linkedStock.filter(level => level.quantity <= level.alert_threshold).length;
                  const availableProducts = products.filter(product => product.is_active).length;
                  return (
                    <div key={pos.id} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-white font-black text-sm">{pos.name}</p>
                          <p className="text-text-tertiary text-[10px] mt-0.5">{warehouse?.name || 'Dépôt non lié'} · {availableProducts} références</p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${lowStock ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                          {lowStock ? `${lowStock} alerte(s)` : 'OK'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={() => openPOS(pos, 'sales')} className="h-12 rounded-xl bg-white/5 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-black">
                          <ShoppingBag size={15} style={{ color: group.color }} />
                          Ventes
                        </button>
                        <button type="button" onClick={() => openPOS(pos, 'cash')} className="h-12 rounded-xl bg-white/5 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-black">
                          <CreditCard size={15} style={{ color: group.color }} />
                          Caisse
                        </button>
                        <button type="button" onClick={() => openPOS(pos, 'stock')} className="h-12 rounded-xl bg-white/5 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-black">
                          <Warehouse size={15} style={{ color: group.color }} />
                          Stock
                        </button>
                        {canAccessRoute(user, '/settings') && (
                          <button type="button" onClick={() => openPOS(pos, 'settings')} className="h-12 rounded-xl bg-white/5 text-white flex flex-col items-center justify-center gap-1 text-[10px] font-black">
                            <Settings size={15} style={{ color: group.color }} />
                            Régler
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {groupPOS.length === 0 && (
                  <div className="rounded-2xl bg-white/5 border border-dashed border-white/10 p-4">
                    <p className="text-text-secondary text-xs mb-3">Aucun point de vente configuré pour ce métier.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="w-full h-11 rounded-xl bg-white/10 text-white font-black text-xs"
                    >
                      Créer le point de vente
                    </button>
                  </div>
                )}
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="glass-card p-4 mt-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 text-text-secondary flex items-center justify-center shrink-0">
          <Building2 size={18} />
        </div>
        <div>
          <p className="text-white font-black text-sm">Configuration globale</p>
          <p className="text-text-secondary text-xs mt-1">Les sites, points de vente, dépôts, produits, prix et affectations restent modifiables depuis Admin.</p>
          {canAccessRoute(user, '/settings') && (
            <button type="button" onClick={() => navigate('/settings')} className="mt-3 text-blue font-black text-xs">
              Ouvrir les paramètres
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
