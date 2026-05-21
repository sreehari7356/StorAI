import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cleanMemoryContent } from '../../../lib/ocrQuality';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const jsonPath = path.join(process.cwd(), 'data', 'memories.json');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

function readData() {
  if (!fs.existsSync(jsonPath)) return [];
  const data = fs.readFileSync(jsonPath, 'utf8');
  return data ? JSON.parse(data) : [];
}

function writeData(data) {
  const dirPath = path.dirname(jsonPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
}

// GET: Fetch all memory entries securely
export async function GET() {
  const memories = readData();
  let changed = false;
  const cleaned = memories.map((item) => {
    const content = cleanMemoryContent(item.content);
    if (content !== item.content) changed = true;
    return { ...item, content };
  });
  if (changed) writeData(cleaned);
  return NextResponse.json(cleaned);
}

// POST: Save fresh text and local image paths
export async function POST(request) {
  try {
    const { content } = await request.json();
    const memories = readData();

    const newEntry = {
      id: Date.now().toString(),
      content: cleanMemoryContent(content),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };
    
    memories.unshift(newEntry);
    writeData(memories);
    return NextResponse.json(newEntry);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to write vault entry' }, { status: 500 });
  }
}

// DELETE: Safely erase data strings and physical drive files
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const memories = readData();
    const targetItem = memories.find(item => item.id === id);

    if (targetItem) {
      const imageRegex = /\[🖼️ Local Attachment:\s*([^\]]+)\]/;
      const match = targetItem.content.match(imageRegex);
      
      if (match && match[1]) {
        const fileUrl = match[1].trim();
        if (fileUrl.startsWith('/uploads/')) {
          const fileName = fileUrl.replace('/uploads/', '');
          const absoluteDiskPath = path.join(uploadsDir, fileName);

          if (fs.existsSync(absoluteDiskPath)) {
            fs.unlinkSync(absoluteDiskPath);
          }
        }
      }
    }

    const updatedMemories = memories.filter(item => item.id !== id);
    writeData(updatedMemories);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}