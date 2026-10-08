import { errorResponse, readChatRequestBody } from "@/lib/chat-request";
import type { ChatResponse } from "@/lib/chat-schema";
import { mockAiLine } from "@/lib/mock-conversation";

/** Roughly what a Gemini round trip takes, so the thinking bubble is visible. */
const MOCK_LATENCY_MS = 1300;

const MOCK_ID_PREFIX = "mock-";

/**
 * The mock keeps no state, so the position in the canned script travels in the
 * interaction id: `mock-<n>` is the id of AI turn n, and the next request hands it back
 * as `previousInteractionId`. No previous id means the first AI turn. A retry sends the
 * same previous id and so gets the same line.
 */
function aiTurnIndexAfter(previousInteractionId: string | undefined): number {
  if (!previousInteractionId?.startsWith(MOCK_ID_PREFIX)) {
    return 0;
  }
  const previousIndex = Number(previousInteractionId.slice(MOCK_ID_PREFIX.length));
  return Number.isInteger(previousIndex) ? previousIndex + 1 : 0;
}

/**
 * Stand-in for `/api/chat` while developing without a Gemini key or quota. The client
 * picks it via `NEXT_PUBLIC_USE_MOCK_CHAT`; see `use-chat-driver.ts`. Same request and
 * response contract as the real route, from `chat-schema.ts`.
 */
export async function POST(request: Request) {
  // It has no business existing outside development.
  if (process.env.NODE_ENV !== "development") {
    return errorResponse("Mock chat is only available in development", 404);
  }

  const parsed = await readChatRequestBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }
  const chatRequestBody = parsed.body;
  const previousInteractionId =
    chatRequestBody.kind === "userTurn"
      ? chatRequestBody.previousInteractionId
      : undefined;

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const aiTurnIndex = aiTurnIndexAfter(previousInteractionId);
  const chatResponse: ChatResponse = {
    interactionId: `${MOCK_ID_PREFIX}${aiTurnIndex}`,
    reply: mockAiLine(chatRequestBody.language, aiTurnIndex),
  };

  return Response.json(chatResponse);
}
