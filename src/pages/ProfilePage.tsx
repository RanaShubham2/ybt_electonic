import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, LogOut, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store';
import { cn } from '../lib/utils';

const ProfilePage = () => {
  const { user, logout, token, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          password: newPassword || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');

      updateUser(data.user);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.name || user.email.split('@')[0]}</h1>
              <p className="text-zinc-500">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full uppercase tracking-wider">
                {user.role} Account
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Full Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">New Password (Optional)</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Leave blank to keep current"
              />
            </div>
            <button 
              type="submit" 
              disabled={isUpdating}
              className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-emerald-500" /> Recent Orders
      </h2>

      {loading ? (
        <div className="text-center py-10">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 text-center">
          <Package className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
          <p className="text-zinc-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-emerald-500/30 transition-all">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Order #{order.id}</p>
                <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
                <p className="text-xs text-zinc-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                  order.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {order.status}
                </span>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
