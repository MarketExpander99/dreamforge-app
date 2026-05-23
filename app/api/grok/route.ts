// app/api/grok/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4.1-fast',     // Most cost-effective model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1100,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);
      throw new Error(`Grok API error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in Grok response:', data);
      return NextResponse.json({ error: "No response from Grok" }, { status: 500 });
    }

    return NextResponse.json(content);

  } catch (error: any) {
    console.error('API Route Error:', error.message);
    return NextResponse.json({ 
      error: 'Grok API call failed',
      details: error.message 
    }, { status: 500 });
  }
}