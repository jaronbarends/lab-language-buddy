import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

import styles from "./button.module.css";

type ButtonVariant = "primary" | "secondary";

/** Body size everywhere except "Start chat", which is the one large button. */
type ButtonFontSize = "medium" | "large";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fontSize?: ButtonFontSize;
  icon?: ReactNode;
  children: ReactNode;
  /** React 19: a normal prop. It stays in `rest` and reaches the button untouched. */
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "primary",
  fontSize = "medium",
  icon,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    fontSize === "large" ? styles.largeText : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classNames} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
