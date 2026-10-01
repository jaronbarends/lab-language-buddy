"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Bubble, BubbleText } from "./bubble";
import styles from "./draft-review.module.css";

/**
 * What the user said, once recording has stopped and before it is sent.
 *
 * The same Bubble as the live transcript it replaces, so stopping cannot make the text
 * jump. What does change is the listening indicator: the dot is gone, because the
 * microphone is no longer on.
 *
 * A draft longer than the text's maximum height starts scrolled to its end, as the live
 * transcript it replaces was: stopping must not make the text jump, and the end is what
 * the user was just reading. Only on mount — nothing follows after that.
 */
export function DraftBubble({
  draft,
  conversationLang,
}: {
  draft: string;
  conversationLang: string;
}) {
  const textRef = useRef<HTMLSpanElement | null>(null);

  // Before the first paint, so the draft is never seen at the top for a frame.
  useLayoutEffect(() => {
    const text = textRef.current;
    if (!text) {
      return;
    }

    text.scrollTop = text.scrollHeight;
  }, []);

  return (
    <Bubble author="user" lang={conversationLang}>
      <BubbleText ref={textRef}>{draft}</BubbleText>
    </Bubble>
  );
}

type DraftEditorProps = {
  conversationLang: string;
  /** The text to start from. Later edits come back through `onChange`, not through here. */
  draft: string;
  onChange: (draft: string) => void;
};

/**
 * The draft as an editable bubble: an ordinary block of text that happens to be
 * editable, rather than a form field. Being an ordinary block is the point. Its width
 * and line height come from the bubble around it exactly as they do for every other
 * bubble, so it grows with the text until the bubble's maximum width and then wraps.
 *
 * A textarea could not do that. It sizes itself from `cols` and `rows`, not from its
 * content; `field-sizing: content` fixes that but only arrives in Safari on iOS 26.2;
 * and a hidden copy of the text stacked behind it was tried and failed on an iPhone,
 * where the textarea took the full width and laid its lines out differently from the
 * copy. `plaintext-only` keeps pasted text from bringing formatting with it.
 *
 * It is uncontrolled. The text is written in once and read back on every input; it is
 * never rendered from state, because re-rendering the text would throw the caret back
 * to the start. That is safe here since this component only exists while the turn is in
 * its editing state, so nothing else can change the text while it is on the screen.
 */
export function DraftEditor({
  draft,
  conversationLang,
  onChange,
}: DraftEditorProps) {
  const editorRef = useRef<HTMLSpanElement | null>(null);
  // Captured once so the effect below runs once, however often the parent re-renders.
  const [initialDraft] = useState(draft);

  // Before the first paint, so the bubble is never seen empty and then jumping to size.
  // Caret at the end rather than selecting everything — the common case is fixing a
  // word, not retyping the sentence.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.textContent = initialDraft;
    editor.focus();
    // The caret goes to the end below, which for a draft longer than the editor's
    // maximum height is out of sight. Focusing does not reliably scroll to it.
    editor.scrollTop = editor.scrollHeight;

    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const caretAtEnd = document.createRange();
    caretAtEnd.selectNodeContents(editor);
    caretAtEnd.collapse(false);
    selection.removeAllRanges();
    selection.addRange(caretAtEnd);
  }, [initialDraft]);

  function handleInput(event: React.InputEvent<HTMLSpanElement>) {
    onChange(event.currentTarget.innerText);
  }

  return (
    <Bubble author="user" as="div">
      <BubbleText
        ref={editorRef}
        className={styles.editor}
        lang={conversationLang}
        contentEditable="plaintext-only"
        role="textbox"
        aria-multiline="true"
        aria-label="Edit what you said"
        // The text is in the practice language, not the keyboard's, so correction,
        // auto-capitalisation and spell-checking would work against the user.
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        onInput={handleInput}
      />
    </Bubble>
  );
}
