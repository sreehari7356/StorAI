'use client';
import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons';

export default function AddMemoryModal({ isOpen, onClose, onSave }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const fileInputRef = useRef(null);
  const hiddenImgRef = useRef(null);

  // 🧠 Load TensorFlow.js and MobileNet
  useEffect(() => {
    if (!isOpen) return;

    const loadMlModels = async () => {
      if (window.mobilenetInstance || window.mobilenet) {
        setModel(window.mobilenetInstance || window.mobilenet);
        return;
      }
      
      setModelLoading(true);
      try {
        const tfscript = document.createElement('script');
        tfscript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js";
        document.head.appendChild(tfscript);

        tfscript.onload = () => {
          const nscript = document.createElement('script');
          nscript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js";
          document.head.appendChild(nscript);
          
          nscript.onload = async () => {
            const loadedModel = await window.mobilenet.load();
            window.mobilenetInstance = loadedModel;
            setModel(loadedModel);
            setModelLoading(false);
          };
        };
      } catch (err) {
        console.error("TensorFlow initialization error:", err);
        setModelLoading(false);
      }
    };

    loadMlModels();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 🛑 SAFETY GATE: Prevent uploading if file is selected but model isn't ready
    if (file && !model && !window.mobilenetInstance) {
      alert("Please wait a moment for the AI Engine to finish initializing before committing.");
      return;
    }
    if (!text.trim() && !file) return;

    setIsSaving(true);
    let detectedLabels = '';

    try {
      if (file && file.type.startsWith('image/') && hiddenImgRef.current) {
        const activeModel = model || window.mobilenetInstance;
        if (activeModel) {
          try {
            const predictions = await activeModel.classify(hiddenImgRef.current);
            detectedLabels = predictions
              .map(p => p.className.toLowerCase())
              .join(', ');
            console.log("🧠 TensorFlow Tags Found:", detectedLabels);
          } catch (modelErr) {
            console.error("TensorFlow classification failed:", modelErr);
          }
        }
      }

      await onSave(text, file, detectedLabels);
      setText('');
      setFile(null);
      setImagePreview('');
      onClose();
    } catch (err) {
      console.error('Failed to submit modal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xl">
        
        {imagePreview && (
          <img 
            ref={hiddenImgRef}
            src={imagePreview} 
            alt="hidden processor" 
            className="hidden" 
            crossOrigin="anonymous"
          />
        )}

        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-ink">Index New Document Reference</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-ink-muted hover:bg-premium-light hover:text-ink transition">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modal-content" className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              Document Text / Notes Description
            </label>
            <textarea
              id="modal-content"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter descriptive metadata notes..."
              className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-black outline-none"
              required={!file}
            />
          </div>

          <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-ink-muted">
                Upload Image Asset Reference
              </label>
              {modelLoading && (
                <span className="text-[10px] animate-pulse text-accent font-medium font-mono">
                  Loading AI Engine...
                </span>
              )}
              {!modelLoading && model && (
                <span className="text-[10px] text-emerald-600 font-medium font-mono">
                  ● AI Ready
                </span>
              )}
            </div>
            
            <div className="mt-1 flex flex-col items-start gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full text-xs text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-premium-light file:text-ink file:cursor-pointer"
              />
              {file && (
                <div className="w-full flex items-center justify-between mt-2 rounded bg-accent/10 px-3 py-1.5 text-xs text-accent font-medium">
                  <span className="truncate">📎 Attached: {file.name}</span>
                  <button type="button" onClick={handleRemoveFile} className="text-ink-muted hover:text-danger font-bold text-sm">×</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-border bg-white px-4 py-2.5 text-xs font-medium text-ink">
              Cancel
            </button>
            <button
              type="submit"
              // 🛑 DISABLED UNTIL AI IS FULLY READY FOR SCANNING
              disabled={isSaving || modelLoading || (!text.trim() && !file)}
              className="rounded-md bg-[#2d4a5f] px-5 py-2.5 text-xs font-medium tracking-wide text-white shadow hover:bg-[#3a5f78] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Running AI Scan...' : 'Commit to Storage Vault'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}