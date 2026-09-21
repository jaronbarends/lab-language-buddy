import { NextRequest, NextResponse } from 'next/server';

import * as elevenlabs from '@/lib/voice/elevenlabs';
import * as google from '@/lib/voice/google';

export async function POST(request: NextRequest) {
  const { text }: { text?: string } = await request.json();
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const provider = process.env.VOICE_PROVIDER === 'google' ? google : elevenlabs;

  try {
    const audioBuffer = await provider.synthesize(text);
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
