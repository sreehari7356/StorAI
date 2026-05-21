'use client';
import React from 'react';
import { supabase } from '../../lib/supabase';

export default function Navbar({ memoryCount = 0 }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/vault-login';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-raised/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
        <div>
          <p className="font-display text-xl font-semibold tracking-wide text-ink">StorAI</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Memory vault</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-ink-muted sm:inline">
            {memoryCount} {memoryCount === 1 ? 'entry' : 'entries'}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-border bg-premium-light/60 px-4 py-2 text-xs font-medium tracking-wide text-ink transition hover:border-premium-muted hover:bg-premium/40"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
