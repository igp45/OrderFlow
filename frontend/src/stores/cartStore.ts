import { create } from 'zustand';
import type { CartItem, MenuItem } from '../types';

interface CartStore {
  items: CartItem[];
  notes: string;
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  notes: '',

  addItem: (menuItem) => {
    set((state) => {
      const existing = state.items.find(i => i.menuItem.id === menuItem.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.menuItem.id === menuItem.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { menuItem, quantity: 1 }] };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => ({
      items: state.items.filter(i => i.menuItem.id !== menuItemId),
    }));
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set((state) => ({
      items: state.items.map(i =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      ),
    }));
  },

  setNotes: (notes) => set({ notes }),

  clearCart: () => set({ items: [], notes: '' }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

  itemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
