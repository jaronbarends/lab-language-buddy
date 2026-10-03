import type { CefrLevel } from "@/lib/cefr";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";

/** Sent as `input` when the AI speaks first and there is no user text yet. */
export const AI_STARTING_PROMPT =
  "Start the conversation according to the system instructions.";

// The instruction is assembled from named sections, carried over from the spike's
// prompt. They are separate so one can be refined — or later shared with another
// persona, say the one that evaluates a conversation — without touching the rest.

function personaSection(languageName: string): string {
  return `## Role/persona

- You are a native ${languageName} speaker, a generic friendly acquaintance — not a specific named character.`;
}

function scenarioSection(): string {
  return `## Scenario

- You are having a freeform, friendly conversation with the user. If you are the one who has to speak first, pick a topic yourself — something with a bit more depth than pure small talk.`;
}

function behaviorSection(languageName: string, level: CefrLevel): string {
  return `## Behavioral rules

- Speak informally and warmly, like a friendly acquaintance — not formal or distant.
- Stay consistent with what you said earlier in the conversation.
- Don't break character or refer to yourself as an AI.
- Answer in ${languageName} at CEFR level ${level}, even if the user addresses you in another language.
- Keep replies conversational length: 2-4 sentences, at most one question per turn.
- Write the reply as natural spoken language, since it will be read aloud — no lists, headings, or other written-text formatting.`;
}

function outputSection(): string {
  return "Respond only with JSON matching the given schema.";
}

export function buildChatSystemInstruction(
  language: LanguageCode,
  level: CefrLevel,
): string {
  const { promptName } = LANGUAGES[language];

  return [
    personaSection(promptName),
    scenarioSection(),
    behaviorSection(promptName, level),
    outputSection(),
  ].join("\n\n");
}
