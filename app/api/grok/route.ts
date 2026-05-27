// app/api/grok/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for AI endpoint protection
// Note: This is instance-specific and resets on Vercel cold starts / deploys.
// For high-traffic production, we can upgrade to @upstash/ratelimit + Redis later (no schema change needed).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20;     // Adjust as needed (e.g. 10-30 calls/min per user/IP)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export async function POST(req: NextRequest) {
  // Rate limiting by client IP (prevents abuse before expensive Grok call)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim();

  const now = Date.now();

  // Cleanup expired entries
  for (const [key, entry] of rateLimits.entries()) {
    if (entry.resetTime < now) {
      rateLimits.delete(key);
    }
  }

  let entry = rateLimits.get(ip);
  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(ip, entry);
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again in a minute." },
      { status: 429 }
    );
  }

  entry.count++;

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error("XAI_API_KEY is missing!");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',           // Using a stable model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API Error:', response.status, errorText);
      return NextResponse.json({ error: `API error ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No content from Grok" }, { status: 500 });
    }

    return NextResponse.json(content);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}