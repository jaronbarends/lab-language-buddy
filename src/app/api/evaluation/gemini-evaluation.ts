import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  EvaluationResponseSchema,
  type EvaluationRequestBody,
  type EvaluationResponse,
} from "@/lib/chat-schema";
import { buildEvaluationSystemInstruction } from "@/lib/prompt";

// Server only: reads the API key. Never import this from client code.

// Its own constant, not shared with the chat route: the corrector is the call that may
// one day want a different model.
const MODEL = "gemini-3.1-flash-lite";

/**
 * What Gemini is asked to produce: just the correction. The schema only guards the shape:
 * a non-empty list of segments, each with a type and non-empty text, or null. The content
 * rules (the single most instructive mistake, `userInput` only the part the explanation
 * needs, an English explanation, no quotation marks) are in the prompt,
 * `buildEvaluationSystemInstruction` in `src/lib/prompt.ts`. Changing the segment format
 * means changing both.
 */
const GeminiCorrectionSchema = z.object({
  correction: EvaluationResponseSchema.shape.correction.describe(
    "A short correction of the single most instructive mistake in the user's last message, as segments. Null if there was nothing worth mentioning.",
  ),
});

const GeminiCorrectionJSONSchema = z.toJSONSchema(GeminiCorrectionSchema);

export async function askGeminiForEvaluation(
  body: EvaluationRequestBody,
  signal: AbortSignal,
): Promise<EvaluationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Branches off the last AI turn, so the corrector sees the conversation so far, with the
  // message to give feedback on as the input. The chat call for the same message branches
  // off the same turn; the id of this call is never handed back, so nothing of it ends up
  // in the chain the conversation continues along.
  const response = await ai.interactions.create(
    {
      model: MODEL,
      input: body.input,
      previous_interaction_id: body.previousInteractionId,
      // Not stored: nothing ever fetches this interaction and its id is not kept. The chat
      // call is the one that has to be stored, since the conversation chain hangs off it.
      store: false,
      system_instruction: buildEvaluationSystemInstruction(
        body.language,
        body.level,
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
