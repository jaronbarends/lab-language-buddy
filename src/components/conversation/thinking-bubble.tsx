import { Bubble } from "./bubble";
import styles from "./thinking-bubble.module.css";

export function ThinkingBubble() {
  return (
    <Bubble author="ai" as="div" role="status" aria-label="Waiting for a reply">
      <span className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    </Bubble>
  );
}
