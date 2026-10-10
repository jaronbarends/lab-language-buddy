import { DEFAULT_CEFR_LEVEL, type CefrLevel } from "@/lib/cefr";
import type { EvaluationSegment } from "@/lib/chat-schema";
import type { LanguageCode } from "@/lib/languages";

export type Starter = "ai" | "user";

export type SessionConfig = {
  language: LanguageCode;
  level: CefrLevel;
  starter: Starter;
};

type TurnBase = {
  /**
   * Stable identity, assigned once when the turn is created.
   *
   * Everything that needs to point at a turn later — most importantly "which bubble
   * is currently being spoken" — matches on this, never on an array index or
   * `turns.length`. The spike had exactly that bug: `requestAiTurn` read `turns` from
   * a closure captured before the `setTurns` that appended the user's turn, so the
   * highlight landed one bubble too early. Matching on an id removes the race
   * regardless of how React batches the updates.
   *
   * The speech actions (`AI_SPEECH_PROGRESSED`, `AI_SPEECH_FINISHED`,
   * `AI_SPEECH_FAILED`) match on it too: with one `<audio>` element reused across
   * turns, a late event from the previous turn's audio must not land on the current one.
   */
  id: string;
  text: string;
};

/**
 * The evaluation of a user turn, from its own call (`use-evaluation-driver.ts`).
 * `ready` with a `null` correction means there was nothing worth correcting. Settled
 * means `ready` or `failed`; the AI's reply is not shown before that (see
 * `AI_TURN_RECEIVED`).
 */
export type Evaluation =
  | { status: "pending" }
  | { status: "ready"; correction: EvaluationSegment[] | null }
  | { status: "failed" };

/** What the chat call produced for an AI turn, before the turn is added to `turns`. */
export type AiReply = {
  id: string;
  text: string;
  interactionId: string;
};

export type Turn =
  | (TurnBase & { author: "user"; evaluation: Evaluation })
  | (TurnBase & {
      author: "ai";
      /**
       * Gemini's id for the interaction that produced this turn. The next request sends
       * the last AI turn's id as `previous_interaction_id`, which is how the conversation
       * history is chained without being resent. Derived from `turns` rather than kept as
       * a separate field, so ending the session (which drops the turns) resets the chain.
       */
      interactionId: string;
    });

/** The user's side of a turn, the one that carries an `evaluation`. */
export type UserTurn = Extract<Turn, { author: "user" }>;

/** What Deepgram gives us mid-utterance: settled text plus a volatile tail. */
export type LiveTranscript = {
  finalized: string;
  interim: string;
};

export type TurnState =
  | { name: "awaitingUser" }
  | {
      name: "listening";
      transcript: LiveTranscript;
      /**
       * False from `LISTENING_STARTED` until `MICROPHONE_STARTED`. Audio is actually
       * being recorded and sent only once this is true, so words said before are not heard.
       */
      microphoneIsLive: boolean;
    }
  /** Recording has stopped and the text is settled, but it has not been sent. */
  | { name: "reviewing"; draft: string }
  | {
      name: "editing";
      draft: string;
      /**
       * The text as it stood when editing began, so "Cancel edit" can put it back.
       *
       * This is why editing is its own state rather than a flag on `reviewing`:
       * the previous value has to live somewhere, and only this state has one.
       */
      draftBeforeEdit: string;
    }
  | {
      name: "aiThinking";
      /**
       * The reply has come in, but the evaluation of the user turn it answers is still
       * pending. It is held here and shown, with the AI starting to speak, once the
       * evaluation settles: the correction sits in the user's bubble, above the reply,
       * and the reply must not appear before it. It is released by `EVALUATION_RECEIVED`
       * or `EVALUATION_FAILED`, so the evaluation driver must always settle; its deadline
       * is `EVALUATION_TIMEOUT_MS` in `src/lib/evaluation-deadline.ts`.
       */
      pendingReply?: AiReply;
    }
  | { name: "aiSpeaking"; turnId: string; spokenWordCount: number }
  | {
      name: "error";
      /** Fixed generic text, chosen by whoever dispatched `FAILED`. */
      message: string;
      /** The raw error, truncated. Shown below the message when present. */
      detail?: string;
      /**
       * The turn state the failure came from. "Try again" needs it: a failed AI call
       * is retried by re-entering `aiThinking`, anything else falls back to the user.
       */
      from: TurnStateName;
    };

export type TurnStateName = TurnState["name"];

// The three groups the control bar tells apart, each narrowed to just its variants.
export type ComposingTurnState = Extract<
  TurnState,
  { name: "listening" | "reviewing" | "editing" }
>;
export type ErrorTurnState = Extract<TurnState, { name: "error" }>;
export type IdleTurnState = Extract<
  TurnState,
  { name: "awaitingUser" | "aiThinking" | "aiSpeaking" }
>;

/** Raw errors can be arbitrarily long; the screen only needs enough to recognise one. */
const MAX_ERROR_DETAIL_LENGTH = 300;

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  language: "no",
  level: DEFAULT_CEFR_LEVEL,
  starter: "ai",
};

export type SessionState =
  | {
      phase: "setup";
      /**
       * What the previous session was set to, so ending one and starting another
       * doesn't mean re-picking the same language every time. Null on first load.
       *
       * Held in memory only — a page reload starts from the defaults again, which
       * matches the brief's "no persistence".
       */
      lastConfig: SessionConfig | null;
    }
  | {
      phase: "conversation";
      config: SessionConfig;
      turns: Turn[];
      turnState: TurnState;
    };

export type SessionAction =
  | { type: "START"; config: SessionConfig }
  | { type: "LISTENING_STARTED" }
  | { type: "MICROPHONE_STARTED" }
  | { type: "TRANSCRIPT_UPDATED"; transcript: LiveTranscript }
  | { type: "DRAFT_EDIT_STARTED" }
  | { type: "DRAFT_CHANGED"; draft: string }
  | { type: "DRAFT_EDIT_CANCELLED" }
  | { type: "DRAFT_DISCARDED" }
  | { type: "USER_TURN_SENT"; id: string; text: string }
  | {
      type: "EVALUATION_RECEIVED";
      turnId: string;
      correction: EvaluationSegment[] | null;
    }
  | { type: "EVALUATION_FAILED"; turnId: string }
  | { type: "AI_TURN_RECEIVED"; id: string; text: string; interactionId: string }
  | { type: "AI_SPEECH_PROGRESSED"; turnId: string; spokenWordCount: number }
  | { type: "AI_SPEECH_FINISHED"; turnId: string }
  | { type: "AI_SPEECH_FAILED"; turnId: string }
  | { type: "FAILED"; message: string; detail?: string }
  | { type: "ERROR_DISMISSED" }
  | { type: "SESSION_ENDED" }
  /** For the development state stepper only. */
  | { type: "DEV_FORCED_TURN_STATE"; turnState: TurnState };

export const initialSessionState: SessionState = {
  phase: "setup",
  lastConfig: null,
};

export type ConversationState = Extract<
  SessionState,
  { phase: "conversation" }
>;

/**
 * Whether the session is in a conversation whose turn state is `name`. A type predicate,
 * so after `if (turnStateIs(state, "aiSpeaking"))` (or a const holding its result) the
 * compiler knows `state` is a conversation and what its `turnState` carries. This is the
 * one definition of the check the effect hooks make before doing anything.
 */
export function turnStateIs<N extends TurnStateName>(
  state: SessionState,
  name: N,
): state is ConversationState & { turnState: Extract<TurnState, { name: N }> } {
  return state.phase === "conversation" && state.turnState.name === name;
}

/**
 * The interaction id a request about `turn` continues the conversation from: that of the
 * last AI turn before it. `undefined` when there is none, which is when the user spoke
 * first, and when `turn` is not in `turns`. The chat call and the evaluation call for the
 * same message both use it, so both branch off the same turn.
 */
export function getPreviousInteractionId(
  turns: Turn[],
  turn: Turn,
): string | undefined {
  const turnIndex = turns.indexOf(turn);
  if (turnIndex === -1) {
    return undefined;
  }

  const lastAiTurnBefore = turns
    .slice(0, turnIndex)
    .findLast((earlierTurn) => earlierTurn.author === "ai");

  return lastAiTurnBefore?.author === "ai"
    ? lastAiTurnBefore.interactionId
    : undefined;
}

/** Whether the last turn is a user turn whose evaluation has not settled yet. */
function lastUserTurnIsBeingEvaluated(turns: Turn[]): boolean {
  const lastTurn = turns.at(-1);
  return lastTurn?.author === "user" && lastTurn.evaluation.status === "pending";
}

/**
 * The reply becomes an AI turn and starts being spoken, in the same transition and from
 * the same id: there is no window in which the turn and the "this one is speaking"
 * pointer disagree.
 */
function addAiTurnAndStartSpeaking(
  state: ConversationState,
  reply: AiReply,
): ConversationState {
  return {
    ...state,
    turns: [
      ...state.turns,
      {
        id: reply.id,
        author: "ai",
        text: reply.text,
        interactionId: reply.interactionId,
      },
    ],
    turnState: { name: "aiSpeaking", turnId: reply.id, spokenWordCount: 0 },
  };
}

export function joinTranscript({ finalized, interim }: LiveTranscript): string {
  return `${finalized} ${interim}`.trim();
}

/**
 * The text of the user's turn as it currently stands, wherever the state keeps it: the
 * joined transcript while listening, the draft while reviewing or editing. Accepts only
 * the composing states, so adding one to `ComposingTurnState` without a case here is a
 * compile error (the function would not return on every path) rather than silently
 * empty text. The only place that knows where the text lives.
 */
export function composedTextOf(turnState: ComposingTurnState): string {
  switch (turnState.name) {
    case "listening":
      return joinTranscript(turnState.transcript);
    case "reviewing":
    case "editing":
      return turnState.draft;
  }
}

/**
 * Pure. Every side effect — audio playback, getUserMedia, the Deepgram socket, the
 * fetches — lives in a hook that dispatches into this. Transitions that don't apply
 * to the current state are ignored rather than throwing: a late `TRANSCRIPT_UPDATED`
 * arriving after the socket closed is normal, not a bug worth crashing over.
 *
 * Contract for the async drivers, of which there are two kinds:
 *
 * - Sources bound to a turn state (chat, live transcription, playback). The reducer
 *   cannot tell a stale `AI_TURN_RECEIVED` or `TRANSCRIPT_UPDATED` from a current one —
 *   both only check the state name. So such a source must cancel when the state that
 *   started it is left: abort in-flight fetches, and detach handlers from and close
 *   sockets.
 * - Sources bound to a turn (the evaluation). These are deliberately not cancelled when
 *   the turn state is left: a failed chat call must not throw the correction away. Their
 *   actions carry the turn id, and the reducer ignores one for a turn whose evaluation
 *   is not `pending`. Such a source is cancelled when its turn no longer needs it, which
 *   includes the session ending.
 */
export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  if (action.type === "START") {
    return {
      phase: "conversation",
      config: action.config,
      turns: [],
      // Who speaks first is the whole difference between the two entry paths. Both
      // are reached from the same "Start chat" click, which is what lets the Safari
      // audio unlock in that click cover the AI's first spoken reply.
      turnState:
        action.config.starter === "ai"
          ? { name: "aiThinking" }
          : { name: "awaitingUser" },
    };
  }

  if (state.phase !== "conversation") {
    return state;
  }

  const { turnState } = state;

  switch (action.type) {
    // Ending a session drops straight back to setup — there's no summary screen in
    // between. The turns are discarded; the config is the one thing carried over,
    // so a repeat session doesn't mean re-picking the same language and level.
    case "SESSION_ENDED":
      return { phase: "setup", lastConfig: state.config };

    // Only the two states with a request or a socket in flight can fail. Anywhere
    // else a `FAILED` is a late arrival (say, the socket closing after recording
    // stopped) and must not overwrite a draft the user is looking at.
    case "FAILED":
      if (turnState.name !== "aiThinking" && turnState.name !== "listening") {
        return state;
      }
      return {
        ...state,
        turnState: {
          name: "error",
          message: action.message,
          detail: action.detail?.slice(0, MAX_ERROR_DETAIL_LENGTH),
          from: turnState.name,
        },
      };

    case "ERROR_DISMISSED":
      if (turnState.name !== "error") {
        return state;
      }
      // Recoverable by design. The spike dead-ended here and told the user to
      // reload, which throws away the conversation for what is usually a blip.
      //
      // A failed AI call is retried by re-entering `aiThinking`: the driver effect
      // re-runs on entering that state. Anything else goes back to the user; a
      // transcript that was in progress when listening failed is discarded.
      if (turnState.from === "aiThinking") {
        return { ...state, turnState: { name: "aiThinking" } };
      }
      return { ...state, turnState: { name: "awaitingUser" } };

    // Also accepted from `aiSpeaking`: Reply cuts the AI off. Leaving that state is the
    // whole interruption — the turn's text is already complete in `turns`, so the bubble
    // simply stops being highlighted and shows as it does after the audio ends. The
    // playback driver (`useAudioPlayback` in `use-audio-playback.ts`) must stop the
    // `<audio>` in the cleanup of its effect, which runs on leaving `aiSpeaking`; a
    // late `AI_SPEECH_FINISHED` is ignored here.
    case "LISTENING_STARTED":
      if (turnState.name !== "awaitingUser" && turnState.name !== "aiSpeaking") {
        return state;
      }
      return {
        ...state,
        turnState: {
          name: "listening",
          transcript: { finalized: "", interim: "" },
          microphoneIsLive: false,
        },
      };

    case "MICROPHONE_STARTED":
      if (turnState.name !== "listening" || turnState.microphoneIsLive) {
        return state;
      }
      return { ...state, turnState: { ...turnState, microphoneIsLive: true } };

    case "TRANSCRIPT_UPDATED":
      if (turnState.name !== "listening") {
        return state;
      }
      return {
        ...state,
        turnState: { ...turnState, transcript: action.transcript },
      };

    // Send, Edit and Cancel are all offered while the mic is still open, so each of
    // them ends recording as a side effect. There is no separate Stop button: it
    // would only ever be a step on the way to one of these three.
    case "DRAFT_EDIT_STARTED": {
      if (turnState.name === "listening") {
        const draft = joinTranscript(turnState.transcript);
        return {
          ...state,
          turnState: { name: "editing", draft, draftBeforeEdit: draft },
        };
      }
      if (turnState.name === "reviewing") {
        return {
          ...state,
          turnState: {
            name: "editing",
            draft: turnState.draft,
            draftBeforeEdit: turnState.draft,
          },
        };
      }
      return state;
    }

    case "DRAFT_CHANGED":
      if (turnState.name !== "editing") {
        return state;
      }
      return { ...state, turnState: { ...turnState, draft: action.draft } };

    // Backs out of the edit only, not the turn: the text reverts to what it was and
    // the same three controls come back. The mic does not restart.
    case "DRAFT_EDIT_CANCELLED":
      if (turnState.name !== "editing") {
        return state;
      }
      return {
        ...state,
        turnState: { name: "reviewing", draft: turnState.draftBeforeEdit },
      };

    // Backs out of the whole turn: the transcript is dropped and the user can start
    // over. Not offered while editing — "Cancel edit" occupies that slot there.
    case "DRAFT_DISCARDED":
      if (turnState.name !== "listening" && turnState.name !== "reviewing") {
        return state;
      }
      return { ...state, turnState: { name: "awaitingUser" } };

    case "USER_TURN_SENT":
      if (
        turnState.name !== "listening" &&
        turnState.name !== "reviewing" &&
        turnState.name !== "editing"
      ) {
        return state;
      }
      // An empty turn is never worth sending, whichever component dispatched it.
      if (!action.text.trim()) {
        return state;
      }
      return {
        ...state,
        turns: [
          ...state.turns,
          {
            id: action.id,
            author: "user",
            text: action.text.trim(),
            evaluation: { status: "pending" },
          },
        ],
        turnState: { name: "aiThinking" },
      };

    // Matched by turn id, like the speech actions: the evaluation outlives `aiThinking`
    // (a failed chat call does not cancel it), so only the turn can say whether the
    // answer still applies. One for a turn that is not pending is ignored.
    case "EVALUATION_RECEIVED":
    case "EVALUATION_FAILED": {
      const turn = state.turns.find(
        (candidate) => candidate.id === action.turnId,
      );
      if (turn?.author !== "user" || turn.evaluation.status !== "pending") {
        return state;
      }
      const evaluation: Evaluation =
        action.type === "EVALUATION_RECEIVED"
          ? { status: "ready", correction: action.correction }
          : { status: "failed" };
      const settledState: ConversationState = {
        ...state,
        turns: state.turns.map((candidate) =>
          candidate.id === turn.id ? { ...turn, evaluation } : candidate,
        ),
      };
      // The reply that was waiting for this evaluation is released with it.
      if (turnState.name === "aiThinking" && turnState.pendingReply) {
        return addAiTurnAndStartSpeaking(settledState, turnState.pendingReply);
      }
      return settledState;
    }

    // The reply waits for the evaluation of the user turn it answers: the correction may
    // appear before the reply, never after it. The opening AI turn answers nothing, so
    // nothing holds it back.
    case "AI_TURN_RECEIVED": {
      if (turnState.name !== "aiThinking" || turnState.pendingReply) {
        return state;
      }
      const reply: AiReply = {
        id: action.id,
        text: action.text,
        interactionId: action.interactionId,
      };
      if (lastUserTurnIsBeingEvaluated(state.turns)) {
        return {
          ...state,
          turnState: { name: "aiThinking", pendingReply: reply },
        };
      }
      return addAiTurnAndStartSpeaking(state, reply);
    }

    case "AI_SPEECH_PROGRESSED":
      if (
        turnState.name !== "aiSpeaking" ||
        action.turnId !== turnState.turnId
      ) {
        return state;
      }
      if (turnState.spokenWordCount === action.spokenWordCount) {
        // `ontimeupdate` fires far more often than the highlight actually moves;
        // bailing on an unchanged count keeps this from re-rendering the thread
        // several times a second.
        return state;
      }
      return {
        ...state,
        turnState: { ...turnState, spokenWordCount: action.spokenWordCount },
      };

    case "AI_SPEECH_FINISHED":
      if (
        turnState.name !== "aiSpeaking" ||
        action.turnId !== turnState.turnId
      ) {
        return state;
      }
      return { ...state, turnState: { name: "awaitingUser" } };

    // Failed TTS degrades to text-only: the AI's text is already on screen, so this
    // goes to `awaitingUser` without an error state. Deliberately not
    // `AI_SPEECH_FINISHED`, so the two stay distinguishable. The dispatching driver
    // is responsible for `console.error`; nothing here logs.
    case "AI_SPEECH_FAILED":
      if (
        turnState.name !== "aiSpeaking" ||
        action.turnId !== turnState.turnId
      ) {
        return state;
      }
      return { ...state, turnState: { name: "awaitingUser" } };

    case "DEV_FORCED_TURN_STATE":
      return { ...state, turnState: action.turnState };

    // Compile-time exhaustiveness: adding an action to `SessionAction` without a case
    // above makes this fail to type-check. Still returns `state` at runtime.
    default:
      action satisfies never;
      return state;
  }
}
