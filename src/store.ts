import { create } from 'zustand';

interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    return { theme: newTheme };
  }),
}));

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  setUser: (user, token) => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    set({ user, token });
  },
  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

interface CartItem {
  id: number;
  title: string;
  price: number;
  image_url: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  addItem: (item) => set((state) => {
    const newItems = [...state.items, item];
    localStorage.setItem('cart', JSON.stringify(newItems));
    return { items: newItems };
  }),
  removeItem: (id) => set((state) => {
    const newItems = state.items.filter((i) => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(newItems));
    return { items: newItems };
  }),
  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },
}));

interface WishlistState {
  items: number[]; // Array of product IDs
  setItems: (items: number[]) => void;
  toggleItem: (productId: number) => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  toggleItem: (productId) => set((state) => {
    const isWishlisted = state.items.includes(productId);
    const newItems = isWishlisted 
      ? state.items.filter(id => id !== productId)
      : [...state.items, productId];
    return { items: newItems };
  }),
}));
