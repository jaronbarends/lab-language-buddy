---
titel: "A drift signal for leading documents"
type: spec
soort: plan van aanpak
status: concept
datum: 27 oktober 2026
auteurs: Jaron, Mama Claude
---

# A drift signal for leading documents

**The point.** REQ-GG-05 (Richt drift-detectie in) wants drift to be signalled, booked and
followed up. DFT-001 proved the *process* of a reconciliation; nothing tells anyone *when* one
is due. This feature adds that: a signal that says "the code this document describes has
changed since the document was last touched". It is a signal, not a verdict. Whether the
document is actually wrong is for a reconciliation to find out, and a DFT books the result.

## Part 1: the field `werkgebied`

A leading document that describes code says which code, in its own front matter:

```yaml
werkgebied:
  - src/lib
  - src/hooks
  - src/app
  - src/components
  - next.config.ts
  - .env.example
```

- Paths are files or folders in the repo. The field lives with the document it belongs to, so a
  new balance brings its own scope and nothing else has to be kept in step (the choice for
  option 2 over a separate list).
- First user: `docs/grootboek/software-architectuur.md`, the only balance so far. That is a
  change to a leading document: reported and checked before it is committed.
- **Left out on purpose: `package.json`.** Since the balance was last touched it changed four
  times, all tooling (CI, Husky, scripts). Those say nothing about the balance, and a signal
  that cries on day one gets ignored. A dependency that matters shows up in `src/` as well.
- Scope is a judgment call per document. `src/app` is taken whole, not just `src/app/api`,
  because the balance also describes the app shell; CSS changes there will fire the signal.

## Part 2: the script, `npm run docs:drift`

- Finds every `.md` under `docs/` whose front matter has `werkgebied`.
- **Baseline** is the last commit that touched the document. Commits that touched the scope
  after it are the drift: the script lists them (hash, date, subject) and the files changed.
- A path in `werkgebied` that does not exist is a problem, not drift: the list itself has gone
  stale (a folder was renamed). Exit code 1.
- A document not yet committed has no baseline: skipped, and said so.
- It never changes anything and always exits 0 unless there is a problem.

## Part 3: in `docs:check`

- Drift is a **warning** (like the plan-staleness one), never an error: drift is normal, and a
  red CI for it would be wrong. A missing scope path is an **error**.
- `docs:check` is already on the list of checks to run before calling something done and runs
  in CI on every PR, so the signal needs no new habit.

## What it does not do

- **It does not judge.** "Behind" means the scope changed, not that the document is wrong.
  The next step is a reconciliation (an agent pass against the code, as in DFT-001) and a DFT
  that books the outcome.
- **Baseline is "last touched", not "last checked".** Fixing a typo in the document resets the
  signal. A stricter baseline (a field naming the commit a reconciliation last verified) is a
  possible later step.
- **Visibility is thin.** A CI warning is a line in a log. Nothing posts it on the PR.
- **Other leading documents.** `CLAUDE.md` files could carry `werkgebied` too (the one in
  `src/components` describes that folder). Not done here; the mechanism allows it.

## Tests

`node:test` on a throwaway git repo, as for the renumber script: no change gives no drift; a
change inside the scope after the document is reported with its file; a change outside the
scope is not; editing the document afterwards resets it; a document without `werkgebied` is
ignored; an uncommitted document is skipped; a missing scope path is a problem; a folder scope
matches files below it.

## Done when

- `npm run docs:drift` runs on the current repo and reports nothing behind (no change in the
  scope since the balance was last touched, checked above).
- The tests pass and run in CI (`test:scripts` already does).
- `docs:check` warns on drift and fails on a missing scope path, shown on a throwaway repo.
- The proof that it *finds* something real stays open until a change in the scope lands:
  `arc/bubble-animation` (`ai-bubble.tsx`) is the first. That is named in the record, not
  faked here.
- A new HDR books the decision and how the signal leads to a reconciliation and a DFT.

## Sources

- **The thinking:** this session; DFT-001 (the reconciliation process, no drift found);
  REQ-GG-05.
- **The pattern:** `.claude/hooks/leading-documents.json` and HDR-006 (a list as data);
  `scripts/renumber-records.mjs` and HDR-007 (script, test on a throwaway repo, check in
  `docs:check`); the plan-staleness warning in `scripts/check-docs.mjs`.
- **Where it lands:** `scripts/drift-signal.mjs`, `scripts/check-docs.mjs`, `package.json`,
  the front matter of `docs/grootboek/software-architectuur.md`.
- **The first real test:** branch `arc/bubble-animation`.
