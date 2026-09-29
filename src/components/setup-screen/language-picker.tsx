"use client";

import { FlagIcon } from "@/components/ui/flag-icon";
import { LANGUAGE_LIST, type LanguageCode } from "@/lib/languages";

import styles from "./language-picker.module.css";

type LanguagePickerProps = {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  labelledBy: string;
};

export function LanguagePicker({
  value,
  onChange,
  labelledBy,
}: LanguagePickerProps) {
  return (
    // A radio group rather than a list of buttons: it's a single-choice control, and
    // this gets arrow-key navigation and the right announcement for free.
    <div className={styles.grid} role="radiogroup" aria-labelledby={labelledBy}>
      {LANGUAGE_LIST.map((language) => {
        const languageIsSelected = language.code === value;

        return (
          <button
            key={language.code}
            type="button"
            role="radio"
            aria-checked={languageIsSelected}
            className={`${styles.option} ${languageIsSelected ? styles.selected : ""}`}
            onClick={() => onChange(language.code)}
          >
            <FlagIcon code={language.code} width={26} />
            <span className={styles.label}>{language.label}</span>
          </button>
        );
      })}
    </div>
  );
}
