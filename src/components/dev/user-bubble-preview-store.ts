import type { UserTurn } from "@/lib/session-reducer";

export type UserBubblePreviewState = {
  /** A new number per run: the preview's key, so each run remounts and replays. */
  runId: number;
  /** Null until the first press: an idle preview renders nothing. */
  turn: UserTurn | null;
};

/**
 * Development-only. A tiny module-level store (read with `useSyncExternalStore`) that
 * carries the user bubble preview between the dev panel and the thread. Same reasons as
 * the AI bubble preview's store: it sits outside the session reducer on purpose, since
 * sending a real turn would start the chat and evaluation drivers (JNL-003, K11). Kept
 * as a second store rather than stretched over the AI one: that one is about the dots
 * turning into a reply, this one has no phases.
 *
 * Bundle: the preview component is dead code in production (gated in the thread).
 * StateStepper imports showUserBubblePreview, but only uses it after its NODE_ENV return,
 * so a production build should drop the code that builds the turn; checked by looking for
 * the string "dev-user-preview" (in the id below) in .next/static.
 */
let state: UserBubblePreviewState = { runId: 0, turn: null };
const listeners = new Set<() => void>();

export function subscribeToUserBubblePreview(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getUserBubblePreviewState() {
  return state;
}

// A stable object: getServerSnapshot must return the same reference every call.
const IDLE_SERVER_STATE: UserBubblePreviewState = { runId: 0, turn: null };

export function getServerUserBubblePreviewState(): UserBubblePreviewState {
  return IDLE_SERVER_STATE;
}

/**
 * Shows one just-sent user turn, with the evaluation still pending, as a real send
 * leaves it. Pressing again replaces it with a new run, which replays the reveal.
 */
export function showUserBubblePreview(text: string) {
  state = {
    runId: state.runId + 1,
    turn: {
      id: `dev-user-preview-${crypto.randomUUID()}`,
      author: "user",
      text,
      evaluation: { status: "pending" },
    },
  };
  listeners.forEach((listener) => listener());
}
