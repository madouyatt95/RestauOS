import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'plats' | 'boissons' | 'desserts';
  image: string;
  stock: number;
  cost: number;
  recipe?: { stockItemId: string; amount: number }[];
  allergens?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'especes' | 'wave' | 'orange_money' | 'carte';
  date: string;
}

export type OrderStatus = 'non_payee' | 'partiellement_payee' | 'payee' | 'en_preparation' | 'prete' | 'servie' | 'en_livraison' | 'terminee';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  type: 'sur_place' | 'emporter' | 'livraison';
  payment: 'especes' | 'wave' | 'orange_money' | 'carte';
  date: string;
  clientId?: string;
  tableId?: string;
  serveurName?: string;
  status: OrderStatus;
  paidAmount: number;
  payments: Payment[];
  itemsReady: Record<string, boolean>;
  loyaltyClientId?: string;
}

export const PRODUCTS: Product[] = [
  { 
    id: 'p1', name: 'Thiéboudienne', price: 5000, category: 'plats', image: '/images/thieboudienne.png', stock: 30, cost: 2000,
    recipe: [{ stockItemId: 's1', amount: 0.2 }, { stockItemId: 's2', amount: 0.1 }, { stockItemId: 's6', amount: 0.3 }]
  },
  { 
    id: 'p2', name: 'Yassa Poulet', price: 4000, category: 'plats', image: '/images/yassa_poulet.png', stock: 25, cost: 1500,
    recipe: [{ stockItemId: 's1', amount: 0.2 }, { stockItemId: 's4', amount: 0.3 }, { stockItemId: 's5', amount: 0.3 }]
  },
  { 
    id: 'p3', name: 'Mafé Bœuf', price: 4500, category: 'plats', image: '/images/mafe.png', stock: 20, cost: 1800,
    recipe: [{ stockItemId: 's1', amount: 0.2 }, { stockItemId: 's3', amount: 0.1 }]
  },
  { id: 'p4', name: 'Thiou Poisson', price: 4000, category: 'plats', image: '🐟', stock: 18, cost: 1600 },
  { id: 'p5', name: 'Dibi Agneau', price: 6000, category: 'plats', image: '🥩', stock: 15, cost: 2500 },
  { id: 'p6', name: 'Pastels', price: 2000, category: 'plats', image: '🥟', stock: 40, cost: 600 },
  { 
    id: 'p7', name: 'Jus de Bissap', price: 1500, category: 'boissons', image: '/images/jus_bissap.png', stock: 50, cost: 300,
    recipe: [{ stockItemId: 's9', amount: 0.05 }, { stockItemId: 's10', amount: 0.05 }]
  },
  { id: 'p8', name: 'Jus de Bouye', price: 1500, category: 'boissons', image: '🥛', stock: 40, cost: 300 },
  { id: 'p9', name: 'Eau minérale', price: 500, category: 'boissons', image: '💧', stock: 100, cost: 150 },
  { id: 'p10', name: 'Coca-Cola', price: 1000, category: 'boissons', image: '🥤', stock: 60, cost: 400 },
  { id: 'p11', name: 'Café Touba', price: 500, category: 'boissons', image: '☕', stock: 80, cost: 100 },
  { id: 'p12', name: 'Thiakry', price: 2000, category: 'desserts', image: '🍨', stock: 20, cost: 500 },
  { id: 'p13', name: 'Fondé', price: 1500, category: 'desserts', image: '🍮', stock: 15, cost: 400 },
  { id: 'p14', name: 'Ngalakh', price: 1500, category: 'desserts', image: '🥣', stock: 12, cost: 400 },
];

const generateOrders = (): Order[] => {
  const orders: Order[] = [];
  const types: Order['type'][] = ['sur_place', 'emporter', 'livraison'];
  const payments: Order['payment'][] = ['especes', 'wave', 'orange_money', 'carte'];
  const now = new Date();

  // Commandes passées (7 derniers jours)
  for (let d = 7; d >= 1; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const count = Math.floor(80 + Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: CartItem[] = [];
      for (let j = 0; j < itemCount; j++) {
        const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        items.push({ product: p, quantity: Math.floor(Math.random() * 2) + 1 });
      }
      const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
      const pm = payments[Math.floor(Math.random() * payments.length)];
      orders.push({
        id: `ord-${d}-${i}`,
        items,
        total,
        type: types[Math.floor(Math.random() * types.length)],
        payment: pm,
        date: day.toISOString(),
        status: 'terminee',
        paidAmount: total,
        payments: [{ id: `pay-${d}-${i}`, amount: total, method: pm, date: day.toISOString() }],
        itemsReady: {},
      });
    }
  }

  // Commandes "Live" pour démo
  orders.push({
    id: 'cmd-live-1',
    items: [{ product: PRODUCTS[0], quantity: 2 }, { product: PRODUCTS[6], quantity: 2 }],
    total: 13000,
    type: 'sur_place',
    payment: 'especes',
    date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    tableId: 't4',
    serveurName: 'Awa F.',
    status: 'en_preparation',
    paidAmount: 0,
    payments: [],
    itemsReady: {},
  });

  orders.push({
    id: 'cmd-live-2',
    items: [{ product: PRODUCTS[1], quantity: 1 }, { product: PRODUCTS[7], quantity: 1 }],
    total: 5500,
    type: 'sur_place',
    payment: 'wave',
    date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    tableId: 't7',
    serveurName: 'Ibrahima B.',
    status: 'prete',
    paidAmount: 0,
    payments: [],
    itemsReady: {},
  });

  // Demo commande livraison en cours (for client view)
  orders.push({
    id: 'cmd-live-3',
    items: [{ product: PRODUCTS[0], quantity: 1 }, { product: PRODUCTS[9], quantity: 2 }],
    total: 7000,
    type: 'livraison',
    payment: 'wave',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    clientId: 'c1',
    status: 'en_livraison',
    paidAmount: 7000,
    payments: [{ id: 'pay-live-3', amount: 7000, method: 'wave', date: new Date(Date.now() - 1000 * 60 * 30).toISOString() }],
    itemsReady: {},
  });

  // Demo historique client passé
  orders.push({
    id: 'cmd-hist-1',
    items: [{ product: PRODUCTS[4], quantity: 1 }, { product: PRODUCTS[6], quantity: 1 }],
    total: 7500,
    type: 'livraison',
    payment: 'wave',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    clientId: 'c1',
    status: 'terminee',
    paidAmount: 7500,
    payments: [{ id: 'pay-hist-1', amount: 7500, method: 'wave', date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }],
    itemsReady: {},
  });

  orders.push({
    id: 'cmd-hist-2',
    items: [{ product: PRODUCTS[1], quantity: 2 }, { product: PRODUCTS[11], quantity: 1 }],
    total: 10000,
    type: 'livraison',
    payment: 'orange_money',
    date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    clientId: 'c1',
    status: 'terminee',
    paidAmount: 10000,
    payments: [{ id: 'pay-hist-2', amount: 10000, method: 'orange_money', date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() }],
    itemsReady: {},
  });

  return orders;
};

interface OrderState {
  cart: CartItem[];
  orders: Order[];
  orderType: Order['type'];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  setOrderType: (type: Order['type']) => void;
  checkout: (payment: Order['payment'], clientId?: string, tableId?: string, serveurName?: string) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addPayment: (orderId: string, amount: number, method: Payment['method']) => void;
  toggleItemReady: (orderId: string, productId: string) => void;
  checkAllItemsReady: (orderId: string) => boolean;
  setLoyaltyClient: (orderId: string, clientId: string) => void;
  getCA: (daysAgo: number) => number;
  getOrderCount: (daysAgo?: number) => number;
  getClientCount: (daysAgo?: number) => number;
  getAvgTicket: (daysAgo?: number) => number;
  getCAByDay: () => { day: string; ca: number }[];
  getTypeDistribution: () => { sur_place: number; emporter: number; livraison: number };
  getTopProducts: () => { name: string; image: string; sales: number; revenue: number }[];
}

const PAID_STATUSES: OrderStatus[] = ['payee', 'terminee', 'servie'];

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      cart: [],
      orders: generateOrders(),
      orderType: 'sur_place',

      addToCart: (product) => set((s) => {
        const existing = s.cart.find(c => c.product.id === product.id);
        if (existing) {
          return { cart: s.cart.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c) };
        }
        return { cart: [...s.cart, { product, quantity: 1 }] };
      }),

      removeFromCart: (productId) => set((s) => ({
        cart: s.cart.filter(c => c.product.id !== productId)
      })),

      updateQuantity: (productId, qty) => set((s) => ({
        cart: qty <= 0
          ? s.cart.filter(c => c.product.id !== productId)
          : s.cart.map(c => c.product.id === productId ? { ...c, quantity: qty } : c)
      })),

      clearCart: () => set({ cart: [] }),
      setOrderType: (type) => set({ orderType: type }),

      checkout: (payment, clientId, tableId, serveurName) => {
        const state = get();
        if (state.cart.length === 0) return null;

        const total = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        const newOrder: Order = {
          id: `cmd-${Date.now()}`,
          items: [...state.cart],
          total,
          type: state.orderType,
          payment,
          clientId,
          tableId,
          serveurName,
          date: new Date().toISOString(),
          status: tableId ? 'en_preparation' : 'payee',
          paidAmount: tableId ? 0 : total,
          payments: tableId ? [] : [{ id: `pay-${Date.now()}`, amount: total, method: payment, date: new Date().toISOString() }],
          itemsReady: {},
        };

        set(state => ({
          orders: [newOrder, ...state.orders],
          cart: [],
        }));

        return newOrder;
      },

      updateOrderStatus: (orderId, status) => set(state => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
      })),

      addPayment: (orderId, amount, method) => set(state => ({
        orders: state.orders.map(o => {
          if (o.id !== orderId) return o;
          const newPayment: Payment = {
            id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            amount,
            method,
            date: new Date().toISOString(),
          };
          const newPaidAmount = o.paidAmount + amount;
          const newStatus: OrderStatus = newPaidAmount >= o.total ? 'payee' : 'partiellement_payee';
          return {
            ...o,
            payments: [...o.payments, newPayment],
            paidAmount: newPaidAmount,
            status: newStatus,
          };
        })
      })),

      toggleItemReady: (orderId, productId) => set(state => ({
        orders: state.orders.map(o => {
          if (o.id !== orderId) return o;
          const newItemsReady = { ...o.itemsReady, [productId]: !o.itemsReady[productId] };
          // Check if all items are now ready
          const allReady = o.items.every(it => newItemsReady[it.product.id]);
          return {
            ...o,
            itemsReady: newItemsReady,
            status: allReady ? 'prete' : o.status,
          };
        })
      })),

      checkAllItemsReady: (orderId) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return false;
        return order.items.every(it => order.itemsReady[it.product.id]);
      },

      setLoyaltyClient: (orderId, clientId) => set(state => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, loyaltyClientId: clientId } : o)
      })),

      getCA: (daysAgo) => {
        const s = get();
        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() - daysAgo);
        const dayStr = target.toISOString().split('T')[0];
        return s.orders
          .filter(o => o.date.startsWith(dayStr) && PAID_STATUSES.includes(o.status))
          .reduce((sum, o) => sum + o.total, 0);
      },

      getOrderCount: (daysAgo = 0) => {
        const s = get();
        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() - daysAgo);
        const dayStr = target.toISOString().split('T')[0];
        return s.orders.filter(o => o.date.startsWith(dayStr) && PAID_STATUSES.includes(o.status)).length;
      },

      getClientCount: (daysAgo = 0) => {
        return Math.floor(get().getOrderCount(daysAgo) * 0.75);
      },

      getAvgTicket: (daysAgo = 0) => {
        const count = get().getOrderCount(daysAgo);
        if (count === 0) return 0;
        return Math.round(get().getCA(daysAgo) / count);
      },

      getCAByDay: () => {
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const result: { day: string; ca: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split('T')[0];
          const ca = get().orders
            .filter(o => o.date.startsWith(dayStr) && PAID_STATUSES.includes(o.status))
            .reduce((sum, o) => sum + o.total, 0);
          result.push({ day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], ca });
        }
        return result;
      },

      getTypeDistribution: () => {
        const orders = get().orders.filter(o => PAID_STATUSES.includes(o.status));
        const total = orders.length || 1;
        return {
          sur_place: Math.round(orders.filter(o => o.type === 'sur_place').length / total * 100),
          emporter: Math.round(orders.filter(o => o.type === 'emporter').length / total * 100),
          livraison: Math.round(orders.filter(o => o.type === 'livraison').length / total * 100),
        };
      },

      getTopProducts: () => {
        const counts: Record<string, { name: string; image: string; sales: number; revenue: number }> = {};
        get().orders.filter(o => PAID_STATUSES.includes(o.status)).forEach(o => {
          o.items.forEach(it => {
            if (!counts[it.product.id]) {
              counts[it.product.id] = { name: it.product.name, image: it.product.image, sales: 0, revenue: 0 };
            }
            counts[it.product.id].sales += it.quantity;
            counts[it.product.id].revenue += it.product.price * it.quantity;
          });
        });
        return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      },
    }),
    { name: 'restauos-orders' }
  )
);
