'use client';
import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons';
import { isPdfFile, isImageFile, extractTextFromFile } from '../../lib/fileText';
import { recognizeImageFromFile } from '../../lib/imageRecognition';
import { sanitizeOcrForStorage } from '../../lib/ocrQuality';

const ACCEPTED = 'image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,.pdf';

export default function AddMemoryModal({ isOpen, onClose, onSave }) {
  const [noteText, setNoteText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setPreview({ type: 'image', url });
      return () => URL.revokeObjectURL(url);
    }
    setPreview({ type: 'pdf', name: file.name });
  }, [file]);

  if (!isOpen) return null;

  const handleFile = (selected) => {
    if (!selected) return;
    const ok =
      isImageFile(selected) ||
      isPdfFile(selected) ||
      selected.name.toLowerCase().endsWith('.pdf');
    if (!ok) {
      alert('Please choose an image (PNG, JPG) or PDF file.');
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setStatusMessage('Uploading file…');

    try {
      let textInput = noteText.trim();
      let finalPayload = textInput;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!uploadRes.ok) throw new Error('Upload failed.');
        const uploadData = await uploadRes.json();

        let scannedText = '';
        try {
          scannedText = await extractTextFromFile(file, setStatusMessage);
        } catch (ocrErr) {
          console.error('OCR failed:', ocrErr);
        }

        if (!scannedText && uploadData.extractedText) {
          scannedText = uploadData.extractedText;
        }
        scannedText = sanitizeOcrForStorage(scannedText);

        let vision = null;
        if (isImageFile(file) || isPdfFile(file)) {
          try {
            vision = await recognizeImageFromFile(file, setStatusMessage);
          } catch (visionErr) {
            console.error('Vision recognition failed:', visionErr);
          }
        }

        const fileNameTags = file.name.toLowerCase().replace(/[-_.]/g, ' ');
        const typeLabel = isPdfFile(file) ? 'PDF Document' : 'Image Attachment';

        finalPayload = textInput ? `${textInput}\n\n` : '';
        finalPayload += `[🖼️ Local Attachment: ${uploadData.fileUrl}]`;
        finalPayload += `\n📎 [File Type]: ${typeLabel}`;

        if (scannedText) {
          finalPayload += `\n\n🔍 [Scanned Text Content]:\n${scannedText}`;
        }

        if (vision?.summary) {
          finalPayload += `\n\n🎯 [Image Recognition]:\n${vision.summary}`;
        } else if (isImageFile(file)) {
          finalPayload += `\n\n🎯 [Image Recognition]: (No objects detected)`;
        }

        const visionTags = vision?.searchTerms ? ` ${vision.searchTerms}` : '';
        finalPayload += `\n\n🏷️ [Search Tags]: ${fileNameTags} ${file.name} pdf document scan${visionTags}`;
      }

      await onSave(finalPayload);
      setNoteText('');
      setFile(null);
      onClose();
    } catch (err) {
      alert(`Could not save: ${err.message}`);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-memory-title"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-lg border border-border bg-surface-raised shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle bg-premium/20 px-6 py-4">
          <div>
            <h2 id="add-memory-title" className="font-display text-xl font-semibold text-ink">
              New memory
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">OCR text + visual recognition (e.g. dog, car)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-ink-muted hover:bg-premium/40 hover:text-ink"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label htmlFor="memory-note" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Notes <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="memory-note"
              placeholder="Chapter, subject, or reminder…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-premium-muted focus:ring-2 focus:ring-premium/40"
            />
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-md border-2 border-dashed px-6 py-8 text-center transition ${
              dragOver
                ? 'border-premium-muted bg-premium/40'
                : 'border-border bg-premium-light/40 hover:border-premium-muted hover:bg-premium/25'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept={ACCEPTED}
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
            {preview?.type === 'image' ? (
              <div className="flex flex-col items-center gap-3">
                <img src={preview.url} alt="" className="max-h-36 rounded-md border border-border-subtle object-contain" />
                <p className="text-xs text-ink-muted">{file?.name}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Choose different file
                </button>
              </div>
            ) : preview?.type === 'pdf' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-20 items-center justify-center rounded-md border border-border bg-premium/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">PDF</span>
                </div>
                <p className="text-xs text-ink-muted">{preview.name}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">Drop a screenshot, PDF, or click to browse</p>
                <p className="mt-1 text-xs text-ink-muted">PNG, JPG, PDF — OCR + object recognition in browser</p>
              </>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 rounded-md bg-premium/50 px-3 py-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="text-xs font-medium text-ink-muted">{statusMessage}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-border-subtle px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 rounded-md border border-border py-2.5 text-sm font-medium text-ink-muted transition hover:bg-premium-light disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading || (!noteText.trim() && !file)}
            className="flex-1 rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUploading ? 'Processing…' : 'Save memory'}
          </button>
        </div>
      </form>
    </div>
  );
}
