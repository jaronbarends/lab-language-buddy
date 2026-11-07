# ADR-030: Evaluatie is een veld van de beurt

- **Status:** implemented
- **Date:** 2026-10-08
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**De evaluatie van een gebruikersbeurt is een veld van de beurt, geen beurtstatus.** Een
gebruikersbeurt draagt `evaluation`: `pending` vanaf `USER_TURN_SENT`, daarna `ready` (met een
`correction` die `null` mag zijn) of `failed`.

- `EVALUATION_RECEIVED` en `EVALUATION_FAILED` matchen op het beurt-id, zoals de spraakacties, en
  worden genegeerd voor een beurt die niet `pending` is.
- De evaluatie heeft een eigen driver, `use-evaluation-driver.ts`, die de beurt volgt en niet
  `aiThinking`: een mislukte chatcall annuleert hem niet, en *Try again* vraagt hem niet een
  tweede keer aan.
- De volgorderegel (het antwoord nooit vóór de afhandeling van de correctie, `ready` of `failed`)
  leeft in de reducer: `AI_TURN_RECEIVED` houdt het antwoord vast als `pendingReply`.
- Een correctie die niet binnen 10 s antwoordt, wordt `failed`.

## Waarom

De volgorderegel staat in de reducer zodat het een pure functie is, en geen asynchrone coördinatie
tussen hooks.

## Gevolgen

- `UserTurn`, `Evaluation` en `pendingReply` staan in `src/lib/session-reducer.ts` (uit de code, niet
  uit het plan).

Verwant: ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`)
Verwant: ADR-007 (Evaluatie per beurt, in een eigen call)
Verwant: ADR-028 (De reducer negeert late acties)
Verwant: PDR-006 (Antwoord pas na de correctie)
