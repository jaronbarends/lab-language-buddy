@AGENTS.md

# Project plan

`docs/plan.md` is the living plan and decision record for this app: state model,
component layout, design decisions with their reasoning, build stages, and a dated log of
everything that changed after the plan was first approved.

Read it before making structural changes — several choices that look arbitrary in the code
are deliberate, and the reasoning lives there rather than in the diff.

**Keep it current in the same commit as the code.** If a change contradicts the plan,
update the plan and add a decision-log line in that same commit. Left as a separate chore
it will not happen, and a stale plan is worse than none.

# Grootboek (experiment, `arc/*` branches)

An experiment next to the plan: numbered decision records (ADR, HDR, PDR), drift
reports (DFT) and discovery journals (JNL) under `docs/grootboek/`, indexed by YAML
registers in `docs/grootboek/registers/`. Read a register first, then only the
document you need. `docs/grootboek/CLAUDE.md` loads by itself in that folder and has
the document types and conventions. Start the `grootboek` skill
(`.claude/skills/grootboek/`) for any grootboek document: its writing guides are a hard
requirement.

- **`docs/plan.md` stays the source for every decision made before 2026-10-20.**
  Only decisions from the `arc/*` experiments are booked in the grootboek
  (HDR-001 says why). It does not replace the plan rule above: a change that
  contradicts the plan still updates the plan in the same commit.
- **Language.** Grootboek documents are written in English, like everything else in
  this repo. That overrides the skill's own "Documentatie: Nederlands" convention.
- **Duty to communicate:** when a document in `docs/grootboek/` or this file changes,
  say what changes and why, and ask for a check. No silent edits.
- A decision without a register line does not exist for the next session. Update the
  register in the same commit as the record.

# What this is

A personal learning project, also used daily by its builder, to practise spoken
conversation in a foreign language against an AI persona. Details and ambition: the
"Who it is for" section of `README.md`.

# Working agreements

These describe what the codebase and its history already do. If you find a counter-example,
say so rather than following either blindly.

- **Language.** Code, comments, UI copy, commit messages and docs are in English.
- **Code style** in one line: TypeScript strict, function declarations, braced `if`s with
  early returns, booleans that read as a sentence (`microphoneIsLive`), lowercase-dashed
  file names. The full list loads when you touch `src/` (`.claude/rules/code-style.md`).
- **Commits.** One short imperative sentence that says what changed ("Handle all documented
  Scribe error types"), no prefixes except the rare `chore:`. No `Co-Authored-By` trailer.
  The plan goes in the same commit as the code that invalidates it (see above).
- **Branches.** One branch per piece of work, merged into `main` through a pull request:
  `stage/N-name` for build stages, a descriptive name for fixes and features, `spike-*` for
  experiments. Review fixes get their own commits on the branch under review. Code goes
  through a branch and a PR; only small notes in the plan or tooling tweaks have been
  committed straight to `main`, and only on Jaron's go-ahead.
- **Hooks.** `.claude/settings.json` wires hooks under `.claude/hooks/`. A hook's output is an
  order, not a suggestion: when one fires, carry out exactly what it says — nothing skipped,
  nothing deferred, no working around it with a different tool or phrasing. A hook that
  carries a procedure (a checklist, a release ritual) keeps that procedure in its own file
  next to the script and injects it at the right moment — the checklist is data, the hook is
  delivery, so a procedure change never means a code change.
- **Working model: subagent-tenzij.** The lead thread steers and decides; it does not write
  source itself. Edits to `src/` or `spikes/` go through a builder subagent — a
  `guard-kenniswerker` hook enforces this for the lead thread (subagent calls pass through;
  `docs/`, `.claude/` and other non-code files are a carve-out, so this file or a hook script
  can still be edited directly). A time-boxed override exists for when Jaron explicitly asks
  the lead thread to make one change itself: it creates
  `.claude/.hoofdthread-override.json` (`{"activatedAt": "<ISO timestamp>", "durationMinutes": 15}`,
  15 minutes unless Jaron names a longer duration), which the hook honors only until it expires.
- **Staffel.** Before starting a builder, load the `triage` skill and classify the task —
  trivial / normal / risky, by type, never by size — then put the one-line verdict
  (`regime: ... — <reason>`) on the first line of the builder's assignment. A `triage-guard`
  hook refuses a lead-thread builder-start without that line (a builder started by another
  agent passes through — the orchestrating agent is the assurance there, per the skill).
  `trivial` gets a one-line assignment and a three-line report, no reviewer; anything else
  keeps the full contract.
- **Fork mode.** On by default, no setup needed. Use it for conversation-fed synthesis work — a
  spec, a draft, a write-up where the dialogue itself is the source. Living documents and
  registers (`docs/plan.md`, the grootboek registers) stay lead-thread work; they are not fork
  material.
- **Checks before you call something done.** `npm run lint`, then
  `npx next typegen && npx tsc --noEmit`, `npm run docs:check` (drift between docs and
  repo), then `npm run build`. Anything touching audio,
  recording or layout also needs a test on a real iPhone: Safari is a hard requirement.
- **Folders.** `src/app` routes and global CSS, `src/components` screens and UI,
  `src/hooks` session context and effect drivers, `src/lib` state machine, provider
  registries and pure helpers. `spikes/` is a separate app, excluded from lint and typecheck.

# Where the rest of the context lives

Context is layered so that a session loads what it needs. `docs/index.yml` is the
machine-readable table of contents: read it first, then open only the document you need.

| Layer | Where | Loads |
|---|---|---|
| Code style | `.claude/rules/code-style.md` | when a file in `src/` is touched |
| Safari / iPhone | `.claude/rules/safari-ios.md` | when components, hooks or STT code are touched |
| Design system, components | `src/components/CLAUDE.md` | when working in `src/components/` |
| Providers, state machine | `src/lib/CLAUDE.md` | when working in `src/lib/` |
| Plan and decisions | `docs/plan.md`, `docs/adr/` | on demand, via `docs/index.yml` |
| Code architecture | `docs/code-architectuur.md` + `docs/code-architectuur-register.json` | on demand; before splitting or growing a file |
| Grootboek | `docs/grootboek/`, via `registers/` | on demand; `docs/grootboek/CLAUDE.md` loads when working there |
| Procedures | `.claude/skills/` | when invoked (`/stage-review`, `/grootboek`) |
| Agents | `.claude/agents/` (`builder`, `reviewer`) | when delegated to; parallel builders get disjoint file boundaries and share this context |
