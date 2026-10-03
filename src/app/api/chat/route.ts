import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  ChatRequestSchema,
  GeminiReplyJSONSchema,
  GeminiReplySchema,
  type ChatResponse,
} from "@/lib/chat-schema";
import { AI_STARTING_PROMPT, buildChatSystemInstruction } from "@/lib/prompt";

const MODEL = "gemini-3.1-flash-lite";

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse("Missing GEMINI_API_KEY", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body is not valid JSON", 400);
  }

  const parsedRequest = ChatRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse(z.prettifyError(parsedRequest.error), 400);
  }
  const { language, level, input, previousInteractionId } = parsedRequest.data;

  const ai = new GoogleGenAI({ apiKey });

  try {
    // The conversation history comes from `previous_interaction_id`, but the model,
    // system instruction and response format are sent on every call: they belong to the
    // interaction, not to the chain.
    const response = await ai.interactions.create({
      model: MODEL,
      input: input ?? AI_STARTING_PROMPT,
      system_instruction: buildChatSystemInstruction(language, level),
      previous_interaction_id: previousInteractionId,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: GeminiReplyJSONSchema,
      },
    });

    const { reply } = GeminiReplySchema.parse(
      JSON.parse(response.output_text ?? "{}"),
    );
    const chatResponse: ChatResponse = { interactionId: response.id, reply };

    return Response.json(chatResponse);
  } catch (error) {
    // Provider errors can carry request details; they stay in the server log.
    console.error("Chat request failed:", error);
    return errorResponse("The chat request failed", 500);
  }
}
