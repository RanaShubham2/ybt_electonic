import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore, useCartStore } from '../store';
import { createOrder } from '../lib/supabase';

const CartPage = () => {
  const { items, removeItem, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const total = items.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }

    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const { token } = useAuthStore.getState();

    if (!razorpayKeyId) {
      // Fallback to simulated checkout if Razorpay is not configured
      console.warn('Razorpay Key ID is missing. Falling back to simulated checkout.');
      try {
        const supaResult = await createOrder(String(user.id), total, items);
        if (supaResult.success) {
          toast.success('Order placed successfully!');
          clearCart();
          navigate('/profile');
          return;
        }
        throw new Error('Checkout failed');
      } catch (err: any) {
        toast.error(err.message || 'Checkout failed');
        return;
      }
    }

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: total })
      });

      if (!orderRes.ok) throw new Error('Failed to create payment order');
      const orderData = await orderRes.json();

      // 2. Initialize Razorpay
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "YBT Electronics",
        description: "Purchase from YBT Electronics",
        order_id: orderData.id,
        handler: async (response: any) => {
          // 3. Verify payment on server
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items,
                totalAmount: total
              })
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success('Payment successful and order placed!');
              clearCart();
              navigate('/profile');
            }
          } catch (err: any) {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#10b981", // emerald-500
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Checkout failed');
    }
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
          <p className="text-zinc-500 mb-8">Your cart is empty.</p>
          <Link to="/products" className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <img src={item.image_url} alt={item.title} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-emerald-500 font-bold">${item.price}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-8 rounded-[2rem] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-zinc-400 dark:text-zinc-500">Subtotal</span>
              <span className="text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-emerald-500/20"
            >
              Checkout Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
