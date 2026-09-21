const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const STT_MODEL_ID = 'scribe_v2';
const TTS_MODEL_ID = 'eleven_flash_v2_5';

function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY');
  }
  return apiKey;
}

export async function transcribe(audio: Blob): Promise<string> {
  const apiKey = getApiKey();

  const form = new FormData();
  form.set('model_id', STT_MODEL_ID);
  form.set('language_code', 'no');
  form.set('file', audio, 'speech.webm');

  const response = await fetch(STT_URL, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data: { text: string } = await response.json();
  return data.text;
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
