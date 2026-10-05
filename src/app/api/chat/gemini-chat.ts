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
 * What Gemini is asked to produce. Just the reply: whether and how feedback on mistakes
 * is given (per turn, on demand or at the end of a session) is still undecided, so no
 * `correction` field here. The reply rule comes from the
 * response schema, so what the client accepts and what Gemini is told cannot differ.
 */
const GeminiReplySchema = z.object({
  reply: ChatResponseSchema.shape.reply.describe(
    "The AI conversation partner's reply, in the target language.",
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

  const { reply } = GeminiReplySchema.parse(JSON.parse(response.output_text));

  return { interactionId: response.id, reply };
}
