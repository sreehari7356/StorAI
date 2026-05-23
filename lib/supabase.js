import { createClient } from '@supabase/supabase-js';

// Safely fetch variables or assign clean string fallbacks to prevent server crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofqlhpadesxgoqckoipx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcWxocGFkZXN4Z29xY2tvaXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzY5OTEsImV4cCI6MjA5NDQxMjk5MX0.3vBAyjpzi3zWKF54BD0ssEtxTev1XxzY1-uNtEMQeGY';

// Create client without throwing fatal URL validation format errors
export const supabase = createClient(supabaseUrl, supabaseAnonKey);