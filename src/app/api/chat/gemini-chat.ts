import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  ChatResponseSchema,
  type ChatRequest,
  type ChatResponse,
} from "@/lib/chat-schema";
import { AI_STARTING_PROMPT, buildChatSystemInstruction } from "@/lib/prompt";

// Server only: reads the API key. Never import this from client code.

const MODEL = "gemini-3.1-flash-lite";

/**
 * What Gemini is asked to produce: the reply and the correction of the user's last
 * message. The rules come from the response schema, so what the client accepts and what
 * Gemini is told cannot differ. `reply` comes first on purpose: if the route ever
 * streams, TTS can start as soon as the reply is complete.
 */
const GeminiReplySchema = z.object({
  reply: ChatResponseSchema.shape.reply.describe(
    "The AI conversation partner's reply, in the target language.",
  ),
  correction: ChatResponseSchema.shape.correction.describe(
    "A short correction of the single most instructive mistake in the user's last message, in English. Null if there was nothing worth mentioning.",
  ),
});

const GeminiReplyJSONSchema = z.toJSONSchema(GeminiReplySchema);

export async function askGemini(
  request: ChatRequest,
  signal: AbortSignal,
): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const input =
    request.kind === "userTurn" ? request.input : AI_STARTING_PROMPT;
  const previousInteractionId =
    request.kind === "userTurn" ? request.previousInteractionId : undefined;

  const ai = new GoogleGenAI({ apiKey });

  // The conversation history comes from `previous_interaction_id`, but the model,
  // system instruction and response format are sent on every call: they belong to the
  // interaction, not to the chain.
  const response = await ai.interactions.create(
    {
      model: MODEL,
      input,
      system_instruction: buildChatSystemInstruction(
        request.language,
        request.level,
      ),
      previous_interaction_id: previousInteractionId,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: GeminiReplyJSONSchema,
      },
    },
    { signal },
  );

  if (!response.output_text) {
    throw new Error("Gemini returned no output text");
  }

  const { reply, correction } = GeminiReplySchema.parse(
    JSON.parse(response.output_text),
  );

  return { interactionId: response.id, reply, correction };
}
