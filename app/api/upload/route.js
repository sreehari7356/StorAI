import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ✅ Use service role key for storage uploads (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Magic bytes validation — kept exactly as you had it ✅
const VALID_MAGIC_BYTES = {
  png:  '89504e47',
  jpeg: 'ffd8ff',
  pdf:  '25504446',
  webp: '52494646',
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // ── 1. SIZE CHECK ──────────────────────────────────────────────
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit.' },
        { status: 413 }
      );
    }

    // ── 2. MAGIC BYTES VALIDATION ─────────────────────────────────
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHeaderHex = buffer.slice(0, 4).toString('hex').toLowerCase();

    const isPNG  = fileHeaderHex.startsWith(VALID_MAGIC_BYTES.png);
    const isJPEG = fileHeaderHex.startsWith(VALID_MAGIC_BYTES.jpeg);
    const isPDF  = fileHeaderHex.startsWith(VALID_MAGIC_BYTES.pdf);
    const isWEBP = fileHeaderHex.startsWith(VALID_MAGIC_BYTES.webp);

    if (!isPNG && !isJPEG && !isPDF && !isWEBP) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, PDF, and WebP are allowed.' },
        { status: 403 }
      );
    }

    // ── 3. DETERMINE FILE TYPE ────────────────────────────────────
    let finalExtension = 'jpg';
    let assignedMimeType = 'image/jpeg';

    if (isPNG)  { finalExtension = 'png';  assignedMimeType = 'image/png'; }
    if (isPDF)  { finalExtension = 'pdf';  assignedMimeType = 'application/pdf'; }
    if (isWEBP) { finalExtension = 'webp'; assignedMimeType = 'image/webp'; }

    // ── 4. UPLOAD TO SUPABASE STORAGE ─────────────────────────────
    // ✅ FIX — Supabase Storage persists across deployments
    // Local disk (fs.writeFileSync) gets wiped on every Vercel deploy
    const fileName = `${Date.now()}.${finalExtension}`;

    const { data, error: uploadError } = await supabase.storage
      .from('memories')           // ← your bucket name in Supabase
      .upload(fileName, buffer, {
        contentType: assignedMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload failed:', uploadError.message);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ── 5. GET PUBLIC URL ─────────────────────────────────────────
    const { data: { publicUrl } } = supabase.storage
      .from('memories')
      .getPublicUrl(data.path);

    return NextResponse.json({
      fileUrl: publicUrl,           // ✅ permanent public URL
      fileName: file.name,
      fileType: assignedMimeType,
      extractedText: `File Reference Asset Name: ${file.name}`,
    });

  } catch (error) {
    console.error('Upload route failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error saving asset.' },
      { status: 500 }
    );
  }
}