import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BedDouble,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dice5,
  DoorOpen,
  Package,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Warehouse,
  Wrench,
} from 'lucide-react';
import { useAuthStore, type UserRole } from '../stores/authStore';
import { useHospiStore, type RoomStatus } from '../stores/hospiStore';
import { useBusinessOperationsStore } from '../stores/businessOperationsStore';
import { usePlanningStore } from '../stores/planningStore';
import { getVisiblePOS, getVisibleSites } from '../utils/accessControl';
import { getProfileWorkspace, workspaceToneClasses, type WorkspaceTone } from '../utils/profileWorkspace';
import type { LucideIcon } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('fr-FR');

type Action = {
  label: string;
  detail: string;
  path: string;
  icon: LucideIcon;
  tone: WorkspaceTone;
};

type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: WorkspaceTone;
};

const statusLabel: Record<RoomStatus, string> = {
  available: 'Libre',
  occupied: 'Occupée',
  cleaning: 'À nettoyer',
  maintenance: 'Hors service',
};

const roleLabels: Partial<Record<UserRole, string>> = {
  Réceptionniste: 'Arrivées, départs, folios et paiements PMS',
  Gouvernante: 'Chambres à nettoyer, inspection, mini-bar et anomalies',
  Maintenance: 'Chambres bloquées, tickets techniques et remise en service',
  Barman: 'Ventes bar, cave, caisse et stock boissons',
  Croupier: 'Tables casino, buy-in, cash-out et audit',
  'Praticien spa': 'Planning soins, cabines, clients et consommables',
  'Vendeur boutique': 'Ventes boutique, retours, échanges et stock',
  Stockiste: 'Dépôts, seuils, transferts, inventaires et pertes',
  Acheteur: 'Commandes fournisseurs, réceptions et coûts d’achat',
};

function action(label: string, detail: string, path: string, icon: LucideIcon, tone: WorkspaceTone): Action {
  return { label, detail, path, icon, tone };
}

function metric(label: string, value: string, detail: string, tone: WorkspaceTone): Metric {
  return { label, value, detail, tone };
}

export default function Workstation() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    sites,
    posList,
    rooms,
    guests,
    stays,
    folios,
    folioLines,
    warehouses,
    stockLevels,
    products,
    purchaseOrders,
    purchaseOrderLines,
    suppliers,
    activePOSId,
    getProductsForPOS,
    updateRoomStatus,
    setActivePOS,
  } = useHospiStore();
  const { spaAppointments, casinoSessions, boutiqueReturns, updateSpaAppointmentStatus, closeCasinoSession } = useBusinessOperationsStore();
  const { shifts } = usePlanningStore();

  const visibleSites = getVisibleSites(user, sites);
  const visibleSiteIds = visibleSites.map(site => site.id);
  const visiblePOS = getVisiblePOS(user, posList).filter(pos => pos.is_active);
  const activePOS = visiblePOS.find(pos => pos.id === activePOSId) || visiblePOS[0];
  const workspace = getProfileWorkspace(user, activePOS);
  const workspaceTone = workspaceToneClasses[workspace.tone];

  const visibleRooms = rooms.filter(room => visibleSiteIds.includes(room.site_id));
  const openFolios = folios.filter(folio => visibleRooms.some(room => room.id === folio.room_id) && folio.status === 'open');
  const roomRows = visibleRooms.map(room => {
    const stay = stays.find(item => item.room_id === room.id && item.status === 'checked_in');
    const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
    const folio = stay ? folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
    const total = folioLines.filter(line => line.folio_id === folio?.id).reduce((sum, line) => sum + line.amount, 0);
    return { room, guest, folio, total };
  });
  const lowStocks = stockLevels.filter(level => {
    const warehouse = warehouses.find(item => item.id === level.warehouse_id);
    return !!warehouse && visibleSiteIds.includes(warehouse.site_id) && level.quantity <= level.alert_threshold;
  });
  const pendingPurchases = purchaseOrders.filter(order => order.status !== 'received' && order.status !== 'cancelled');
  const posProducts = activePOS ? getProductsForPOS(activePOS.id) : [];
  const todayShifts = user?.employeeId ? shifts.filter(shift => shift.employeeId === user.employeeId) : [];
  const spaRows = spaAppointments.filter(item => visiblePOS.some(pos => pos.id === item.posId));
  const casinoRows = casinoSessions.filter(item => visiblePOS.some(pos => pos.id === item.posId));
  const boutiqueRows = boutiqueReturns.filter(item => visiblePOS.some(pos => pos.id === item.posId));

  const role = user?.role;
  const roleIntro = role ? roleLabels[role] : undefined;

  const actions: Action[] = (() => {
    if (role === 'Réceptionniste') {
      return [
        action('Réception PMS', 'Check-in, folios, paiements', '/pms', BedDouble, 'cyan'),
        action('Encaisser', 'Caisse room service ou réception', '/caisse', CreditCard, 'green'),
        action('Planning équipe', 'Voir le service du jour', '/personnel', CalendarDays, 'purple'),
      ];
    }
    if (role === 'Gouvernante') {
      return [
        action('Chambres', 'Ménage et inspection PMS', '/pms', BedDouble, 'cyan'),
        action('Mini-bar', 'Contrôles et consommations', '/pms', ReceiptText, 'blue'),
        action('Planning', 'Équipe housekeeping', '/personnel', CalendarDays, 'purple'),
      ];
    }
    if (role === 'Maintenance') {
      return [
        action('Tickets hôtel', 'Chambres bloquées et interventions', '/pms', Wrench, 'orange'),
        action('Planning', 'Affectations techniques', '/personnel', CalendarDays, 'purple'),
        action('Profil', 'Coordonnées et service', '/plus', BriefcaseBusiness, 'slate'),
      ];
    }
    if (role === 'Barman') {
      return [
        action('Vendre', 'Bar, night-club, prix POS', '/pos-metier', ShoppingBag, 'purple'),
        action('Caisse', 'Encaissements et clôture Z', '/caisse', CreditCard, 'green'),
        action('Stock bar', 'Cave et seuils boissons', '/stocks', Warehouse, 'blue'),
      ];
    }
    if (role === 'Croupier') {
      return [
        action('Tables casino', 'Sessions, buy-in, cash-out', '/pos-metier', Dice5, 'purple'),
        action('Caisse casino', 'Paiements et audit', '/caisse', CreditCard, 'green'),
        action('Planning', 'Service casino', '/personnel', CalendarDays, 'purple'),
      ];
    }
    if (role === 'Praticien spa') {
      return [
        action('Soins du jour', 'Planning spa et cabines', '/pos-metier', Sparkles, 'green'),
        action('Imputer chambre', 'Folio client hôtel', '/pos-metier', BedDouble, 'cyan'),
        action('Planning', 'Services praticiens', '/personnel', CalendarDays, 'purple'),
      ];
    }
    if (role === 'Vendeur boutique') {
      return [
        action('Boutique', 'Vente, retour, échange', '/pos-metier', Store, 'blue'),
        action('Caisse', 'Paiement ou chambre', '/caisse', CreditCard, 'green'),
        action('Stock boutique', 'Références et seuils', '/stocks', Package, 'orange'),
      ];
    }
    if (role === 'Stockiste') {
      return [
        action('Stocks', 'Dépôts, transferts, inventaires', '/stocks', Warehouse, 'blue'),
        action('Équipe', 'Présences et affectations', '/personnel', CalendarDays, 'purple'),
        action('Mouvements', 'Historique et alertes stock', '/stocks', ReceiptText, 'green'),
      ];
    }
    if (role === 'Acheteur') {
      return [
        action('Achats', 'Commandes fournisseurs', '/stocks', Truck, 'orange'),
        action('Réceptions', 'Lots, DLC, quantités reçues', '/stocks', CheckCircle2, 'green'),
        action('Fournisseurs', 'Prix et historique', '/stocks', BriefcaseBusiness, 'blue'),
      ];
    }
    return [
      action('Mon activité', 'Ouvrir le module métier', '/pos-metier', ShoppingBag, 'orange'),
      action('Planning', 'Voir mon service', '/personnel', CalendarDays, 'purple'),
      action('Profil', 'Déconnexion et paramètres', '/plus', BriefcaseBusiness, 'slate'),
    ];
  })();

  const metrics: Metric[] = (() => {
    if (role === 'Réceptionniste') {
      return [
        metric('Arrivées', String(Math.max(2, visibleRooms.filter(room => room.status === 'available').length)), 'à préparer', 'green'),
        metric('Folios ouverts', String(openFolios.length), 'comptes chambre', 'cyan'),
        metric('Solde folios', `${fmt(openFolios.reduce((sum, folio) => sum + folio.total_amount, 0))} F`, 'à suivre', 'orange'),
      ];
    }
    if (role === 'Gouvernante') {
      return [
        metric('À nettoyer', String(visibleRooms.filter(room => room.status === 'cleaning').length), 'chambres', 'orange'),
        metric('Occupées', String(visibleRooms.filter(room => room.status === 'occupied').length), 'contrôle séjour', 'purple'),
        metric('Mini-bar', String(lowStocks.filter(level => level.warehouse_id === 'wh-minibar').length), 'alertes', 'blue'),
      ];
    }
    if (role === 'Maintenance') {
      return [
        metric('Bloquées', String(visibleRooms.filter(room => room.status === 'maintenance').length), 'chambres', 'red'),
        metric('Interventions', '3', 'tickets ouverts', 'orange'),
        metric('Remises', '1', 'à contrôler', 'green'),
      ];
    }
    if (role === 'Barman' || role === 'Croupier') {
      return [
        metric('POS', String(visiblePOS.length), 'autorisés', 'purple'),
        metric('Offres', String(posProducts.length), 'catalogue actif', 'orange'),
        metric('Stock bas', String(lowStocks.length), 'références', 'red'),
      ];
    }
    if (role === 'Praticien spa') {
      return [
        metric('Soins', String(spaRows.length), 'planning visible', 'green'),
        metric('Cabines', '3', 'opérationnelles', 'cyan'),
        metric('Clients hôtel', String(openFolios.length), 'room charge possible', 'purple'),
      ];
    }
    if (role === 'Vendeur boutique') {
      return [
        metric('Articles', String(posProducts.length), 'en vente', 'blue'),
        metric('Retours', String(boutiqueRows.length), 'à traiter', 'orange'),
        metric('Stock bas', String(lowStocks.length), 'alertes', 'red'),
      ];
    }
    if (role === 'Stockiste' || role === 'Acheteur') {
      return [
        metric('Alertes', String(lowStocks.length), 'seuils atteints', 'red'),
        metric('Commandes', String(pendingPurchases.length), 'fournisseurs', 'orange'),
        metric('Dépôts', String(warehouses.filter(warehouse => visibleSiteIds.includes(warehouse.site_id)).length), 'visibles', 'blue'),
      ];
    }
    return [
      metric('POS', String(visiblePOS.length), 'autorisés', 'orange'),
      metric('Planning', String(todayShifts.length), 'services', 'purple'),
      metric('Site', String(visibleSites.length), 'périmètre', 'blue'),
    ];
  })();

  const openAction = (item: Action) => {
    if (activePOS && ['/pos-metier', '/caisse'].includes(item.path)) setActivePOS(activePOS.id);
    navigate(item.path);
  };

  return (
    <div className="page-content pt-14 pb-28">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[1.75rem] border p-5 mb-5 ${workspaceTone.bg} ${workspaceTone.border}`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${workspaceTone.text}`}>{workspace.eyebrow}</p>
        <h1 className="text-white font-black text-2xl mt-1">{workspace.title}</h1>
        <p className="text-text-secondary text-sm mt-1 leading-snug">{roleIntro || workspace.subtitle}</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none mt-4">
          {visiblePOS.map(pos => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setActivePOS(pos.id)}
              className={`shrink-0 px-3 py-2 rounded-2xl border text-[10px] font-black ${activePOS?.id === pos.id ? `${workspaceTone.bg} ${workspaceTone.border} text-white` : 'bg-white/5 border-white/10 text-text-secondary'}`}
            >
              {pos.name}
            </button>
          ))}
          {visiblePOS.length === 0 && <span className="text-text-tertiary text-xs">Aucun POS affecté à ce profil.</span>}
        </div>
      </motion.header>

      <section className="grid grid-cols-3 gap-2 mb-5">
        {metrics.map(item => {
          const tone = workspaceToneClasses[item.tone];
          return (
            <div key={item.label} className="glass-card p-3">
              <p className={`text-[9px] font-black uppercase tracking-widest ${tone.text}`}>{item.label}</p>
              <p className="text-white font-black text-lg mt-1 leading-tight">{item.value}</p>
              <p className="text-text-tertiary text-[10px] mt-0.5">{item.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="glass-card-lg p-4 mb-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Actions du poste</p>
            <h2 className="text-white font-black text-lg">Ce que ce profil doit faire</h2>
          </div>
          <BriefcaseBusiness size={20} className={workspaceTone.text} />
        </div>
        <div className="space-y-2">
          {actions.map(item => {
            const tone = workspaceToneClasses[item.tone];
            return (
              <button key={item.label} type="button" onClick={() => openAction(item)} className="w-full rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3 text-left active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-sm">{item.label}</p>
                    <p className="text-text-secondary text-xs truncate">{item.detail}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black ${tone.text}`}>Ouvrir</span>
              </button>
            );
          })}
        </div>
      </section>

      {['Réceptionniste', 'Gouvernante', 'Maintenance'].includes(role || '') && (
        <section className="glass-card-lg p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black text-lg">Chambres à suivre</h2>
            <DoorOpen size={18} className="text-cyan-300" />
          </div>
          <div className="space-y-2">
            {roomRows.slice(0, 6).map(row => (
              <div key={row.room.id} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">Chambre {row.room.room_number}</p>
                    <p className="text-text-secondary text-xs mt-1">{row.guest ? `${row.guest.first_name} ${row.guest.last_name}` : 'Disponible'} · {statusLabel[row.room.status]}</p>
                  </div>
                  <span className="text-cyan-300 font-black text-xs">{row.folio ? `${fmt(row.total)} F` : '-'}</span>
                </div>
                {role === 'Gouvernante' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={() => updateRoomStatus(row.room.id, 'cleaning')} className="h-9 rounded-xl bg-orange/10 text-orange text-[10px] font-black">À nettoyer</button>
                    <button type="button" onClick={() => updateRoomStatus(row.room.id, 'available')} className="h-9 rounded-xl bg-green/10 text-green text-[10px] font-black">Inspectée</button>
                  </div>
                )}
                {role === 'Maintenance' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={() => updateRoomStatus(row.room.id, 'maintenance')} className="h-9 rounded-xl bg-red/10 text-red text-[10px] font-black">Bloquer</button>
                    <button type="button" onClick={() => updateRoomStatus(row.room.id, 'available')} className="h-9 rounded-xl bg-green/10 text-green text-[10px] font-black">Remettre libre</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {['Barman', 'Croupier', 'Praticien spa', 'Vendeur boutique'].includes(role || '') && (
        <section className="glass-card-lg p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black text-lg">Activité du métier</h2>
            {role === 'Croupier' ? <Dice5 size={18} className="text-purple" /> : role === 'Praticien spa' ? <Sparkles size={18} className="text-green" /> : <ShoppingBag size={18} className="text-orange" />}
          </div>

          {role === 'Praticien spa' && (
            <div className="space-y-2">
              {spaRows.slice(0, 4).map(item => (
                <div key={item.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{item.serviceName}</p>
                    <p className="text-text-secondary text-xs mt-1">{item.guestName} · {item.status}</p>
                  </div>
                  <button type="button" onClick={() => updateSpaAppointmentStatus(item.id, item.status === 'booked' ? 'in_progress' : 'done')} className="h-9 px-3 rounded-xl bg-green/10 text-green text-[10px] font-black">
                    Avancer
                  </button>
                </div>
              ))}
            </div>
          )}

          {role === 'Croupier' && (
            <div className="space-y-2">
              {casinoRows.slice(0, 4).map(item => (
                <div key={item.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{item.tableName}</p>
                    <p className="text-text-secondary text-xs mt-1">{item.playerName} · {fmt(item.buyIn)} F</p>
                  </div>
                  {item.status === 'open' ? (
                    <button type="button" onClick={() => closeCasinoSession(item.id)} className="h-9 px-3 rounded-xl bg-red/10 text-red text-[10px] font-black">Fermer</button>
                  ) : (
                    <span className="text-text-tertiary text-[10px] font-black">Clôturée</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {role !== 'Praticien spa' && role !== 'Croupier' && (
            <div className="space-y-2">
              {posProducts.slice(0, 5).map(row => (
                <div key={row.price.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-black text-sm truncate">{row.product.name}</p>
                    <p className="text-text-secondary text-xs mt-1">{row.stock?.quantity ?? 0} {row.stock?.unit || row.product.unit} · {row.product.sku}</p>
                  </div>
                  <span className="text-orange font-black text-sm">{fmt(row.price.sale_price)} F</span>
                </div>
              ))}
              {role === 'Vendeur boutique' && boutiqueRows.length > 0 && (
                <div className="rounded-2xl bg-blue/10 border border-blue/20 p-3">
                  <p className="text-blue font-black text-xs">{boutiqueRows.length} retour(s) boutique à suivre</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {['Stockiste', 'Acheteur'].includes(role || '') && (
        <section className="glass-card-lg p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black text-lg">{role === 'Acheteur' ? 'Achats à suivre' : 'Alertes stock'}</h2>
            <Warehouse size={18} className="text-blue" />
          </div>
          <div className="space-y-2">
            {role === 'Acheteur' ? pendingPurchases.slice(0, 5).map(order => {
              const supplier = suppliers.find(item => item.id === order.supplier_id);
              const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
              return (
                <div key={order.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{supplier?.name || 'Fournisseur'}</p>
                    <p className="text-text-secondary text-xs mt-1">{lines.length} ligne(s) · {order.status}</p>
                  </div>
                  <span className="text-orange font-black text-xs">{order.expected_at ? new Date(order.expected_at).toLocaleDateString('fr-FR') : 'À planifier'}</span>
                </div>
              );
            }) : lowStocks.slice(0, 6).map(level => {
              const product = products.find(item => item.id === level.product_id);
              const warehouse = warehouses.find(item => item.id === level.warehouse_id);
              return (
                <div key={level.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{product?.name || 'Produit'}</p>
                    <p className="text-text-secondary text-xs mt-1">{warehouse?.name || 'Dépôt'} · seuil {level.alert_threshold}</p>
                  </div>
                  <span className="text-red font-black text-sm">{level.quantity} {level.unit}</span>
                </div>
              );
            })}
          </div>
          {(role === 'Stockiste' && lowStocks.length === 0) || (role === 'Acheteur' && pendingPurchases.length === 0) ? (
            <div className="rounded-2xl bg-green/10 border border-green/20 p-4 text-center">
              <CheckCircle2 size={22} className="text-green mx-auto mb-2" />
              <p className="text-green font-black text-sm">Aucune urgence pour ce poste</p>
            </div>
          ) : null}
        </section>
      )}

      <section className="glass-card p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange shrink-0 mt-0.5" />
          <p className="text-text-secondary text-xs leading-relaxed">
            Ce poste est filtré par profil, site, activité et POS. Les boutons ouvrent les modules existants avec le même périmètre, pour éviter qu’un salarié voie toute l’application.
          </p>
        </div>
      </section>
    </div>
  );
}
