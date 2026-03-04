import { Handler } from '@netlify/functions';
import Razorpay from 'razorpay';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET ? new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
}) : null;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!razorpay) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Razorpay is not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' }),
    };
  }

  try {
    const { amount, currency = 'INR' } = JSON.parse(event.body || '{}');

    if (!amount) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Amount is required' }) };
    }

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return {
      statusCode: 200,
      body: JSON.stringify(order),
    };
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create Razorpay order', details: error.message }),
    };
  }
};
