import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized — no user ID provided.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing memory target parameter identifier.' }, { status: 400 });
    }

    // 1. Find the target record first to see if it has a physical cloud storage attachment link
    const { data: targetMemory, error: fetchError } = await supabase
      .from('memories')
      .select('content')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (targetMemory?.content) {
      // Parse out the storage file URL if it exists
      const imageRegex = /\[🖼️ Local Attachment:\s*([^\]]+)\]/;
      const match = targetMemory.content.match(imageRegex);
      const fileUrl = match ? match[1].trim() : null;

      if (fileUrl && fileUrl.includes('/storage/v1/object/public/memories/')) {
        // Extract the raw storage file path relative to the bucket root
        // Format extracted: "user_id/filename.jpg"
        const filePath = fileUrl.split('/public/memories/')[1];
        
        if (filePath) {
          // Purge the physical binary asset out of the storage partition entirely
          await supabase.storage.from('memories').remove([filePath]);
        }
      }
    }

    // 2. Clear out the primary database catalog row index entry
    const { error: dbError } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, message: 'Vault text record and cloud asset successfully purged.' });

  } catch (error) {
    console.error('DELETE transaction failure endpoint trace:', error.message);
    return NextResponse.json({ error: 'Internal Server Error processing database drop' }, { status: 500 });
  }
}