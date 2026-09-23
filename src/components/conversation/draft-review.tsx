"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { CrossIcon, PencilIcon, SendIcon } from "@/components/ui/icons";

import styles from "./draft-review.module.css";

type DraftReviewProps = {
  draft: string;
  draftIsEditable: boolean;
  onEdit: () => void;
  onChange: (draft: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

/**
 * What the user said, before it's committed to the conversation. Speech recognition
 * gets things wrong often enough that sending unreviewed would be frustrating, so
 * nothing leaves here without an explicit Send.
 */
export function DraftReview({
  draft,
  draftIsEditable,
  onEdit,
  onChange,
  onSend,
  onCancel,
}: DraftReviewProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!draftIsEditable) {
      return;
    }
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    // Caret at the end rather than selecting everything: the common case is fixing
    // a word or two, not retyping the sentence.
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }, [draftIsEditable]);

  const draftIsEmpty = draft.trim().length === 0;

  return (
    <div className={styles.panel}>
      {draftIsEditable ? (
        <textarea
          ref={editorRef}
          className={styles.editor}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Edit what you said"
        />
      ) : (
        <p className={styles.draft}>
          <span className={styles.marker} aria-hidden="true" />
          <span>{draft}</span>
        </p>
      )}

      <Button icon={<SendIcon />} onClick={onSend} disabled={draftIsEmpty}>
        Send
      </Button>

      <div className={styles.secondaryActions}>
        <Button
          variant="secondary"
          icon={<PencilIcon />}
          onClick={onEdit}
          disabled={draftIsEditable}
        >
          Edit
        </Button>
        <Button variant="secondary" icon={<CrossIcon />} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
