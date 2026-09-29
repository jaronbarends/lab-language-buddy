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

const LANGUAGE_LABEL_ID = "setup-language-label";
const LEVEL_LABEL_ID = "setup-level-label";
const STARTER_LABEL_ID = "setup-starter-label";

export function SetupScreen({ lastConfig, onStart }: SetupScreenProps) {
  // Seeded once, on mount. That's sufficient rather than sloppy: this screen only
  // exists in the "setup" phase, so it unmounts on Start chat and remounts fresh
  // when a session ends — by which point `lastConfig` is already the new value.
  const initialConfig = lastConfig ?? DEFAULT_SESSION_CONFIG;

  const [language, setLanguage] = useState<LanguageCode>(initialConfig.language);
  const [level, setLevel] = useState<CefrLevel>(initialConfig.level);
  const [starter, setStarter] = useState<Starter>(initialConfig.starter);

  function handleStartClick() {
    // Stage 3 note: the shared <audio> element gets unlocked here, synchronously,
    // before anything awaits. When the AI starts, its first spoken reply is several
    // fetches away and iOS will have forgotten this gesture by then.
    onStart({ language, level, starter });
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <ChatIcon size={22} />
        </span>
        <div>
          <h1 className={styles.title}>Language buddy</h1>
          <p className={styles.tagline}>Practice speaking out loud</p>
        </div>
      </header>

      <div className={styles.field}>
        <span id={LANGUAGE_LABEL_ID} className={styles.fieldLabel}>
          Choose your practice language
        </span>
        <LanguagePicker
          value={language}
          onChange={setLanguage}
          labelledBy={LANGUAGE_LABEL_ID}
        />
      </div>

      <div className={styles.field}>
        <label
          id={LEVEL_LABEL_ID}
          className={styles.fieldLabel}
          htmlFor="setup-level"
        >
          What is your language level?
        </label>
        <LevelSelect id="setup-level" value={level} onChange={setLevel} />
      </div>

      <div className={styles.field}>
        <span id={STARTER_LABEL_ID} className={styles.fieldLabel}>
          Who should start the conversation?
        </span>
        <StarterToggle
          value={starter}
          onChange={setStarter}
          labelledBy={STARTER_LABEL_ID}
        />
      </div>

      <div className={styles.submit}>
        <Button onClick={handleStartClick} icon={<ChatIcon />}>
          Start chat
        </Button>
      </div>
    </main>
  );
}
