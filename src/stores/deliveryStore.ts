import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Delivery {
  id: string;
  orderId: string;
  clientName: string;
  clientPhone: string;
  address: string;
  amount: number;
  paymentStatus: 'paye' | 'en_attente';
  driverId: string;
  driverName: string;
  status: 'preparation' | 'en_route' | 'livre';
  estimatedTime: number; // minutes
  createdAt: string;
}

interface DeliveryState {
  deliveries: Delivery[];
  addDelivery: (d: Omit<Delivery, 'id'>) => void;
  updateStatus: (id: string, status: Delivery['status']) => void;
  updatePaymentStatus: (id: string, status: Delivery['paymentStatus']) => void;
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      deliveries: [
        { id: 'd1', orderId: 'ord-0-1', clientName: 'Ibrahima Sarr', clientPhone: '77 123 45 67', address: 'Mermoz, Dakar', amount: 15500, paymentStatus: 'en_attente', driverId: 'e5', driverName: 'Pape Sow', status: 'en_route', estimatedTime: 15, createdAt: new Date().toISOString() },
        { id: 'd2', orderId: 'ord-0-2', clientName: 'Abdoulaye Diop', clientPhone: '78 987 65 43', address: 'Almadies, Dakar', amount: 8900, paymentStatus: 'paye', driverId: 'e5', driverName: 'Pape Sow', status: 'preparation', estimatedTime: 25, createdAt: new Date().toISOString() },
        { id: 'd3', orderId: 'ord-0-3', clientName: 'Malick Faye', clientPhone: '76 555 12 34', address: 'Ouakam, Dakar', amount: 12000, paymentStatus: 'en_attente', driverId: 'e5', driverName: 'Pape Sow', status: 'preparation', estimatedTime: 35, createdAt: new Date().toISOString() },
        { id: 'd4', orderId: 'ord-1-1', clientName: 'Ndèye Aïssatou', clientPhone: '77 000 00 00', address: 'Plateau, Dakar', amount: 5000, paymentStatus: 'paye', driverId: 'e5', driverName: 'Pape Sow', status: 'livre', estimatedTime: 0, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'd5', orderId: 'ord-1-2', clientName: 'Cheikh Tidiane', clientPhone: '77 111 11 11', address: 'Yoff, Dakar', amount: 7500, paymentStatus: 'paye', driverId: 'e5', driverName: 'Pape Sow', status: 'livre', estimatedTime: 0, createdAt: new Date(Date.now() - 7200000).toISOString() },
      ],

      addDelivery: (d) => set((s) => ({
        deliveries: [{ ...d, id: `d-${Date.now()}` }, ...s.deliveries]
      })),

      updateStatus: (id, status) => set((s) => ({
        deliveries: s.deliveries.map(d => d.id === id ? { ...d, status, estimatedTime: status === 'livre' ? 0 : d.estimatedTime } : d)
      })),
      updatePaymentStatus: (id, paymentStatus) => set((s) => ({
        deliveries: s.deliveries.map(d => d.id === id ? { ...d, paymentStatus } : d)
      })),
    }),
    { name: 'restauos-deliveries' }

  )
);
