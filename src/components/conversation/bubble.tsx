import type { HTMLAttributes, Ref } from "react";

import styles from "./bubble.module.css";

type BubbleProps = HTMLAttributes<HTMLDivElement> & {
  author: "ai" | "user";
};

/**
 * The frame every speech bubble shares: turns, the thinking indicator, the live
 * transcript, the settled draft and the editor. Size, padding, border, colour, line
 * height and weight live here and nowhere else, so two bubbles that are meant to look
 * the same — the live transcript becoming the draft the moment recording stops — cannot
 * drift apart. What goes inside, and any layout of it, is the caller's.
 *
 * Only the wrapper: always a `div`, so what it holds can be a paragraph, a status
 * indicator, an editor or an attachment alike. It clips what it holds to its rounded
 * corners.
 *
 * Extra attributes (aria-live, role, …) pass straight through to the element.
 */
export function Bubble({
  author,
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
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

/**
 * A section attached to the bottom of a bubble, inside its border: the bubble's own
 * text above it, a divider, then this. It runs the full width of the bubble, so it
 * cancels the bubble's padding and brings its own. What it contains and its background
 * are the caller's; the bubble clips it to its rounded corners.
 */
export function BubbleAttachment({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[styles.attachment, className].filter(Boolean).join(" ")}
      {...rest}
    />
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
 * A span made block by CSS, as it was when the transcript and draft bubbles were
 * paragraphs that could not contain a div.
 */
export function BubbleText({ className, ...rest }: BubbleTextProps) {
  return (
    <span
      className={[styles.text, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
