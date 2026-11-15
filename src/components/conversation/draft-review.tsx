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
    <Bubble author="user" hasMinimumWidth lang={conversationLang}>
      <BubbleText ref={textRef}>{draft}</BubbleText>
    </Bubble>
  );
}

type DraftEditorProps = {
  conversationLang: string;
  /** The text to start from. Later edits come back through `onChange`, not through here. */
  draft: string;
  onChange: (draft: string) => void;
  /** Enter on a device with a fine pointer: the same as the Send button. */
  onSend: () => void;
  /** Escape: the same as the Cancel edit button. */
  onCancelEdit: () => void;
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
 *
 * The keyboard works as in a chat window: with a mouse or trackpad Enter sends and
 * Shift+Enter adds a line; on a touch screen, which has no Shift+Enter, Enter keeps
 * adding a line. Escape cancels the edit everywhere.
 */
export function DraftEditor({
  draft,
  conversationLang,
  onChange,
  onSend,
  onCancelEdit,
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    // An IME uses Enter and Escape itself while composing. Safari fires the keydown of
    // the Enter that ends a composition after compositionend, with isComposing false
    // and keyCode 229, so the deprecated keyCode is the only way to tell.
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEdit();
      return;
    }

    // Asked at the keypress rather than once, so an iPad that gains or loses a trackpad
    // follows along.
    const enterSends = window.matchMedia("(pointer: fine)").matches;
    if (event.key === "Enter" && !event.shiftKey && enterSends) {
      // Also for an empty field: onSend ignores empty text, so Enter then does
      // nothing at all rather than adding a line, just as Send is disabled.
      event.preventDefault();
      // A held Enter on the Edit button repeats into the editor it just opened.
      if (event.repeat) {
        return;
      }
      onSend();
    }
  }

  return (
    <Bubble author="user" hasMinimumWidth>
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
        onKeyDown={handleKeyDown}
      />
    </Bubble>
  );
}
