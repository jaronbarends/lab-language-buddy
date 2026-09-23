import { NextResponse } from 'next/server';

import { mintLiveToken } from '@/lib/voice/deepgram';

export async function POST() {
  try {
    const token = await mintLiveToken();
    return NextResponse.json(token);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
