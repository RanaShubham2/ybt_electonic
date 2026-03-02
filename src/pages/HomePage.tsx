import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';

const optimizeImage = (url: string, width = 600, quality = 75) => {
  if (!url) return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=600&q=75';
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
  return url;
};

const HomePage = () => {
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
          {[
            { id: 1, title: 'MacBook Pro 16" M3 Max', price: 3499, category: 'Laptops', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
            { id: 2, title: 'iPhone 15 Pro Titanium', price: 999, category: 'Smartphones', img: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&w=800&q=80' },
            { id: 3, title: 'Sony WH-1000XM5', price: 398, category: 'Audio', img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' }
          ].map((prod) => (
            <motion.div 
              key={prod.id}
              whileHover={{ y: -12 }}
              className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={optimizeImage(prod.img, 800, 75)} 
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
    </div>
  );
};

export default HomePage;
