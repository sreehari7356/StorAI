/**
 * Detects low-quality OCR noise (symbols, fragments) so we don't save or show it.
 */
export function isMeaningfulOcr(text) {
  if (!text || typeof text !== 'string') return false;

  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 10) return false;

  if (
    cleaned.startsWith('(No printed') ||
    cleaned.startsWith('(No readable') ||
    cleaned.startsWith('Keywords:')
  ) {
    return false;
  }

  const words = cleaned.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (words.length < 3) return false;

  const letters = (cleaned.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letters / cleaned.length;
  if (letterRatio < 0.4) return false;

  const symbolRatio =
    (cleaned.match(/[^a-zA-Z0-9\s.,'":;!?()-]/g) || []).length / cleaned.length;
  if (symbolRatio > 0.22) return false;

  const singleCharTokens = cleaned.split(/\s+/).filter((t) => t.length === 1).length;
  if (singleCharTokens / cleaned.split(/\s+/).length > 0.35) return false;

  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgWordLen < 3.2) return false;

  return true;
}

export function sanitizeOcrForStorage(text) {
  if (!text) return '';
  return isMeaningfulOcr(text) ? text.trim() : '';
}

export function parseVisionSummary(content) {
  const match = content.match(/🎯 \[Image Recognition\]:\s*([\s\S]*?)(?:\n\n🏷️|$)/);
  if (!match) return null;
  const raw = match[1].trim();
  if (!raw || raw.startsWith('(No objects')) return null;

  const labels = raw
    .split(',')
    .map((part) => part.replace(/\s*\(\d+%\)\s*$/, '').trim())
    .filter(Boolean);

  return {
    raw,
    primary: labels[0] || null,
    short: labels.slice(0, 3).join(', '),
  };
}

export function getMemoryDisplayTitle(content) {
  const userNote = content.split('[🖼️')[0].trim();
  if (userNote) return userNote;

  const vision = parseVisionSummary(content);
  if (vision?.primary) {
    const title = vision.primary.charAt(0).toUpperCase() + vision.primary.slice(1);
    return title;
  }

  const ocrMatch = content.match(
    /🔍 \[Scanned Text Content\]:\s*([\s\S]*?)(?:\n\n🎯|\n\n🏷️|$)/
  );
  if (ocrMatch && isMeaningfulOcr(ocrMatch[1])) {
    const line = ocrMatch[1].trim().split('\n').find((l) => l.trim().length > 0);
    if (line) return line.slice(0, 80) + (line.length > 80 ? '…' : '');
  }

  return 'Saved memory';
}

export function getMeaningfulOcrPreview(content) {
  const ocrMatch = content.match(
    /🔍 \[Scanned Text Content\]:\s*([\s\S]*?)(?:\n\n🎯|\n\n🏷️|$)/
  );
  if (!ocrMatch) return null;
  const text = ocrMatch[1].trim();
  if (!isMeaningfulOcr(text)) return null;
  return text.slice(0, 120) + (text.length > 120 ? '…' : '');
}

/** Remove low-quality OCR blocks from saved memory payloads. */
export function cleanMemoryContent(content) {
  if (!content) return content;

  const ocrMatch = content.match(
    /🔍 \[Scanned Text Content\]:\s*([\s\S]*?)(?:\n\n🎯|\n\n🏷️|$)/
  );
  if (!ocrMatch || isMeaningfulOcr(ocrMatch[1])) return content;

  return content
    .replace(/\n\n🔍 \[Scanned Text Content\]:\s*[\s\S]*?(?=\n\n🎯|\n\n🏷️|$)/, '')
    .replace(/\n\n🔍 \[Scanned Text Content\]:\s*[\s\S]*$/, '')
    .trim();
}
