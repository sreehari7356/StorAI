'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar({ memoryCount }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    
    const confirmLogout = window.confirm('Are you sure you want to sign out of your secure vault?');
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    try {
      // 1. Clear out session storage flags first
      sessionStorage.clear();
      localStorage.clear();

      // 2. Clear out the cookie instantly so proxy.js catches it immediately
      document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // 3. Terminate the Supabase cloud session globally
      await supabase.auth.signOut();

      // 4. Clean, singular redirect execution to prevent terminal loop collisions
      window.location.href = '/vault-login';
    } catch (error) {
      console.error('Sign out transaction failure:', error.message);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="border-b border-border-subtle bg-surface-raised/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-5 py-4 sm:px-8 flex items-center justify-between">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-semibold tracking-tight text-ink text-lg">
            StorAI <span className="text-xs font-mono font-normal text-ink-muted">v1.0</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-5">
          {memoryCount !== undefined && (
            <span className="hidden sm:inline-flex items-center rounded-full bg-premium-light px-2.5 py-0.5 text-xs font-medium text-ink-muted border border-premium-muted/30">
              {memoryCount} Indexed {memoryCount === 1 ? 'Asset' : 'Assets'}
            </span>
          )}
          
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="rounded-md border border-border bg-surface px-4 py-2 text-xs font-medium tracking-wide text-ink shadow-sm transition hover:bg-danger/10 hover:text-danger hover:border-danger/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? 'Locking Vault...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </nav>
  );
}