"use client";

import { PersonIcon, RobotIcon } from "@/components/ui/icons";
import type { Starter } from "@/lib/session-reducer";

import styles from "./starter-toggle.module.css";

type StarterToggleProps = {
  value: Starter;
  onChange: (starter: Starter) => void;
};

const OPTIONS: { value: Starter; label: string; icon: React.ReactNode }[] = [
  { value: "ai", label: "AI", icon: <RobotIcon /> },
  { value: "user", label: "Me", icon: <PersonIcon /> },
];

/**
 * A segmented control built on native radios, like the language picker: a visually
 * hidden `<input type="radio">` inside each label. It renders no caption — the
 * fieldset and legend that name the group belong to the caller.
 */
export function StarterToggle({ value, onChange }: StarterToggleProps) {
  return (
    <div className={styles.group}>
      {OPTIONS.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name="starter"
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="u-hidden-form-control"
          />
          {option.icon}
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
