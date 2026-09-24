"use client";

import { useEffect, useRef } from "react";

import styles from "./draft-review.module.css";

/**
 * What the user said, once recording has stopped and before it is sent.
 *
 * Deliberately styled to match the live transcript bubble it replaces — same width,
 * same alignment, same spot in the control bar — so stopping doesn't make the text
 * appear to jump. The solid border and the marker are the only difference.
 */
export function DraftBubble({ draft }: { draft: string }) {
  return (
    <p className={styles.draft}>
      <span className={styles.marker} aria-hidden="true" />
      <span>{draft}</span>
    </p>
  );
}

type DraftEditorProps = {
  draft: string;
  onChange: (draft: string) => void;
};

export function DraftEditor({ draft, onChange }: DraftEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Mount-only: this component exists exactly as long as the editing state does,
  // so there's no flag to react to. Caret at the end rather than selecting
  // everything — the common case is fixing a word, not retyping the sentence.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }, []);

  return (
    <textarea
      ref={editorRef}
      className={styles.editor}
      value={draft}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Edit what you said"
    />
  );
}
