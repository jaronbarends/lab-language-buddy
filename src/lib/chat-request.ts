import { z } from "zod";

import {
  ChatRequestBodySchema,
  EvaluationRequestBodySchema,
  type ChatError,
  type ChatRequestBody,
  type EvaluationRequestBody,
} from "@/lib/chat-schema";

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ChatError, { status });
}

type ReadRequestBodyResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: Response };

async function readRequestBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ReadRequestBodyResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: errorResponse("Request body is not valid JSON", 400),
    };
  }

  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success) {
    return {
      ok: false,
      response: errorResponse(z.prettifyError(parsedBody.error), 400),
    };
  }

  return { ok: true, body: parsedBody.data };
}

/** Reads and validates the body of a chat request; shared by the real and the mock route. */
export function readChatRequestBody(
  request: Request,
): Promise<ReadRequestBodyResult<ChatRequestBody>> {
  return readRequestBody(request, ChatRequestBodySchema);
}

/** The same for an evaluation request. */
export function readEvaluationRequestBody(
  request: Request,
): Promise<ReadRequestBodyResult<EvaluationRequestBody>> {
  return readRequestBody(request, EvaluationRequestBodySchema);
}
