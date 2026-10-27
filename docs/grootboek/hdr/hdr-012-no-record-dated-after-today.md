# HDR-012: No record may be dated after today

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

`npm run docs:check` fails when a grootboek register or record carries a date after today.
It reads the structured fields only: the register fields (`datum`, `implementatie-datum`,
`laatste-sessie`), the front matter of a document, the `- **Date:**` and `- **Implemented:**`
lines of a record, and the Dutch `datum: 27 oktober 2026` of a spec. Registers are read in full;
a document is read in its first twenty lines. A date in running prose is not looked at.

"Today" is the date in `Europe/Amsterdam`, not in UTC. CI runs in UTC, and a record written
shortly after midnight here would otherwise look as if it comes from tomorrow.

## Why

**Kernprincipe:** a date is a fact, and a fact that anyone can read from the clock should not be
assumed. On 2026-10-27 22 dates in eight files were written as 2026-10-28, a day ahead of the
clock and of every commit that carried them, because the day was taken to have turned over
without looking. It was found by chance, in the reflog of a cold-start clone. A check would have
caught it in the first `docs:check`.

This is the mechanical half of the pattern `date-assumed` in the incident register (HDR-009),
which it is the `maatregel` of.

## Consequences

- It only catches a date after today. A date that is wrong but in the past, or a date in prose,
  passes. A one-day-late error is invisible to it.
- The timezone is a constant in `scripts/records.mjs`. Someone working from another timezone, at
  the wrong hour, could trip it; the fix is the constant, not a looser check.
- Covered by `scripts/record-dates.test.mjs`, including the exact mistake that was made: a
  register dated one day ahead.
- The other, non-mechanical half of the same incident is a claim made without reading its
  source. That is the pattern `document-not-fully-read`, at two incidents and not yet at the
  threshold, and it has no maatregel.
