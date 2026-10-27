# Grootboek — domain context

## Start the grootboek skill

When creating or resuming any grootboek document: start the grootboek skill. Its writing
guide is a hard requirement — without that context you write a form to fill in instead of
a living document.

## Document types

| Type | Prefix | Question |
|------|--------|----------|
| ADR | adr-NNN | WHAT do we build? |
| HDR | hdr-NNN | HOW do we work? |
| PDR | pdr-NNN | WHY this way? |
| DFT | dft-NNN | IS IT STILL TRUE? |
| JNL | jnl-NNN | WHAT ARE WE DISCOVERING? |

Registers live in `docs/grootboek/registers/` (YAML). Update the register with every new
decision or status change.

## Numbering across parallel branches

Branches booking records in parallel hand out the same next number. The branch that merges
second renumbers its own records, in its own branch, **before** merging `arc/arc-main` or
`main` into it: run `npm run docs:renumber`, review, commit (HDR-005, order changed by
HDR-007). The `guard-merge-renumber` hook holds back such a merge from Claude Code until it
has run, and `npm run docs:check` fails on a duplicated id. Merged records keep their number.

## Writing conventions

- Documentation: English (the repo's language rule; the skill's own templates are Dutch)
- Files: kebab-case
- Every feature or bugfix gets a spec in `docs/grootboek/specs/`
- Specs are throwaway: after delivery the code is the truth
- A leading document that describes code, a new balance included, declares its `werkgebied`
  (the files and folders it is about) in its front matter; `npm run docs:drift` and
  `npm run docs:check` use it to signal drift (HDR-008)

## Duty to communicate

See the root `CLAUDE.md`: it holds the list of leading documents and the rule.
