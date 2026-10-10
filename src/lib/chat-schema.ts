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

/** The id of the last AI turn: where the request continues the conversation from. */
const PreviousInteractionIdSchema = z
  .string()
  .min(1)
  .max(MAX_INTERACTION_ID_LENGTH);

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
export const ChatRequestBodySchema = z.discriminatedUnion("kind", [
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
    previousInteractionId: PreviousInteractionIdSchema.optional(),
  }),
]);

export type ChatRequestBody = z.infer<typeof ChatRequestBodySchema>;

/**
 * One piece of a correction. Read in order and concatenated, the `text` values form the
 * explanation, so a segment carries its own surrounding spaces and must not be trimmed.
 *
 * - `text`: the explanation itself, in English.
 * - `userInput`: only the part of the user's message the explanation needs, quoted in
 *   the target language. Never the whole message.
 * - `suggestion`: the more natural alternative, in the target language.
 *
 * The client renders `userInput` and `suggestion` in italics, `suggestion` also on a
 * background, with no quotation marks of its own.
 */
export const EVALUATION_SEGMENT_TYPES = [
  "text",
  "userInput",
  "suggestion",
] as const;

export const EvaluationSegmentSchema = z.object({
  type: z.enum(EVALUATION_SEGMENT_TYPES),
  text: z.string().min(1),
});

export type EvaluationSegment = z.infer<typeof EvaluationSegmentSchema>;

/** What the chat routes return and the client parses. An empty reply is a failure. */
export const ChatResponseSchema = z.object({
  interactionId: z.string(),
  reply: z.string().trim().min(1),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * The contract of `/api/evaluation` and `/api/mock/evaluation`: the correction of one user
 * message. `previousInteractionId` is the last AI turn's id, as in a chat request, so the
 * corrector sees the whole conversation up to the message it gives feedback on; it is
 * absent only when the user spoke first. The call branches off that turn and its own id
 * is never handed back, so the correction never enters the conversation chain.
 * `language` and `level` are enums for the same reason as in `ChatRequestBodySchema`.
 */
export const EvaluationRequestBodySchema = z.object({
  language: z.enum(LANGUAGE_CODES),
  level: z.enum(CEFR_LEVELS),
  input: z.string().min(1).max(MAX_INPUT_LENGTH),
  previousInteractionId: PreviousInteractionIdSchema.optional(),
});

export type EvaluationRequestBody = z.infer<typeof EvaluationRequestBodySchema>;

/**
 * `correction` is `null` when the message has nothing worth correcting. An empty list is
 * a failure, not "no correction".
 */
export const EvaluationResponseSchema = z.object({
  correction: z.array(EvaluationSegmentSchema).min(1).nullable(),
});

export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;

/** What a failing route answers and the client parses. Shared by all the routes above. */
export const ChatErrorSchema = z.object({ error: z.string() });

export type ChatError = z.infer<typeof ChatErrorSchema>;
