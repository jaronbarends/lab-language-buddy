# HDR-005: The branch that merges second renumbers its records

- **Status:** implemented
- **Date:** 2026-10-23
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

Grootboek records are numbered sequentially (HDR-005, JNL-002, ...), and several `arc/*`
branches run in parallel, each booking the next free number from its own base. Two branches
therefore hand out the same number. The order in which they merge is not known up front.

The rule: **the branch that merges second renumbers its own records, in that branch, before
it merges.** In practice:

1. Merge `arc/arc-main` into the branch (a merge, not a rebase: a pushed branch is not
   rewritten, so no force-push).
2. Find the numbers the branch booked that `arc/arc-main` now also holds.
3. Give the branch's records the next free numbers, in one pass over the file names, the
   register lines, `docs/index.yml` and every reference in prose (other records, the balance,
   code comments).
4. Run `npm run docs:check`, then open the pull request.

A record that has already landed in `arc/arc-main` or `main` keeps its number, always.
Numbers are never reused or shifted afterwards.

## Why

**Kernprincipe:** a number is only an identity once it is in shared history; before that it
is a draft label. Renumbering a draft costs one search-and-replace; renumbering a merged
record rewrites commit messages, pull requests and the references others already copied, and
breaks the grootboek's own rule that records are append-only.

Resolving the collision in the merge conflict on `main` instead looks tempting, but git only
conflicts on what both sides edit at the same lines. The register tails and `docs/index.yml`
do conflict. The record files do not (`hdr-005-a.md` and `hdr-005-b.md` are different
files), and neither do the references inside prose. Fixing only the conflict leaves two
different "HDR-005" in the repo and nothing says so. Doing it in the branch, before the
merge, puts the whole job in one deliberate step.

The merge order is deliberately not fixed here. The rule works whichever branch goes first,
so nobody has to decide the order for the numbers' sake.

## Consequences

- `docs/grootboek/CLAUDE.md` carries the rule as a short working agreement, so every session
  in that folder loads it.
- `arc/bubble-animation` booked HDR-005 (the Modern Web Guidance trial) before this record
  existed. When it merges `arc/arc-main` it becomes the first branch to apply this rule: its
  HDR-005 takes the next free HDR number. JNL-002 does not collide.
- `npm run docs:check` does not check record ids (`scripts/check-docs.mjs` only compares
  `docs/index.yml` with the files, env vars and backticked paths). Until it does, step 3 is a
  manual check; each register must hold each id once.
