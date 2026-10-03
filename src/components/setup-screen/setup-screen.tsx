"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChatIcon } from "@/components/ui/icons";
import type { CefrLevel } from "@/lib/cefr";
import type { LanguageCode } from "@/lib/languages";
import {
  DEFAULT_SESSION_CONFIG,
  type SessionConfig,
  type Starter,
} from "@/lib/session-reducer";

import { LanguagePicker } from "./language-picker";
import { LevelSelect } from "./level-select";
import { StarterToggle } from "./starter-toggle";
import styles from "./setup-screen.module.css";

type SetupScreenProps = {
  /** The previous session's settings, or null on first load. */
  lastConfig: SessionConfig | null;
  onStart: (config: SessionConfig) => void;
};

/** The select is labelled through this; the two radio groups are named by their fieldset. */
const LEVEL_LEGEND_ID = "setup-level-legend";

export function SetupScreen({ lastConfig, onStart }: SetupScreenProps) {
  // Seeded once, on mount. That's sufficient rather than sloppy: this screen only
  // exists in the "setup" phase, so it unmounts on Start chat and remounts fresh
  // when a session ends — by which point `lastConfig` is already the new value.
  const initialConfig = lastConfig ?? DEFAULT_SESSION_CONFIG;

  const [language, setLanguage] = useState<LanguageCode>(initialConfig.language);
  const [level, setLevel] = useState<CefrLevel>(initialConfig.level);
  const [starter, setStarter] = useState<Starter>(initialConfig.starter);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    // The state is React's, not the form's, so the browser's own submission — a
    // page reload with the choices in the query string — must never happen.
    event.preventDefault();

    // Stage 3 note: unlocking the shared <audio> element does NOT belong here. It
    // goes in the submit button's onClick, synchronously, before anything awaits.
    // That click always fires before this submit, and pressing Enter makes the
    // browser fire a click on the default button too, so both routes are covered by
    // a handler that is certainly a user gesture. When the AI starts, its first
    // spoken reply is several fetches away and iOS will have forgotten the gesture.
    onStart({ language, level, starter });
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <ChatIcon size={22} />
        </span>
        <div>
          <h1>Language buddy</h1>
          <p className={styles.tagline}>Practice speaking out loud</p>
        </div>
      </header>

      {/*
        Every field is a fieldset with a legend, owned here rather than by the
        controls, which render no caption of their own. Styling for <legend> lives at
        element level in elements.css, so nothing below carries a caption class.
      */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset>
          <legend className={styles.legend}>Choose your practice language</legend>
          <LanguagePicker value={language} onChange={setLanguage} />
        </fieldset>

        <fieldset>
          <legend id={LEVEL_LEGEND_ID} className={styles.legend}>
            What is your language level?
          </legend>
          <LevelSelect
            value={level}
            onChange={setLevel}
            labelledBy={LEVEL_LEGEND_ID}
          />
        </fieldset>

        <fieldset>
          <legend className={styles.legend}>
            Who should start the conversation?
          </legend>
          <StarterToggle value={starter} onChange={setStarter} />
        </fieldset>

        <div className={styles.submit}>
          <Button type="submit" icon={<ChatIcon />} fontSize="large">
            Start chat
          </Button>
        </div>
      </form>
    </main>
  );
}
