import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTelegramAlert } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { type, record } = payload;

    if (type === 'INSERT' && payload.table === 'users') {
      const { id, email, full_name } = record;
      
      await sendTelegramAlert(`🚀 <b>New User Signed Up!</b>\n\nName: ${full_name}\nEmail: ${email}\nID: <code>${id}</code>`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
