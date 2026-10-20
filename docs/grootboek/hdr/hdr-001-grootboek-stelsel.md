# HDR-001: Introduction of the grootboek system

- **Status:** implemented
- **Date:** 2026-10-20
- **Type:** Harness Decision Record (HOW do we work)

## Decision

language-buddy introduces the grootboek system, as an experiment on the `arc/*` branches.
Every decision of substance gets a numbered document and a register line:

| Type | Question | Folder |
|------|----------|--------|
| ADR | WHAT do we build? | docs/grootboek/adr/ |
| HDR | HOW do we work? | docs/grootboek/hdr/ |
| PDR | WHY this way? | docs/grootboek/pdr/ |
| DFT | IS IT STILL TRUE? | docs/grootboek/dft/ |

The registers in docs/grootboek/registers/ are the cheap index: the agent reads the
register first, then the document. The constitution (CLAUDE.md) is the operational summary
that is always in context.

Two choices specific to this repo:

- **`docs/plan.md` stays the source for every decision made before 2026-10-20.** Nothing is
  migrated and `docs/adr/0001-decisions-live-in-the-plan.md` stays in force for `main`. Only
  decisions taken from now on, in the experiments on `arc/*`, are booked here. Before this
  branch merges to `main`, ADR 0001 has to be settled (superseded, or the two places
  reconciled).
- **No source field.** The plan's Decision log records who originated each decision
  (`agent`, `you`, `ported`). The grootboek register format has no such field and it has
  not been used in practice, so new records do not carry one.

## Why

Without a grootboek every decision lives only in the session in which it was made. With one,
every choice is traceable (where is it), followable (why was it made) and transferable (any
later session or agent can build on it). The experiment is to find out whether that pays off
here, next to the plan, before deciding whether to move the plan into it.

## Consequences

- The folder structure and registers were created by the bootstrap script of the grootboek
  skill; this decision documents its own introduction.
- From now on: update the register with every new decision or status change. A document
  without a register line does not exist for an agent reading the index.
- An `implemented` decision no longer changes; a new decision supersedes the old one (the
  counter-entry).
- Two places hold decisions until the experiment is settled, so drift between them is
  possible. The register for HDR/ADR/PDR is the place to look for anything from
  2026-10-20 onward; `plan.md` for everything before.
