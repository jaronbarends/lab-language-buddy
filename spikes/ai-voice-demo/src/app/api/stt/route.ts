import { NextRequest, NextResponse } from 'next/server';

import * as elevenlabs from '@/lib/voice/elevenlabs';
import * as google from '@/lib/voice/google';

export async function POST(request: NextRequest) {
  const incomingForm = await request.formData();
  const audio = incomingForm.get('audio');
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
  }

  const provider = process.env.VOICE_PROVIDER === 'google' ? google : elevenlabs;

  try {
    const text = await provider.transcribe(audio);
    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
