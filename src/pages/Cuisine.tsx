import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore } from '../stores/orderStore';
import { useDeliveryStore } from '../stores/deliveryStore';
import { Check, Clock, ChefHat } from 'lucide-react';

const getWaitMinutes = (dateString: string) => {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
};

export default function Cuisine() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { addDelivery } = useDeliveryStore();
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

      {/* IA Forecast Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 mb-6 border-violet/30 bg-violet/5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center shrink-0">
          <span className="text-sm">🤖</span>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm mb-1">Prévisions IA (Vendredi)</h3>
          <p className="text-text-secondary text-xs">Météo : 30°C. Prévoyez <strong>+40%</strong> de commandes Yassa aujourd'hui par rapport à la moyenne. Pensez à vérifier le stock d'oignons.</p>
        </div>
      </motion.div>

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
                    onClick={() => {
                      updateOrderStatus(order.id, 'pret');
                      if (order.type === 'livraison') {
                        addDelivery({
                          orderId: order.id,
                          clientName: order.clientId ? 'Ousmane Thiam' : 'Client Inconnu',
                          address: 'Dakar (Adresse de livraison)',
                          driverId: 'u6', // Pape Sow
                          driverName: 'Pape Sow',
                          status: 'preparation',
                          estimatedTime: 25,
                          createdAt: new Date().toISOString()
                        });
                      }
                    }}
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
