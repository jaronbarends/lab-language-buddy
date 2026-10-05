"use client";

import { useLayoutEffect, useRef } from "react";

import type { LiveTranscript as LiveTranscriptValue } from "@/lib/session-reducer";

import { Bubble, BubbleText } from "./bubble";
import styles from "./live-transcript.module.css";

/**
 * How far from the bottom the text can be and still count as "at the bottom". Scroll
 * positions are fractional on high-density screens, so an exact comparison would stop
 * following for no reason the user can see.
 */
const FOLLOW_TOLERANCE_PX = 4;

type LiveTranscriptProps = {
  transcript: LiveTranscriptValue;
  conversationLang: string;
  microphoneIsLive: boolean;
};

/**
 * The user's speech as it's being recognised. Settled words render normally;
 * the trailing words Deepgram hasn't committed to yet (`is_final: false`) are greyed,
 * so it's visible at a glance which part of the text may still change.
 *
 * `aria-live="polite"` rather than `assertive`: this updates several times a second
 * and should not interrupt.
 *
 * The text is capped in height (see BubbleText), so a long transcript scrolls. It
 * follows the newest words for as long as the user has not scrolled away from the
 * bottom; scrolling up stops that, and scrolling back down resumes it.
 */
export function LiveTranscript({
  transcript,
  conversationLang,
  microphoneIsLive,
}: LiveTranscriptProps) {
  const nothingHeardYet = !transcript.finalized && !transcript.interim;

  const textRef = useRef<HTMLSpanElement | null>(null);
  const followingTheNewestWordsRef = useRef(true);

  function handleScroll() {
    const text = textRef.current;
    if (!text) {
      return;
    }

    const distanceFromBottom =
      text.scrollHeight - text.clientHeight - text.scrollTop;
    followingTheNewestWordsRef.current =
      distanceFromBottom <= FOLLOW_TOLERANCE_PX;
  }

  // Keyed on the words themselves, not on the transcript object, so a re-render that
  // brings no new words does not scroll. Before paint, so the newest words are never
  // seen below the edge for a frame. Growth does not fire a scroll event, so the flag
  // above only changes when the user (or this effect) actually moves the text.
  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text || !followingTheNewestWordsRef.current) {
      return;
    }

    text.scrollTop = text.scrollHeight;
  }, [transcript.finalized, transcript.interim]);

  return (
    <Bubble author="user" className={styles.listening} aria-live="polite">
      {microphoneIsLive && (
        <span className={styles.listeningIndicator} aria-hidden="true" />
      )}
      <BubbleText ref={textRef} lang={conversationLang} onScroll={handleScroll}>
        {nothingHeardYet ? (
          // The placeholder is UI text, not recognised speech: back to the page's
          // language (see <html lang> in layout.tsx).
          <span className={styles.placeholder} lang="en">
            {microphoneIsLive ? "Listening…" : "Preparing mic…"}
          </span>
        ) : (
          <>
            {transcript.finalized}
            {transcript.interim && (
              <span className={styles.interim}>
                {transcript.finalized ? " " : ""}
                {transcript.interim}
              </span>
            )}
          </>
        )}
      </BubbleText>
    </Bubble>
  );
}
