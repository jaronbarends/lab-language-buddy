"use client";

import { useEffect, type Dispatch } from "react";

import { ChatResponseSchema, type ChatRequest } from "@/lib/chat-schema";
import { postJson } from "@/lib/post-json";
import {
  turnStateIs,
  type ConversationState,
  type SessionAction,
  type SessionState,
} from "@/lib/session-reducer";

// Read as a literal property so Next can inline it at build time; a dynamic lookup of
// the name would not be replaced. Dev-only in effect: the mock route 404s elsewhere.
const CHAT_ENDPOINT =
  process.env.NEXT_PUBLIC_USE_MOCK_CHAT === "true"
    ? "/api/mock/chat"
    : "/api/chat";

const CHAT_FAILED_MESSAGE = "The AI couldn't come up with a reply.";

/** Generous for a Gemini round trip; only there so a stalled response can't hang `aiThinking`. */
const CHAT_TIMEOUT_MS = 30_000;

/**
 * The Gemini round trip: while the turn state is `aiThinking`, one request to the chat
 * route, answered with `AI_TURN_RECEIVED` or `FAILED`. The reducer may hold a reply back
 * until the evaluation of the user turn has settled; the evaluation is not this hook's
 * business (see `use-evaluation-driver.ts`).
 *
 * Everything the request needs is derived from `turns`: no turns yet means the AI
 * speaks first (`aiStarts`); a last turn that is the user's is a `userTurn` carrying its
 * text, chained to the last AI turn's `interactionId` when there is one. That is also
 * why retrying after an error needs no bookkeeping: a failed request adds no turn, so
 * entering `aiThinking` again sends the same request.
 */
export function useChatDriver(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
): void {
  const turnStateIsAiThinking = turnStateIs(state, "aiThinking");

  useEffect(() => {
    if (!turnStateIsAiThinking) {
      return;
    }

    const chatRequest = chatRequestFrom(state);
    if (!chatRequest) {
      dispatch({
        type: "FAILED",
        message: CHAT_FAILED_MESSAGE,
        detail: "There is no user turn to answer",
      });
      return;
    }

    // Per the reducer's contract: a reply that arrives after `aiThinking` was left
    // would be accepted by whatever state the reducer is in now, so it must not arrive.
    const abortController = new AbortController();

    // An abort from the cleanup below means the state was left and nobody is waiting;
    // an abort from this deadline means the user is, so it has to end in `FAILED`.
    let requestHasTimedOut = false;
    const timeoutId = setTimeout(() => {
      requestHasTimedOut = true;
      abortController.abort();
    }, CHAT_TIMEOUT_MS);

    fetchChatReply(chatRequest, abortController.signal)
      .then(({ interactionId, reply }) => {
        dispatch({
          type: "AI_TURN_RECEIVED",
          id: crypto.randomUUID(),
          text: reply,
          interactionId,
        });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted && !requestHasTimedOut) {
          return;
        }
        console.error(error);
        dispatch({
          type: "FAILED",
          message: CHAT_FAILED_MESSAGE,
          detail: requestHasTimedOut
            ? "The request timed out"
            : error instanceof Error
              ? error.message
              : String(error),
        });
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
    // `state` is deliberately absent: re-running on every turns change would abort and
    // resend the request. Entering the state is the trigger, and the request is built
    // from the state as it is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnStateIsAiThinking, dispatch]);
}

/**
 * `null` when the last turn is the AI's: there is nothing to answer. Only reachable by
 * forcing `aiThinking` from the dev state stepper.
 */
function chatRequestFrom(state: ConversationState): ChatRequest | null {
  const { config, turns } = state;
  const { language, level } = config;
  const lastTurn = turns.at(-1);

  if (!lastTurn) {
    return { kind: "aiStarts", language, level };
  }
  if (lastTurn.author === "ai") {
    return null;
  }

  const lastAiTurn = turns.findLast((turn) => turn.author === "ai");

  return {
    kind: "userTurn",
    language,
    level,
    input: lastTurn.text,
    previousInteractionId:
      lastAiTurn?.author === "ai" ? lastAiTurn.interactionId : undefined,
  };
}

async function fetchChatReply(request: ChatRequest, signal: AbortSignal) {
  return ChatResponseSchema.parse(await postJson(CHAT_ENDPOINT, request, signal));
}
