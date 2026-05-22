'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-12345';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Navbar({ memoryCount }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // 1. Tell Supabase to destroy the session cookie completely
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Clear any lingering local tracking items
      sessionStorage.clear();
      localStorage.clear();

      // 3. Kick the user back to the login screen instantly
      router.push('/vault-login');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  return (
    <nav className="border-b border-border-subtle bg-surface-raised/80 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-4xl px-5 py-4 sm:px-8 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <span className="font-display font-bold tracking-wider text-ink text-lg">StoreAI</span>
          <span className="rounded bg-premium/30 px-2 py-0.5 text-[10px] font-medium tracking-wide text-ink-muted">
            Vault
          </span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-5">
          {memoryCount > 0 && (
            <span className="hidden sm:inline text-xs font-medium text-ink-muted">
              {memoryCount} {memoryCount === 1 ? 'memory' : 'memories'} secured
            </span>
          )}
          
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-ink transition hover:border-premium-muted hover:bg-premium/25"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}