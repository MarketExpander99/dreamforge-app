// app/api/grok/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.XAI_API_KEY) {
      console.error("❌ XAI_API_KEY is missing in environment variables");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4.1-fast',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Grok API Error:', res.status, errorText);
      return NextResponse.json({ error: `Grok API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No content received from Grok" }, { status: 500 });
    }

    return NextResponse.json(content);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}