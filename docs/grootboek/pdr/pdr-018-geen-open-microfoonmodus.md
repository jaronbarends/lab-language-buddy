# PDR-018: Geen open-microfoonmodus

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De app heeft geen doorlopende modus met een open microfoon, en de gebruiker kan de AI niet midden in een zin onderbreken door erdoorheen te praten.

Wel binnen scope: op Reply tikken terwijl de AI praat; zie PDR-010 (Sessieflow en schermen).

## Waarom

Twee risico's uit de spike zijn onopgelost:

- Of de audio-unlock van Safari een hele sessie overleeft zonder herhaalde gebaren.
- Echo wanneer de microfoon openblijft terwijl de AI-audio via de telefoonluidspreker klinkt.

Niet bewezen, dus niet in scope.
