import styles from "./thinking-bubble.module.css";

/**
 * The pulsing dots shown inside the AI bubble while it waits for a reply. Only the
 * content: the bubble itself is AiBubble's, so the same element can turn into the reply.
 */
export function ThinkingBubble() {
  return (
    <span className={styles.dots}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
