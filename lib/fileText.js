export function isPdfFile(file) {
  if (!file) return false;
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isImageFile(file) {
  if (!file) return false;
  return file.type.startsWith('image/');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export async function ensureOcrLibraries() {
  if (!window.Tesseract) {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
  }
  if (!window.pdfjsLib) {
    await loadScript(
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js'
    );
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
  }
}

export async function extractTextFromFile(file, onProgress) {
  await ensureOcrLibraries();

  if (isPdfFile(file)) {
    return extractTextFromPdf(file, onProgress);
  }
  if (isImageFile(file)) {
    return extractTextFromImage(file);
  }
  return '';
}

async function extractTextFromImage(file) {
  const worker = await window.Tesseract.createWorker('eng');
  try {
    const result = await worker.recognize(file);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}

async function extractTextFromPdf(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = Math.min(pdf.numPages, 5);
  const worker = await window.Tesseract.createWorker('eng');
  let combined = '';

  try {
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      onProgress?.(`Reading PDF page ${pageNum} of ${maxPages}…`);
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const result = await worker.recognize(canvas);
      combined += `${result.data.text.trim()}\n\n`;
    }
  } finally {
    await worker.terminate();
  }

  return combined.trim();
}
