import { z } from "zod";

import { errorResponse } from "@/lib/chat-request";

const TOKEN_URL = "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe";

const TokenResponseSchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  try {
    return Response.json({ accessToken: await mintLiveToken(request.signal) });
  } catch (error) {
    // The provider's response can carry request details, and a missing API key is not
    // the caller's business; both stay in the server log.
    console.error("Speech recognition token request failed:", error);
    return errorResponse("The speech recognition token request failed", 500);
  }
}

// Mints a single-use token (valid 15 minutes, consumed when the socket opens) so the
// browser can talk to ElevenLabs' realtime Scribe WebSocket directly, without ever seeing
// the permanent API key. The browser passes it as the `token` query parameter of the
// socket URL (see src/lib/stt/elevenlabs.ts). The same key as the TTS provider uses.
async function mintLiveToken(signal: AbortSignal): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs token request failed (${response.status}): ${await response.text()}`,
    );
  }

  return TokenResponseSchema.parse(await response.json()).token;
}
