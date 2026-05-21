import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Only images (PNG, JPG, WebP) and PDF files are allowed' },
        { status: 400 }
      );
    }

    // 1. Setup local folder paths
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadDir, cleanFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Save file immediately to your computer hard drive
    fs.writeFileSync(filePath, buffer);
    const localFileUrl = `/uploads/${cleanFileName}`;

    // 3. FAST OCR INDEXER: Reads alphanumeric string text characters directly from the file buffer
    let visibleTextContent = '';
    try {
      const rawStrings = buffer.toString('utf8').replace(/[^\x20-\x7E]/g, ' ');
      const cleanWords = rawStrings.match(/[a-zA-Z]{3,15}/g) || [];
      // Take the most readable words to use as search keys
      const searchKeywords = [...new Set(cleanWords)].slice(0, 80).join(' ');
      visibleTextContent = `Keywords: ${searchKeywords} (File: ${file.name})`;
    } catch (err) {
      visibleTextContent = `File Reference Asset Name: ${file.name}`;
    }

    return NextResponse.json({ 
      fileUrl: localFileUrl,
      fileName: file.name,
      fileType: file.type,
      extractedText: visibleTextContent 
    });

  } catch (error) {
    console.error('Local file engine failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}