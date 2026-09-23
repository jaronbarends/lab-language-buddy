const TTS_MODEL_ID = 'eleven_flash_v2_5';

function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY');
  }
  return apiKey;
}

export async function synthesize(text: string): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error('Missing ELEVENLABS_VOICE_ID');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, model_id: TTS_MODEL_ID }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.arrayBuffer();
}
