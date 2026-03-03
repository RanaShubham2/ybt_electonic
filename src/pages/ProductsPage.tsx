import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Heart, Star, ChevronRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useAuthStore, useCartStore, useWishlistStore } from '../store';
import { cn } from '../lib/utils';
import { getProducts } from '../lib/supabase';

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

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { items: wishlistItems, toggleItem } = useWishlistStore();

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProductsData = async () => {
      setLoading(true);
      try {
        const result = await getProducts();
        if (result.success) {
          setProducts(result.data || []);
        } else if (result.fallback) {
          // Fallback to API if Supabase is not configured
          const response = await fetch('/api/products');
          if (!response.ok) throw new Error('Failed to fetch products');
          const data = await response.json();
          setProducts(data || []);
        } else {
          throw new Error(result.error);
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        toast.error('Failed to load products: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProductsData();
  }, []);

  const handleToggleWishlist = async (productId: number) => {
    if (!user) {
      toast.error('Please login to use wishlist');
      return;
    }

    toggleItem(productId);
    const isWishlisted = wishlistItems.includes(productId);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = ['All', ...new Set(products.map(p => p.category))];

  if (loading) return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Skeleton className="h-12 w-full md:w-64 rounded-2xl" />
          <Skeleton className="h-12 w-full md:w-48 rounded-2xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-4">
            <Skeleton className="aspect-video mb-4 rounded-2xl" />
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">All Products</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === cat 
                    ? "bg-emerald-600 text-white" 
                    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800">
          <Search className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
          <p className="text-zinc-500 mb-8">No products found matching your criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
            <AnimatePresence mode="popLayout">
              {paginatedProducts.map((product, index) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -8 }}
                  transition={{ 
                    duration: 0.3,
                    delay: Math.min(index * 0.05, 0.5)
                  }}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/products/${product.id}`} className="block aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <ImageWithFallback 
                      src={optimizeImage(product.image_url, 600, 75)} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{product.category}</span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleWishlist(product.id);
                        }}
                        className={cn(
                          "p-1.5 rounded-full transition-colors",
                          wishlistItems.includes(product.id) 
                            ? "text-red-500 bg-red-50 dark:bg-red-500/10" 
                            : "text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", wishlistItems.includes(product.id) && "fill-current")} />
                      </button>
                    </div>
                    <h3 className="font-bold text-base mb-1 truncate group-hover:text-emerald-500 transition-colors">{product.title}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold">${product.price}</span>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => {
                          addItem(product);
                          toast.success('Added to cart');
                        }}
                        className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-10 h-10 rounded-xl font-bold transition-all",
                      currentPage === page 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
