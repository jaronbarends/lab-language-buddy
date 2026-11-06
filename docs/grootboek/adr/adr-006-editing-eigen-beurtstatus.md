# ADR-006: `editing` is een eigen beurtstatus met `draftBeforeEdit`

- **Status:** implemented
- **Date:** 2026-09-24
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

`editing` is een eigen beurtstatus, met een eigen veld `draftBeforeEdit` waarin de tekst van vóór
het bewerken wordt bewaard.

## Waarom

*Cancel edit* moet de tekst van vóór het bewerken terugzetten, en alleen die state heeft een
plek om die te bewaren.

## Gevolgen

- **De reducer is de plek.** `editing` en `draftBeforeEdit` leven in `src/lib/session-reducer.ts`;
  een nieuwe state breidt de union uit en wordt niet als losse vlag ergens anders toegevoegd.
- **Het lijkt willekeurig in de code** en is bewust: een aparte `editing`-state naast het
  samenstellen van een beurt. Wie dit wil samenvoegen met een andere state, verliest de plek
  waar *Cancel edit* de oude tekst vandaan haalt.
- De bediening die hiervan afhangt, staat in PDR-003 (eén set bediening zonder Stop, het live
  transcript in de control bar).
