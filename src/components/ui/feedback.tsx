import type { ComponentType, ReactNode } from "react";

import { InfoIcon, WarningIcon, type IconProps } from "./icons";
import styles from "./feedback.module.css";

/*
 * The box the error message and the info notice share (PDR-020). What has to change in
 * both at once — the corners, the padding, the border width, where the icon and the text
 * sit — lives here; what sets one apart (colour, icon, role) lives in the variants below,
 * and the text and its typography come in as children.
 */

type FeedbackProps = {
  variant: "error" | "info";
  icon: ComponentType<IconProps>;
  role?: "alert";
  children: ReactNode;
};

// Not exported: a box always comes with a variant, its icon and its role.
function Feedback({ variant, icon: Icon, role, children }: FeedbackProps) {
  return (
    <div className={`${styles.feedback} ${styles[variant]}`} role={role}>
      <Icon size={24} />
      <div className={styles.text}>{children}</div>
    </div>
  );
}

// ErrorFeedback and InfoFeedback rather than Error and Info: a component called Error
// would shadow JavaScript's built-in Error in every file that imports it.
export function ErrorFeedback({ children }: { children: ReactNode }) {
  return (
    <Feedback variant="error" icon={WarningIcon} role="alert">
      {children}
    </Feedback>
  );
}

export function InfoFeedback({ children }: { children: ReactNode }) {
  return (
    <Feedback variant="info" icon={InfoIcon}>
      {children}
    </Feedback>
  );
}
