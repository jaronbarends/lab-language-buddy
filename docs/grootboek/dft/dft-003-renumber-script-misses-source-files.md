# DFT-003: The renumber script leaves record ids in source comments unchanged, HDR-005 says it should not

- **Status:** in_progress
- **Date:** 2026-10-27
- **Trigger:** found by the animation session after `arc/arc-main` was merged into
  `arc/bubble-animation` (the first time `npm run docs:renumber` ran on a branch that touches
  `src/`): three comments in `src/` still said JNL-002, which by then was the cold-start
  journal and no longer the bubble journal.

## SOLL vs IST

**SOLL:** HDR-005, step 3: a renumbering rewrites the file name, the register lines,
`docs/index.yml` "and every reference in prose (other records, the balance, **code comments**)".
HDR-007 made that step mechanical and describes the script as covering the registers,
`docs/index.yml`, the record and the journals that mention it.

**IST:** `scripts/renumber-records.mjs` rewrote only files ending in `.md`, `.yml`, `.yaml` or
`.json`. A reference in a `.ts` or `.tsx` comment was never looked at. On 2026-10-27 that left
three comments pointing at the wrong journal, in `ai-bubble.tsx` (two) and
`conversation-thread.tsx` (one). No behaviour changed; a reader who followed the reference
would have landed in the wrong document.

**Weight:** medium. The pointer is wrong silently, nothing fails, and only a person reading the
code finds it. It was found by chance, by the session that owns those files.

## Pattern

None yet; this is the first renumbering on a branch that touches `src/`, and so the first time
the gap could show. It is not an incident of the kind the incident register counts (a repeat);
it is a defect in a tool, found on first use.

## Decisions

1. **The script now also rewrites `.css` and every JavaScript or TypeScript file extension**
   (`js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, `cts`), on the lines the branch added, like
   the documents. Done on `arc/renumber-source-files`. Covered by two tests: a comment the
   branch added is rewritten, and a line in a source file that the branch did not add is left
   alone.
2. **Replayed on the real case** on a throwaway checkout of `arc/bubble-animation` from before
   its renumbering: the script changed eight files instead of six, and the three comments read
   JNL-003.
3. **The three comments that are already wrong** on `arc/bubble-animation` cannot be repaired by
   the script now (the collision is resolved), so the animation session fixes them by hand
   through a builder (`regime: trivial`, comments only). **This DFT stays `in_progress` until
   that has landed.**
4. HDR-005 and HDR-007 are not edited: both are implemented. This record is the correction.

## Consequences

- **Limits.** A reference in a file type outside the list (an `.html`, an `.svg`, a binary) is
  still not rewritten. A source comment that cites a record by id still has no check that the
  id exists, and such a check could not have caught this case: JNL-002 exists, it is just the
  other journal.
- The assumption that makes the replacement safe still holds, and now covers source files too:
  before the merge, a colliding id on a line the branch added means the branch's own record.
- Not an incident in the register. A tool defect found on first use is a fix, not a pattern; if
  the same kind of gap turns up again, it is a candidate for one.
