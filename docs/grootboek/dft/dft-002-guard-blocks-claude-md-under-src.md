# DFT-002: The subagent-tenzij guard blocks CLAUDE.md files under src/, the working agreement says it should not

- **Status:** resolved (2026-10-27)
- **Date:** 2026-10-24
- **Trigger:** found while designing the communication-duty hook (REQ-GG-04, Implementeer de
  communicatieplicht bij documentwijzigingen): `src/components/CLAUDE.md` and
  `src/lib/CLAUDE.md` are leading documents, so the question came up who may edit them.

## SOLL vs IST

**SOLL:** the "Working model: subagent-tenzij" line in the root `CLAUDE.md` says edits to
`src/` or `spikes/` go through a builder, and that `docs/`, `.claude/` and "other non-code
files" are a carve-out the lead thread may edit directly.

**IST:** `.claude/hooks/guard-kenniswerker.cjs` does not look at the kind of file. It denies
any Edit or Write from the lead thread whose path starts with `src/` or `spikes/`. Tested on
2026-10-24 with simulated lead-thread calls:

| Path | Lead thread |
|---|---|
| `src/lib/foo.ts` | denied (intended) |
| `src/lib/CLAUDE.md` | denied |
| `src/components/CLAUDE.md` | denied |
| `CLAUDE.md` | allowed |
| `docs/plan.md` | allowed |

So two non-code files are blocked for the lead thread while a subagent may edit them. The
agreement and the hook disagree on one class of file.

**Weight:** low. Nothing breaks: the lead thread can use the time-boxed override or a
builder. The cost is that a documentation change in two context files needs a detour, and
that the agreement overstates the carve-out.

## Pattern

None yet. One occurrence; no earlier report of a hook disagreeing with its working agreement.
It is a candidate for the harness-weakness count (REQ-GG-06, Bouw het immuunsysteem) only if
a second hook turns out to differ from its description.

## Decisions

Decided by Jaron on 2026-10-27: **change the hook** (option 1 of the two that were open; the
other was to tighten the agreement).

`guard-kenniswerker.cjs` no longer guards Markdown files. A file with the extension `.md` (any
case) under `src/` or `spikes/` is allowed for the lead thread. Code and every other file
type under those folders stays guarded, a CSS module or a JSON file included. The working
agreement needed no change: it already said that non-code files are a carve-out.

Tested on 2026-10-27 with simulated lead-thread calls:

| Path | Lead thread |
|---|---|
| `src/lib/CLAUDE.md`, `src/components/CLAUDE.md` | allowed (was denied) |
| `spikes/ai-voice-demo/findings.md`, `src/lib/NOTES.MD` | allowed |
| `src/lib/foo.ts`, `src/app/page.tsx`, `src/components/x.module.css`, `spikes/ai-voice-demo/app.js`, `src/lib/notes.md.ts` | denied (unchanged) |
| `CLAUDE.md`, `docs/plan.md` | allowed (unchanged) |

A subagent edit of code passes as before, and the time-boxed override still works.

## Consequences

- The lead thread can now edit `src/components/CLAUDE.md` and `src/lib/CLAUDE.md` itself, so
  the duty to communicate (HDR-006) reaches it directly, no longer through a builder's report.
- This is the first drift report in the grootboek that ran the whole chain: booked (DFT-002),
  decided, changed in the harness, and closed. It is evidence for REQ-GG-05 (Richt
  drift-detectie in) that a finding is followed up and not only signalled.
- No record is needed besides this one: a hook changed to match an existing agreement is a
  correction, not a new decision.
