const LISTEN_URL = 'https://api.deepgram.com/v1/listen';
// Norwegian is only supported on the legacy nova-2/base/enhanced models, not nova-3/flux.
const MODEL = 'nova-2';
const LANGUAGE = 'no';

// STT only: Deepgram's TTS (Aura) doesn't have a Norwegian voice.

function getApiKey(): string {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('Missing DEEPGRAM_API_KEY');
  }
  return apiKey;
}

export async function transcribe(audio: Blob): Promise<string> {
  const apiKey = getApiKey();
  const audioBuffer = await audio.arrayBuffer();

  const response = await fetch(`${LISTEN_URL}?model=${MODEL}&language=${LANGUAGE}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': audio.type || 'audio/webm',
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data: {
    results?: { channels: { alternatives: { transcript: string }[] }[] };
  } = await response.json();

  return data.results?.channels[0]?.alternatives[0]?.transcript ?? '';
}
