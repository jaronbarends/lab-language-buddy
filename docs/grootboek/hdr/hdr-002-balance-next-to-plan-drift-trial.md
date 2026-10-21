# HDR-002: Keep the software balance next to `plan.md`, as a drift-detection trial

- **Status:** in-progress
- **Date:** 2026-10-20
- **Type:** Harness Decision Record (HOW do we work)

## Decision

`docs/grootboek/software-architectuur.md` stays, as a second, derived reading path next to
`docs/plan.md`. `plan.md` remains the source for every decision made before 2026-10-20 (see
HDR-001). The explicit purpose of keeping the balance is to try the grootboek's drift
mechanism (a DFT report: does the balance still match the code), which has no other way to
be tried without a balance to check against.

## Why

A fresh-context critique pass found that most of the balance's content already existed in
`plan.md`, from a different angle. Keeping a second document that largely restates the first
is drift risk for no benefit — unless the point is specifically to exercise the part of the
grootboek that `plan.md` cannot provide on its own: a mechanical check that a leading document
still describes the code. The human's stated intent is to move `plan.md` into the grootboek
eventually, but to try the grootboek first; this decision is the vehicle for that trial, not
a commitment to the balance's long-term existence.

## Consequences

- The balance now needs the same discipline as any leading document: the duty to communicate
  on change, and an update in the same commit as a decision that touches it.
- The drift trial (REQ-GG-05) is the next concrete step; this record is what makes it
  possible.
- If the trial shows the balance adds nothing drift detection couldn't tell some other way,
  that is grounds to retire the balance rather than keep maintaining a near-duplicate of
  `plan.md`.
- Source: JNL-001, issue K1.
