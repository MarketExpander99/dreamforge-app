// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'rex' } = await request.json();

    const response = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-tts',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'TTS failed' }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}