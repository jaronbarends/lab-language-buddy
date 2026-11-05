# ADR-016: Vlaggen: flag-icons

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De vlaggen komen uit het pakket `flag-icons`, en alleen de zes SVG's die nodig zijn worden
geïmporteerd. Ze vervangen de emoji-vlaggen. De stylesheet van het pakket wordt niet geïmporteerd.

## Waarom

Emoji-vlaggen verschijnen op Windows als kale landletters. De stylesheet van het pakket zou alle
ongeveer 260 vlaggen binnenhalen; zes SVG's importeren houdt het bij de zes die nodig zijn.

## Herkomst

- D14 (Decisions) Flags — `flag-icons`, importing only the six SVGs needed
- L4 (09-24) `flag-icons` replaces emoji flags
