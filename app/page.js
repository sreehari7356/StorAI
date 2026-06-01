'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import MemoryCard from './components/MemoryCard';
import AddMemoryModal from './components/AddMemoryModal';
import { PlusIcon, XIcon } from './components/icons';
import { supabase } from '@/lib/supabase';

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
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">OCR text, visual labels, PDFs</p>
      </div>
    </div>
  );
}

function MemoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-sm animate-pulse">
          <div className="mb-3 h-3 w-24 rounded bg-border-subtle/60" />
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 rounded-md bg-border-subtle/60" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-full rounded bg-border-subtle/60" />
              <div className="h-3 w-2/3 rounded bg-border-subtle/60" />
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
  const [saveError, setSaveError] = useState('');
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState(null);
  const userIdRef = React.useRef(null);

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

  const fetchMemories = async (currentUserId) => {
    const activeUid = currentUserId || userIdRef.current;
    if (!activeUid) {
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
      setDisplayedMemories(data || []);
    } catch (err) {
      console.error('Error loading memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        userIdRef.current = session.user.id;
        setUserId(session.user.id);
        fetchMemories(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Initial mount session check crash:', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        userIdRef.current = null;
        setUserId(null);
        setMemories([]);
        setDisplayedMemories([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setDisplayedMemories(memories);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    setDisplayedMemories(
      memories.filter((item) => item.content?.toLowerCase().includes(q))
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDisplayedMemories(memories);
  };

  const handleSaveMemory = async (text, attachedFile = null, aiTags = '') => {
    const activeUid = userIdRef.current;
    if (!activeUid) return;
    setSaveError('');
    
    try {
      let finalContent = text ? text.trim() : '';

      if (aiTags && aiTags.trim()) {
        finalContent = finalContent 
          ? `${finalContent}\n\n[Vision Summary: ${aiTags.trim()}]` 
          : `[Vision Summary: ${aiTags.trim()}]`;
      }

      if (!finalContent) {
        finalContent = 'Saved Document Reference';
      }

      if (attachedFile) {
        const fileExt = attachedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${activeUid}/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from('memories')
          .upload(filePath, attachedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
          .storage
          .from('memories')
          .getPublicUrl(filePath);

        finalContent = `${finalContent}\n\n[🖼️ Local Attachment: ${publicUrl}]`;
      }

      const { error: dbError } = await supabase
        .from('memories')
        .insert([{ content: finalContent, user_id: activeUid, date: new Date().toISOString() }]);

      if (dbError) throw dbError;
      
      setIsModalOpen(false);
      fetchMemories(activeUid);
    } catch (err) {
      console.error('Save pipeline exception:', err);
      setSaveError(err.message || 'Could not commit asset records into your vault.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-premium-light via-surface to-surface">
        <Navbar memoryCount={0} />
        <main className="mx-auto max-w-4xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
          <div className="mb-10 border-b border-border-subtle pb-8">
            <p className="font-display text-xl font-medium leading-snug text-ink sm:text-2xl">
              StorAI — secure workspace initializing...
            </p>
          </div>
          <MemoryListSkeleton />
        </main>
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
        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
            {saveError}
          </div>
        )}

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
            StorAI — scan your study materials and find any page or topic before exams.
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
                className="w-full rounded-md border border-border bg-surface-raised px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-muted text-black focus:border-premium-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted hover:text-ink"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-md border border-border bg-surface-raised px-6 py-3.5 text-sm font-medium tracking-wide text-ink shadow-sm hover:bg-premium/25"
            >
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setSaveError(''); setIsModalOpen(true); }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-6 py-3.5 text-sm font-medium tracking-wide text-white shadow-sm hover:bg-accent-hover"
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

          {displayedMemories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-raised/80 px-8 py-16 text-center shadow-sm">
              <p className="font-display text-xl text-ink">
                {isSearching ? 'No matches' : 'No memories yet'}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {isSearching ? 'Try another phrase.' : 'Add a scanned page to build your vault.'}
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
                  style={justSignedIn ? { animationDelay: `${0.52 + index * 0.07}s` } : undefined}
                >
                  {/* ✅ DOUBLE CHECKED AND VERIFIED RENDERING PROPS */}
                  <MemoryCard
                    id={memory.id}
                    content={memory.content}
                    date={memory.date}
                    userId={userId} 
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