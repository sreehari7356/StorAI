'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VaultLogin() {
  const [checking, setChecking] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // 🔑 Helper to instantly write cookies so proxy.js lets the user through
  const syncAuthCookie = (session) => {
    if (session) {
      const maxAge = session.expires_in || 3600;
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
    } else {
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('Session check timed out — showing login form');
      setChecking(false);
    }, 4000);

    // Initial check on page mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        if (session) {
          syncAuthCookie(session);
          window.location.replace('/');
        } else {
          setChecking(false);
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('Session check failed:', err);
        setChecking(false);
      });

    // Real-time authentication listener to catch fast log-ins
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        syncAuthCookie(session);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setErrorMsg('Please tick the confirmation checkbox first.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    const formattedEmail = email.trim().toLowerCase();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: formattedEmail, password });
        if (error) {
          setErrorMsg(error.message.includes('already registered')
            ? 'Account already exists. Click "Sign in" tab.'
            : error.message);
          return;
        }
        setSuccessMsg('✅ Account created! Now click "Sign in" and login.');
        setTimeout(() => {
          setIsSignUp(false);
          setSuccessMsg('');
          setPassword('');
        }, 2000);

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password,
        });
        
        if (error) {
          setErrorMsg(error.message.includes('Invalid login credentials')
            ? 'Wrong email or password.'
            : error.message);
          return;
        }
        
        if (data?.session) {
          syncAuthCookie(data.session); // 🛡️ Write token to cookie infrastructure before route migration
          sessionStorage.setItem('storai-welcome', '1');
          window.location.replace('/');
        } else {
          setErrorMsg('Sign in failed — no session returned.');
        }
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { label: 'Offline OCR', desc: 'Index textbook pages in your browser' },
    { label: 'Full-text search', desc: 'Find any scanned passage instantly' },
    { label: 'Private vault', desc: 'Your memories, securely stored' },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <section className="login-bg-mesh relative flex min-h-[38vh] flex-col justify-between overflow-hidden p-8 sm:min-h-0 sm:flex-1 sm:p-12 lg:p-14">
        <div className="pointer-events-none absolute -right-16 top-1/4 h-48 w-72 rounded-[3rem] bg-white/25" />
        <div className="pointer-events-none absolute -left-10 bottom-1/4 h-40 w-56 rounded-[2.5rem] bg-ink/[0.04]" />
        <div className="pointer-events-none absolute right-12 top-12 h-24 w-24 rounded-full border border-white/40" />
        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">Document intelligence</p>
          <h1 className="font-display mt-3 text-5xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-6xl">StorAI</h1>
          <div className="mt-4 h-px w-16 bg-ink/30" />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
            A quiet, premium space for the pages you need to remember — scanned, indexed, and ready when you are.
          </p>
        </div>
        <ul className="relative z-10 mt-10 hidden space-y-4 sm:block">
          {features.map((item, i) => (
            <li key={item.label} className="flex items-start gap-4 rounded-lg border border-white/30 bg-white/20 px-4 py-3 backdrop-blur-sm">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/10 text-[10px] font-bold text-ink">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="text-xs text-ink-muted">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="relative z-10 mt-8 text-xs tracking-wide text-ink-muted/80 sm:mt-0">
          © {new Date().getFullYear()} StorAI · Your knowledge, preserved
        </p>
      </section>

      <section className="relative flex flex-1 flex-col items-center justify-center bg-surface-raised px-6 py-10 lg:border-l lg:border-border-subtle sm:px-12 lg:px-16">
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-semibold text-black">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {isSignUp ? 'Start building your personal document vault' : 'Enter your credentials to continue'}
            </p>
          </div>

          <div className="mb-8 flex rounded-lg border border-border-subtle bg-surface-overlay p-1">
            {['Sign in', 'Sign up'].map((label) => {
              const signUpMode = label === 'Sign up';
              const active = isSignUp === signUpMode;
              return (
                <button key={label} type="button"
                  onClick={() => { setIsSignUp(signUpMode); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`relative flex-1 rounded-md py-2.5 text-sm font-medium transition-all duration-300 ${
                    active ? 'bg-white text-black shadow-sm' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Email address
              </label>
              <input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="relative z-50 w-full rounded-lg border border-border bg-white px-4 py-3.5 text-sm text-black outline-none transition-all duration-300 focus:border-premium-muted"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Password
              </label>
              <input id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required placeholder="••••••••"
                className="relative z-50 w-full rounded-lg border border-border bg-white px-4 py-3.5 text-sm text-black outline-none transition-all duration-300 focus:border-premium-muted"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600" role="alert">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-600" role="status">
                {successMsg}
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-premium-light/50 px-4 py-3">
              <input type="checkbox" checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-accent"
              />
              <span className="text-xs leading-relaxed text-ink-muted">
                I confirm access requests into my private vault room.
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-[#2d4a5f] py-3.5 text-sm font-semibold tracking-wide text-white shadow-md transition-all duration-300 hover:bg-[#3a5f78] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Please wait…' : isSignUp ? 'Confirm & Create Account' : 'Confirm & Sign In'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}