import { z } from "zod";

import { CEFR_LEVELS } from "@/lib/cefr";
import { LANGUAGE_CODES } from "@/lib/languages";

/**
 * Characters, not words. About 800 words of speech, far beyond a single turn; it is only
 * there so the public endpoint can't be fed unbounded text on the API key's tab.
 */
const MAX_INPUT_LENGTH = 5000;

/**
 * Real Gemini interaction ids are 70 characters of base64url. The bound is deliberately
 * loose and is input hygiene, not abuse protection.
 */
const MAX_INTERACTION_ID_LENGTH = 200;

/**
 * The contract of `/api/chat` and `/api/mock/chat`, in one place so the two routes and
 * the client cannot drift apart. A request is one of two kinds:
 *
 * - `aiStarts`: the first request when the AI speaks first. No input and no id; there is
 *   nothing to answer and no chain to continue.
 * - `userTurn`: the user's latest text as `input`. `previousInteractionId` is the
 *   `interactionId` of the last AI turn, and is absent only when the user spoke first.
 *
 * `language` and `level` are enums on purpose: they end up inside the system
 * instruction, and a free-text field there would let any caller write into the prompt.
 */
export const ChatRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("aiStarts"),
    language: z.enum(LANGUAGE_CODES),
    level: z.enum(CEFR_LEVELS),
  }),
  z.object({
    kind: z.literal("userTurn"),
    language: z.enum(LANGUAGE_CODES),
    level: z.enum(CEFR_LEVELS),
    input: z.string().min(1).max(MAX_INPUT_LENGTH),
    previousInteractionId: z
      .string()
      .min(1)
      .max(MAX_INTERACTION_ID_LENGTH)
      .optional(),
  }),
]);

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * What the routes return and the client parses. An empty reply is a failure.
 * `correction` is about the user's latest message, and is `null` when there was nothing
 * worth mentioning and always when the AI speaks first; an empty string is a failure too.
 */
export const ChatResponseSchema = z.object({
  interactionId: z.string(),
  reply: z.string().trim().min(1),
  correction: z.string().trim().min(1).nullable(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/** What a failing route answers and the client parses. */
export const ChatErrorSchema = z.object({ error: z.string() });

export type ChatError = z.infer<typeof ChatErrorSchema>;
