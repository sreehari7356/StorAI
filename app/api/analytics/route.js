import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    // 1. Fetch all memories to calculate stats
    const { data: memories, error } = await supabase
      .from('memories')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalCount = memories.length;

    // 2. Calculate memories added in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCount = memories.filter(item => {
      const createdDate = new Date(item.created_at);
      return createdDate >= sevenDaysAgo;
    }).length;

    // 3. Generate AI Summary using OpenAI if memories exist
    let aiSummary = "Add some memories to generate your smart AI summary!";
    
    if (totalCount > 0) {
      // Take up to the 10 most recent memories to give context to OpenAI
      const recentTextContent = memories
        .slice(0, 10)
        .map(item => `- ${item.content}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and accurate for summary generation
        messages: [
          {
            role: 'system',
            content: 'You are a helpful personal assistant summarizing a user\'s digital memory vault. Provide a concise, motivating 2-sentence summary highlighting the main topics, projects, or thoughts they have been saving recently. Address the user directly as "You".'
          },
          {
            role: 'user',
            content: `Here are my recent saved notes:\n\n${recentTextContent}`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      aiSummary = completion.choices[0].message.content.trim();
    }

    return NextResponse.json({
      totalCount,
      recentCount,
      aiSummary
    });

  } catch (error) {
    console.error('Analytics engine error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}