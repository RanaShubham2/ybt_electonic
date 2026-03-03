import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Truck, ShieldCheck, Headphones, CreditCard, Zap, Smartphone, Laptop, Watch, Speaker } from 'lucide-react';
import { motion } from 'motion/react';
import { getProducts } from '../lib/supabase';
import { cn } from '../lib/utils';

const optimizeImage = (url: string, width = 600, quality = 75) => {
  if (!url) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=600&q=75';
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  return url;
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      const result = await getProducts();
      if (result.success && result.data) {
        setFeaturedProducts(result.data.slice(0, 3));
      } else {
        // Fallback to static if Supabase is not ready
        setFeaturedProducts([
          { id: 1, title: 'MacBook Pro 16" M3 Max', price: 3499, category: 'Laptops', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
          { id: 2, title: 'iPhone 15 Pro Titanium', price: 999, category: 'Smartphones', image_url: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=800&q=80' },
          { id: 3, title: 'Sony WH-1000XM5', price: 398, category: 'Audio', image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' }
        ]);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  const categories = [
    { name: 'Laptops', icon: Laptop, count: '120+ Products', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Smartphones', icon: Smartphone, count: '80+ Products', color: 'bg-emerald-500/10 text-emerald-500' },
    { name: 'Wearables', icon: Watch, count: '45+ Products', color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Audio', icon: Speaker, count: '60+ Products', color: 'bg-orange-500/10 text-orange-500' },
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On all orders over $999' },
    { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure payment processing' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support team' },
    { icon: CreditCard, title: 'Easy Returns', desc: '30-day money back guarantee' },
  ];

  return (
    <div className="pt-20 md:pt-0">
      {/* Hero Section */}
      <section className="relative h-[80vh] md:h-screen flex items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="relative z-10 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold tracking-widest uppercase"
          >
            Spring Sale: Up to 40% Off
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 leading-tight"
          >
            Elevate Your <span className="text-emerald-500">Digital</span> Lifestyle.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 mb-12 max-w-3xl mx-auto font-medium"
          >
            Discover the latest in high-performance computing, mobile innovation, and immersive audio gear.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link to="/products" className="w-full md:w-auto bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/25">
              Shop Collection
            </Link>
            <Link to="/support" className="w-full md:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Get Support
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm">
                  <f.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{f.title}</h4>
                  <p className="text-xs text-zinc-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Bento */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
          <p className="text-zinc-500">Find exactly what you're looking for across our curated selections.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <Link 
              key={i} 
              to={`/products?category=${cat.name}`}
              className="group p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] hover:shadow-xl transition-all duration-300"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", cat.color)}>
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-1">{cat.name}</h3>
              <p className="text-sm text-zinc-500 mb-4">{cat.count}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 group-hover:gap-3 transition-all">
                Explore <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl font-bold mb-3">Trending Now</h2>
            <p className="text-zinc-500 text-lg">The most sought-after electronics of the season.</p>
          </div>
          <Link to="/products" className="hidden md:flex items-center gap-2 text-emerald-500 font-bold text-lg hover:underline">
            View all <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featuredProducts.map((prod) => (
            <motion.div 
              key={prod.id}
              whileHover={{ y: -12 }}
              className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={optimizeImage(prod.image_url || prod.img, 800, 75)} 
                  alt={prod.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold shadow-lg">
                  ${prod.price}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-500">{prod.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-bold">4.9</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-500 transition-colors">{prod.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 line-clamp-2 text-sm font-medium">Experience the pinnacle of technology with our latest {prod.category.toLowerCase()} release.</p>
                <Link to={`/products/${prod.id}`} className="w-full flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-800 py-3 rounded-xl font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto bg-zinc-900 dark:bg-emerald-600 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/20 to-transparent hidden md:block" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">The Future of Sound is Here.</h2>
            <p className="text-emerald-100/80 text-lg mb-10">Get the new Sony WH-1000XM5 with industry-leading noise cancellation and 30-hour battery life.</p>
            <Link to="/products/3" className="inline-flex items-center gap-3 bg-white text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
              Buy Now <Zap className="w-5 h-5 text-emerald-500" />
            </Link>
          </div>
          <div className="absolute bottom-0 right-0 w-1/3 h-full hidden lg:flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80" 
              alt="Sony Headphones" 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[3rem] p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Join the Tech Revolution</h2>
            <p className="text-zinc-500 mb-10">Subscribe to our newsletter and get 10% off your first purchase plus early access to new releases.</p>
            <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-6 py-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-colors">
                Subscribe
              </button>
            </form>
            <p className="text-[10px] text-zinc-400 mt-6 uppercase tracking-widest">No spam, just pure tech innovation.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
