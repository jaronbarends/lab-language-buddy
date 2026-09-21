import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

import { ChatResponseJSONSchema, ChatResponseSchema } from '@/lib/chatResponseSchema';
import { AI_STARTING_PROMPT, getSystemInstruction } from '@/lib/systemInstruction';

const MODEL = 'gemini-3.1-flash-lite';

type ChatRequestBody = {
  input?: string;
  previousInteractionId?: string;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
  }

  const body: ChatRequestBody = await request.json();
  const input = body.input ?? AI_STARTING_PROMPT;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.interactions.create({
      model: MODEL,
      input,
      system_instruction: getSystemInstruction(),
      previous_interaction_id: body.previousInteractionId,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: ChatResponseJSONSchema,
      },
    });

    const parsed = ChatResponseSchema.parse(JSON.parse(response.output_text ?? '{}'));

    return NextResponse.json({
      interactionId: response.id,
      reply: parsed.reply,
      correction: parsed.correction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
