# PDR-007: Persona van de AI

- **Status:** implemented
- **Date:** 2026-10-03
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De AI is een algemene, vriendelijke kennis met een vrij gespreksonderwerp. Per beurt geeft ze 2 tot 4
zinnen en stelt ze hooguit één vraag. Dit is overgenomen uit de spike en in het Engels geschreven.

Benoemde persona's of scenariokaarten zijn een andere feature en horen niet bij dit besluit.

## Waarom

Latere persona's (minstens één die een gesprek evalueert) kunnen onderdelen delen, zoals de toon. Daarom wordt de prompt in `src/lib/prompt.ts` opgebouwd uit benoemde secties. Wat gedeeld
wordt, is op het moment van dit besluit nog niet gebouwd.

## Gevolgen

- Inmiddels bestaan er wel gedeelde secties in `src/lib/prompt.ts` (`sharedContextSection` en
  `sharedConstraintsSection`) (uit de code, niet uit het plan).
