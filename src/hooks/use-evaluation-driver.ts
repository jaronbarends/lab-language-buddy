"use client";

import { useEffect, type Dispatch } from "react";

import {
  EvaluationResponseSchema,
  type EvaluationRequest,
} from "@/lib/chat-schema";
import { postJson } from "@/lib/post-json";
import type { SessionAction, SessionState } from "@/lib/session-reducer";

// Read as a literal property so Next can inline it at build time. The same switch as the
// chat route's: a mocked chat with a real evaluation is rarely what anyone wants.
const EVALUATION_ENDPOINT =
  process.env.NEXT_PUBLIC_USE_MOCK_CHAT === "true"
    ? "/api/mock/evaluation"
    : "/api/evaluation";

/**
 * After this the evaluation counts as failed. It matters because the AI's reply waits for
 * the evaluation (see `AI_TURN_RECEIVED` in the reducer): a corrector that never answers
 * would otherwise hold the reply back for good.
 */
const EVALUATION_TIMEOUT_MS = 10_000;

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
  const turnToEvaluate = evaluationRequestFrom(state);
  const turnToEvaluateId = turnToEvaluate?.turnId;

  useEffect(() => {
    if (!turnToEvaluate) {
      return;
    }
    const { turnId, request } = turnToEvaluate;

    const abortController = new AbortController();

    // An abort from the cleanup below means the turn is no longer the one to evaluate and
    // nobody is waiting; an abort from this deadline means the reply is, so it has to end
    // in `EVALUATION_FAILED`.
    let requestHasTimedOut = false;
    const timeoutId = setTimeout(() => {
      requestHasTimedOut = true;
      abortController.abort();
    }, EVALUATION_TIMEOUT_MS);

    fetchEvaluation(request, abortController.signal)
      .then(({ correction }) => {
        dispatch({ type: "EVALUATION_RECEIVED", turnId, correction });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted && !requestHasTimedOut) {
          return;
        }
        console.error(error);
        dispatch({ type: "EVALUATION_FAILED", turnId });
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
    // `state` is deliberately absent, as in `use-chat-driver.ts`: the turn being
    // evaluated is the trigger, and the request is built from the state at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnToEvaluateId, dispatch]);
}

/** `null` when no user turn is waiting for its evaluation. */
function evaluationRequestFrom(
  state: SessionState,
): { turnId: string; request: EvaluationRequest } | null {
  if (state.phase !== "conversation") {
    return null;
  }

  const turn = state.turns.findLast(
    (candidate) =>
      candidate.author === "user" && candidate.evaluation.status === "pending",
  );
  if (!turn) {
    return null;
  }

  const { language, level } = state.config;
  return { turnId: turn.id, request: { language, level, input: turn.text } };
}

async function fetchEvaluation(
  request: EvaluationRequest,
  signal: AbortSignal,
) {
  return EvaluationResponseSchema.parse(
    await postJson(EVALUATION_ENDPOINT, request, signal),
  );
}
