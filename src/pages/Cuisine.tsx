import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { useTableStore } from '../stores/tableStore';
import { Check, Clock, ChefHat } from 'lucide-react';

const getWaitMinutes = (dateString: string) => {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
};

export default function Cuisine() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { addDelivery } = useDeliveryStore();
  const { tables } = useTableStore();
  const [, setTick] = useState(0);

  // Re-render every minute to update wait times
  useEffect(() => {
    const timer = setInterval(() => setTick((t: number) => t + 1), 60000);

    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'en_attente').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate production summary
  const summary: Record<string, number> = {};
  activeOrders.forEach(o => {
    o.items.forEach(it => {
      summary[it.product.name] = (summary[it.product.name] || 0) + it.quantity;
    });
  });

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#070A0F]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ChefHat className="text-orange" /> Cuisine
        </h1>
        <div className="glass-card px-3 py-1.5 text-xs text-text-secondary">
          {activeOrders.length} tickets en attente
        </div>
      </div>

      {/* Production Summary */}
      {activeOrders.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-8 border-orange/20 bg-orange/5">
          <h3 className="text-orange font-black text-[10px] uppercase tracking-widest mb-3">Récapitulatif de production</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(summary).map(([name, qty]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-orange text-white font-black text-xs flex items-center justify-center">{qty}</span>
                <span className="text-white text-sm font-bold">{name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
          <ChefHat size={48} className="mb-4 opacity-20" />
          <p className="font-bold">Cuisine calme</p>
          <p className="text-xs">Aucune commande en attente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {activeOrders.map(order => {
              const waitMins = getWaitMinutes(order.date);
              const isLate = waitMins >= 15;
              const isWarning = waitMins >= 10 && waitMins < 15;
              const tableNum = order.tableId ? tables.find(t => t.id === order.tableId)?.number : null;

              let timerColor = 'text-green';
              let borderColor = 'border-white/5';
              if (isLate) {
                timerColor = 'text-red';
                borderColor = 'border-red/30';
              } else if (isWarning) {
                timerColor = 'text-orange';
                borderColor = 'border-orange/30';
              }

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className={`glass-card p-5 border-2 transition-colors ${borderColor}`}
                >
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black text-lg">
                        {tableNum || '📦'}
                      </div>
                      <div>
                        <span className="text-white font-black text-sm">{tableNum ? `Table ${tableNum}` : 'À Emporter'}</span>
                        <p className="text-text-tertiary text-[10px] uppercase font-bold">Ticket #{order.id.slice(-4)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 font-black text-xs ${timerColor}`}>
                      <Clock size={14} />
                      {waitMins} MIN
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {order.items.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-white text-sm font-bold">
                          <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-orange font-black text-xs">
                            {item.quantity}
                          </span>
                          {item.product.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, 'pret');
                      if (order.type === 'livraison') {
                        addDelivery({
                          orderId: order.id,
                          clientName: order.clientId ? 'Ousmane Thiam' : 'Client Inconnu',
                          clientPhone: '77 000 00 00',
                          address: 'Dakar (Adresse de livraison)',
                          amount: order.total,
                          paymentStatus: order.status === 'paye' ? 'paye' : 'en_attente',

                          driverId: 'u6', // Pape Sow
                          driverName: 'Pape Sow',
                          status: 'preparation',
                          estimatedTime: 25,
                          createdAt: new Date().toISOString()
                        });

                      }
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-green to-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-green/10"
                  >
                    <Check size={20} /> MARQUER PRÊT
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

