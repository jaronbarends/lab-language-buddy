"use client";

import { FlagIcon } from "@/components/ui/flag-icon";
import { LANGUAGE_LIST, type LanguageCode } from "@/lib/languages";

import styles from "./language-picker.module.css";

type LanguagePickerProps = {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
};

/**
 * A real radio group: a visually hidden `<input type="radio">` inside each label.
 * Arrow-key navigation, the checked state, form semantics and the announcement all
 * come from the platform — none of it is reimplemented.
 *
 * It renders no caption. The fieldset and legend that name the group belong to the
 * caller, the same as for every other field on the setup screen.
 *
 * The layout is driven from CSS rather than from props. `:has()` counts the options
 * to pick a column count, and a style container query flips each label between
 * flag-above-text and flag-beside-text. Adding a seventh language would want a
 * different UI, not another breakpoint.
 */
export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <div className={styles.languageOptions}>
      {LANGUAGE_LIST.map((language) => (
        <label key={language.code} className={styles.label}>
          <input
            type="radio"
            name="language"
            value={language.code}
            checked={language.code === value}
            onChange={() => onChange(language.code)}
            className="u-hidden-form-control"
          />
          <span className={styles.flagIcon}>
            <FlagIcon code={language.code} width={32} />
          </span>
          {language.label}
        </label>
      ))}
    </div>
  );
}
