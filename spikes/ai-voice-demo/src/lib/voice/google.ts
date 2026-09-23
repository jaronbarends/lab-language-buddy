const LANGUAGE_CODE = 'nb-NO';
const VOICE_NAME = 'nb-NO-Chirp3-HD-Aoede';
// range 0.25-2.0, 1.0 is unadjusted pace
const SPEAKING_RATE = 1;

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_CLOUD_API_KEY');
  }
  return apiKey;
}

export async function synthesize(text: string): Promise<ArrayBuffer> {
  const apiKey = getApiKey();

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: LANGUAGE_CODE, name: VOICE_NAME },
        audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data: { audioContent: string } = await response.json();
  const buffer = Buffer.from(data.audioContent, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
