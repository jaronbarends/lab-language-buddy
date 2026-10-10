"use client";

import { useEffect, type Dispatch } from "react";

import {
  EvaluationResponseSchema,
  type EvaluationRequestBody,
} from "@/lib/chat-schema";
import { EVALUATION_TIMEOUT_MS } from "@/lib/evaluation-deadline";
import { postJsonWithDeadline } from "@/lib/post-json";
import {
  getPreviousInteractionId,
  type SessionAction,
  type SessionConfig,
  type SessionState,
  type Turn,
  type UserTurn,
} from "@/lib/session-reducer";

// Read as a literal property so Next can inline it at build time. The same switch as the
// chat route's: a mocked chat with a real evaluation is rarely what anyone wants.
const EVALUATION_ENDPOINT =
  process.env.NEXT_PUBLIC_USE_MOCK_CHAT === "true"
    ? "/api/mock/evaluation"
    : "/api/evaluation";

/**
 * The evaluation of a user turn: while a user turn's evaluation is `pending`, one request
 * to the evaluation route, answered with `EVALUATION_RECEIVED` or `EVALUATION_FAILED`.
 *
 * It follows the turn, not the turn state, so it is independent of `aiThinking`: a chat
 * call that fails does not cancel the evaluation, and trying again does not request it a
 * second time, because the turn is still pending or already settled. It is aborted when
 * the turn stops being the one to evaluate, which includes ending the session. A late
 * answer therefore never arrives; the reducer would ignore it anyway.
 */
export function useEvaluationDriver(
  state: SessionState,
  dispatch: Dispatch<SessionAction>,
): void {
  const turnToEvaluate = getTurnToEvaluate(state);
  const turnToEvaluateId = turnToEvaluate?.id;

  useEffect(() => {
    if (state.phase !== "conversation" || !turnToEvaluate) {
      return;
    }
    const turnId = turnToEvaluate.id;
    const evaluationRequestBody = createEvaluationRequestBody(
      state.config,
      state.turns,
      turnToEvaluate,
    );

    // The returned cleanup cancels the request (silently) when the turn is no longer the
    // one to evaluate; the deadline, on the other hand, means the reply is waiting, so it
    // ends in `EVALUATION_FAILED`.
    return postJsonWithDeadline(EVALUATION_ENDPOINT, evaluationRequestBody, {
      timeoutMs: EVALUATION_TIMEOUT_MS,
      parse: (json) => EvaluationResponseSchema.parse(json),
      onResult: ({ correction }) => {
        dispatch({ type: "EVALUATION_RECEIVED", turnId, correction });
      },
      onFailure: (error) => {
        console.error(error);
        dispatch({ type: "EVALUATION_FAILED", turnId });
      },
    });
    // `state` is deliberately absent, as in `use-chat-driver.ts`: the turn being
    // evaluated is the trigger, and the request body is built from the state at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnToEvaluateId, dispatch]);
}

/** The user turn still waiting for its evaluation, if any. */
function getTurnToEvaluate(state: SessionState): UserTurn | undefined {
  if (state.phase !== "conversation") {
    return undefined;
  }

  return state.turns.findLast(
    (turn): turn is UserTurn =>
      turn.author === "user" && turn.evaluation.status === "pending",
  );
}

/**
 * The corrector gets the conversation by continuing from the last AI turn before the
 * message, as the chat request does; there is none when the user spoke first.
 */
function createEvaluationRequestBody(
  config: SessionConfig,
  turns: Turn[],
  turn: UserTurn,
): EvaluationRequestBody {
  const { language, level } = config;

  return {
    language,
    level,
    input: turn.text,
    previousInteractionId: getPreviousInteractionId(turns, turn),
  };
}
