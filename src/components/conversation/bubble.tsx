import type { HTMLAttributes, Ref } from "react";

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

type BubbleTextProps = HTMLAttributes<HTMLSpanElement> & {
  ref?: Ref<HTMLSpanElement>;
};

/**
 * The text inside a bubble, for the three bubbles that hold the user's own words: live
 * transcript, settled draft and editor. It caps the text at 40% of the viewport and
 * scrolls beyond that, so a long utterance cannot push the buttons below it and the
 * thread above it off the screen.
 *
 * The cap is on the text rather than on the bubble so that the frame — padding, corner,
 * focus ring — stays outside the scrolling region and is never clipped by it. The same
 * cap on all three keeps them the same size when they swap places. `vh`, not `dvh`: the
 * cap does not follow the keyboard or the collapsing URL bar.
 *
 * Always a span made block by CSS, because it sits inside the transcript and draft
 * bubbles, which are paragraphs and may not contain a div.
 */
export function BubbleText({ className, ...rest }: BubbleTextProps) {
  return (
    <span
      className={[styles.text, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
