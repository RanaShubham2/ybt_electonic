import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!RAZORPAY_KEY_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Razorpay secret is missing' }) };
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      items,
      totalAmount,
      userId
    } = JSON.parse(event.body || '{}');

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is verified
      
      if (supabase) {
        // 1. Create the order in Supabase
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{ 
            user_id: userId, 
            total_amount: totalAmount, 
            transaction_id: razorpay_payment_id,
            status: 'completed' 
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Create order items
        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity || 1,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, orderId: order.id }),
        };
      } else {
        // If no Supabase, we just return success (simulated)
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Payment verified (No Supabase configured)' }),
        };
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid payment signature' }),
      };
    }
  } catch (error: any) {
    console.error('Razorpay Verification Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Verification failed', details: error.message }),
    };
  }
};
