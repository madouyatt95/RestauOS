import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Delivery {
  id: string;
  orderId: string;
  clientName: string;
  address: string;
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
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      deliveries: [
        { id: 'd1', orderId: 'ord-0-1', clientName: 'Ibrahima Sarr', address: 'Mermoz, Dakar', driverId: 'e5', driverName: 'Pape Sow', status: 'en_route', estimatedTime: 15, createdAt: new Date().toISOString() },
        { id: 'd2', orderId: 'ord-0-2', clientName: 'Abdoulaye Diop', address: 'Almadies, Dakar', driverId: 'e5', driverName: 'Pape Sow', status: 'preparation', estimatedTime: 25, createdAt: new Date().toISOString() },
        { id: 'd3', orderId: 'ord-0-3', clientName: 'Malick Faye', address: 'Ouakam, Dakar', driverId: 'e5', driverName: 'Pape Sow', status: 'preparation', estimatedTime: 35, createdAt: new Date().toISOString() },
        { id: 'd4', orderId: 'ord-1-1', clientName: 'Ndèye Aïssatou', address: 'Plateau, Dakar', driverId: 'e5', driverName: 'Pape Sow', status: 'livre', estimatedTime: 0, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'd5', orderId: 'ord-1-2', clientName: 'Cheikh Tidiane', address: 'Yoff, Dakar', driverId: 'e5', driverName: 'Pape Sow', status: 'livre', estimatedTime: 0, createdAt: new Date(Date.now() - 7200000).toISOString() },
      ],

      addDelivery: (d) => set((s) => ({
        deliveries: [{ ...d, id: `d-${Date.now()}` }, ...s.deliveries]
      })),

      updateStatus: (id, status) => set((s) => ({
        deliveries: s.deliveries.map(d => d.id === id ? { ...d, status, estimatedTime: status === 'livre' ? 0 : d.estimatedTime } : d)
      })),
    }),
    { name: 'restauos-deliveries' }
  )
);
