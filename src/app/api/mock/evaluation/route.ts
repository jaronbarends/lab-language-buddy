import { errorResponse, readEvaluationRequestBody } from "@/lib/chat-request";
import type { EvaluationResponse } from "@/lib/chat-schema";
import { EVALUATION_TIMEOUT_MS } from "@/lib/evaluation-deadline";
import { mockCorrection } from "@/lib/mock-conversation";

/** A corrector has less to produce than the chat partner, so it answers sooner. */
const MOCK_LATENCY_MS = 800;

/**
 * Ways to see the other states of an evaluation without breaking anything: a message
 * containing the first fails, one containing the second does not answer within the
 * driver's deadline. Typed in the editor, since the mock changes nothing else.
 */
const FAIL_MARKER = "[fail]";
const SLOW_MARKER = "[slow]";
// Longer than the driver's deadline, so `[slow]` always times out whatever the deadline is.
const MOCK_SLOW_LATENCY_MS = EVALUATION_TIMEOUT_MS + 5_000;

/**
 * Stand-in for `/api/evaluation` while developing without a Gemini key or quota. Same
 * request and response contract as the real route, from `chat-schema.ts`.
 *
 * A message containing `[fail]` gets a 500, and one containing `[slow]` an answer only
 * after the driver's deadline plus 5 s, to try the failed and the timed-out evaluation.
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

  const latency = input.includes(SLOW_MARKER) ? MOCK_SLOW_LATENCY_MS : MOCK_LATENCY_MS;
  await new Promise((resolve) => setTimeout(resolve, latency));

  if (input.includes(FAIL_MARKER)) {
    return errorResponse("Mock evaluation failure", 500);
  }

  const evaluationResponse: EvaluationResponse = {
    correction: mockCorrection(language, input),
  };

  return Response.json(evaluationResponse);
}
