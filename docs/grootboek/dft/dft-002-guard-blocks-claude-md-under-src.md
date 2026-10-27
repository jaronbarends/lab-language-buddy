# DFT-002: The subagent-tenzij guard blocks CLAUDE.md files under src/, the working agreement says it should not

- **Status:** open
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

Open. The choice is Jaron's; two options, neither booked:

1. **Change the hook.** Allow the lead thread to edit `*.md` under `src/`; keep denying code.
   The hook then matches the agreement as written.
2. **Change the agreement.** Say that the carve-out ends at `src/` and `spikes/`, including
   their `CLAUDE.md` files. The hook stays as it is.

Whichever is chosen lands in `CLAUDE.md` (the working-model line) or in the hook script, and
this DFT moves to `resolved` with a line saying which.

## Consequences

- Until decided, the communication-duty hook (REQ-GG-04) treats `src/components/CLAUDE.md`
  and `src/lib/CLAUDE.md` as leading documents like any other; it does not depend on who edits
  them.
- A change to `CLAUDE.md` is a leading-document change: when this DFT is resolved, the duty
  to communicate applies.
