# ADR-028: De reducer negeert late acties

- **Status:** implemented
- **Date:** 2026-09-29
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Late acties worden genegeerd, de reducer gooit niet.** De reducer is puur: audio, `getUserMedia`,
de WebSocket en de fetches leven in hooks die erin dispatchen. Een transitie die niet past bij de
huidige state wordt genegeerd. Een late `TRANSCRIPT_UPDATED` nadat de socket is gesloten is normaal,
geen crash.

## Waarom

Omdat een late `TRANSCRIPT_UPDATED` nadat de socket is gesloten normaal is, wordt een actie die niet
past genegeerd in plaats van dat de reducer gooit. Voor `FAILED` is de reden concreet: een late
`FAILED` mag een concept niet overschrijven.

## Gevolgen

- De acties en de ignore-regels staan in `src/lib/session-reducer.ts` (uit de code, niet uit het
  plan).

Verwant: ADR-018 (Sessiestate: één reducer, beurtstatus als discriminated union)
Verwant: ADR-021 (Fouten en herstel)
Verwant: ADR-030 (Evaluatie is een veld van de beurt)
