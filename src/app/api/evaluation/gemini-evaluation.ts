import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  EvaluationResponseSchema,
  type EvaluationRequest,
  type EvaluationResponse,
} from "@/lib/chat-schema";
import { buildEvaluationSystemInstruction } from "@/lib/prompt";

// Server only: reads the API key. Never import this from client code.

// Its own constant, not shared with the chat route: the corrector is the call that may
// one day want a different model.
const MODEL = "gemini-3.1-flash-lite";

/**
 * What Gemini is asked to produce: just the correction. The rules come from the response
 * schema, so what the client accepts and what Gemini is told cannot differ.
 */
const GeminiCorrectionSchema = z.object({
  correction: EvaluationResponseSchema.shape.correction.describe(
    "A short correction of the single most instructive mistake in the user's last message, as segments. Null if there was nothing worth mentioning.",
  ),
});

const GeminiCorrectionJSONSchema = z.toJSONSchema(GeminiCorrectionSchema);

export async function askGeminiForEvaluation(
  request: EvaluationRequest,
  signal: AbortSignal,
): Promise<EvaluationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  // No `previous_interaction_id`: the corrector sees only this message, and nothing of
  // this call ends up in the conversation chain.
  const response = await ai.interactions.create(
    {
      model: MODEL,
      input: request.input,
      system_instruction: buildEvaluationSystemInstruction(
        request.language,
        request.level,
      ),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: GeminiCorrectionJSONSchema,
      },
    },
    { signal },
  );

  if (!response.output_text) {
    throw new Error("Gemini returned no output text");
  }

  return GeminiCorrectionSchema.parse(JSON.parse(response.output_text));
}
