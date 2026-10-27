---
titel: "An incident register: recurring faults are counted and codified at three"
type: spec
soort: plan van aanpak
status: concept
datum: 28 oktober 2026
auteurs: Jaron, Mama Claude
---

# An incident register: recurring faults are counted and codified at three

**The point.** REQ-GG-06 (Bouw het immuunsysteem) wants recurring faults to become a rule, hook
or skill in the harness: once is an incident, twice is chance, three times is a weakness of the
harness. Today nothing counts. The corrections Jaron gives live in Claude's private memory,
outside the repo, and no builder or other clone sees them. This feature adds the front half of
the immune system: a place where incidents are logged by pattern, a counter that shouts at
three, and a rule for what happens then.

## Part 1: the register

`docs/grootboek/registers/incident-register.yml`, grouped by pattern:

```yaml
patronen:
  - patroon: naming-precision
    titel: "A name promises more or less than the code does"
    maatregel: HDR-010          # empty until the pattern is codified
    incidenten:
      - datum: 2026-10-10
        aantal: 7               # optional, default 1
        wat: "Seven names corrected in one review, each right"
        bron: "stage 4 review"
```

- **No ids and no numbered documents.** An incident is a line, not a decision (HDR-001 books
  decisions). Without ids the register cannot collide across parallel branches the way record
  numbers do (HDR-007). Two branches that both log still conflict on the same lines: keep both.
- A pattern is a slug. When a new fault looks like an existing pattern, it joins it; the
  judgment whether it is "the same fault" is the agent's, checked by Jaron.
- **`maatregel`** names the HDR that codified the pattern. The HDR names the place: a rule, a
  hook, a skill, a line in `CLAUDE.md`.

## Part 2: the counter, `npm run docs:incidents`

- Reads the register and prints each pattern with its count and whether it is codified.
- **Threshold three**, a constant in the script (the requirement says three; the grootboek
  skill's HDR guide says "more than three", which is stricter and not followed here).
- It never changes anything and exits 0, unless the register is malformed.

## Part 3: in `docs:check`

- A pattern with three or more incidents and no `maatregel` is a **warning**: "codify it and
  book an HDR". Not an error: the weakness is real but the day it is found should not turn CI
  red.
- **Errors:** a `maatregel` naming an HDR that is not in the HDR register; a duplicate pattern
  slug; an incident without `datum` or `wat`.

## Part 4: the logging duty

A line in the root `CLAUDE.md`: when Jaron corrects the agent, or a tool fails in a way that
has happened before, add one entry to the incident register and say so in a sentence. No hook
can see a human correction, so **logging depends on the agent**. The register makes repetition
visible and countable once it is logged; it does not make the agent log. That limit goes in the
HDR. `CLAUDE.md` is a leading document: the change is reported and checked.

## Part 5: seeding, and the first use

The six feedback notes in Claude's memory are the first incidents, counted by what the notes
themselves say, not by a complete history:

| Pattern | Count | Codified? |
|---|---|---|
| naming-precision | 7 (one review, 2026-10-10) | No: the rules cover how names are written, not what they promise |
| answer-first | 2 (2026-09-23) | No |
| act-on-question | 2 (2026-09-23) | No |
| review-point-context | 1 (2026-10-03) | No |
| id-with-title | 1 (2026-10-21) | No |
| ai-vs-self-advice | 1 (2026-10-03) | Special case, see below |

**The first use of the mechanism:** `naming-precision` is at seven, so the register warns on
day one. Codifying it is the proof that the chain works: an HDR plus a rule in
`.claude/rules/code-style.md` (a name says what the function returns or does, uses the word of
its neighbours, and a correction is accepted without defence). The rule file is not a leading
document, so no duty to communicate; it is shown before it is committed anyway.

**`ai-vs-self-advice` is a different kind of fault.** It is not a repeated mistake but a
conflict: Jaron's global instructions ask for a verdict, this project says to skip it, and the
project says so only in Claude's private memory. A session without that memory gives the verdict
again. One incident is enough to fix that, because the fix is a line in the project
`CLAUDE.md`. Decided separately, not by the counter.

## Tests

`node:test` on a throwaway repo, as for the other scripts: a pattern with two incidents is quiet;
three, uncodified, warns; `aantal` counts as its value; a codified pattern with an existing HDR
is quiet; a `maatregel` naming a missing HDR is an error; a duplicate slug is an error; an
incident without `datum` or `wat` is an error.

## Done when

- The register exists, seeded as above, and `docs:check` warns on `naming-precision` and
  nothing else.
- Codifying `naming-precision` (HDR and rule) turns that warning off.
- The tests pass and run in CI.
- A new HDR books the decision, the threshold, and the limit on logging.
- Not claimed: that the agent logs reliably. That is only known after weeks of use.

## Sources

- **The thinking:** this session; the kennisdocument het-gedirigeerde-grootboek, immune system
  ("één keer is een incident, twee keer toeval, drie keer een harnas-zwakte"); REQ-GG-06.
- **The pattern:** `scripts/drift-signal.mjs` and HDR-008 (a signal in `docs:check`);
  `.claude/skills/grootboek/references/hdr-schrijfgids.md` ("Uit het immuunsysteem").
- **The incidents:** the six `feedback-*` notes in Claude's memory for this project.
- **Where it lands:** `docs/grootboek/registers/incident-register.yml`,
  `scripts/incidents.mjs`, `scripts/check-docs.mjs`, `package.json`, root `CLAUDE.md`,
  `.claude/rules/code-style.md`.
