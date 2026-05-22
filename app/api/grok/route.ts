import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) throw new Error('Grok API error');

    const data = await res.json();
    return NextResponse.json(data.choices?.[0]?.message?.content || {});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Grok API call failed' }, { status: 500 });
  }
}