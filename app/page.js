'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import MemoryCard from './components/MemoryCard';
import AddMemoryModal from './components/AddMemoryModal';
import { PlusIcon, XIcon } from './components/icons';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with strict direct fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofqlhpadesxgoqckoipx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yQEEd-DAV_Cj8yVCj_gfgg_2jdL8wua';
const supabase = createClient(supabaseUrl, supabaseKey);

function StatsBar({ total, filtered, isSearching }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border-subtle bg-surface-raised px-5 py-4 shadow-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">Total</p>
        <p className="mt-1 font-display text-3xl font-semibold text-ink">{total}</p>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-raised px-5 py-4 shadow-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">Showing</p>
        <p className="mt-1 font-display text-3xl font-semibold text-accent">
          {isSearching ? filtered : total}
        </p>
      </div>
      <div className="col-span-2 rounded-lg border border-premium-muted/50 bg-premium/30 px-5 py-4 sm:col-span-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">Index</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          OCR text, visual labels, PDFs
        </p>
      </div>
    </div>
  );
}

function MemoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-sm">
          <div className="skeleton mb-3 h-3 w-24 rounded" />
          <div className="flex gap-4">
            <div className="skeleton h-20 w-20 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [memories, setMemories] = useState([]);
  const [displayedMemories, setDisplayedMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState(null);

  // Auth form local states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (sessionStorage.getItem('storai-welcome') === '1') {
      sessionStorage.removeItem('storai-welcome');
      setJustSignedIn(true);
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (!showWelcome) return;
    const hideTimer = setTimeout(() => setWelcomeLeaving(true), 3200);
    const removeTimer = setTimeout(() => {
      setShowWelcome(false);
      setWelcomeLeaving(false);
    }, 3800);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [showWelcome]);

  // Fetch only the memories belonging to the authenticated user
  const fetchMemories = async (currentUserId) => {
    const activeUid = currentUserId || userId;
    
    if (!activeUid) {
      setMemories([]);
      setDisplayedMemories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', activeUid)
        .order('date', { ascending: false });

      if (error) throw error;

      setMemories(data || []);
      if (!searchQuery.trim()) {
        setDisplayedMemories(data || []);
      } else {
        const q = searchQuery.toLowerCase().trim();
        setDisplayedMemories(
          (data || []).filter((item) => item.content?.toLowerCase().includes(q))
        );
      }
    } catch (err) {
      console.error('Error loading memories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Track authentication session
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          fetchMemories(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Session query failed:', err);
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchMemories(session.user.id);
      } else {
        setUserId(null);
        setMemories([]);
        setDisplayedMemories([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Corrected Form submission handler with visual error handling
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const formattedEmail = email.trim();
    if (!formattedEmail || !password) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email: formattedEmail, 
          password 
        });
        if (error) throw error;
        alert('Sign up successful! Please check your email or attempt to sign in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: formattedEmail, 
          password 
        });
        
        if (error) {
          setAuthError(error.message);
          return;
        }

        if (data?.user) {
          sessionStorage.setItem('storai-welcome', '1');
          setUserId(data.user.id);
          setJustSignedIn(true);
          setShowWelcome(true);
          fetchMemories(data.user.id);
        }
      }
    } catch (err) {
      console.error('Authentication Layer Exception:', err);
      setAuthError(err.message || 'Authentication processing failed.');
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setDisplayedMemories(memories);
      return;
    }
    const queryStr = searchQuery.toLowerCase().trim();
    setDisplayedMemories(
      memories.filter((item) => item.content?.toLowerCase().includes(queryStr))
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDisplayedMemories(memories);
  };

  const handleSaveMemory = async (text) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('memories')
        .insert([{ content: text, user_id: userId, date: new Date().toISOString() }]);

      if (!error) fetchMemories(userId);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const recentWeekCount = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return memories.filter((m) => {
      if (!m.date) return false;
      const parsed = new Date(m.date);
      return !Number.isNaN(parsed.getTime()) && parsed >= weekAgo;
    }).length;
  }, [memories]);

  // 🛡️ IF NOT LOGGED IN, RENDER SIGN IN INTERFACE DIRECTLY
  if (!userId && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-premium-light via-surface to-surface px-6 py-12">
        <div className="w-full max-w-md rounded-xl border border-border-subtle bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">StorAI</h1>
            <p className="mt-2 text-sm text-ink-muted">Access your private document intelligence vault</p>
          </div>

          <div className="mb-6 flex border-b border-border-subtle">
            <button
              onClick={() => { setIsSignUp(false); setAuthError(''); }}
              className={`flex-1 pb-3 text-sm font-medium transition ${!isSignUp ? 'border-b-2 border-accent text-accent' : 'text-ink-muted hover:text-ink'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setAuthError(''); }}
              className={`flex-1 pb-3 text-sm font-medium transition ${isSignUp ? 'border-b-2 border-accent text-accent' : 'text-ink-muted hover:text-ink'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent text-black"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs font-medium text-red-600">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-accent py-3 text-sm font-medium text-white shadow transition hover:bg-accent-hover"
            >
              {isSignUp ? 'Create Account' : 'Confirm & Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pageClass = justSignedIn ? 'home-after-login' : '';

  return (
    <div className={`min-h-screen bg-gradient-to-b from-premium-light via-surface to-surface ${pageClass}`}>
      <div className={justSignedIn ? 'home-anim-nav' : ''}>
        <Navbar memoryCount={memories.length} />
      </div>

      <main className="mx-auto max-w-4xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        {showWelcome && (
          <div
            className={`home-anim-welcome mb-6 rounded-lg border border-premium-muted bg-premium/45 px-4 py-3 ${welcomeLeaving ? 'is-leaving' : ''}`}
            role="status"
          >
            <p className="text-sm font-medium text-ink">Welcome back — your vault is ready.</p>
          </div>
        )}

        <div className={`home-hero-glow mb-10 border-b border-border-subtle pb-8 ${justSignedIn ? 'home-anim-hero' : ''}`}>
          <p className="font-display text-xl font-medium leading-snug text-ink sm:text-2xl">
            StoreAI — scan your study materials and find any page or topic before exams.
          </p>
        </div>

        <div className={justSignedIn ? 'home-anim-stats' : ''}>
          <StatsBar
            total={memories.length}
            filtered={displayedMemories.length}
            isSearching={isSearching}
          />
        </div>

        <div className={`mb-10 flex flex-col gap-3 sm:flex-row sm:items-stretch ${justSignedIn ? 'home-anim-search' : ''}`}>
          <form onSubmit={handleSearch} className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search text, objects (e.g. dog), PDFs…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) setDisplayedMemories(memories);
                }}
                className="w-full rounded-md border border-border bg-surface-raised px-4 py-3.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-premium-muted focus:ring-2 focus:ring-premium/50 text-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted hover:text-ink"
                  aria-label="Clear"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-md border border-border bg-surface-raised px-6 py-3.5 text-sm font-medium tracking-wide text-ink shadow-sm transition hover:border-premium-muted hover:bg-premium/25"
            >
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 text-sm font-medium tracking-wide text-white shadow-sm transition hover:bg-accent-hover"
          >
            <PlusIcon />
            Add memory
          </button>
        </div>

        <div className={justSignedIn ? 'home-anim-content' : ''}>
          {!loading && memories.length > 0 && recentWeekCount > 0 && (
            <p className="mb-5 text-xs tracking-wide text-ink-muted">
              {recentWeekCount} added this week
            </p>
          )}

          {loading ? (
            <MemoryListSkeleton />
          ) : displayedMemories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-raised/80 px-8 py-16 text-center shadow-sm">
              <p className="font-display text-xl text-ink">
                {isSearching ? 'No matches' : 'No memories yet'}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {isSearching
                  ? 'Try another phrase from your saved pages.'
                  : 'Add a scanned page to build your vault.'}
              </p>
              {!isSearching && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  <PlusIcon />
                  Add your first memory
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedMemories.map((memory, index) => (
                <div
                  key={memory.id}
                  className={justSignedIn ? 'home-stagger-item' : ''}
                  style={
                    justSignedIn
                      ? { animationDelay: `${0.52 + index * 0.07}s` }
                      : undefined
                  }
                >
                  <MemoryCard
                    id={memory.id}
                    content={memory.content}
                    date={memory.date}
                    onDelete={() => fetchMemories(userId)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <AddMemoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMemory}
        />
      </main>
    </div>
  );
}