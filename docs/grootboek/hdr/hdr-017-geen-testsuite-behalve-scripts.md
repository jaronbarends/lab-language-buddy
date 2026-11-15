# HDR-017: Geen testsuite, behalve scripts die documenten herschrijven

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

De app heeft geen testsuite; die wordt met de hand geverifieerd. Een script onder `scripts/` dat
documenten herschrijft zonder dat iemand het resultaat leest, krijgt wel een test, geschreven met
`node:test` (zit in Node, geen dependency). De eerste test is voor het script dat records
hernummert (spec `docs/grootboek/specs/automatisch-hernummeren-bij-merge.md`).

## Waarom

De brief vraagt nergens om tests, en het riskante gedrag van de app hangt af van het apparaat.

Een test kan dat apparaatgedrag niet nabootsen. Een hernummerscript is daarentegen pure logica op
bestanden en git, en een verkeerde hernummering wordt pas maanden later gevonden, niet in de review.

## Voorgeschiedenis

Het besluit begon als "geen testsuite": alleen handmatige verificatie voor de app, met één
uitzondering voor scripts onder `scripts/` die documenten herschrijven. Op 10-27 is dat versmald
tot de huidige stand hierboven: de app heeft er nog steeds geen, maar zo'n script krijgt een test
met `node:test`.

## Gevolgen

- De vraag of er tests voor de app komen (bijvoorbeeld Vitest op de reducer en `word-timing.ts`)
  blijft open. "Geen testsuite" is dus geen definitief besluit voor de app.
- **Tests bestaan ook buiten de uitzondering** (versie 1.1, 2026-11-15). Verplicht is een test
  alleen voor een script dat documenten herschrijft: nu `renumber-records.mjs` en
  `sync-code-architectuur-register.mjs`. `npm run test:scripts` draait daarnaast tests voor checks
  die alleen lezen (`drift-signal`, `incidents`, `records`, `run-directly`,
  `sweep-code-architectuur`) en voor twee hooks onder `.claude/hooks/` (`guard-id-with-title`,
  `guard-reconciliatie-pr`). Dat was zo vanaf de dag van de uitzondering: `record-dates.test.mjs`
  kwam op 2026-10-27. Voor die tests geldt geen regel; de andere hooks hebben er geen. Gevonden in
  de tweede ronde van de proef besluiten toetsen.
