import type { Turn } from "@/lib/session-reducer";

type AiTurn = Extract<Turn, { author: "ai" }>;

export type AiBubblePreviewState =
  | { phase: "idle"; runId: number }
  | { phase: "thinking"; runId: number; text: string }
  | { phase: "replied"; runId: number; turn: AiTurn };

/**
 * Development-only. A tiny module-level store (read with `useSyncExternalStore`) that
 * carries the AI bubble preview between the dev panel and the thread.
 *
 * Chosen over a CustomEvent on `window` because the dev panel also has to know whether
 * a run is pending, to disable its buttons; with an event that would need a second
 * event or shared state anyway. It sits outside the session reducer on purpose: forcing
 * `aiThinking` there starts the chat driver (JNL-003).
 *
 * Bundle: the preview component is dead code in production (gated in the thread).
 * StateStepper still imports this module and calls its hook above its NODE_ENV return,
 * and renders null in production. A production build was checked for "dev-preview" (the
 * reply turn's interactionId, in this file) and found none, so the reply-building code
 * is shaken out; the subscribe/getter helpers may remain, unchecked (names are minified).
 */
let state: AiBubblePreviewState = { phase: "idle", runId: 0 };
const listeners = new Set<() => void>();

function setState(next: AiBubblePreviewState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeToAiBubblePreview(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAiBubblePreviewState() {
  return state;
}

// A stable object: getServerSnapshot must return the same reference every call.
const IDLE_SERVER_STATE: AiBubblePreviewState = { phase: "idle", runId: 0 };

export function getServerAiBubblePreviewState(): AiBubblePreviewState {
  return IDLE_SERVER_STATE;
}

/** Starts a run: the dots now, the reply once `showAiBubblePreviewReply` is called. */
export function startAiBubblePreview(text: string) {
  if (state.phase === "thinking") {
    return;
  }
  setState({ phase: "thinking", runId: state.runId + 1, text });
}

export function showAiBubblePreviewReply(runId: number) {
  if (state.phase !== "thinking" || state.runId !== runId) {
    return;
  }
  setState({
    phase: "replied",
    runId,
    turn: {
      id: crypto.randomUUID(),
      author: "ai",
      text: state.text,
      interactionId: "dev-preview",
    },
  });
}
