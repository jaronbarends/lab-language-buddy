// TTS only: Azure's short-audio STT REST endpoint only accepts WAV/PCM or OGG/Opus, not the
// WebM/Opus Safari (and our recorder) produce. Sending it anyway returns 200 with an empty
// transcript and a bogus duration instead of an error, so it fails silently. Fixing that would
// mean recording as PCM or remuxing WebM to Ogg — parked for now; STT stays on Deepgram.
const TTS_LOCALE = 'nb-NO';
// Alternatives confirmed to exist for nb-NO: nb-NO-PernilleNeural (f), nb-NO-FinnNeural (m).
// const TTS_VOICE = 'nb-NO-IselinNeural'; // female
const TTS_VOICE = 'nb-NO-FinnNeural'; // male
const TTS_OUTPUT_FORMAT = 'audio-24khz-96kbitrate-mono-mp3';

function getCredentials(): { apiKey: string; region: string } {
  const apiKey = process.env.AZURE_SPEECH_API_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!apiKey) {
    throw new Error('Missing AZURE_SPEECH_API_KEY');
  }
  if (!region) {
    throw new Error('Missing AZURE_SPEECH_REGION');
  }
  return { apiKey, region };
}

export async function synthesize(text: string): Promise<ArrayBuffer> {
  const { apiKey, region } = getCredentials();

  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const ssml = `<speak version="1.0" xml:lang="${TTS_LOCALE}"><voice name="${TTS_VOICE}">${escapedText}</voice></speak>`;

  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': TTS_OUTPUT_FORMAT,
      'User-Agent': 'ai-voice-demo',
    },
    body: ssml,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.arrayBuffer();
}
