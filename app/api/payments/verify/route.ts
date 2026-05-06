import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logAction } from '@/lib/logger';
import { sendTelegramAlert } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      feature
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // 1. Update Payment Status in DB
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabaseAdmin.from('payments').insert({
        user_id: userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: 100, // Fixed for now
        status: 'success',
        feature_unlocked: feature || 'resume_24h',
        expires_at: expiresAt.toISOString()
      });

      // 2. Log Access
      await logAction(userId, 'payment_success');

      // 3. Telegram Alert
      await sendTelegramAlert(`💰 <b>New Payment Received!</b>\n\nUser ID: <code>${userId}</code>\nAmount: ₹100\nOrder: ${razorpay_order_id}`);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Payment Verification failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
