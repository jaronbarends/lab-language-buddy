import type { LiveTranscript as LiveTranscriptValue } from "@/lib/session-reducer";

import styles from "./bubble.module.css";

type LiveTranscriptProps = {
  transcript: LiveTranscriptValue;
};

/**
 * The user's speech as it's being recognised. Settled words render normally;
 * the trailing words Deepgram hasn't committed to yet (`is_final: false`) are greyed,
 * so it's visible at a glance which part of the text may still change.
 *
 * `aria-live="polite"` rather than `assertive`: this updates several times a second
 * and should not interrupt.
 */
export function LiveTranscript({ transcript }: LiveTranscriptProps) {
  const nothingHeardYet = !transcript.finalized && !transcript.interim;

  return (
    <p
      className={`${styles.bubble} ${styles.user} ${styles.listening}`}
      aria-live="polite"
    >
      {nothingHeardYet ? (
        <span className={styles.placeholder}>Listening…</span>
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
    </p>
  );
}
