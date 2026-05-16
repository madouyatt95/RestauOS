import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore, type AppNotification } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';
import { ChefHat, Calendar, Package, Star, Truck, Gift, Info } from 'lucide-react';

export default function NotificationToaster() {
  const { notifications, markRead } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [toastQueue, setToastQueue] = useState<AppNotification[]>([]);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (notifications.length === 0 || !user) return;
    
    const latest = notifications[0];
    
    if (latest.id !== lastNotifId && !latest.read) {
      setLastNotifId(latest.id);
      
      // Target role check
      if (latest.targetRole && latest.targetRole !== user.role && user.role !== 'Gérant') {
        return; 
      }
      
      setToastQueue(prev => [...prev, latest]);
      
      // Native browser notification logic
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(latest.title, { body: latest.message, icon: '/icon-192x192.png' });
      } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
      }

      // Auto dismiss after 5s
      setTimeout(() => {
        setToastQueue(prev => prev.filter(n => n.id !== latest.id));
      }, 5000);
    }
  }, [notifications, lastNotifId, user]);

  const handleClick = (notif: AppNotification) => {
    markRead(notif.id);
    setToastQueue(prev => prev.filter(n => n.id !== notif.id));
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ChefHat className="text-orange" size={20} />;
      case 'swap': return <Calendar className="text-blue" size={20} />;
      case 'stock': return <Package className="text-red" size={20} />;
      case 'review': return <Star className="text-yellow-400" size={20} />;
      case 'delivery': return <Truck className="text-green" size={20} />;
      case 'promo': return <Gift className="text-violet" size={20} />;
      default: return <Info className="text-text-secondary" size={20} />;
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
      <AnimatePresence>
        {toastQueue.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            onClick={() => handleClick(notif)}
            className="pointer-events-auto bg-[#1a1c22]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 p-4 rounded-2xl flex items-start gap-4 cursor-pointer"
          >
            <div className="mt-1 bg-white/5 p-2 rounded-xl">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm mb-1">{notif.title}</h4>
              <p className="text-text-secondary text-xs">{notif.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
