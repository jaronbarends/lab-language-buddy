"use client";

import { PersonIcon, RobotIcon } from "@/components/ui/icons";
import type { Starter } from "@/lib/session-reducer";

import styles from "./starter-toggle.module.css";

type StarterToggleProps = {
  value: Starter;
  onChange: (starter: Starter) => void;
  labelledBy: string;
};

const OPTIONS: { value: Starter; label: string; icon: React.ReactNode }[] = [
  { value: "ai", label: "AI", icon: <RobotIcon /> },
  { value: "user", label: "Me", icon: <PersonIcon /> },
];

export function StarterToggle({
  value,
  onChange,
  labelledBy,
}: StarterToggleProps) {
  return (
    <div className={styles.group} role="radiogroup" aria-labelledby={labelledBy}>
      {OPTIONS.map((option) => {
        const optionIsSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={optionIsSelected}
            className={`${styles.option} ${optionIsSelected ? styles.selected : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
