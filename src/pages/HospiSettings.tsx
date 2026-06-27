import { motion } from 'framer-motion';
import { Building2, Store, Warehouse, BedDouble, ReceiptText, ShieldCheck, ChefHat, Truck } from 'lucide-react';
import { useHospiStore } from '../stores/hospiStore';
import { useBusinessRulesStore } from '../stores/businessRulesStore';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function HospiSettings() {
  const {
    companies,
    sites,
    posList,
    warehouses,
    products,
    posProductPrices,
    stockLevels,
    recipes,
    recipeItems,
    productionBatches,
    suppliers,
    purchaseOrders,
    purchaseOrderLines,
    supplierReceipts,
    rooms,
    guests,
    stays,
    folios,
    folioLines,
  } = useHospiStore();
  const { auditLogs } = useBusinessRulesStore();

  return (
    <div className="page-content pt-14 pb-28">
      <div className="mb-6">
        <h1 className="text-white font-black text-2xl">Administration Hospi</h1>
        <p className="text-text-secondary text-xs uppercase tracking-widest font-bold mt-1">Sártal OS Hospi</p>
      </div>

      <div className="glass-card-lg p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-orange/10 text-orange flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-white font-black text-sm">{companies[0]?.name}</h2>
            <p className="text-text-tertiary text-xs">{sites[0]?.name} • {companies[0]?.currency}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">POS</p>
            <p className="text-white font-black">{posList.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôts</p>
            <p className="text-white font-black">{warehouses.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">Chambres</p>
            <p className="text-white font-black">{rooms.length}</p>
          </div>
        </div>
      </div>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Store size={16} className="text-blue" /> Points de vente</h3>
        <div className="space-y-3">
          {posList.map(pos => {
            const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
            const prices = posProductPrices.filter(price => price.pos_id === pos.id);
            return (
              <motion.div key={pos.id} layout className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-black text-sm">{pos.name}</p>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest">{pos.type}</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green/10 text-green">{pos.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
                <p className="text-text-secondary text-xs mb-3">Dépôt de sortie : <span className="text-white font-bold">{warehouse?.name}</span></p>
                <div className="space-y-2">
                  {prices.map(price => {
                    const product = products.find(item => item.id === price.product_id);
                    return (
                      <div key={price.id} className="flex justify-between rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-text-secondary text-xs">{product?.name}</span>
                        <span className="text-orange font-black text-xs">{fmt(price.sale_price)} F</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Warehouse size={16} className="text-green" /> Dépôts & stocks</h3>
        <div className="space-y-3">
          {warehouses.map(warehouse => {
            const levels = stockLevels.filter(level => level.warehouse_id === warehouse.id);
            return (
              <div key={warehouse.id} className="glass-card p-4">
                <p className="text-white font-black text-sm mb-2">{warehouse.name}</p>
                {levels.map(level => {
                  const product = products.find(item => item.id === level.product_id);
                  return (
                    <div key={level.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{product?.name}</span>
                      <span className="text-white font-bold">{level.quantity} {level.unit}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><ChefHat size={16} className="text-orange" /> Recettes & production</h3>
        <div className="space-y-3">
          {recipes.map(recipe => {
            const product = products.find(item => item.id === recipe.product_id);
            const items = recipeItems.filter(item => item.recipe_id === recipe.id);
            return (
              <div key={recipe.id} className="glass-card p-4">
                <p className="text-white font-black text-sm mb-2">{product?.name || recipe.name}</p>
                <div className="space-y-1">
                  {items.map(item => {
                    const ingredient = products.find(productItem => productItem.id === item.ingredient_product_id);
                    return (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-text-secondary">{ingredient?.name}</span>
                        <span className="text-white font-bold">{item.quantity} {item.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {productionBatches.slice(0, 3).map(batch => {
            const product = products.find(item => item.id === batch.product_id);
            const warehouse = warehouses.find(item => item.id === batch.warehouse_id);
            return (
              <div key={batch.id} className="glass-card p-4 flex justify-between gap-3">
                <div>
                  <p className="text-white font-black text-sm">{product?.name}</p>
                  <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {new Date(batch.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="text-green font-black text-sm">+{batch.quantity}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Truck size={16} className="text-blue" /> Achats fournisseurs</h3>
        <div className="space-y-3">
          {purchaseOrders.map(order => {
            const supplier = suppliers.find(item => item.id === order.supplier_id);
            const warehouse = warehouses.find(item => item.id === order.warehouse_id);
            const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
            const total = lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_cost, 0);
            return (
              <div key={order.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-black text-sm">{supplier?.name}</p>
                    <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {fmt(total)} F</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${order.status === 'received' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                    {order.status}
                  </span>
                </div>
                {lines.map(line => {
                  const product = products.find(item => item.id === line.product_id);
                  return (
                    <div key={line.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{product?.name}</span>
                      <span className="text-white font-bold">{line.quantity_received}/{line.quantity_ordered}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {supplierReceipts.slice(0, 3).map(receipt => {
            const order = purchaseOrders.find(item => item.id === receipt.purchase_order_id);
            const supplier = order ? suppliers.find(item => item.id === order.supplier_id) : undefined;
            const warehouse = warehouses.find(item => item.id === receipt.warehouse_id);
            return (
              <div key={receipt.id} className="glass-card p-4 flex justify-between gap-3">
                <div>
                  <p className="text-white font-black text-sm">Réception {supplier?.name}</p>
                  <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {new Date(receipt.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="text-green font-black text-sm">{fmt(receipt.total_cost)} F</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><BedDouble size={16} className="text-cyan-400" /> PMS simplifié</h3>
        <div className="space-y-3">
          {rooms.map(room => {
            const stay = stays.find(item => item.room_id === room.id && item.status === 'checked_in');
            const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
            const folio = stay ? folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
            const lines = folio ? folioLines.filter(line => line.folio_id === folio.id) : [];
            return (
              <div key={room.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-black text-sm">Chambre {room.room_number}</p>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${room.status === 'occupied' ? 'bg-blue/10 text-blue' : 'bg-green/10 text-green'}`}>{room.status}</span>
                </div>
                {guest && <p className="text-text-secondary text-xs">{guest.first_name} {guest.last_name}</p>}
                {folio && (
                  <div className="mt-3 rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-tertiary text-[10px] font-black uppercase flex items-center gap-1"><ReceiptText size={12} /> Folio ouvert</span>
                      <span className="text-white font-black text-sm">{fmt(folio.total_amount)} F</span>
                    </div>
                    {lines.map(line => (
                      <div key={line.id} className="flex justify-between text-[10px]">
                        <span className="text-text-secondary">{line.description}</span>
                        <span className="text-cyan-300 font-bold">{fmt(line.amount)} F</span>
                      </div>
                    ))}
                    {lines.length === 0 && <p className="text-text-tertiary text-[10px]">Aucune consommation imputée.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-orange" /> Journal d’audit</h3>
        <div className="space-y-3">
          {auditLogs.slice(0, 10).map(log => (
            <div key={log.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-white font-black text-sm">
                    {log.action === 'discount' ? 'Remise' : log.action === 'cancel_order' ? 'Annulation ticket' : log.action}
                  </p>
                  <p className="text-text-tertiary text-[10px]">{log.actorName} • {log.actorRole}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${log.managerApprovalRequired ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                  {log.managerApprovalRequired ? 'Manager' : 'Autorisé'}
                </span>
              </div>
              <p className="text-text-secondary text-xs">{log.reason}</p>
              <div className="flex justify-between text-[10px] text-text-tertiary mt-2">
                <span>{log.targetType} #{log.targetId.slice(-4)}</span>
                <span>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="glass-card p-6 text-center text-text-tertiary text-sm">
              Aucune action sensible journalisée pour le moment.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
