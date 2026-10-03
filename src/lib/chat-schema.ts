import { z } from "zod";

import { CEFR_LEVELS } from "@/lib/cefr";
import { LANGUAGE_CODES } from "@/lib/languages";

/**
 * The contract of `/api/chat` and `/api/mock/chat`, in one place so the two routes and
 * the client cannot drift apart.
 *
 * `language` and `level` are enums on purpose: they end up inside the system
 * instruction, and a free-text field there would let any caller write into the prompt.
 *
 * `previousInteractionId` is the `interactionId` of the last AI turn; `input` is the
 * user's latest text. Both are absent on the very first request when the AI speaks
 * first, and `previousInteractionId` is absent on the first request when the user does.
 */
export const ChatRequestSchema = z.object({
  language: z.enum(LANGUAGE_CODES),
  level: z.enum(CEFR_LEVELS),
  input: z.string().optional(),
  previousInteractionId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * What Gemini is asked to produce. Just the reply: whether feedback is per turn is the
 * stage 4 question, so no `correction` field here.
 */
export const GeminiReplySchema = z.object({
  reply: z
    .string()
    .describe("The AI conversation partner's reply, in the target language."),
});

export const GeminiReplyJSONSchema = z.toJSONSchema(GeminiReplySchema);

/** What the routes return and the client parses. */
export const ChatResponseSchema = z.object({
  interactionId: z.string(),
  reply: z.string(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
