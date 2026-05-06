import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for frontend (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend (uses service role key - DO NOT USE ON FRONTEND)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
