import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logAction } from '@/lib/logger';
import { sendTelegramAlert } from '@/lib/telegram';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const resumeId = searchParams.get('resumeId');

    if (!userId || !resumeId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Check for active payment
    const { data: payment, error: pError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'success')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!payment || pError) {
      return NextResponse.json({ error: 'No active payment found for 24h access.' }, { status: 403 });
    }

    // 2. Log and Alert
    await logAction(userId, 'pdf_download');
    await sendTelegramAlert(`📄 <b>Resume Downloaded</b>\n\nUser ID: <code>${userId}</code>\nResume ID: <code>${resumeId}</code>`);

    // 3. Return PDF Generation Logic (Placeholder or redirect)
    return NextResponse.json({ message: 'Download authorized. Generating PDF...' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
