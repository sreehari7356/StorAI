import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided for vectorization' }, { status: 400 });
    }

    // Call OpenAI to convert the text payload into a mathematical coordinate array
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = response.data[0].embedding;

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('OpenAI Embedding Vector generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}