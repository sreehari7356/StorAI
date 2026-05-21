'use client';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Safe fallback credentials prevent the Next.js production worker from crashing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-12345';

const supabase = createClient(supabaseUrl, supabaseKey);

function BrandPanel() {
// ... Leave everything else in the file exactly the same!
  const features = [
    { label: 'Offline OCR', desc: 'Index textbook pages in your browser' },
    { label: 'Full-text search', desc: 'Find any scanned passage instantly' },
    { label: 'Private vault', desc: 'Your memories, securely stored' },
  ];

  return (
    <section className="login-bg-mesh relative flex min-h-[38vh] flex-col justify-between overflow-hidden p-8 sm:min-h-0 sm:flex-1 sm:p-12 lg:p-14">
      {/* Decorative shapes — soft rectangles, not lens icons */}
      <div
        className="login-blob-1 pointer-events-none absolute -right-16 top-1/4 h-48 w-72 rounded-[3rem] bg-white/25"
        aria-hidden
      />
      <div
        className="login-blob-2 pointer-events-none absolute -left-10 bottom-1/4 h-40 w-56 rounded-[2.5rem] bg-ink/[0.04]"
        aria-hidden
      />
      <div
        className="login-ring-pulse pointer-events-none absolute right-12 top-12 h-24 w-24 rounded-full border border-white/40"
        aria-hidden
      />

      <div className="relative z-10">
        <p className="login-reveal-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">
          Document intelligence
        </p>
        <h1 className="login-reveal-2 font-display mt-3 text-5xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-6xl">
          StorAI
        </h1>
        <div className="login-title-line mt-4 h-px w-16 bg-ink/30" />
        <p className="login-reveal-3 mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
          A quiet, premium space for the pages you need to remember — scanned, indexed, and ready when you are.
        </p>
      </div>

      <ul className="relative z-10 mt-10 hidden space-y-4 sm:block">
        {features.map((item, i) => (
          <li
            key={item.label}
            className={[
              'flex items-start gap-4 rounded-lg border border-white/30 bg-white/20 px-4 py-3 backdrop-blur-sm',
              i === 0 ? 'login-reveal-2' : i === 1 ? 'login-reveal-3' : 'login-reveal-4',
            ].join(' ')}
          >
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

      <p className="login-reveal-4 relative z-10 mt-8 text-xs tracking-wide text-ink-muted/80 sm:mt-0">
        © {new Date().getFullYear()} StorAI · Your knowledge, preserved
      </p>
    </section>
  );
}

function AuthForm({
  isSignUp,
  setIsSignUp,
  onSubmit,
  loading,
  errorMsg,
  successMsg,
  email,
  setEmail,
  password,
  setPassword,
  confirmed,
  setConfirmed,
}) {
  return (
    <div className="login-form-enter flex w-full flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-semibold text-ink">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {isSignUp
              ? 'Start building your personal document vault'
              : 'Enter your credentials to continue'}
          </p>
        </div>

        {/* Animated mode toggle */}
        <div className="mb-8 flex rounded-lg border border-border-subtle bg-surface-overlay p-1">
          {['Sign in', 'Sign up'].map((label) => {
            const signUpMode = label === 'Sign up';
            const active = isSignUp === signUpMode;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setIsSignUp(signUpMode);
                  setConfirmed(false);
                }}
                className={`relative flex-1 rounded-md py-2.5 text-sm font-medium transition-all duration-300 ${
                  active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-md bg-surface-raised shadow-sm transition-all duration-300"
                    aria-hidden
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>

        <div key={isSignUp ? 'signup' : 'signin'} className="login-mode-panel">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="group">
              <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="login-input-glow w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-sm text-ink transition-all duration-300 outline-none focus:border-premium-muted"
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="login-input-glow w-full rounded-lg border border-border bg-surface px-4 py-3.5 text-sm text-ink transition-all duration-300 outline-none focus:border-premium-muted"
              />
            </div>

            {errorMsg && (
              <p
                className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-xs text-danger login-mode-panel"
                role="alert"
              >
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p
                className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-xs text-success login-mode-panel"
                role="status"
              >
                {successMsg}
              </p>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-premium-light/50 px-4 py-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-premium/50"
              />
              <span className="text-xs leading-relaxed text-ink-muted">
                {isSignUp
                  ? 'I confirm that I want to create a StorAI vault account and store my documents securely.'
                  : 'I confirm that I am signing in to access my private StorAI memory vault.'}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !confirmed}
              className="login-btn-confirm group relative mt-2 w-full rounded-lg py-3.5 text-sm font-semibold tracking-wide shadow-md transition-all duration-300 enabled:hover:shadow-lg disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading && (
                  <span
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                    style={{ animation: 'login-spin-slow 0.8s linear infinite' }}
                  />
                )}
                {loading
                  ? 'Please wait…'
                  : isSignUp
                    ? 'Confirm & Create Account'
                    : 'Confirm & Sign In'}
              </span>
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-ink-muted">
          By continuing, you agree to keep your vault private and secure.
        </p>
      </div>
    </div>
  );
}

export default function VaultLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleModeChange = (signUp) => {
    setIsSignUp(signUp);
    setConfirmed(false);
    clearMessages();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('Account created successfully. You can sign in now.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        sessionStorage.setItem('storai-welcome', '1');
        window.location.href = '/';
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <BrandPanel />

      <section className="relative flex flex-1 flex-col bg-surface-raised lg:border-l lg:border-border-subtle">
        {/* Subtle top accent line */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-premium to-transparent lg:hidden" />

        <AuthForm
          isSignUp={isSignUp}
          setIsSignUp={handleModeChange}
          onSubmit={handleSubmit}
          loading={loading}
          errorMsg={errorMsg}
          successMsg={successMsg}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmed={confirmed}
          setConfirmed={setConfirmed}
        />
      </section>
    </main>
  );
}
