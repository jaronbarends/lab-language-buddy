"use client";

import { useEffect, useSyncExternalStore } from "react";

import { AiBubble } from "@/components/conversation/ai-bubble";

import {
  getAiBubblePreviewState,
  getServerAiBubblePreviewState,
  showAiBubblePreviewReply,
  subscribeToAiBubblePreview,
} from "./ai-bubble-preview-store";

type AiBubblePreviewProps = {
  conversationLang: string;
};

/**
 * Development-only. Replays the dots-to-text transition of `AiBubble` from local state,
 * entirely outside the session reducer and the drivers. Renders nothing until a button
 * in the dev panel starts a run, and then stays as the thread's last child (the reply
 * remains until the next run replaces it).
 *
 * The thread only renders this when NODE_ENV is "development", which is what removes it
 * (and its import) from a production bundle. The NODE_ENV return below is a second
 * guard, kept in case it is ever rendered without that gate; its hooks sit above it,
 * so on its own it would not drop anything from the bundle.
 */
export function AiBubblePreview({ conversationLang }: AiBubblePreviewProps) {
  const preview = useSyncExternalStore(
    subscribeToAiBubblePreview,
    getAiBubblePreviewState,
    getServerAiBubblePreviewState,
  );
  const { phase, runId } = preview;
  // Only a thinking run has a duration; the effect below returns early otherwise.
  const thinkingDurationMs =
    preview.phase === "thinking" ? preview.thinkingDurationMs : 0;

  // Decided here: the timer lives in the component, so unmounting always clears it.
  useEffect(() => {
    if (phase !== "thinking") {
      return;
    }
    const timer = setTimeout(() => {
      showAiBubblePreviewReply(runId);
    }, thinkingDurationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [phase, runId, thinkingDurationMs]);

  if (process.env.NODE_ENV !== "development" || preview.phase === "idle") {
    return null;
  }

  // Same key for the dots and the reply within a run keeps one element, which is what
  // lets the animation run; a new run gets a new key, so it remounts and can replay.
  return (
    <AiBubble
      key={`dev-preview-${runId}`}
      turn={preview.phase === "replied" ? preview.turn : null}
      conversationLang={conversationLang}
      spokenWordCount={null}
      followsSentTurn={preview.followsSentTurn}
    />
  );
}
