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
second renumbers its own records, in its own branch, after merging `arc/arc-main` into it and
before its pull request; merged records keep their number (HDR-005). `npm run docs:check`
does not catch duplicate ids, so check each register by hand.

## Writing conventions

- Documentation: English (the repo's language rule; the skill's own templates are Dutch)
- Files: kebab-case
- Every feature or bugfix gets a spec in `docs/grootboek/specs/`
- Specs are throwaway: after delivery the code is the truth

## Duty to communicate

See the root `CLAUDE.md`: it holds the list of leading documents and the rule.
