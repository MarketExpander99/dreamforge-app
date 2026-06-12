// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  voice?: 'rex' | 'sal' | 'ara' | 'eve' | 'leo';
  language?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, voice = 'ara', language = 'en' } = body;

    // Validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (text.length > 15000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 15,000 characters' },
        { status: 400 }
      );
    }

    const supportedVoices = ['rex', 'sal', 'ara', 'eve', 'leo'] as const;
    const voiceId = (voice || 'ara').toLowerCase() as (typeof supportedVoices)[number];

    if (!supportedVoices.includes(voiceId)) {
      return NextResponse.json(
        { error: `Invalid voice. Supported voices: ${supportedVoices.join(', ')}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error('[TTS] XAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'TTS service is not configured' },
        { status: 500 }
      );
    }

    // Call xAI Grok TTS API
    const ttsResponse = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        voice_id: voiceId,
        language,
        output_format: {
          codec: 'mp3',
          sample_rate: 24000,
          bit_rate: 128000,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text().catch(() => 'Unknown error');
      console.error('[TTS] xAI API error:', ttsResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech from xAI' },
        { status: 502 }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[TTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating speech' },
      { status: 500 }
    );
  }
}