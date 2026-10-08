import { errorResponse, readEvaluationRequest } from "@/lib/chat-request";

import { askGeminiForEvaluation } from "./gemini-evaluation";

export async function POST(request: Request) {
  const parsed = await readEvaluationRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    return Response.json(
      await askGeminiForEvaluation(parsed.request, request.signal),
    );
  } catch (error) {
    // Provider errors can carry request details, and a missing API key is not the
    // caller's business; both stay in the server log.
    console.error("Evaluation request failed:", error);
    return errorResponse("The evaluation request failed", 500);
  }
}
