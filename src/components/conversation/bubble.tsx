import type { HTMLAttributes } from "react";

import styles from "./bubble.module.css";

type BubbleProps = HTMLAttributes<HTMLElement> & {
  author: "ai" | "user";
  /**
   * Text bubbles are paragraphs, so `p` is the default. The thinking indicator and the
   * editor hold things a <p> may not contain, and use `div`.
   */
  as?: "p" | "div";
};

/**
 * The frame every speech bubble shares: turns, the thinking indicator, the live
 * transcript, the settled draft and the editor. Size, padding, border, colour, line
 * height and weight live here and nowhere else, so two bubbles that are meant to look
 * the same — the live transcript becoming the draft the moment recording stops — cannot
 * drift apart. What goes inside, and any layout of it, is the caller's.
 *
 * Extra attributes (aria-live, role, …) pass straight through to the element.
 */
export function Bubble({
  author,
  as: Element = "p",
  className,
  children,
  ...rest
}: BubbleProps) {
  const classNames = [
    styles.bubble,
    author === "ai" ? styles.ai : styles.user,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Element className={classNames} {...rest}>
      {children}
    </Element>
  );
}
