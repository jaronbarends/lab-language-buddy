import { z } from "zod";

import { errorResponse } from "@/lib/chat-request";
import { getTtsProvider, VOICE_GENDER } from "@/lib/tts";
import { TTS_CONTENT_TYPE, TtsRequestSchema } from "@/lib/tts/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body is not valid JSON", 400);
  }

  const parsedRequest = TtsRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse(z.prettifyError(parsedRequest.error), 400);
  }

  try {
    const audio = await getTtsProvider().synthesize(
      { ...parsedRequest.data, gender: VOICE_GENDER },
      request.signal,
    );
    return new Response(audio, {
      headers: { "Content-Type": TTS_CONTENT_TYPE },
    });
  } catch (error) {
    // Provider errors can carry request details, a missing key is not the caller's
    // business, and a bad TTS_PROVIDER lists the valid names; all stay in the server log.
    console.error("TTS request failed:", error);
    return errorResponse("The speech request failed", 500);
  }
}
