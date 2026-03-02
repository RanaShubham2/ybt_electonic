import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, User, ChevronRight, Star, Plus, Database, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store';
import { cn } from '../lib/utils';
import { checkSupabaseConnection, testSupabaseRead } from '../lib/supabase';

const AdminDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    const result = await testSupabaseRead();
    if (result.success) {
      toast.success(result.message);
      setSupabaseConnected(true);
    } else {
      toast.error(result.message);
      setSupabaseConnected(false);
    }
    setIsTesting(false);
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [statsRes, productsRes, ordersRes, supaStatus] = await Promise.allSettled([
          fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/products'),
          fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
          checkSupabaseConnection()
        ]);

        const statsResult = statsRes.status === 'fulfilled' ? statsRes.value : null;
        const productsResult = productsRes.status === 'fulfilled' ? productsRes.value : null;
        const ordersResult = ordersRes.status === 'fulfilled' ? ordersRes.value : null;
        const supaStatusResult = supaStatus.status === 'fulfilled' ? supaStatus.value : false;

        setSupabaseConnected(supaStatusResult);

        if (statsResult && statsResult.ok) {
          setStats(await statsResult.json());
        } else {
          console.warn('Stats fetch failed');
        }

        if (productsResult && productsResult.ok) {
          setProducts(await productsResult.json());
        } else {
          console.warn('Products fetch failed');
        }

        if (ordersResult && ordersResult.ok) {
          setOrders(await ordersResult.json());
        } else {
          console.warn('Orders fetch failed');
        }

        if ((statsResult && !statsResult.ok) || (productsResult && !productsResult.ok) || (ordersResult && !ordersResult.ok)) {
            throw new Error('Some data failed to load');
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        toast.error('Failed to load some admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate, token]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold flex items-center gap-4">
            <LayoutDashboard className="w-10 h-10 text-emerald-500" /> Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className={cn("w-4 h-4", supabaseConnected ? "text-emerald-500" : "text-red-500")} />
              <span className={cn("text-xs font-bold uppercase tracking-widest", supabaseConnected ? "text-emerald-500" : "text-red-500")}>
                Supabase (Auth & Support): {supabaseConnected === null ? 'Checking...' : (supabaseConnected ? 'Connected' : 'Disconnected')}
              </span>
            </div>
            <button 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-emerald-500 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3 h-3", isTesting && "animate-spin")} /> Test Connection
            </button>
          </div>
        </div>
        <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {supabaseConnected === false && (
        <div className="mb-12 p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Supabase Connection Required</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-2xl">
                Your application is currently running in "Local Fallback" mode. To enable real-time features, OAuth, and cloud storage, you must connect your Supabase project.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <p className="text-[10px] uppercase font-black text-zinc-400 mb-2">Step 1</p>
                  <p className="text-sm font-bold mb-1">Create Project</p>
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <p className="text-[10px] uppercase font-black text-zinc-400 mb-2">Step 2</p>
                  <p className="text-sm font-bold mb-1">Get API Keys</p>
                  <p className="text-xs text-zinc-500">Settings &gt; API &gt; URL &amp; Anon Key</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <p className="text-[10px] uppercase font-black text-zinc-400 mb-2">Step 3</p>
                  <p className="text-sm font-bold mb-1">Set Env Vars</p>
                  <p className="text-xs text-zinc-500">Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</p>
                </div>
              </div>

              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <p className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Troubleshooting: Email Rate Limit
                </p>
                <p className="text-[10px] text-blue-500 leading-relaxed">
                  If you see "email rate limit exceeded", go to your Supabase Dashboard &gt; Authentication &gt; Rate Limits and increase the "Email Rate Limit" (default is 3 per hour).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">Loading dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-zinc-500 text-sm font-medium mb-1">Total Orders</p>
            <h3 className="text-3xl font-bold">{stats?.totalOrders || 0}</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="w-12 h-12 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-zinc-500 text-sm font-medium mb-1">Total Products</p>
            <h3 className="text-3xl font-bold">{stats?.totalProducts || 0}</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <User className="w-6 h-6" />
            </div>
            <p className="text-zinc-500 text-sm font-medium mb-1">Total Users</p>
            <h3 className="text-3xl font-bold">{stats?.totalUsers || 0}</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <p className="text-zinc-500 text-sm font-medium mb-1">Total Revenue</p>
            <h3 className="text-3xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
          <h3 className="text-2xl font-bold mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold">Order #{order.id}</p>
                  <p className="text-xs text-zinc-500">{order.user_email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${order.total_amount.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
          <h3 className="text-2xl font-bold mb-6">Product Inventory</h3>
          <div className="space-y-4">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={product.image_url} alt={product.title} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-sm truncate w-40">{product.title}</p>
                    <p className="text-xs text-zinc-500">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-500">${product.price}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{product.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
