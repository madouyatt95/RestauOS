import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BedDouble, CalendarDays, CreditCard, Dice5, Package, ReceiptText, RotateCcw, Store, UserRound, Warehouse } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useHospiStore, type POSProduct } from '../stores/hospiStore';
import { useBusinessOperationsStore } from '../stores/businessOperationsStore';
import { canAccessPOS } from '../utils/accessControl';
import { getPOSActionCards, getPOSTypeLabel, getProfileWorkspace, workspaceToneClasses } from '../utils/profileWorkspace';
import { completePOSSale } from '../services/posTransaction';
import { runtimeDateOffset } from '../utils/runtime';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function BusinessPOS() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    activePOSId,
    posList,
    warehouses,
    getProductsForPOS,
    getOccupiedRoomsWithOpenFolios,
    adjustInventory,
  } = useHospiStore();
  const {
    spaAppointments,
    casinoSessions,
    boutiqueReturns,
    addSpaAppointment,
    updateSpaAppointmentStatus,
    openCasinoSession,
    closeCasinoSession,
    addBoutiqueReturn,
  } = useBusinessOperationsStore();
  const [notice, setNotice] = useState('');

  const activePOS = posList.find(pos => pos.id === activePOSId);
  const warehouse = warehouses.find(item => item.id === activePOS?.default_warehouse_id);
  const products = useMemo(() => activePOS ? getProductsForPOS(activePOS.id) : [], [activePOS, getProductsForPOS]);
  const rooms = getOccupiedRoomsWithOpenFolios().filter(row => row.room.site_id === activePOS?.site_id);
  const posSpaAppointments = activePOS ? spaAppointments.filter(item => item.posId === activePOS.id) : [];
  const posCasinoSessions = activePOS ? casinoSessions.filter(item => item.posId === activePOS.id) : [];
  const posBoutiqueReturns = activePOS ? boutiqueReturns.filter(item => item.posId === activePOS.id) : [];
  const workspace = getProfileWorkspace(user, activePOS);
  const workspaceTone = workspaceToneClasses[workspace.tone];
  const actionCards = activePOS ? getPOSActionCards(activePOS, rooms.length) : [];

  const sellNow = (row: POSProduct) => {
    if (!activePOS) return;
    try {
      completePOSSale({ posId: activePOS.id, productId: row.product.id, payment: 'carte', actor: user?.name || activePOS.name });
      setNotice(`${row.product.name} vendu sur ${activePOS.name}. Stock déduit du dépôt ${warehouse?.name || 'lié'}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'La vente n’a pas pu être enregistrée.');
    }
  };

  const chargeRoom = (row: POSProduct) => {
    const target = rooms[0];
    if (!target) {
      setNotice('Aucune chambre occupée avec folio ouvert pour imputation.');
      return;
    }
    if (!activePOS) return;
    try {
      completePOSSale({ posId: activePOS.id, productId: row.product.id, payment: 'room_charge', actor: user?.name || activePOS.name, roomId: target.room.id });
      setNotice(`${row.product.name} imputé à la chambre ${target.room.room_number}. Stock, POS et folio sont reliés.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'L’imputation chambre a échoué.');
    }
  };

  const createSpaAppointment = () => {
    if (!activePOS) return;
    const service = products.find(row => row.product.category_id === 'spa') || products[0];
    if (!service) {
      setNotice('Aucune prestation spa disponible dans ce POS.');
      return;
    }
    const targetRoom = rooms[0];
    const appointment = addSpaAppointment({
      posId: activePOS.id,
      guestName: targetRoom ? `Chambre ${targetRoom.room.room_number}` : 'Client walk-in',
      roomNumber: targetRoom?.room.room_number,
      serviceName: service.product.name,
      therapist: user?.name || 'Spa',
      startsAt: runtimeDateOffset(0.08),
      amount: service.price.sale_price,
    });
    setNotice(`Rendez-vous spa créé : ${appointment.serviceName} pour ${appointment.guestName}.`);
  };

  const createCasinoSession = () => {
    if (!activePOS) return;
    const session = openCasinoSession({
      posId: activePOS.id,
      tableName: `Table VIP ${posCasinoSessions.filter(item => item.status === 'open').length + 1}`,
      playerName: rooms[0] ? `Chambre ${rooms[0].room.room_number}` : 'Client casino',
      host: user?.name || 'Casino',
      buyIn: 100000,
    });
    setNotice(`Session casino ouverte : ${session.tableName}, buy-in ${fmt(session.buyIn)} F.`);
  };

  const recordBoutiqueReturn = () => {
    if (!activePOS) return;
    const row = products.find(item => item.product.is_stockable) || products[0];
    if (!row || !warehouse) {
      setNotice('Aucun article boutique ou dépôt lié pour enregistrer le retour.');
      return;
    }
    addBoutiqueReturn({
      posId: activePOS.id,
      productName: row.product.name,
      reason: 'Retour client / échange',
      amount: row.price.sale_price,
      status: 'received',
    });
    if (row.product.is_stockable) {
      adjustInventory(row.product.id, warehouse.id, (row.stock?.quantity || 0) + 1, 'Retour boutique', user?.name || activePOS.name);
    }
    setNotice(`Retour boutique enregistré : ${row.product.name}. Stock du dépôt ${warehouse.name} ajusté.`);
  };

  if (!activePOS || !canAccessPOS(user, activePOS)) {
    return (
      <div className="page-content pt-14 pb-28">
        <button onClick={() => navigate('/modules')} className="h-11 px-4 rounded-2xl bg-white/5 text-white text-sm font-bold mb-6">
          Retour aux métiers
        </button>
        <div className="glass-card-lg p-6 text-center">
          <Store size={28} className="mx-auto text-text-tertiary mb-3" />
          <h1 className="text-white font-black text-xl">Point de vente non sélectionné</h1>
          <p className="text-text-secondary text-sm mt-2">Choisis un métier depuis la page Activités.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/modules')} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
          <ArrowLeft size={18} />
        </button>
        <button onClick={() => navigate('/stocks')} className="h-10 px-3 rounded-2xl bg-white/5 border border-white/10 text-text-secondary text-xs font-black flex items-center gap-2">
          <Warehouse size={15} /> Dépôt
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-card-lg p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${workspaceTone.text}`}>{workspace.eyebrow}</p>
            <h1 className="text-white font-black text-2xl mt-1">{workspace.title}</h1>
            <p className="text-text-secondary text-xs mt-1 leading-snug">{workspace.subtitle}</p>
          </div>
          <span className={`shrink-0 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase ${workspaceTone.bg} ${workspaceTone.border} ${workspaceTone.text}`}>
            {getPOSTypeLabel(activePOS.type)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-2xl bg-white/5 p-3">
            <Package size={16} className="text-orange mb-2" />
            <p className="text-text-tertiary text-[9px] font-black uppercase">Catalogue</p>
            <p className="text-white font-black text-sm">{products.length} offres</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <Warehouse size={16} className="text-blue mb-2" />
            <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôt</p>
            <p className="text-white font-black text-sm truncate">{warehouse?.name || 'Non lié'}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <CreditCard size={16} className="text-green mb-2" />
            <p className="text-text-tertiary text-[9px] font-black uppercase">Paiements</p>
            <p className="text-white font-black text-sm">{activePOS.payment_methods.length}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {actionCards.map(card => {
            const tone = workspaceToneClasses[card.tone];
            return (
              <div key={`${card.label}-${card.value}`} className={`rounded-2xl border p-3 ${tone.bg} ${tone.border}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest ${tone.text}`}>{card.label}</p>
                <p className="text-white font-black text-sm mt-1">{card.value}</p>
                <p className="text-text-tertiary text-[10px] mt-0.5 leading-tight">{card.detail}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {notice && (
        <button onClick={() => setNotice('')} className="w-full rounded-2xl bg-green/10 border border-green/20 text-green text-xs font-bold px-4 py-3 text-left mb-4">
          {notice}
        </button>
      )}

      {activePOS.type === 'room_service' && (
        <section className="glass-card-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-cyan-300 text-[10px] font-black uppercase tracking-widest">Room service</p>
              <h2 className="text-white font-black text-lg">Chambres à servir</h2>
              <p className="text-text-secondary text-xs mt-1">Chaque vente peut être encaissée ou imputée au folio de la chambre.</p>
            </div>
            <button onClick={() => navigate('/pms')} className="h-10 px-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-200 text-xs font-black flex items-center gap-2">
              <BedDouble size={15} /> PMS
            </button>
          </div>
          <div className="space-y-2">
            {rooms.slice(0, 4).map(row => {
              const quickProduct = products[0];
              return (
                <div key={row.room.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">Chambre {row.room.room_number}</p>
                    <p className="text-text-secondary text-xs mt-1">{row.guest.first_name} {row.guest.last_name} · folio ouvert</p>
                  </div>
                  <button
                    type="button"
                    disabled={!quickProduct}
                    onClick={() => quickProduct && chargeRoom(quickProduct)}
                    className="h-9 px-3 rounded-xl bg-blue/10 text-blue text-[10px] font-black disabled:opacity-40"
                  >
                    Imputer
                  </button>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="rounded-2xl bg-white/5 border border-dashed border-white/10 p-4 text-center">
                <p className="text-white font-bold text-sm">Aucune chambre occupée avec folio ouvert</p>
                <p className="text-text-secondary text-xs mt-1">Le room charge sera disponible dès qu’un séjour sera actif.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activePOS.type === 'spa' && (
        <section className="glass-card-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Planning spa</p>
              <h2 className="text-white font-black text-lg">Rendez-vous du point de vente</h2>
            </div>
            <button onClick={createSpaAppointment} className="h-10 px-3 rounded-2xl bg-purple text-white text-xs font-black flex items-center gap-2">
              <CalendarDays size={15} /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {posSpaAppointments.slice(0, 4).map(appointment => (
              <div key={appointment.id} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{appointment.serviceName}</p>
                    <p className="text-text-secondary text-xs mt-1">{appointment.guestName} · {appointment.therapist}</p>
                  </div>
                  <span className="text-purple text-[10px] font-black uppercase">{appointment.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => updateSpaAppointmentStatus(appointment.id, 'in_progress')} className="h-9 rounded-xl bg-white/5 text-white text-[10px] font-black">Démarrer</button>
                  <button onClick={() => updateSpaAppointmentStatus(appointment.id, 'done')} className="h-9 rounded-xl bg-green/10 text-green text-[10px] font-black">Terminer</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activePOS.type === 'casino' && (
        <section className="glass-card-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Casino</p>
              <h2 className="text-white font-black text-lg">Sessions tables & buy-in</h2>
            </div>
            <button onClick={createCasinoSession} className="h-10 px-3 rounded-2xl bg-orange text-white text-xs font-black flex items-center gap-2">
              <Dice5 size={15} /> Ouvrir
            </button>
          </div>
          <div className="space-y-2">
            {posCasinoSessions.slice(0, 4).map(session => (
              <div key={session.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-black text-sm">{session.tableName}</p>
                  <p className="text-text-secondary text-xs mt-1 truncate">{session.playerName} · {fmt(session.buyIn)} F</p>
                </div>
                {session.status === 'open' ? (
                  <button onClick={() => closeCasinoSession(session.id)} className="h-9 px-3 rounded-xl bg-red/10 text-red text-[10px] font-black">Fermer</button>
                ) : (
                  <span className="text-text-tertiary text-[10px] font-black uppercase">Clôturée</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activePOS.type === 'boutique' && (
        <section className="glass-card-lg p-4 mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Boutique</p>
              <h2 className="text-white font-black text-lg">Retours, échanges et stock</h2>
            </div>
            <button onClick={recordBoutiqueReturn} className="h-10 px-3 rounded-2xl bg-blue text-white text-xs font-black flex items-center gap-2">
              <RotateCcw size={15} /> Retour
            </button>
          </div>
          <div className="space-y-2">
            {posBoutiqueReturns.slice(0, 4).map(item => (
              <div key={item.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-black text-sm">{item.productName}</p>
                  <p className="text-text-secondary text-xs mt-1 truncate">{item.reason}</p>
                </div>
                <div className="text-right">
                  <UserRound size={15} className="text-blue ml-auto mb-1" />
                  <p className="text-blue text-[10px] font-black uppercase">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {products.map(row => (
          <motion.div key={row.price.id} layout className="glass-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-black text-sm">{row.product.name}</p>
                <p className="text-text-tertiary text-xs mt-1">{row.product.sku} · stock {row.stock?.quantity ?? 0} {row.stock?.unit || row.product.unit}</p>
              </div>
              <p className="text-orange font-black text-sm whitespace-nowrap">{fmt(row.price.sale_price)} F</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => sellNow(row)} className="h-11 rounded-xl bg-orange text-white text-xs font-black flex items-center justify-center gap-2">
                <ReceiptText size={15} /> Vendre
              </button>
              <button onClick={() => chargeRoom(row)} className="h-11 rounded-xl bg-blue/10 text-blue text-xs font-black flex items-center justify-center gap-2">
                <BedDouble size={15} /> Chambre
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="glass-card-lg p-8 text-center">
          <Package size={28} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-white font-bold">Aucun produit disponible</p>
          <p className="text-text-secondary text-sm mt-1">Ajoute les prix POS depuis Admin Hospi.</p>
        </div>
      )}
    </div>
  );
}
