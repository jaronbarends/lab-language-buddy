import styles from "./bubble.module.css";

export function ThinkingBubble() {
  return (
    <div
      className={`${styles.bubble} ${styles.ai} ${styles.thinking}`}
      role="status"
      aria-label="Waiting for a reply"
    >
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}
