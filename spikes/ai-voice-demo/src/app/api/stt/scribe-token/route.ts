import { NextResponse } from 'next/server';

const SINGLE_USE_TOKEN_URL = 'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe';

// Mints a single-use token (valid 15 minutes, consumed on first use) so the browser can open
// ElevenLabs' realtime Scribe WebSocket directly, without exposing the permanent API key.
// The browser passes it as the `token` query parameter.
export async function POST() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing ELEVENLABS_API_KEY' }, { status: 500 });
  }

  try {
    const response = await fetch(SINGLE_USE_TOKEN_URL, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
    });
    if (!response.ok) {
      return NextResponse.json({ error: await response.text() }, { status: 500 });
    }

    const data: { token: string } = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
