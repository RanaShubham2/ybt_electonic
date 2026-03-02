import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, User, ChevronRight, Star, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store';
import { cn } from '../lib/utils';

const AdminDashboard = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [statsRes, productsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/products'),
          fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!statsRes.ok || !productsRes.ok || !ordersRes.ok) throw new Error('Failed to fetch admin data');

        const [statsData, productsData, ordersData] = await Promise.all([
          statsRes.json(),
          productsRes.json(),
          ordersRes.json()
        ]);

        setStats(statsData);
        setProducts(productsData);
        setOrders(ordersData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        toast.error('Failed to load admin dashboard');
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
        <h1 className="text-4xl font-bold flex items-center gap-4">
          <LayoutDashboard className="w-10 h-10 text-emerald-500" /> Admin Dashboard
        </h1>
        <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

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
