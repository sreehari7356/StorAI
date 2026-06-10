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

  const previewSnippet = getMeaningfulOcrPreview(content);

  // ── 🧼 ROBUST TEXT FILTER ENGINE ──
  const getCleanUserNotes = (rawContent) => {
    if (!rawContent) return '';
    return rawContent
      .replace(/\[OCR Text:[\s\S]*?\]/gi, '')         // Clean explicit OCR wrappers
      .replace(/\[Vision Summary:[^\]]+\]/gi, '')     // Clean MobileNet labels
      .replace(/\[AI Recognition:[^\]]+\]/gi, '')     // Clean secondary AI descriptors
      .replace(/\[🖼️ Local Attachment:[^\]]+\]/gi, '') // Clean asset URL identifiers
      .replace(/(https?:\/\/[^\s\]]+)/g, '')         // Clean raw address nodes
      .trim();
  };

  const userNotes = getCleanUserNotes(content);

  // 🕵️‍♂️ IDENTIFY RAW AUTOMATED DUMPS: 
  // If the notes match the raw snippet exactly or are longer than 120 characters without custom tags, flag it!
  const isAutomatedTextDump = 
    userNotes.length > 120 || 
    (previewSnippet && userNotes.toLowerCase().includes(previewSnippet.toLowerCase().slice(0, 20)));

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
    <article className="group rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-sm transition hover:border-premium-muted hover:shadow-md animate-fadeIn">
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

      <div className="flex gap-4 items-center">
        {/* 🖼️ RENDERS VISUAL ASSET PREVIEW */}
        {imageUrl && !imgError ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-premium-light">
            <img
              src={imageUrl}
              alt="Indexed asset snapshot"
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : isPdf ? (
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-premium/40 text-accent font-bold text-[10px]">
            <span>PDF</span>
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-blue-200 bg-blue-50 text-blue-500 font-bold font-mono text-xs">
            DOC
          </div>
        )}

        {/* 📝 CONDITIONAL VIEW MATRIX BLOCK */}
        <div className="min-w-0 flex-1">
          {userNotes && !isAutomatedTextDump ? (
            <h3 className="text-[15px] font-medium leading-snug text-ink break-words">
              {userNotes}
            </h3>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-gray-800">
                Visual Vault Asset Reference
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                <p className="text-xs text-emerald-600 font-medium">
                  Text Indexed & Searchable
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}