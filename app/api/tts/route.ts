// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'rex' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      console.error('XAI_API_KEY not set in environment');
      return NextResponse.json({ error: 'TTS service unavailable' }, { status: 500 });
    }

    // Official xAI TTS endpoint (server-side only - key never exposed)
    const ttsResponse = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        voice: voice, // 'rex', 'ava', etc. - confirm available voices in xAI docs
        model: 'grok-tts', // or appropriate model per current xAI API
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('xAI TTS error:', errorText);
      return NextResponse.json({ error: 'TTS generation failed' }, { status: ttsResponse.status });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="narration.mp3"',
      },
    });
  } catch (error) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: 'Internal TTS error' }, { status: 500 });
  }
}