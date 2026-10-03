import { errorResponse, readChatRequest } from "@/lib/chat-request";

import { askGemini } from "./gemini-chat";

export async function POST(request: Request) {
  const parsed = await readChatRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    return Response.json(await askGemini(parsed.request, request.signal));
  } catch (error) {
    // Provider errors can carry request details, and a missing API key is not the
    // caller's business; both stay in the server log.
    console.error("Chat request failed:", error);
    return errorResponse("The chat request failed", 500);
  }
}
