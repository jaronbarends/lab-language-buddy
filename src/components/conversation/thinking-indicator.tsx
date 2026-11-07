import styles from "./thinking-indicator.module.css";

/**
 * The pulsing dots shown inside the AI bubble while it waits for a reply. Only the
 * content: the bubble itself is AiBubble's, so the same element can turn into the reply.
 */
export function ThinkingIndicator({ className }: { className?: string }) {
  return (
    <span className={[styles.dots, className].filter(Boolean).join(" ")}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}
