# HDR-011: Arc work branches from `arc/arc-main`, and the branch exists before the first edit

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

One sentence added to the `Branches` line of the root `CLAUDE.md`: work in the grootboek
experiment (`arc/*`) branches from `arc/arc-main` and goes back into it through a pull request,
while `arc/arc-main` is the integration branch; `main` is production (ADR-001). The branch is
created before the first edit, not after.

No hook enforces the second half. It is one incident (see the register), and the rule was not
written down until now; a hook comes only if the pattern recurs.

## Why

**Kernprincipe:** the root `CLAUDE.md` is the one file every session loads, so whatever a
newcomer needs to start correctly has to be there, not only in a folder that loads when you
happen to work in it. The base branch was written in `docs/grootboek/CLAUDE.md` and in the CI
workflow, and a fresh agent in the first cold-start run (JNL-002) answered "what do I do before
a change" exactly as the root said: its own branch, never `main`, and no base branch. It then
edited on `arc/arc-main`. The repo's description of itself had drifted behind how the work is
actually done.

## Consequences

- **A time-bound sentence.** It says "while `arc/arc-main` is the integration branch". When
  `arc/arc-main` merges into `main` and becomes the central branch, the sentence is updated in
  the same step; the drift signal does not watch it.
- The base branch is now named in two places, the root and `docs/grootboek/CLAUDE.md`. A
  duplication, accepted: the root is what loads for everyone.
- `branch-before-edit` is logged in the incident register with this record as its `maatregel`.
  If it recurs after the sentence, the rule was not enough and the pattern escalates; a hook that
  refuses edits on `arc/arc-main` and `main` is the obvious next step, not a thing to build first.
- The root `CLAUDE.md` is a leading document: the change was reported to Jaron and checked.
- Proof is a second cold-start round (JNL-002): the base-branch question should now be answered
  and the edit should start on a branch. Until then this is a decision, not a result.
