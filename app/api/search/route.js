import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // 1. Convert user typed question into an AI vector embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const [{ embedding }] = embeddingResponse.data;

    // 2. Query our Supabase RPC function to find the closest matching vectors
    const { data: matches, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.3, 
      match_count: 5,        
    });

    if (error) throw error;
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}