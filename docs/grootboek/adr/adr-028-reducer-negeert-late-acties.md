# ADR-028: De reducer negeert late acties; evaluatie is een veld van de beurt

- **Status:** implemented
- **Date:** 2026-09-29
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Late acties worden genegeerd, de reducer gooit niet.** De reducer is puur: audio, `getUserMedia`,
de WebSocket en de fetches leven in hooks die erin dispatchen. Een transitie die niet past bij de
huidige state wordt genegeerd. Een late `TRANSCRIPT_UPDATED` nadat de socket is gesloten is normaal,
geen crash.

**De evaluatie van een gebruikersbeurt is een veld van de beurt, geen beurtstatus.** Een
gebruikersbeurt draagt `evaluation`: `pending` vanaf `USER_TURN_SENT`, daarna `ready` (met een
`correction` die `null` mag zijn) of `failed`.

- `EVALUATION_RECEIVED` en `EVALUATION_FAILED` matchen op het beurt-id, zoals de spraakacties, en
  worden genegeerd voor een beurt die niet `pending` is.
- De evaluatie heeft een eigen driver, `use-evaluation-driver.ts`, die de beurt volgt en niet
  `aiThinking`: een mislukte chatcall annuleert hem niet, en *Try again* vraagt hem niet een
  tweede keer aan.
- De volgorderegel (het antwoord nooit vóór de afhandeling van de correctie, `ready` of `failed`) leeft in de reducer: `AI_TURN_RECEIVED`
  houdt het antwoord vast als `pendingReply`. Zo is het een pure functie en geen asynchrone
  coördinatie tussen hooks.
- Een correctie die niet binnen 10 s antwoordt, wordt `failed`.

## Waarom

Een late `TRANSCRIPT_UPDATED` nadat de socket is gesloten is normaal, geen crash; daarom wordt een
actie die niet past genegeerd in plaats van dat de reducer gooit. Voor `FAILED` is de reden
concreet: een late `FAILED` mag een concept niet overschrijven.

De volgorderegel staat in de reducer zodat het een pure functie is, en geen asynchrone coördinatie
tussen hooks.

## Gevolgen

- De acties en de ignore-regels staan in `src/lib/session-reducer.ts`; `UserTurn` en `Evaluation`
  staan daar ook (uit de code, niet uit het plan).

Verwant: ADR-018 (Sessiestate: één reducer, beurtstatus als discriminated union)
Verwant: ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`)
Verwant: ADR-007 (Evaluatie per beurt, in een eigen call)
Verwant: ADR-021 (Fouten en herstel)
Verwant: PDR-006 (Antwoord pas na de correctie)
