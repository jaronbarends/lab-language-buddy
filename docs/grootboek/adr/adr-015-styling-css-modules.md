# ADR-015: Styling: CSS Modules over het overgenomen design system

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De styling is CSS Modules, over het design system dat uit de bestaande app is overgenomen.

## Waarom

Het voordeel van Tailwind is hergebruik van klassen over een groot oppervlak. Hier zou het vooral
een buildstap toevoegen en de iOS-specifieke CSS begraven in uitwijkroutes met arbitrary values.
