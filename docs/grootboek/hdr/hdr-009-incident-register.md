# HDR-009: Recurring faults are logged by pattern and codified at three

- **Status:** implemented
- **Date:** 2026-10-28
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

REQ-GG-06 (Bouw het immuunsysteem) wants a fault that keeps coming back to become a rule, hook
or skill in the harness. Until now nothing counted: the corrections Jaron gave lived in
Claude's private memory, outside the repo, where no builder or other clone could see them and
nobody could tell whether a fault had happened twice or seven times. This record adds the
front half of the immune system.

- **A register**, `docs/grootboek/registers/incident-register.yml`, grouped by pattern. An
  incident is a line (`datum`, optional `aantal`, `wat`, `bron`), not a document and not a
  numbered record: it books no decision (HDR-001), and without ids two parallel branches cannot
  collide on a number the way records do (HDR-007).
- **A counter**, `npm run docs:incidents` (`scripts/incidents.mjs`), and a check in
  `docs:check`. **Threshold three**: a pattern with three or more incidents and no `maatregel`
  is a warning; a `maatregel` naming an HDR that does not exist, a duplicate pattern, or an
  incident without `datum` or `wat` is an error.
- **What happens at three:** the pattern is codified (a rule, a hook or a skill), an HDR books
  the decision (its source is the immune system, as the HDR guide describes), and the HDR's id
  goes in the pattern's `maatregel`. The warning then stops.
- **A logging duty** in the root `CLAUDE.md`: when Jaron corrects the agent, or a tool fails in
  a way that has happened before, add one entry and say so in a sentence.

## Why

**Kernprincipe:** one time is an incident, two times is chance, three times is a weakness of the
harness (kennisdocument het-gedirigeerde-grootboek). A weakness can only be fixed once it has
been seen as one, and that takes a count nobody was keeping. The count is cheap if it is only a
line; it would not be kept if each fault needed a document, which is why a fault is not a DFT.

The threshold is three, as the requirement says. The grootboek skill's HDR guide says
"frequentie > 3", which is stricter and which this repo does not follow.

## Consequences

- **Seeded** on 2026-10-28 from the six feedback notes in Claude's memory, counted by what the
  notes themselves say and not by a full history: `naming-precision` 7, `answer-first` 2,
  `act-on-question` 2, `review-point-context` 1, `id-with-title` 1, `ai-vs-self-advice` 1.
- **First codification:** `naming-precision` stood at seven on day one, so the register warned
  immediately. It was codified in HDR-010, which is the proof that the chain runs from
  incident through count to rule.
- **`ai-vs-self-advice` is not a repeated fault but a conflict** between Jaron's global
  instructions and this project, settled only in private memory. It was fixed once, with a line
  in the project `CLAUDE.md`, without waiting for a count.
- **Logging depends on the agent.** No hook can see a human correction. The register makes
  repetition countable once it is logged; it does not make the agent log. Whether it does is
  known only after weeks of use, and this record does not claim it.
- **Judgment stays human.** Whether a new fault is "the same" as an existing pattern is the
  agent's call, checked by Jaron. A wrong match skews a count.
- **Parallel branches** that both log still conflict on the same lines of the register; the
  resolution is to keep both sides.
- The memory notes are not deleted. They remain the source of the first incidents; the
  register is where they are counted.
- **Numbering.** This branch books HDR-009 and HDR-010. `arc/bubble-animation` holds an
  HDR-008 of its own and renumbers it with `npm run docs:renumber` when it next merges
  `arc/arc-main` (HDR-007).
