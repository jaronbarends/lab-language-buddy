import { z } from 'zod';

export const ChatResponseSchema = z.object({
  reply: z.string().describe('The AI conversation partner reply, in the target language.'),
  correction: z
    .string()
    .nullable()
    .describe(
      "A short correction of the single most instructive mistake in the user's last message, in English. Null if there was nothing worth mentioning."
    ),
});

export const ChatResponseJSONSchema = z.toJSONSchema(ChatResponseSchema);

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
