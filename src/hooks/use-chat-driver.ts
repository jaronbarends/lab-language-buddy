"use client";

import { useEffect, type Dispatch } from "react";

import {
  ChatResponseSchema,
  type ChatRequest,
} from "@/lib/chat-schema";
import type { SessionAction, SessionState } from "@/lib/session-reducer";

// Read as a literal property so Next can inline it at build time; a dynamic lookup of
// the name would not be replaced. Dev-only in effect: the mock route 404s elsewhere.
const CHAT_ENDPOINT =
  process.env.NEXT_PUBLIC_USE_MOCK_CHAT === "true"
    ? "/api/mock/chat"
    : "/api/chat";

type ConversationState = Extract<SessionState, { phase: "conversation" }>;

const CHAT_FAILED_MESSAGE = "The AI couldn't come up with a reply.";

/**
 * The Gemini round trip: while the turn state is `aiThinking`, one request to the chat
 * route, answered with `AI_TURN_RECEIVED` or `FAILED`.
 *
 * Everything the request needs is derived from `turns`: the user's latest text is the
 * last turn when it is theirs, and the conversation chain is the last AI turn's
 * `interactionId`. That is also why retrying after an error needs no bookkeeping: a
 * failed request adds no turn, so entering `aiThinking` again sends the same request.
 */
export function useChatDriver(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
): void {
  const phase = state.phase;
  const turnStateName =
    state.phase === "conversation" ? state.turnState.name : null;

  useEffect(() => {
    if (state.phase !== "conversation" || turnStateName !== "aiThinking") {
      return;
    }

    // Per the reducer's contract: a reply that arrives after `aiThinking` was left
    // would be accepted by whatever state the reducer is in now, so it must not arrive.
    const abortController = new AbortController();

    fetchChatReply(chatRequestFrom(state), abortController.signal)
      .then(({ interactionId, reply }) => {
        dispatch({
          type: "AI_TURN_RECEIVED",
          id: crypto.randomUUID(),
          text: reply,
          interactionId,
        });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }
        console.error(error);
        dispatch({
          type: "FAILED",
          message: CHAT_FAILED_MESSAGE,
          detail: error instanceof Error ? error.message : String(error),
        });
      });

    return () => abortController.abort();
    // `state` is deliberately absent: re-running on every turns change would abort and
    // resend the request. Entering the state is the trigger, and the request is built
    // from the state as it is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnStateName, dispatch]);
}

function chatRequestFrom(state: ConversationState): ChatRequest {
  const { config, turns } = state;
  const lastTurn = turns.at(-1);
  const lastAiTurn = turns.findLast((turn) => turn.author === "ai");

  return {
    language: config.language,
    level: config.level,
    input: lastTurn?.author === "user" ? lastTurn.text : undefined,
    previousInteractionId:
      lastAiTurn?.author === "ai" ? lastAiTurn.interactionId : undefined,
  };
}

async function fetchChatReply(request: ChatRequest, signal: AbortSignal) {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(await errorTextOf(response));
  }

  return ChatResponseSchema.parse(await response.json());
}

/** The routes answer failures with `{ error }`; anything else falls back to the status. */
async function errorTextOf(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`;
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Not JSON — the status is all there is.
  }
  return fallback;
}
