import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/ai';
import { logAction } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { prompt, userId, actionType } = await req.json();

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Missing prompt or userId' }, { status: 400 });
    }

    // Generate content using the rotation utility
    const result = await generateContent(prompt);

    // Log the action for audit/DPDP
    await logAction(userId, actionType || 'ai_generate');

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('AI Generation API failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
