import { isImageFile, isPdfFile, ensureOcrLibraries } from './fileText';

let modelPromise = null;

async function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const mobilenet = await import('@tensorflow-models/mobilenet');
      return mobilenet.load({ version: 2, alpha: 0.5 });
    })();
  }
  return modelPromise;
}

function fileToImageElement(file) {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for recognition'));
    };
    img.src = url;
  });
}

async function pdfFirstPageToCanvas(file) {
  await ensureOcrLibraries();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Classify image content (e.g. dog, car) without needing text in the image.
 * Uses MobileNet in the browser — first run downloads ~5MB model.
 */
export async function recognizeImageFromFile(file, onProgress) {
  if (!file || (!isImageFile(file) && !isPdfFile(file))) {
    return null;
  }

  try {
    onProgress?.('Loading vision model (first time may take a moment)…');
    const model = await loadModel();

    onProgress?.('Recognizing objects in image…');
    let source;
    if (isImageFile(file)) {
      source = await fileToImageElement(file);
    } else {
      onProgress?.('Analyzing first PDF page visually…');
      source = await pdfFirstPageToCanvas(file);
    }

    const predictions = await model.classify(source, 5);
    if (!predictions?.length) return null;

    const lines = predictions.map(
      (p) => `${p.className} (${Math.round(p.probability * 100)}%)`
    );
    const searchTerms = predictions
      .map((p) => p.className.replace(/,/g, ' ').toLowerCase())
      .join(' ');

    return {
      summary: lines.join(', '),
      topLabel: predictions[0].className,
      searchTerms,
    };
  } catch (err) {
    console.error('Image recognition failed:', err);
    return null;
  }
}

export function parseImageRecognition(content) {
  const match = content.match(/🎯 \[Image Recognition\]:\s*([\s\S]*?)(?:\n\n🏷️|$)/);
  if (!match) return null;
  const text = match[1].trim();
  if (!text || text.startsWith('(No objects')) return null;
  return text;
}
