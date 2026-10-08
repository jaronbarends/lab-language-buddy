import { z } from "zod";

import {
  ChatRequestSchema,
  EvaluationRequestSchema,
  type ChatError,
  type ChatRequest,
  type EvaluationRequest,
} from "@/lib/chat-schema";

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ChatError, { status });
}

type ReadRequestResult<T> =
  | { ok: true; request: T }
  | { ok: false; response: Response };

async function readRequest<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ReadRequestResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: errorResponse("Request body is not valid JSON", 400),
    };
  }

  const parsedRequest = schema.safeParse(body);
  if (!parsedRequest.success) {
    return {
      ok: false,
      response: errorResponse(z.prettifyError(parsedRequest.error), 400),
    };
  }

  return { ok: true, request: parsedRequest.data };
}

/** Reads and validates the body of a chat request; shared by the real and the mock route. */
export function readChatRequest(
  request: Request,
): Promise<ReadRequestResult<ChatRequest>> {
  return readRequest(request, ChatRequestSchema);
}

/** The same for an evaluation request. */
export function readEvaluationRequest(
  request: Request,
): Promise<ReadRequestResult<EvaluationRequest>> {
  return readRequest(request, EvaluationRequestSchema);
}
