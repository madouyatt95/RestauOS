import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore, type Order } from '../stores/orderStore';
import { Check, Clock, ChefHat } from 'lucide-react';

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getWaitMinutes = (dateString: string) => {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
};

export default function Cuisine() {
  const { orders, updateOrderStatus } = useOrderStore();
  const [, setTick] = useState(0);

  // Re-render every minute to update wait times
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'en_attente').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="page-content pt-14 pb-28 min-h-screen bg-[#070A0F]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ChefHat className="text-orange" /> Écran Cuisine
        </h1>
        <div className="glass-card px-3 py-1.5 text-xs text-text-secondary">
          {activeOrders.length} en attente
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-text-tertiary">
          <ChefHat size={48} className="mb-4 opacity-20" />
          <p>Aucune commande en cours</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {activeOrders.map(order => {
              const waitMins = getWaitMinutes(order.date);
              const isLate = waitMins >= 15;
              const isWarning = waitMins >= 10 && waitMins < 15;

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
                  className={`glass-card p-4 border transition-colors ${borderColor}`}
                >
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/5">
                    <div>
                      <span className="text-white font-black text-lg">#{order.id.slice(-4)}</span>
                      <p className="text-text-secondary text-xs mt-1 capitalize">{order.type.replace('_', ' ')}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 font-bold text-sm ${timerColor}`}>
                      <Clock size={16} />
                      {waitMins} min
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {order.items.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-white text-sm font-medium">
                          <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-orange font-bold">
                            {item.quantity}
                          </span>
                          {item.product.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'pret')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <Check size={18} /> Marquer prêt
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
