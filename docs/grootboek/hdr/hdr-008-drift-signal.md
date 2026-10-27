# HDR-008: A drift signal tells when the code a leading document describes has moved on

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

REQ-GG-05 (Richt drift-detectie in) asks for drift to be signalled, booked and followed up.
DFT-001 proved the process of a reconciliation, but nothing said when one was due. This record
adds the signal and the rule for what follows it.

- **A field `werkgebied`** in the front matter of a leading document that describes code: the
  files and folders it is about. It lives with the document, so a new balance brings its own
  scope and no separate list has to be kept in step. First user: `software-architectuur.md`
  (`src/lib`, `src/hooks`, `src/app`, `src/components`, `next.config.ts`, `.env.example`).
- **A script**, `npm run docs:drift` (`scripts/drift-signal.mjs`). The baseline is the last
  commit that touched the document; the drift is every commit that touched its werkgebied
  after that, with the files. It never changes anything.
- **In `docs:check`:** a document that is behind is a **warning**, a werkgebied path that does
  not exist is an **error** (the list itself has gone stale). `docs:check` is on the list of
  checks before calling something done and runs in CI on every PR.
- **What follows a signal:** a reconciliation, an agent pass against the files the script
  names (as in DFT-001), and a DFT that books the outcome, including "no drift found". The
  signal blocks nothing.

## Why

**Kernprincipe:** drift is normal; undetected drift is the danger (kennisdocument,
het-gedirigeerde-grootboek). The signal answers only "when should someone look"; whether the
document is actually wrong is a judgment that belongs to a reconciliation. Keeping those two
apart keeps the signal cheap and honest: it can be mechanical because it claims little.

It is a warning, never an error, because a red CI for drift would punish the normal state and
teach people to ignore CI. `package.json` is left out of the balance's werkgebied: it changed
four times since the balance was last touched, all tooling (CI, Husky, scripts), and a signal
that cries on day one gets ignored. A dependency that matters shows up in `src/` as well.

## Consequences

- **Proved on real data on 2026-10-27**, without touching any branch: in a throwaway checkout
  of `arc/bubble-animation` with the field added, the signal named commit 750dc49 and its four
  files (`ai-bubble.tsx`, `ai-bubble.module.css`, `conversation-thread.tsx`,
  `thinking-bubble.tsx`). On this branch it reports nothing behind, which is correct: nothing in
  the werkgebied changed since the balance was last touched. The tests (`drift-signal.test.mjs`)
  cover the other cases on a throwaway repo.
- **Still open for REQ-GG-05:** the reconciliation that follows a real signal. The first one is
  due when `arc/bubble-animation` is merged; then DFT-003 (or the next free number) books
  whether `software-architectuur.md` needs to change for the bubble. This record does not
  pretend that has happened.
- **Limits, accepted:** the baseline is "last touched", not "last checked", so fixing a typo in
  the document resets the signal. A stricter baseline (a field naming the commit a
  reconciliation last verified) is a possible step. Visibility is a line in a CI log; nothing
  posts it on the PR. `src/app` is taken whole, so a CSS change there fires the signal.
- **A new balance has to declare its `werkgebied`.** The skill's balance guide does not say so;
  `docs/grootboek/CLAUDE.md` does not yet either. Other leading documents (the `CLAUDE.md`
  files) could carry the field too; not done here.
- **Numbering.** This branch books HDR-008. `arc/bubble-animation` also holds an HDR-008 (the
  Modern Web Guidance trial); per HDR-007 it renumbers to the next free number when it next
  merges `arc/arc-main`, using `npm run docs:renumber`.
