import type { LiveTranscript as LiveTranscriptValue } from "@/lib/session-reducer";

import { Bubble } from "./bubble";
import styles from "./live-transcript.module.css";

type LiveTranscriptProps = {
  transcript: LiveTranscriptValue;
  conversationLang: string;
};

/**
 * The user's speech as it's being recognised. Settled words render normally;
 * the trailing words Deepgram hasn't committed to yet (`is_final: false`) are greyed,
 * so it's visible at a glance which part of the text may still change.
 *
 * `aria-live="polite"` rather than `assertive`: this updates several times a second
 * and should not interrupt.
 */
export function LiveTranscript({
  transcript,
  conversationLang,
}: LiveTranscriptProps) {
  const nothingHeardYet = !transcript.finalized && !transcript.interim;

  return (
    <Bubble author="user" className={styles.listening} aria-live="polite">
      <span className={styles.listeningIndicator} aria-hidden="true" />
      <span lang={conversationLang}>
        {nothingHeardYet ? (
          // The placeholder is UI text, not recognised speech: back to the page's
          // language (see <html lang> in layout.tsx).
          <span className={styles.placeholder} lang="en">
            Listening…
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
      </span>
    </Bubble>
  );
}
