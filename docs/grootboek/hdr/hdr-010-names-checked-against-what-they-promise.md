# HDR-010: A name is checked against what it promises

- **Status:** implemented
- **Date:** 2026-10-28
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

A rule in `.claude/rules/code-style.md`, loaded whenever a `.ts` or `.tsx` file in `src/` is
touched: a name says what the function returns or does, not what it is used for, and uses the
same word as its neighbours. When Jaron points at a name, the agent agrees, says plainly why it
was wrong, proposes a better one with the reason, and lets him decide; a rename across files is
cheap, and the files are listed once it passes about five.

## Why

**Kernprincipe:** Jaron reads names as the specification and reviews them as part of the work.
A name that promises more or less than the code does costs him review time, and a code base
only reads well if one word means one thing.

This is the first pattern the incident register (HDR-009) took through to a fix. In the stage 4
review he corrected seven names, each with a reason, and each time he was right: a function
returning a request *body* called a request (`createChatRequestBody`), an endpoint named for the
verb where the noun was what was requested (`evaluation`), a function claiming the reply was
spoken when it only started speaking (`addAiTurnAndStartSpeaking`), a status `running` where
nothing ran yet (`pending`), and a CSS class in a different case than its neighbours. The
existing style rules covered how names are *written* (`handleX`, booleans as sentences,
camelCase), not what they have to *promise*.

## Consequences

- `naming-precision` in the incident register now names this record as its `maatregel`, and the
  `docs:check` warning for it is gone.
- **A rule cannot be checked mechanically.** Unlike the hooks, nothing stops a bad name. The
  measure of success is that no further naming incident is logged. If one is, that is a new
  incident in the same pattern, and the pattern should escalate to something firmer, not stay a
  line of text.
- The rule loads for TypeScript in `src/` only. Names in documents, scripts and CSS files are
  not covered by it.
- `.claude/rules/code-style.md` is not a leading document; the change is shown to Jaron before it
  is committed all the same.
