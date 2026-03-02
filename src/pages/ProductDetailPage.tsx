import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Heart } from 'lucide-react';
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

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { items: wishlistItems, toggleItem } = useWishlistStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
        setSelectedImage(data.image_url);
      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error('Product not found');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!user || !product) {
      toast.error('Please login to use wishlist');
      return;
    }

    toggleItem(product.id);
    const isWishlisted = wishlistItems.includes(product.id);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  if (loading) return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <Skeleton className="aspect-video rounded-3xl max-w-2xl mx-auto" />
          <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-14 flex-1 rounded-2xl" />
            <Skeleton className="h-14 flex-1 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Product not found.</p>
        <button onClick={() => navigate('/products')} className="text-emerald-500 font-bold">Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 mb-8 hover:text-emerald-500 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-video rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-lg max-w-2xl mx-auto">
            <ImageWithFallback 
              src={optimizeImage(selectedImage || product.image_url, 1200, 80)} 
              alt={product.title} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[0, 1, 2, 3].map(i => {
              const imageUrl = i === 0 
                ? product.image_url 
                : `${product.image_url}${product.image_url.includes('?') ? '&' : '?'}sig=${i}`;
              const isSelected = selectedImage === imageUrl;
              
              return (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(imageUrl)}
                  className={cn(
                    "aspect-square rounded-2xl overflow-hidden border transition-all",
                    isSelected 
                      ? "border-emerald-500 ring-2 ring-emerald-500/20" 
                      : "border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800"
                  )}
                >
                  <ImageWithFallback 
                    src={optimizeImage(imageUrl, 400, 60)} 
                    alt={`${product.title} view ${i}`} 
                    className={cn(
                      "w-full h-full object-cover transition-opacity",
                      isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                    )} 
                    referrerPolicy="no-referrer" 
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-emerald-500 font-bold uppercase tracking-widest mb-2">{product.category}</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{product.title}</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            {product.description}
          </p>
          
          <div className="flex items-center gap-6 mb-10">
            <div className="text-4xl font-bold">${product.price}</div>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <Star className="w-5 h-5 fill-current" />
              <span className="text-zinc-500 ml-2">(120+ reviews)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                addItem(product);
                toast.success('Added to cart');
              }}
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20"
            >
              Add to Cart
            </motion.button>
            <button 
              onClick={handleToggleWishlist}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                wishlistItems.includes(product.id)
                  ? "bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/30"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-transparent"
              )}
            >
              <Heart className={cn("w-5 h-5", wishlistItems.includes(product.id) && "fill-current")} />
              {wishlistItems.includes(product.id) ? 'Saved' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
