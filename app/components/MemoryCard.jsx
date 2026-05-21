'use client';
import React, { useState } from 'react';
import { TrashIcon } from './icons';
import {
  getMemoryDisplayTitle,
  getMeaningfulOcrPreview,
  parseVisionSummary,
} from '../../lib/ocrQuality';

export default function MemoryCard({ id, content, date, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const imageRegex = /\[🖼️ Local Attachment:\s*([^\]]+)\]/;
  const match = content.match(imageRegex);
  const attachmentUrl = match ? match[1].trim() : null;
  const isPdf = attachmentUrl?.toLowerCase().endsWith('.pdf');
  const imageUrl = attachmentUrl && !isPdf ? attachmentUrl : null;

  const displayTitle = getMemoryDisplayTitle(content);
  const vision = parseVisionSummary(content);
  const previewSnippet = getMeaningfulOcrPreview(content);

  const handleDelete = async () => {
    if (!confirm('Delete this memory? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/memories?id=${id}`, { method: 'DELETE' });
      if (res.ok && onDelete) onDelete();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="group rounded-lg border border-border-subtle bg-surface-raised p-5 shadow-sm transition hover:border-premium-muted hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <time className="text-xs tracking-wide text-ink-muted">{date || 'Recently added'}</time>
        <div className="flex items-center gap-2">
          {vision?.short && (
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
            className="rounded p-1.5 text-ink-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {isPdf && attachmentUrl ? (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-premium/40 text-accent transition hover:bg-premium/60"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
            <span className="mt-1 text-[9px] text-ink-muted">Open</span>
          </a>
        ) : imageUrl && !imgError ? (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border-subtle bg-premium-light">
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-premium-light/50">
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Doc</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium leading-snug text-ink break-words">
            {displayTitle}
          </h3>
          {vision?.short && (
            <p className="mt-2 text-xs leading-relaxed text-accent">
              {vision.short}
            </p>
          )}
          {previewSnippet && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
              {previewSnippet}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
