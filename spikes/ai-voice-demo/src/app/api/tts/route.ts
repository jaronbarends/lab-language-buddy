import { NextRequest, NextResponse } from 'next/server';

import * as elevenlabs from '@/lib/voice/elevenlabs';
import * as google from '@/lib/voice/google';

// Deepgram is STT-only (no Norwegian TTS voice), so it's not in this map.
const ttsProviders = { elevenlabs, google };

export async function POST(request: NextRequest) {
  const { text }: { text?: string } = await request.json();
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const provider =
    ttsProviders[process.env.TTS_PROVIDER as keyof typeof ttsProviders] ?? elevenlabs;

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
