'use client';
import React, { useState } from 'react';
import { TrashIcon } from './icons';
import { supabase } from '@/lib/supabase';
import { getMeaningfulOcrPreview } from '../../lib/ocrQuality';

export default function MemoryCard({ id, content = '', date, userId, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── 🌐 URL EXTRACTOR ──
  const urlRegex = /(https?:\/\/[^\s\]]+)/g;
  const match = content.match(urlRegex);
  let imageUrl = match ? match[0].trim() : null;

  if (imageUrl && imageUrl.endsWith(']')) {
    imageUrl = imageUrl.slice(0, -1);
  }

  const isPdf = imageUrl?.toLowerCase().includes('.pdf');
  if (isPdf) imageUrl = null;

  // ── 🧼 CLEAN PARSER ──
  // Extracts ONLY the manual text description typed by the user, ignoring AI tags and image links
  const getCleanUserNotes = (rawContent) => {
    if (!rawContent) return '';
    return rawContent
      .replace(/\[Vision Summary:[^\]]+\]/gi, '') // Strip TensorFlow tags
      .replace(/\[AI Recognition:[^\]]+\]/gi, '') // Strip fallback AI tags
      .replace(/\[🖼️ Local Attachment:[^\]]+\]/gi, '') // Strip image URL syntax wrappers
      .replace(/(https?:\/\/[^\s\]]+)/g, '') // Strip raw URLs
      .trim();
  };

  const userNotes = getCleanUserNotes(content);
  const previewSnippet = getMeaningfulOcrPreview(content);

  // 🗑️ DIRECT CLIENT-SIDE DELETION
  const handleDelete = async () => {
    if (!confirm('Delete this memory? This cannot be undone.')) return;

    setDeleting(true);
    try {
      if (imageUrl && imageUrl.includes('/storage/v1/object/public/memories/')) {
        const filePath = imageUrl.split('/public/memories/')[1];
        if (filePath) {
          await supabase.storage.from('memories').remove([filePath]);
        }
      }

      const { error: dbError } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Direct deletion pipeline failed:', err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="group rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-sm transition hover:border-premium-muted hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <time className="text-xs tracking-wide text-ink-muted">
          {date 
            ? new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Recently added'
          }
        </time>
        
        <div className="flex items-center gap-2">
          {imageUrl && (
            <span className="rounded-sm bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
              Visual
            </span>
          )}
          {previewSnippet && (
            <span className="rounded-sm bg-premium/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
              Text
            </span>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="rounded p-1.5 text-ink-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger/10 hover:text-danger disabled:opacity-50 cursor-pointer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* 🖼️ RENDERS THE ACTUAL VISUAL RESULT IMAGE */}
        {imageUrl && !imgError ? (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-premium-light">
            <img
              src={imageUrl}
              alt="Indexed asset snapshot"
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : isPdf ? (
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-premium/40 text-accent font-bold text-[10px]">
            <span>PDF</span>
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-premium-light/50">
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Doc</span>
          </div>
        )}

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {/* 📝 DISPLAYS USER NOTES ONLY IF THEY TYPED SOMETHING */}
          {userNotes ? (
            <h3 className="text-[15px] font-medium leading-snug text-ink break-words">
              {userNotes}
            </h3>
          ) : (
            <span className="text-xs italic text-ink-muted">Visual Vault Asset Reference</span>
          )}
        </div>
      </div>
    </article>
  );
}