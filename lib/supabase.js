import { createClient } from '@supabase/supabase-js';

// Safely fetch variables or assign clean string fallbacks to prevent server crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofqlhpadesxgoqckoipx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yQEEd-DAV_Cj8yVCj_gfgg_2jdL8wua';

// Create client without throwing fatal URL validation format errors
export const supabase = createClient(supabaseUrl, supabaseAnonKey);