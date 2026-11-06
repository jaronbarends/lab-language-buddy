@AGENTS.md

# Decisions

Decisions live in the grootboek (`docs/grootboek/`): ADR (what), PDR (why, product) and HDR
(how we work), indexed by registers in `docs/grootboek/registers/`. Read the register first,
then only the record you need: several choices that look arbitrary in the code are
deliberate, and the reasoning lives there rather than in the diff. `docs/index.yml` is the
table of contents.

**Keep records current in the same commit as the code.** If a change contradicts a record,
update or supersede the record in that same commit. Left as a separate chore it will not
happen, and a stale record is worse than none.

# Grootboek (experiment, `arc/*` branches)

Numbered decision records (ADR, HDR, PDR), drift
reports (DFT) and discovery journals (JNL) under `docs/grootboek/`, indexed by YAML
registers in `docs/grootboek/registers/`. Read a register first, then only the
document you need. `docs/grootboek/CLAUDE.md` loads by itself in that folder and has
the document types and conventions. Start the `grootboek` skill
(`.claude/skills/grootboek/`) for any grootboek document: its writing guides are a hard
requirement.

- **Duty to communicate.** Leading documents: every `CLAUDE.md` in the repo,
  `docs/grootboek/software-architectuur.md` (the only balance so far; a new balance joins
  this list when it is created) and `docs/code-architectuur.md`. When one changes: say what
  changes and why, show the concrete change, and ask for a check. No silent edits. This also
  holds when a record leads to an update of a leading document. Records (ADR, HDR, PDR, DFT,
  JNL) and the README are outside this duty.
- A decision without a register line does not exist for the next session. Update the
  register in the same commit as the record.
- **Incident register** (HDR-009): counts repeated faults so they can become rules. When
  Jaron corrects the agent, or a tool fails the same way again, add one line under a
  matching pattern in `docs/grootboek/registers/incident-register.yml` (or start a new
  pattern) and say so in one sentence. When `docs:check` warns that a pattern reached three,
  fix the cause with a rule, hook or skill, book an HDR and put its id in the pattern's
  `maatregel`.

# What this is

A personal learning project, also used daily by its builder, to practise spoken
conversation in a foreign language against an AI persona. Details and ambition: the
"Who it is for" section of `README.md`.

# Working agreements

These describe what the codebase and its history already do. If you find a counter-example,
say so rather than following either blindly.

- **Language** (HDR-014). Code, code comments, UI copy and commit messages are in English, and
  so are `README.md`, `AGENTS.md` and `spikes/`. All other documentation is in Dutch: the grootboek and its
  registers, every `CLAUDE.md`, the rules, agent and skill instructions, hook messages and the
  rest of `docs/`. Existing English documents are being translated; new documents are written
  in Dutch from the start. Translate prose only, never keys, ids, file names or the
  `Status`/`Date`/`Implementation` labels of a record. Keep technical terms in English
  instead of coining Dutch ones (hook, worktree, branch, dryrun; not "werkboom" or
  "droogloop").
- **No AI-or-self verdicts.** This project is an experiment in building with an AI that writes
  most of the code. Skip the one-line "let AI generate this / write this yourself"
  recommendation and the Next.js/TypeScript learning-goal framing from the global
  instructions. Flagging a vague prompt or spec is still welcome.
- **The existing app is not a source** (HDR-016, PDR-001). Do not read, list or search the
  existing Language Buddy repo (`jaronbarends/language-buddy`) unless Jaron points at a
  specific file. If reading a file would save real time, ask first; name out loud anything
  you do read. If you hit its material by accident, say so instead of using it quietly.
- **Code style** in one line: TypeScript strict, function declarations, braced `if`s with
  early returns, booleans that read as a sentence (`microphoneIsLive`), lowercase-dashed
  file names. The full list loads when you touch `src/` (`.claude/rules/code-style.md`).
- **Commits.** One short imperative sentence that says what changed ("Handle all documented
  Scribe error types"), no prefixes except the rare `chore:`. No `Co-Authored-By` trailer.
  A record that the change invalidates goes in the same commit (see Decisions).
- **Branches.** One branch per piece of work, merged into `main` through a pull request:
  `stage/N-name` for build stages, a descriptive name for fixes and features, `spike-*` for
  experiments. Review fixes get their own commits on the branch under review. Code goes
  through a branch and a PR; only small notes in the docs or tooling tweaks have been
  committed straight to `main`, and only on Jaron's go-ahead. Create the branch before the
  first edit, not after. Work in the grootboek experiment (`arc/*`) branches from
  `arc/arc-main` and goes back into it through a PR, while `arc/arc-main` is the integration
  branch; `main` is production (HDR-011).
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
  registers (the grootboek registers) stay lead-thread work; they are not fork
  material.
- **Refactor loop.** Before the lead thread pushes, a `guard-push-sweep` hook sweeps `src/`
  for files past the doorbell/hard-limit with no register decision. If it finds any new ones,
  it denies the push and names them; the lead thread spawns the `refactor-werkplaats` agent
  for those files, then retries. A pending marker (`docs/.refactor-pending.json`, 24h TTL)
  stops the next push from re-flagging a file that already has a proposal awaiting review. A
  git-level push-hook that spawns this unattended, matching ARC's own convention, was refused
  by the harness's own safety classifier ("Create Unsafe Agents") — this session-scoped
  version is what's actually built; see `docs/code-architectuur.md`'s REQ-AH-13 note.
- **Checks before you call something done.** `npm run lint`, then
  `npx next typegen && npx tsc --noEmit`, `npm run docs:check` (drift between docs and
  repo), `npm run test:scripts` (the tests of the scripts that rewrite documents),
  `npm run register:check` (the code-architecture register has not drifted), then
  `npm run build`. Anything touching audio,
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
| Decisions | `docs/grootboek/` (ADR, PDR, HDR), via the registers and `docs/index.yml` | on demand |
| Code architecture | `docs/code-architectuur.md` + `docs/code-architectuur-register.json` | on demand; before splitting or growing a file |
| Grootboek | `docs/grootboek/`, via `registers/` | on demand; `docs/grootboek/CLAUDE.md` loads when working there |
| Procedures | `.claude/skills/` | when invoked (`/stage-review`, `/grootboek`) |
| Agents | `.claude/agents/` (`builder`, `reviewer`) | when delegated to; parallel builders get disjoint file boundaries and share this context |
