import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useAuthStore, useCartStore, useWishlistStore } from '../store';
import { cn } from '../lib/utils';

const optimizeImage = (url: string, width = 600, quality = 75) => {
  if (!url) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=600&q=75';
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  return url;
};

const ImageWithFallback = ({ src, alt, className, loading = "lazy", ...props }: any) => {
  const [error, setError] = useState(false);
  const fallbackSrc = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=600&q=75';

  return (
    <img
      src={error ? fallbackSrc : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading={loading}
      {...props}
    />
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-lg", className)} />
);

const WishlistPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { items: wishlistIds, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchWishlistProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const allProducts = await response.json();
        const wishlistProducts = allProducts.filter((p: any) => wishlistIds.includes(p.id));
        setProducts(wishlistProducts);
      } catch (err) {
        console.error('Error fetching wishlist products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (wishlistIds.length > 0) {
      fetchWishlistProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user, wishlistIds, navigate]);

  const handleRemove = async (productId: number) => {
    toggleItem(productId);
    toast.success('Removed from wishlist');
  };

  if (loading) return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-4">
            <Skeleton className="aspect-video mb-4 rounded-2xl" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
        <p className="text-zinc-500">Items you've saved for later.</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800">
          <Heart className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
          <p className="text-zinc-500 mb-8">Your wishlist is empty.</p>
          <Link to="/products" className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="aspect-video relative overflow-hidden">
                <ImageWithFallback 
                  src={optimizeImage(product.image_url, 600, 75)} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-red-500 rounded-xl shadow-lg hover:scale-110 transition-transform"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-base mb-1 truncate">{product.title}</h3>
                <p className="text-emerald-500 font-bold mb-4">${product.price}</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      addItem(product);
                      toast.success('Added to cart');
                    }}
                    className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                  <button 
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
