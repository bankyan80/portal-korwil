import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = !!(supabaseUrl && serviceRoleKey && supabaseUrl !== 'https://placeholder.supabase.co');

export const supabaseAdmin = isConfigured
  ? createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false },
    })
  : null;

export function isSupabaseAdminConfigured(): boolean {
  return isConfigured;
}
