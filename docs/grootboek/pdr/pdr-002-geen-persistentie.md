# PDR-002: Geen persistentie

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De app bewaart niets. De sessiestate leeft in het geheugen van de browser; de gespreksgeschiedenis
staat bij Google en wordt aan elkaar gekoppeld met `previous_interaction_id`. Sluit je de tab,
dan is de sessie weg.

## Waarom

Dit stond zo in de brief. Jaron ziet geen waarde in het bewaren van eerdere gesprekken: het
oefenen gebeurt in de sessie zelf, en een opgeslagen gesprek zou daar niets aan toevoegen.

## Gevolgen

- **De prijs:** het sluiten van de tab beëindigt de sessie.
- Het sluit aan bij PDR-001 (een app voor dagelijks gebruik en een experiment in werkwijze):
  één gebruiker, geen accounts, niets dat bewaard hoeft te worden.

## Herkomst

- D3 (Decisions) Persistence — None. Session state lives in memory, and history at Google via `previous_interaction_id`
