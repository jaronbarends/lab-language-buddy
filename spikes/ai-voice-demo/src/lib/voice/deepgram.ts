const AUTH_GRANT_URL = 'https://api.deepgram.com/v1/auth/grant';

// STT only: Deepgram's TTS (Aura) doesn't have a Norwegian voice.

function getApiKey(): string {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('Missing DEEPGRAM_API_KEY');
  }
  return apiKey;
}

export type LiveToken = { accessToken: string; expiresIn: number };

// Mints a short-lived token so the browser can talk to Deepgram's live
// WebSocket directly, without exposing the permanent API key. The grant
// endpoint requires a Member-role key (a viewer-role key gets 403
// FORBIDDEN). On the WebSocket itself, this token needs the 'Bearer'
// Sec-WebSocket-Protocol scheme, not 'token' (that scheme is for the
// permanent API key only) — see findings.md, "Live STT".
export async function mintLiveToken(): Promise<LiveToken> {
  const apiKey = getApiKey();

  const response = await fetch(AUTH_GRANT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data: { access_token: string; expires_in: number } = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}
