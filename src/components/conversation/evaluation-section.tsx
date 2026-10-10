import { Fragment } from "react";

import type { EvaluationSegment } from "@/lib/chat-schema";
import type { Evaluation } from "@/lib/session-reducer";

import { BubbleAttachment } from "./bubble";
import styles from "./evaluation-section.module.css";

type EvaluationSectionProps = {
  evaluation: Evaluation;
  /** The language the conversation is held in, for the phrases quoted from it. */
  conversationLang: string;
};

/**
 * The evaluation of a user turn, attached to the bottom of that turn's bubble. Always
 * there once the turn is sent, so the bubble does not jump when the answer arrives; what
 * it shows follows the evaluation's status. The explanation is English; the user's own
 * words and the suggestion are in the conversation language and say so with `lang`.
 */
export function EvaluationSection({
  evaluation,
  conversationLang,
}: EvaluationSectionProps) {
  return (
    <BubbleAttachment className={styles.section} lang="en">
      <EvaluationContent
        evaluation={evaluation}
        conversationLang={conversationLang}
      />
    </BubbleAttachment>
  );
}

function EvaluationContent({
  evaluation,
  conversationLang,
}: EvaluationSectionProps) {
  switch (evaluation.status) {
    case "pending":
      return "Evaluating…";
    case "failed":
      return "Evaluation failed";
    case "ready":
      if (!evaluation.correction) {
        return "No corrections. Great!";
      }
      return evaluation.correction.map((segment, index) => (
        <EvaluationSegmentText
          key={index}
          segment={segment}
          conversationLang={conversationLang}
        />
      ));
  }
}

type EvaluationSegmentTextProps = {
  segment: EvaluationSegment;
  conversationLang: string;
};

function EvaluationSegmentText({
  segment,
  conversationLang,
}: EvaluationSegmentTextProps) {
  switch (segment.type) {
    case "text":
      return <Fragment>{segment.text}</Fragment>;
    case "userInput":
      return (
        <i className={styles.targetLanguage} lang={conversationLang}>
          {segment.text}
        </i>
      );
    case "suggestion":
      return (
        <i
          className={`${styles.targetLanguage} ${styles.suggestion}`}
          lang={conversationLang}
        >
          {segment.text}
        </i>
      );
  }
}
