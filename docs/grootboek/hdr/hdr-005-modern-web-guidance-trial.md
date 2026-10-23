# HDR-005: Try Modern Web Guidance on the bubble animation, with the baseline written first

- **Status:** in-progress
- **Date:** 2026-10-23
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

A tool that claims to improve the agent's output earns its place in the harness on evidence
from this project. The evidence needs a baseline, and the baseline has to exist before the tool
is consulted, because afterwards "what would we have done without it" cannot be reconstructed
honestly.

## Decision

Try **Modern Web Guidance** (the Chrome team's agent skills with current web platform guidance,
`GoogleChrome/modern-web-guidance`) on the chat bubble animation (JNL-002), and decide
afterwards whether it stays.

The method costs almost no extra work:

1. Before the spike, the agent writes its own approach for JNL-002 K3 (growing a bubble in
   height and width), from its own knowledge. Done on 2026-10-23, in K3.
2. The spike's assignment to the builder carries one extra sentence: consult the guidance for
   K3 and report what it recommends and whether that differs from the baseline in K3.
3. The spike runs on a real iPhone, as planned anyway.
4. One line goes into JNL-002 K10: same / different and better / different and worse /
   nothing added, and whether the iPhone confirmed it.

**Exit criterion.** Right after that line, the human decides: keep it, switch it off, or adjust
it. A difference the iPhone does not confirm does not count as a gain. "Same" is a valid result
and a reason not to keep it. This record then moves to `implemented` (kept) or is superseded or
rejected.

## Extension (2026-10-23): more than one test

The human wants to test with a few more CSS-related tasks before deciding, so the procedure
above is repeated, not just run once. It applies to every task where the skill itself says it
should trigger (UI and layout, scroll and motion, performance, web APIs, forms and
accessibility), and not to backend work, scripts, tooling or trivial edits.

For each such task, in this order:

1. The agent writes its own approach down **before** the guidance is consulted, in the
   journal or spec of that task. The skill's own description says to run it first ("mandatory"
   for HTML/CSS work); in the lead thread that is deliberately **not** followed until the
   baseline is written. The builder is told in its assignment to consult it, as in K10.
2. The builder consults the guidance and reports what it recommends and how it differs from
   the baseline.
3. A row goes into the trial log below, and the human gives the verdict for that task.

**Lesson from the first test (JNL-002):** write the baseline *after* the design decisions that
constrain the problem. There, K4 changed what K3 was about after the baseline existed, so the
comparison was partly moot. A baseline written against a problem that is still moving does not
measure the guidance.

**The trial ends after three tests in total** (the bubble animation plus two more; decided by
the human, 2026-10-23). Then the human decides: keep, switch off or adjust.

### Trial log

| # | Task | Baseline (where) | Guidance recommended | Difference | iPhone confirmed | Verdict (human) |
|---|---|---|---|---|---|---|
| 1 | Bubble reveal (JNL-002 K3) | JNL-002 K3 | `clip-path` for reveals; `interpolate-size` Chromium-only | Same on the key point; final design came from the human, outside both | The first spike ran; the final design was tuned by eye | open |

## Why

The animation work depends on web platform features whose support changes quickly (animating to
an unknown size, entry animations, reduced motion), and the agent's knowledge ends at its
training cutoff. Guidance that is kept current could close that gap. It is a claim, not yet
a fact for this project: Google's reported improvement (37 percentage points) is from its own
internal benchmark. This is deliberately a trial, like HDR-002, but with its exit criterion
stated up front.

## What was found before installing (2026-10-23)

Read from the project's README, `SKILL.md`, `plugin.json` and `package.json` on GitHub (through
a summarising fetch tool, so a second-hand reading) and from the npm registry directly.

**Checked against the npm registry (first-hand):** version 0.0.195, Apache-2.0, no lifecycle
scripts (nothing runs on install), no dependencies, 260 files, 33 MB unpacked, four maintainers
who are Chrome team members, 195 versions with the latest published on 2026-10-19.

**What it does when the agent uses it (from `SKILL.md`):** on UI, layout, scroll and motion work
(not on backend, infrastructure or trivial edits) the agent runs
`npx -y modern-web-guidance@latest search "<query>" --skill-version <date>`, then `retrieve
"<id>"`. The skill allows only that exact command pattern to be allow-listed, never bare `npx *`.
It also tells the agent to end any reply that used a guide with a "Modern Web Guidance" section
listing the guide ids and the rule each one applied.

**Answers to the open points:**

- **Install scope.** Not stated by the README. The plugin commands are `/plugin marketplace add
  GoogleChrome/modern-web-guidance` and `/plugin install modern-web-guidance@googlechrome`; the
  alternative `npx modern-web-guidance@latest install` runs a wizard whose file writes are not
  documented. To be observed after installing, in the `/plugin` screen. This repo keeps its
  skills checked in under `.claude/skills/`; a user-level plugin would not travel with the repo.
- **Updates and pinning.** Nothing is pinned: every command uses `@latest`, the package is at
  0.0.x and changes often. The plugin has an AutoUpdate switch in `/plugin`. Whether a fixed
  version can be used is not documented. npm itself would allow `modern-web-guidance@0.0.195`,
  but the skill text says `@latest`, so a pinned run would be a different thing from what the
  vendor ships. Not tested.
- **Telemetry.** The README says Google collects anonymous usage information: installation
  counts, the calling agent's name, retrieved guide ids and the **CLI search queries**, not raw
  prompts; opt out with `DISABLE_TELEMETRY=1`. `SKILL.md` describes none. **The two sources
  disagree; the README is the more specific one, so treat telemetry as on.** Search itself runs
  an offline model (no network call); the network is needed to fetch the package through `npx`.
- **Uninstall.** Not stated.
- **Baseline target.** Not configurable through the README. The Chrome documentation says one
  line in `CLAUDE.md` or `AGENTS.md` ("This project's Baseline target is Baseline 2024."), and
  `SKILL.md` follows a custom support policy when one is set. Without one it defaults to
  Baseline Widely available.

**Not read:** the CLI's own code (`skills/modern-web-guidance/modern-web.mjs`). The telemetry
claim therefore cannot be verified from here beyond the README.

## Decisions before the status moves to `in-progress`

Taken by the human on 2026-10-23:

1. **Telemetry: off.** `DISABLE_TELEMETRY=1` for the agent's shell. The search queries are short
   and about CSS, but they leave the machine. Setting the variable is a harness change of its
   own: made on 2026-10-23 as an `env` block in `.claude/settings.json`. The name is generic, so
   it may also reach other tools that read it. Verified 2026-10-23: the builder subagent's
   shell has `DISABLE_TELEMETRY=1`.
2. **Permission: approve each run by hand** for the duration of the trial. No allow-list entry.
3. **The Baseline target: the default** (Baseline Widely available). Nothing is added to
   `CLAUDE.md` for it.
4. **The extra section in replies: leave it on.** The skill makes the agent end a reply with a
   "Modern Web Guidance" section. Kept during the trial, because it lists the guide ids and
   rules that shaped the code, which is the evidence for the one-line result in JNL-002 K10. To
   watch on the first run: whether it disturbs the builder's fixed report format.
5. **Install route: the `/plugin` commands.** Done on 2026-10-23, in a terminal window: the
   `/plugin` command is not available in the VS Code extension ("isn't available in this
   environment"), but `/reload-plugins` is. Result, read from `~/.claude/plugins/installed_plugins.json`:
   version 0.0.195, **scope `local`** (this user, this project path only; enabled in the
   gitignored `.claude/settings.local.json`), cached under `~/.claude/plugins/cache/googlechrome/`.
   Consequence: nothing of it is in the repo, so it does not travel to another machine or
   clone; fine for a trial, to be revisited if it is kept. The cached plugin is pinned at
   0.0.195, but the CLI it calls is still fetched as `@latest` on each run. Uninstall is not
   documented by the vendor; the `/plugin` screen in a terminal is the route.

## Consequences

- If kept, it lands as a work rule in `CLAUDE.md` (the HDR is the reasoning, `CLAUDE.md` the
  instruction). Proposed wording, not applied: *"For CSS and web-platform work, consult Modern
  Web Guidance first; the project's Baseline target is X."* Changing `CLAUDE.md` follows the
  duty to communicate: say what changes and ask for a check.
- Installing is done by the human with the `/plugin` commands; the agent cannot run those.
- Source: JNL-002, issue K10.
