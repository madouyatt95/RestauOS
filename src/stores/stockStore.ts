import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  category: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'entree' | 'sortie';
  quantity: number;
  date: string;
  note: string;
}

interface StockState {
  items: StockItem[];
  movements: StockMovement[];
  addItem: (item: Omit<StockItem, 'id'>) => void;
  updateStock: (id: string, quantity: number) => void;
  addMovement: (movement: Omit<StockMovement, 'id'>) => void;
  getLowStockItems: () => StockItem[];
  consumeStockForOrder: (items: any[], orderId: string) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      items: [
        { id: 's1', name: 'Riz brisé', quantity: 25, unit: 'kg', minStock: 30, category: 'Céréales' },
        { id: 's2', name: 'Huile végétale', quantity: 10, unit: 'L', minStock: 5, category: 'Huiles' },
        { id: 's3', name: 'Tomates', quantity: 8, unit: 'kg', minStock: 10, category: 'Légumes' },
        { id: 's4', name: 'Oignons', quantity: 15, unit: 'kg', minStock: 10, category: 'Légumes' },
        { id: 's5', name: 'Poulet', quantity: 12, unit: 'kg', minStock: 8, category: 'Viandes' },
        { id: 's6', name: 'Poisson frais', quantity: 5, unit: 'kg', minStock: 8, category: 'Poissons' },
        { id: 's7', name: 'Piment', quantity: 3, unit: 'kg', minStock: 2, category: 'Épices' },
        { id: 's8', name: 'Citron', quantity: 20, unit: 'pcs', minStock: 15, category: 'Fruits' },
        { id: 's9', name: 'Bissap séché', quantity: 4, unit: 'kg', minStock: 3, category: 'Boissons' },
        { id: 's10', name: 'Sucre', quantity: 8, unit: 'kg', minStock: 5, category: 'Épicerie' },
      ],
      movements: [
        { id: 'm1', itemId: 's1', itemName: 'Riz brisé', type: 'entree', quantity: 50, date: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Fournisseur Touba Distribution' },
        { id: 'm2', itemId: 's5', itemName: 'Poulet', type: 'entree', quantity: 20, date: new Date(Date.now() - 86400000).toISOString(), note: 'Marché Sandaga' },
        { id: 'm3', itemId: 's3', itemName: 'Tomates', type: 'sortie', quantity: 5, date: new Date().toISOString(), note: 'Cuisine du jour' },
        { id: 'm4', itemId: 's6', itemName: 'Poisson frais', type: 'sortie', quantity: 8, date: new Date().toISOString(), note: 'Thiéboudienne' },
      ],

      addItem: (item) => set((s) => ({
        items: [...s.items, { ...item, id: `s-${Date.now()}` }]
      })),

      updateStock: (id, quantity) => set((s) => ({
        items: s.items.map(i => i.id === id ? { ...i, quantity } : i)
      })),

      addMovement: (movement) => set((s) => {
        const newMovement = { ...movement, id: `m-${Date.now()}` };
        const items = s.items.map(i => {
          if (i.id === movement.itemId) {
            return {
              ...i,
              quantity: movement.type === 'entree'
                ? i.quantity + movement.quantity
                : Math.max(0, i.quantity - movement.quantity)
            };
          }
          return i;
        });
        return { movements: [newMovement, ...s.movements], items };
      }),

      getLowStockItems: () => get().items.filter(i => i.quantity <= i.minStock),

      consumeStockForOrder: (orderItems, orderId) => {
        const state = get();
        const newMovements: StockMovement[] = [];
        let updatedItems = [...state.items];

        orderItems.forEach(cartItem => {
          const product = cartItem.product;
          if (product.recipe && product.recipe.length > 0) {
            product.recipe.forEach((ingredient: any) => {
              const totalAmount = ingredient.amount * cartItem.quantity;
              
              const stockItemIndex = updatedItems.findIndex(i => i.id === ingredient.stockItemId);
              if (stockItemIndex !== -1) {
                const item = updatedItems[stockItemIndex];
                updatedItems[stockItemIndex] = {
                  ...item,
                  quantity: Math.max(0, item.quantity - totalAmount)
                };

                newMovements.push({
                  id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  itemId: item.id,
                  itemName: item.name,
                  type: 'sortie',
                  quantity: totalAmount,
                  date: new Date().toISOString(),
                  note: `Commande ${orderId}`
                });
              }
            });
          }
        });

        if (newMovements.length > 0) {
          set({
            items: updatedItems,
            movements: [...newMovements, ...state.movements]
          });
        }
      },
    }),
    { name: 'restauos-stocks' }
  )
);
