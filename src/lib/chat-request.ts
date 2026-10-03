import { z } from "zod";

import {
  ChatRequestSchema,
  type ChatError,
  type ChatRequest,
} from "@/lib/chat-schema";

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ChatError, { status });
}

/** Reads and validates the body of a chat request; shared by the real and the mock route. */
export async function readChatRequest(
  request: Request,
): Promise<
  { ok: true; request: ChatRequest } | { ok: false; response: Response }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: errorResponse("Request body is not valid JSON", 400),
    };
  }

  const parsedRequest = ChatRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return {
      ok: false,
      response: errorResponse(z.prettifyError(parsedRequest.error), 400),
    };
  }

  return { ok: true, request: parsedRequest.data };
}
