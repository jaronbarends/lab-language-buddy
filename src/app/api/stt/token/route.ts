import { z } from "zod";

import { errorResponse } from "@/lib/chat-request";

const AUTH_GRANT_URL = "https://api.deepgram.com/v1/auth/grant";

const GrantResponseSchema = z.object({ access_token: z.string().min(1) });

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

// Mints a short-lived token so the browser can talk to Deepgram's live WebSocket
// directly, without ever seeing the permanent API key. The grant endpoint requires a
// Member-role key (a viewer-role key gets 403 FORBIDDEN). On the WebSocket itself this
// token needs the 'Bearer' Sec-WebSocket-Protocol scheme, not 'token' — that one is for
// the permanent key only (see use-live-transcription.ts and the spike's findings.md).
async function mintLiveToken(signal: AbortSignal): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPGRAM_API_KEY");
  }

  const response = await fetch(AUTH_GRANT_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Deepgram grant failed (${response.status}): ${await response.text()}`);
  }

  return GrantResponseSchema.parse(await response.json()).access_token;
}
