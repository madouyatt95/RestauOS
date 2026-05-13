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
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  type: 'sur_place' | 'emporter' | 'livraison';
  payment: 'especes' | 'wave' | 'orange_money' | 'carte';
  date: string;
  clientId?: string;
}

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Thiéboudienne', price: 5000, category: 'plats', image: '🍛', stock: 30, cost: 2000 },
  { id: 'p2', name: 'Yassa Poulet', price: 4000, category: 'plats', image: '🍗', stock: 25, cost: 1500 },
  { id: 'p3', name: 'Mafé Bœuf', price: 4500, category: 'plats', image: '🥘', stock: 20, cost: 1800 },
  { id: 'p4', name: 'Thiou Poisson', price: 4000, category: 'plats', image: '🐟', stock: 18, cost: 1600 },
  { id: 'p5', name: 'Dibi Agneau', price: 6000, category: 'plats', image: '🥩', stock: 15, cost: 2500 },
  { id: 'p6', name: 'Pastels', price: 2000, category: 'plats', image: '🥟', stock: 40, cost: 600 },
  { id: 'p7', name: 'Jus de Bissap', price: 1500, category: 'boissons', image: '🍹', stock: 50, cost: 300 },
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

  for (let d = 6; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const count = d === 0 ? 128 : Math.floor(80 + Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: CartItem[] = [];
      for (let j = 0; j < itemCount; j++) {
        const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        items.push({ product: p, quantity: qty });
      }
      const total = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
      orders.push({
        id: `ord-${d}-${i}`,
        items,
        total,
        type: types[Math.floor(Math.random() * types.length)],
        payment: payments[Math.floor(Math.random() * payments.length)],
        date: day.toISOString(),
      });
    }
  }
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
  checkout: (payment: Order['payment'], clientId?: string) => Order;
  getCA: (daysAgo?: number) => number;
  getOrderCount: (daysAgo?: number) => number;
  getClientCount: (daysAgo?: number) => number;
  getAvgTicket: (daysAgo?: number) => number;
  getCAByDay: () => { day: string; ca: number }[];
  getTypeDistribution: () => { sur_place: number; emporter: number; livraison: number };
  getTopProducts: () => { name: string; image: string; sales: number; revenue: number }[];
}

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

      checkout: (payment, clientId) => {
        const s = get();
        const total = s.cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
        const order: Order = {
          id: `ord-${Date.now()}`,
          items: [...s.cart],
          total,
          type: s.orderType,
          payment,
          date: new Date().toISOString(),
          clientId,
        };
        set({ orders: [order, ...s.orders], cart: [] });
        return order;
      },

      getCA: (daysAgo = 0) => {
        const s = get();
        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() - daysAgo);
        const dayStr = target.toISOString().split('T')[0];
        return s.orders
          .filter(o => o.date.startsWith(dayStr))
          .reduce((sum, o) => sum + o.total, 0);
      },

      getOrderCount: (daysAgo = 0) => {
        const s = get();
        const now = new Date();
        const target = new Date(now);
        target.setDate(target.getDate() - daysAgo);
        const dayStr = target.toISOString().split('T')[0];
        return s.orders.filter(o => o.date.startsWith(dayStr)).length;
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
            .filter(o => o.date.startsWith(dayStr))
            .reduce((sum, o) => sum + o.total, 0);
          result.push({ day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], ca });
        }
        return result;
      },

      getTypeDistribution: () => {
        const orders = get().orders;
        const total = orders.length || 1;
        return {
          sur_place: Math.round(orders.filter(o => o.type === 'sur_place').length / total * 100),
          emporter: Math.round(orders.filter(o => o.type === 'emporter').length / total * 100),
          livraison: Math.round(orders.filter(o => o.type === 'livraison').length / total * 100),
        };
      },

      getTopProducts: () => {
        const counts: Record<string, { name: string; image: string; sales: number; revenue: number }> = {};
        get().orders.forEach(o => {
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
