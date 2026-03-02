import React, { useEffect, lazy, Suspense, memo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate
} from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  ShoppingCart, 
  User, 
  Moon, 
  Sun,
  LogOut,
  LayoutDashboard,
  Heart
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useCartStore, useThemeStore } from './store';
import { cn } from './lib/utils';

// --- Lazy Pages ---
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));

// --- Components ---

const Navbar = memo(() => {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 hidden md:flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm"
    )}>
      <Link to="/" className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white">
        YBT<span className="text-emerald-500">Electronics</span>
      </Link>
      
      <div className="flex items-center gap-8">
        <Link to="/" className="text-sm font-medium hover:text-emerald-500 transition-colors">Home</Link>
        <Link to="/products" className="text-sm font-medium hover:text-emerald-500 transition-colors">Shop</Link>
        <Link to="/wishlist" className="text-sm font-medium hover:text-emerald-500 transition-colors">Wishlist</Link>
        <Link to="/support" className="text-sm font-medium hover:text-emerald-500 transition-colors">Support</Link>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <Link to="/cart" className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <ShoppingCart className="w-5 h-5" />
          {items.length > 0 && (
            <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {items.length}
            </span>
          )}
        </Link>
        
        {user ? (
          <div className="flex items-center gap-4">
            {user.role === 'admin' && (
              <Link to="/admin" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <LayoutDashboard className="w-5 h-5" />
              </Link>
            )}
            <Link to="/profile" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <button onClick={logout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
});

const BottomNav = memo(() => {
  const location = useLocation();
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Products', path: '/products' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: items.length },
    { icon: User, label: 'Profile', path: user ? '/profile' : '/login' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 md:hidden flex items-center justify-around py-3 px-2">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link 
            key={tab.path} 
            to={tab.path} 
            className={cn(
              "flex flex-col items-center gap-1 relative",
              isActive ? "text-emerald-500" : "text-zinc-400"
            )}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {tab.badge ? (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {tab.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
      <button 
        onClick={toggleTheme}
        className="flex flex-col items-center gap-1 text-zinc-400"
      >
        {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        <span className="text-[10px] font-medium">Theme</span>
      </button>
    </div>
  );
});

const GlobalLoading = () => (
  <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-zinc-500 font-medium animate-pulse">Loading experience...</p>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30">
        <Toaster position="top-center" />
        <Navbar />
        <main>
          <Suspense fallback={<GlobalLoading />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}
