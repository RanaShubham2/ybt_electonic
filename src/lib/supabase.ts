import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl.startsWith('http') && 
                               supabaseAnonKey.length > 0 && 
                               !supabaseUrl.includes('placeholder') &&
                               !supabaseAnonKey.includes('placeholder');
const isProduction = import.meta.env.PROD;

if (!isSupabaseConfigured) {
  if (isProduction) {
    console.error('CRITICAL: Supabase is NOT configured in production! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Netlify environment variables.');
  } else {
    console.warn('Supabase is not fully configured. Authentication and Support Form will use local fallback.');
  }
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

export const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase connection check failed:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Supabase connection check error:', e.message);
    return false;
  }
};

export const testSupabaseRead = async () => {
  if (!isSupabaseConfigured) return { success: false, message: 'Supabase not configured' };
  try {
    // Try to fetch from any table, or just check auth again
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      // If table doesn't exist, that's fine, it means we connected but schema is different
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
          return { success: true, message: 'Connected! (Schema needs setup)' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected and verified!' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const submitSupportRequest = async (name: string, email: string, message: string) => {
  if (!isSupabaseConfigured) return { fallback: !isProduction };
  
  try {
    const { error } = await supabase
      .from('support_requests')
      .insert([{ name, email, message }]);
      
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Supabase support submission failed:', e.message);
    return { success: false, error: e.message };
  }
};

// --- Product Management ---
export const getProducts = async () => {
  if (!isSupabaseConfigured) return { fallback: !isProduction, data: [] };
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');
    
    if (error) {
      // If table not found, fall back to local in dev
      if (error.message.includes('not found') || error.code === 'PGRST116') {
        console.warn('Supabase products table not found, falling back to local data...');
        return { fallback: !isProduction, data: [] };
      }
      throw error;
    }
    return { success: true, data };
  } catch (e: any) {
    console.error('Supabase getProducts failed:', e.message);
    return { success: false, error: e.message, data: [], fallback: !isProduction };
  }
};

export const getProductById = async (id: string) => {
  if (!isSupabaseConfigured) return { fallback: !isProduction };
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.message.includes('not found') || error.code === 'PGRST116') {
        return { fallback: !isProduction };
      }
      throw error;
    }
    return { success: true, data };
  } catch (e: any) {
    console.error('Supabase getProductById failed:', e.message);
    return { success: false, error: e.message, fallback: !isProduction };
  }
};

// --- Order Management ---
export const createOrder = async (userId: string, totalAmount: number, items: any[]) => {
  if (!isSupabaseConfigured) return { fallback: !isProduction };
  try {
    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ user_id: userId, total_amount: totalAmount, status: 'pending' }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity || 1,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return { success: true, orderId: order.id };
  } catch (e: any) {
    console.error('Supabase createOrder failed:', e.message);
    return { success: false, error: e.message };
  }
};

// --- Admin Stats ---
export const getAdminStats = async () => {
  if (!isSupabaseConfigured) return { fallback: !isProduction };
  try {
    const [
      { count: totalOrders },
      { count: totalProducts },
      { data: ordersData }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount')
    ]);

    const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    return {
      success: true,
      data: {
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalUsers: 0, // Supabase doesn't allow counting users easily from client
        totalRevenue
      }
    };
  } catch (e: any) {
    console.error('Supabase getAdminStats failed:', e.message);
    return { success: false, error: e.message };
  }
};
