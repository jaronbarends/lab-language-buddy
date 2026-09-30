"use client";

import { CEFR_LABELS, CEFR_LEVELS, type CefrLevel } from "@/lib/cefr";

import styles from "./level-select.module.css";

type LevelSelectProps = {
  value: CefrLevel;
  onChange: (level: CefrLevel) => void;
  /**
   * Id of the legend that captions this field. A legend names its fieldset, not the
   * control inside it, so without this the select would have no accessible name of
   * its own.
   */
  labelledBy: string;
};

export function LevelSelect({ value, onChange, labelledBy }: LevelSelectProps) {
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    // The option values come from CEFR_LEVELS, so this cast is describing a fact
    // the DOM can't carry rather than papering over an unknown.
    onChange(event.target.value as CefrLevel);
  }

  return (
    // A native <select> on purpose: iOS renders it as the system wheel picker,
    // which is a better one-handed experience than anything custom, and it needs
    // no keyboard or focus-trap work. The wrapper only exists to hang the arrow on.
    <div className={styles.selectBox}>
      <select
        aria-labelledby={labelledBy}
        className={styles.select}
        value={value}
        onChange={handleChange}
      >
        {CEFR_LEVELS.map((level) => (
          <option key={level} value={level}>
            {CEFR_LABELS[level]}
          </option>
        ))}
      </select>
    </div>
  );
}
