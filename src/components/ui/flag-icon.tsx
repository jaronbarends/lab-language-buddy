import deFlag from "flag-icons/flags/4x3/de.svg";
import esFlag from "flag-icons/flags/4x3/es.svg";
import frFlag from "flag-icons/flags/4x3/fr.svg";
import itFlag from "flag-icons/flags/4x3/it.svg";
import nlFlag from "flag-icons/flags/4x3/nl.svg";
import noFlag from "flag-icons/flags/4x3/no.svg";

import type { LanguageCode } from "@/lib/languages";

import styles from "./flag-icon.module.css";

/**
 * SVG flags from flag-icons (flagicons.lipis.dev), imported from the package rather
 * than copied in, so they stay versioned and updatable.
 *
 * These replaced emoji flags, which look right on iOS but render as bare country
 * letters ("NO", "NL") on Windows — Chrome on Windows has no flag glyphs at all.
 *
 * Only these six are imported, so only these six end up in the build; the package
 * ships roughly 260. Note that importing the stylesheet instead
 * (`flag-icons/css/flag-icons.min.css`) would pull every one of them in, since it
 * declares a background-image rule per flag.
 *
 * The keys are *language* codes that happen to coincide with ISO 3166-1 country
 * codes for this particular six. They are different things — an English option would
 * need an explicit choice of `gb` or `us` — so this mapping stays here rather than
 * being assumed elsewhere.
 */
// Typed as string on purpose. Next declares `*.svg` as `any` (next/image-types),
// so nothing here is type-checked for you — an earlier version of this file assumed
// the StaticImageData `{ src }` shape you get for PNG/JPG, compiled clean, and
// rendered six empty boxes. Turbopack hands back the URL directly.
const FLAG_BY_LANGUAGE: Record<LanguageCode, string> = {
  nl: nlFlag,
  fr: frFlag,
  de: deFlag,
  it: itFlag,
  no: noFlag,
  es: esFlag,
};

type FlagIconProps = {
  code: LanguageCode;
  width?: number;
};

export function FlagIcon({ code, width = 24 }: FlagIconProps) {
  return (
    // Plain <img> rather than next/image: these are static SVGs, which next/image
    // serves unoptimized anyway, and its default lazy-loading would delay six icons
    // that are above the fold on the first screen.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.flag}
      src={FLAG_BY_LANGUAGE[code]}
      // Decorative: the language name is always rendered next to it.
      alt=""
      aria-hidden="true"
      width={width}
      height={(width / 4) * 3}
    />
  );
}
