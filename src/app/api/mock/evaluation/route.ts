import { errorResponse, readEvaluationRequestBody } from "@/lib/chat-request";
import type { EvaluationResponse } from "@/lib/chat-schema";
import { mockCorrection } from "@/lib/mock-conversation";

/** A corrector has less to produce than the chat partner, so it answers sooner. */
const MOCK_LATENCY_MS = 800;

/**
 * Stand-in for `/api/evaluation` while developing without a Gemini key or quota. Same
 * request and response contract as the real route, from `chat-schema.ts`.
 */
export async function POST(request: Request) {
  // It has no business existing outside development.
  if (process.env.NODE_ENV !== "development") {
    return errorResponse("Mock evaluation is only available in development", 404);
  }

  const parsed = await readEvaluationRequestBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  const { language, input } = parsed.body;

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const evaluationResponse: EvaluationResponse = {
    correction: mockCorrection(language, input),
  };

  return Response.json(evaluationResponse);
}
