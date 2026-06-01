import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🛑 FAIL LOUDLY AT RUNTIME IF KEYS ARE MISSING
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.error(
    '❌ CRITICAL CONFIGURATION ERROR:\n' +
    'Supabase environment variables are missing. The application cannot connect to the database.\n' +
    'Please stop your terminal and ensure your local .env.local file contains valid credentials.'
  );
}

// 🏗️ Build-safe initialization: uses placeholders ONLY if the Next.js compiler is running an automated production build step
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key-for-build'
);