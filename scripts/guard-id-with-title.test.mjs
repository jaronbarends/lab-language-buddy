// Tests for .claude/hooks/guard-id-with-title.cjs (incident pattern id-with-title): the core runs on
// turns in memory, the hook itself on simulated Stop input with a transcript in a temp folder.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "..", ".claude", "hooks", "guard-id-with-title.cjs");
const { checkTurns } = createRequire(import.meta.url)(HOOK);

// The flags per turn, as "kind id", for turns given as lists of texts.
function flagsPerTurn(...turns) {
  const blockTurns = turns.map((texts, turnIndex) => texts.map((text, index) => ({ lineNumber: turnIndex * 10 + index + 1, text })));
  return checkTurns(blockTurns).map((flags) => flags.map((flag) => `${flag.kind} ${flag.id}`));
}

// The flags of a single turn with a single text.
function flagsOf(text) {
  return flagsPerTurn([text])[0];
}

describe("guard-id-with-title: descriptions", () => {
  it("accepts a parenthesis with a word", () => {
    assert.deepEqual(flagsOf("Volgens HDR-034 (beslispunten eerst uitleggen) doe ik dat."), []);
  });

  it("accepts a colon, an em dash and an en dash followed by a word", () => {
    assert.deepEqual(flagsOf("HDR-005: de tweede branch hernummert."), []);
    assert.deepEqual(flagsOf("HDR-005 — de tweede branch hernummert."), []);
    assert.deepEqual(flagsOf("HDR-005 – de tweede branch hernummert."), []);
  });

  it("accepts a comma followed by a word", () => {
    assert.deepEqual(flagsOf("Zie HDR-037, Het incidentregister telt breder."), []);
    assert.deepEqual(flagsOf("Er komt een HDR-036, de feature-skill."), []);
  });

  it("accepts markdown around the id and before the word", () => {
    assert.deepEqual(flagsOf("**HDR-005**: **De branch** die als tweede merget."), []);
  });

  it("accepts markdown that closes after the separator", () => {
    assert.deepEqual(flagsOf("- **HDR-037:** het incidentregister telt breder."), []);
    assert.deepEqual(flagsOf("**HDR-037 —** het incidentregister telt breder."), []);
    assert.deepEqual(flagsOf("**HDR-037,** het incidentregister telt breder."), []);
    assert.deepEqual(flagsOf("*HDR-037:* het incidentregister telt breder."), []);
  });

  it("leaves a comma list of ids bare", () => {
    assert.deepEqual(flagsOf("Het gaat om HDR-009, HDR-034 en HDR-035."), ["prose HDR-009", "prose HDR-034", "prose HDR-035"]);
  });

  it("does not count a parenthesis without a word, a description before the id, or a colon ending the line", () => {
    assert.deepEqual(flagsOf("JNL-002 (K7) is besloten."), ["prose JNL-002"]);
    assert.deepEqual(flagsOf("Eerst uitleggen (HDR-034)."), ["prose HDR-034"]);
    assert.deepEqual(flagsOf("Wat HDR-005 zegt:\n- de tweede branch"), ["prose HDR-005"]);
    assert.deepEqual(flagsOf("HDR-005:\n- de tweede branch"), ["prose HDR-005"]);
  });

  it("accepts a parenthesis without a word followed by a separator and a word", () => {
    assert.deepEqual(flagsOf("JNL-002 (K7): de koude start bereikt src/ niet."), []);
  });

  it("never counts an id as a description", () => {
    assert.deepEqual(flagsOf("HDR-007 (HDR-005) geldt."), ["prose HDR-007", "prose HDR-005"]);
    assert.deepEqual(flagsOf("HDR-005: HDR-007 geldt ook."), ["prose HDR-005", "prose HDR-007"]);
  });

  it("accepts a parenthesis that wraps onto the next line", () => {
    assert.deepEqual(flagsOf("```\nvolgens HDR-037 (Het incidentregister telt\nelke fout) boek je.\n```"), []);
  });
});

describe("guard-id-with-title: extra forms", () => {
  it("accepts a table row whose next cell has a word", () => {
    assert.deepEqual(flagsOf("| Id | Titel |\n|---|---|\n| HDR-005 | Hernummeren bij merge |"), []);
  });

  it("leaves a table row bare when the next cell has no word", () => {
    assert.deepEqual(flagsOf("| HDR-005 | 2026-11-13 |"), ["prose HDR-005"]);
    assert.deepEqual(flagsOf("| HDR-005 | HDR-007 |"), ["prose HDR-005", "prose HDR-007"]);
  });

  it("accepts a parenthesis on the next line", () => {
    assert.deepEqual(flagsOf("Volgens HDR-005\n(de tweede branch hernummert) doe ik dat."), []);
  });

  it("leaves an id bare when the parenthesis is not on the directly following line", () => {
    assert.deepEqual(flagsOf("Volgens HDR-005\n\n(de tweede branch hernummert)"), ["prose HDR-005"]);
  });

  it("accepts a separator at the end of the line with the word on the next line, also in a bare fence", () => {
    assert.deepEqual(flagsOf("Zie HDR-005 —\nde tweede branch hernummert."), []);
    assert.deepEqual(flagsOf("```\nLees eerst HDR-037,\nhet incidentregister dat breder telt.\n```"), []);
  });

  it("leaves an id bare when the next line holds an id, or opens a fence", () => {
    assert.deepEqual(flagsOf("Het gaat om HDR-009,\nHDR-034 en meer."), ["prose HDR-009", "prose HDR-034"]);
    assert.deepEqual(flagsOf("Volgens HDR-005:\n```yaml\nid: x\n```"), ["prose HDR-005"]);
  });

  it("accepts a quoted title", () => {
    assert.deepEqual(flagsOf('Volgens HDR-005 "De branch die als tweede merget" doe ik dat.'), []);
    assert.deepEqual(flagsOf("Volgens HDR-005 “De branch die als tweede merget” doe ik dat."), []);
    assert.deepEqual(flagsOf("Volgens HDR-005 'De branch die als tweede merget' doe ik dat."), []);
  });

  it("leaves an id bare when the quotes hold no word", () => {
    assert.deepEqual(flagsOf('Volgens HDR-005 "1.2" doe ik dat.'), ["prose HDR-005"]);
    assert.deepEqual(flagsOf('Volgens HDR-005 "HDR-007" doe ik dat.'), ["prose HDR-005", "prose HDR-007"]);
  });

  it("accepts a link followed by a description", () => {
    assert.deepEqual(flagsOf("Zie [HDR-005](docs/grootboek/hdr/hdr-005.md): hernummeren bij merge."), []);
    assert.deepEqual(flagsOf("Zie [HDR-005](docs/grootboek/hdr/hdr-005.md) (hernummeren bij merge)."), []);
    assert.deepEqual(flagsOf("Zie [**HDR-005**](docs/grootboek/hdr/hdr-005.md) — hernummeren bij merge."), []);
  });

  it("leaves a link bare without a description", () => {
    assert.deepEqual(flagsOf("Zie [HDR-005](docs/grootboek/hdr/hdr-005.md) voor de regel."), ["prose HDR-005"]);
  });
});

describe("guard-id-with-title: what is skipped", () => {
  it("skips inline code", () => {
    assert.deepEqual(flagsOf("De hook leest `HDR-005` en ``HDR-007`` niet."), []);
  });

  it("skips a fenced block with an info string", () => {
    assert.deepEqual(flagsOf('Zo:\n```yaml\n  - id: "HDR-005"\n```\nKlaar.'), []);
    assert.deepEqual(flagsOf("```diff\n+ HDR-007 geldt\n```"), []);
  });

  it("skips a block with an info string nested in a bare fence", () => {
    assert.deepEqual(flagsOf("````\nStartprompt.\n```yaml\nid: HDR-005\n```\nEinde.\n````"), []);
  });
});

describe("guard-id-with-title: units", () => {
  it("treats a bare fence as a unit of its own", () => {
    const text = "Volgens HDR-034 (beslispunten eerst uitleggen) doe ik dat.\n\n```\nLees HDR-034 eerst.\n```";
    assert.deepEqual(flagsOf(text), ["fence HDR-034"]);
  });

  it("needs a description once per bare fence", () => {
    const fence = "```\nHDR-034 (beslispunten): uitleg eerst. Later weer HDR-034.\n```";
    assert.deepEqual(flagsOf(fence), []);
    assert.deepEqual(flagsOf(`${fence}\n\n\`\`\`\nOok hier HDR-034.\n\`\`\``), ["fence HDR-034"]);
  });

  it("checks prose per session: a bare first mention flags once, in its own turn", () => {
    assert.deepEqual(flagsPerTurn(["Zie HDR-005."], ["Nog eens HDR-005."]), [["prose HDR-005"], []]);
  });

  it("does not flag a later bare mention after a described first one", () => {
    assert.deepEqual(flagsPerTurn(["HDR-005 (tweede branch hernummert)."], ["Dus HDR-005."]), [[], []]);
  });

  it("does not count a mention in a bare fence as the first prose mention", () => {
    const fence = "```\nHDR-005 (tweede branch hernummert).\n```";
    assert.deepEqual(flagsPerTurn([fence], ["Dus HDR-005."]), [[], ["prose HDR-005"]]);
  });
});

describe("guard-id-with-title: hook output", () => {
  let folder;

  function prompt(text) {
    return { type: "user", message: { role: "user", content: text } };
  }

  function say(text) {
    return { type: "assistant", message: { role: "assistant", content: [{ type: "text", text }] } };
  }

  function toolCall(name = "Bash") {
    return { type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", id: "t1", name, input: {} }] } };
  }

  function toolResult() {
    return {
      type: "user",
      message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }] },
      toolUseResult: {},
    };
  }

  function writeTranscript(entries) {
    const transcript = join(folder, `transcript-${Math.random().toString(36).slice(2)}.jsonl`);
    writeFileSync(transcript, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
    return transcript;
  }

  function runRaw(input) {
    const result = spawnSync(process.execPath, [HOOK], { input, encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    return result.stdout;
  }

  function runHook(entries, extra = {}) {
    const transcript = writeTranscript(entries);
    return runRaw(JSON.stringify({ hook_event_name: "Stop", transcript_path: transcript, stop_hook_active: false, ...extra }));
  }

  before(() => {
    folder = mkdtempSync(join(tmpdir(), "guard-id-with-title-"));
  });

  after(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it("stays silent when every id is described", () => {
    assert.equal(runHook([prompt("Hoe zit het?"), say("HDR-005 (tweede branch hernummert) geldt.")]), "");
  });

  it("blocks a bare prose id, names its register title and asks for an addendum", () => {
    const output = JSON.parse(runHook([prompt("Hoe zit het?"), say("Volgens HDR-005 hernummer ik.")]));
    assert.equal(output.decision, "block");
    assert.match(output.reason, /HDR-005 \([^)]+\)/);
    assert.doesNotMatch(output.reason, /onbekend/);
    assert.match(output.reason, /korte aanvulling/);
  });

  it("blocks a bare id in a bare fence, names its register title and asks to resend the block", () => {
    const output = JSON.parse(runHook([prompt("Startprompt?"), say("```\nLees HDR-034 eerst.\n```")]));
    assert.equal(output.decision, "block");
    assert.match(output.reason, /HDR-034 \([^)]+\)/);
    assert.doesNotMatch(output.reason, /onbekend/);
    assert.match(output.reason, /codeblok opnieuw/);
    assert.doesNotMatch(output.reason, /korte aanvulling/);
  });

  it("flags only the last turn, which may span tool calls", () => {
    const entries = [
      prompt("Eerste vraag"),
      say("Zie HDR-007."),
      prompt("Tweede vraag"),
      say("Ik kijk naar HDR-005."),
      toolCall(),
      toolResult(),
      say("Klaar, ook HDR-007 bekeken."),
    ];
    const output = JSON.parse(runHook(entries));
    assert.match(output.reason, /HDR-005/);
    assert.doesNotMatch(output.reason, /HDR-007/);
  });

  it("stays silent when the bare id came in an earlier turn", () => {
    assert.equal(runHook([prompt("Eerste"), say("Zie HDR-005."), prompt("Tweede"), say("Nog steeds HDR-005.")]), "");
  });

  it("starts a turn at a subagent hand-back, so a bare id from the turn before stays silent", () => {
    const handBack = { type: "user", isMeta: true, origin: { kind: "peer" }, message: { role: "user", content: "Rapport van de builder" } };
    assert.equal(runHook([prompt("Start de builder"), say("Zie HDR-005."), handBack, say("De builder is klaar.")]), "");
  });

  it("continues the turn past a skill companion, so a bare id earlier in the turn is flagged", () => {
    const companion = {
      type: "user",
      isMeta: true,
      turnCompanion: true,
      sourceToolUseID: "t1",
      message: { role: "user", content: "Inhoud van de skill" },
    };
    const entries = [prompt("Doe het"), say("Zie HDR-005."), toolCall("Skill"), toolResult(), companion, say("Skill geladen.")];
    const output = JSON.parse(runHook(entries));
    assert.match(output.reason, /HDR-005/);
  });

  it("keeps working past a null line or a null content block", () => {
    const transcript = join(folder, "with-nulls.jsonl");
    const lines = [
      JSON.stringify(prompt("Hoe zit het?")),
      "null",
      JSON.stringify({ type: "assistant", message: { role: "assistant", content: [null, { type: "text", text: "Volgens HDR-005 hernummer ik." }] } }),
    ];
    writeFileSync(transcript, lines.join("\n") + "\n");
    const output = JSON.parse(runRaw(JSON.stringify({ transcript_path: transcript, stop_hook_active: false })));
    assert.match(output.reason, /HDR-005/);
  });

  it("stays silent when stop_hook_active is set", () => {
    assert.equal(runHook([prompt("Hoe zit het?"), say("Volgens HDR-005 hernummer ik.")], { stop_hook_active: true }), "");
  });

  it("blocks a bare id in last_assistant_message when the transcript ends at the prompt", () => {
    const output = JSON.parse(runHook([prompt("Hoe zit het?")], { last_assistant_message: "Volgens HDR-005 hernummer ik." }));
    assert.equal(output.decision, "block");
    assert.match(output.reason, /HDR-005/);
  });

  it("does not add last_assistant_message again when the transcript already ends with it", () => {
    const closing = "Volgens HDR-005 hernummer ik.\n\n```\nLees HDR-034 eerst.\n```";
    const output = JSON.parse(runHook([prompt("Hoe zit het?"), say(closing)], { last_assistant_message: `${closing}\n` }));
    assert.equal(output.decision, "block");
    assert.equal(output.reason.match(/HDR-005/g).length, 1);
    assert.equal(output.reason.match(/HDR-034/g).length, 1);
    // A second copy would make two flagged fences, and the plural wording.
    assert.match(output.reason, /het codeblok opnieuw/);
    assert.doesNotMatch(output.reason, /codeblokken/);
  });

  it("stays silent when last_assistant_message repeats an id described earlier in the session", () => {
    const entries = [prompt("Eerste"), say("HDR-005 (tweede branch hernummert) geldt."), prompt("Tweede")];
    assert.equal(runHook(entries, { last_assistant_message: "Dus HDR-005." }), "");
  });

  it("blocks a bare id in a bare fence in last_assistant_message and asks to resend the block", () => {
    const output = JSON.parse(runHook([prompt("Startprompt?")], { last_assistant_message: "```\nLees HDR-034 eerst.\n```" }));
    assert.equal(output.decision, "block");
    assert.match(output.reason, /codeblok opnieuw/);
  });

  it("falls back to the transcript when last_assistant_message is empty or not a string", () => {
    const entries = [prompt("Hoe zit het?"), say("Volgens HDR-005 hernummer ik.")];
    assert.match(JSON.parse(runHook(entries, { last_assistant_message: "   " })).reason, /HDR-005/);
    assert.match(JSON.parse(runHook(entries, { last_assistant_message: null })).reason, /HDR-005/);
  });

  it("stays silent on a bare id in last_assistant_message when stop_hook_active is set", () => {
    assert.equal(runHook([prompt("Hoe zit het?")], { last_assistant_message: "Volgens HDR-005 hernummer ik.", stop_hook_active: true }), "");
  });

  it("stays silent on empty stdin, broken JSON and a missing transcript", () => {
    assert.equal(runRaw(""), "");
    assert.equal(runRaw("{ not json"), "");
    assert.equal(runRaw(JSON.stringify({ transcript_path: join(folder, "missing.jsonl"), stop_hook_active: false })), "");
  });

  it("reports turns and blocked turns in replay mode", () => {
    const transcript = writeTranscript([
      prompt("Eerste"),
      say("Zie HDR-005."),
      prompt("Tweede"),
      say("```\nLees HDR-034.\n```"),
      prompt("Derde"),
      say("Niets."),
    ]);
    const result = spawnSync(process.execPath, [HOOK, "--replay", transcript], { encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Turns: 3 \(with assistant text: 3\), blocked: 2/);
    assert.match(result.stdout, /line 2 prose HDR-005/);
    assert.match(result.stdout, /line 4 fence HDR-034/);
  });

  it("gives a plain message, not a stack trace, when replay cannot read the transcript", () => {
    const result = spawnSync(process.execPath, [HOOK, "--replay", join(folder, "missing.jsonl")], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot read .*missing\.jsonl \(ENOENT\)/);
    assert.doesNotMatch(result.stderr, /\n\s+at /);
  });
});
