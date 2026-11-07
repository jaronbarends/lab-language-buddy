"use client";

import { useSyncExternalStore } from "react";

import { TurnBubble } from "@/components/conversation/turn-bubble";

import {
  getServerUserBubblePreviewState,
  getUserBubblePreviewState,
  subscribeToUserBubblePreview,
} from "./user-bubble-preview-store";

type UserBubblePreviewProps = {
  conversationLang: string;
};

/**
 * Development-only. Shows one sent user bubble with the real reveal, from local state,
 * entirely outside the session reducer and the drivers. Renders nothing until a button
 * in the dev panel starts a run, and then stays as the thread's last child until the
 * next run replaces it. Only the bubble: no control bar, no draft, no AI dots.
 *
 * The thread only renders this when NODE_ENV is "development", which is what removes it
 * (and its import) from a production bundle. The NODE_ENV return below is a second
 * guard; its hook sits above it, so on its own it would not drop anything.
 */
export function UserBubblePreview({ conversationLang }: UserBubblePreviewProps) {
  const { runId, turn } = useSyncExternalStore(
    subscribeToUserBubblePreview,
    getUserBubblePreviewState,
    getServerUserBubblePreviewState,
  );

  if (process.env.NODE_ENV !== "development" || !turn) {
    return null;
  }

  // A new key per run remounts the bubble, so its animation plays again.
  return (
    <TurnBubble
      key={`dev-user-preview-${runId}`}
      turn={turn}
      conversationLang={conversationLang}
      spokenWordCount={null}
      shouldReveal
    />
  );
}
