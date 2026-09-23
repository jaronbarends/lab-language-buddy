import { NextRequest, NextResponse } from 'next/server';

import * as azure from '@/lib/voice/azure';
import * as elevenlabs from '@/lib/voice/elevenlabs';
import * as google from '@/lib/voice/google';

// Deepgram is STT-only (no Norwegian TTS voice), so it's not in this map.
const ttsProviders = { azure, elevenlabs, google };
const DEFAULT_TTS_PROVIDER = 'elevenlabs';

function getTtsProvider() {
  const configuredProvider = process.env.TTS_PROVIDER;

  if (!configuredProvider) {
    return ttsProviders[DEFAULT_TTS_PROVIDER];
  }

  const provider = ttsProviders[configuredProvider as keyof typeof ttsProviders];
  if (!provider) {
    throw new Error(
      `Unknown TTS_PROVIDER "${configuredProvider}" — expected one of: ${Object.keys(ttsProviders).join(', ')}`
    );
  }

  return provider;
}

export async function POST(request: NextRequest) {
  const { text }: { text?: string } = await request.json();
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const provider = getTtsProvider();
    const audioBuffer = await provider.synthesize(text);
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
