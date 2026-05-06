import { supabaseAdmin } from './supabase';
import { headers } from 'next/headers';

export async function logAction(userId: string, actionType: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 1. Insert into Access Logs
    await supabaseAdmin.from('user_access_logs').insert({
      user_id: userId,
      action_type: actionType,
      ip_address: ip,
      user_agent: userAgent
    });

    // 2. Update Fast Lookup Table
    await supabaseAdmin.from('user_last_activity')
      .upsert({ 
        user_id: userId, 
        last_accessed_at: new Date().toISOString() 
      });
  } catch (error) {
    console.error('Logging failed:', error);
  }
}
