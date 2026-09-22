import { NextRequest, NextResponse } from 'next/server';

import * as deepgram from '@/lib/voice/deepgram';
import * as elevenlabs from '@/lib/voice/elevenlabs';
import * as google from '@/lib/voice/google';

const sttProviders = { deepgram, elevenlabs, google };

export async function POST(request: NextRequest) {
  const incomingForm = await request.formData();
  const audio = incomingForm.get('audio');
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
  }

  const provider =
    sttProviders[process.env.STT_PROVIDER as keyof typeof sttProviders] ?? elevenlabs;

  try {
    const text = await provider.transcribe(audio);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
