# PDR-009: De luisterstip

- **Status:** implemented
- **Date:** 2026-09-25
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De stip in de luisterbubbel (het live transcript) is een indicator dat de microfoon actief is, geen
versiering van het concept. Hij staat er precies zolang de microfoon live is.

De stip pulseert. Een ring (`::after`) groeit en vervaagt over de stip: `scale` van 1 naar 2.2 en
`opacity` van 0.8 naar 0, in 1.6 s, oneindig, zoals in de originele app. De stip zelf blijft staan.
Bij reduced motion is er geen ring, alleen de gewone stip. "Preparing mic…" heeft geen stip, dus ook
geen puls.

De stip is 12 px, zoals in de originele app (eerst 8 px). Zijn `margin-top` is afgeleid uit de
regelhoogte (`calc((1lh - var(--size)) / 2)`), zodat hij gecentreerd blijft op de eerste tekstregel.
De ring is 2.2 × die maat. Het afstellen gebeurt op het apparaat.

De gestippelde rand van de luisterbubbel is weggelaten.

## Waarom

De stip is de indicator dat de microfoon live is, en de puls was al sinds 09-25 gepland. De
gestippelde rand zei hetzelfde als de stip: twee signalen voor één toestand, en hij week af van de
referentie.

De tekst verschuift 20 px opzij als de stip verschijnt en verdwijnt. Jaron vond dat licht storend.
Daarom delen het live transcript, het afgeronde concept en de editorbubbel één `min-width: 17ch`,
berekend op "Preparing mic…" (een schatting), eenmaal gedefinieerd in `bubble.module.css` en gezet
met `hasMinimumWidth` van `Bubble`. Bij langere tekst blijft de verschuiving van 20 px, dat is
geaccepteerd. Een concept van één woord is nu 17ch breed (JNL-003 — Chat bubble animation, de kwestie over de pulserende stip).

De identiteitswaarde `scale: 1` uit de richtlijn is bij de ring weggelaten, net als bij de bubbels.
Hij is eerst aan de ring toegevoegd en op Jarons besluit weer verwijderd, omdat niets zichtbaars hem
nodig had (proef HDR-013: Try Modern Web Guidance on the bubble animation, with the baseline written first, test 3).

## Voorgeschiedenis

- De stip was eerst 8 px en pulseerde niet; de puls stond als plan.
- Op 10-27 is de puls gebouwd. Alleen die ene regel met zijn keyframes is in het bestand van de
  originele app gelezen, op Jarons aanwijzing.

## Gevolgen

Getest op een iPhone door Jaron op 2026-10-27: geslaagd.

(Uit de code, niet uit het plan:) de stip staat in `src/components/conversation/live-transcript.tsx`
en wordt alleen getoond bij `microphoneIsLive`; de puls staat in `live-transcript.module.css` en de
gedeelde `min-width: 17ch` in `bubble.module.css`.

## Herkomst

- L14 (09-25) The dot is a microphone-active indicator, not draft decoration
- L15 (09-25) Dashed border dropped from the listening bubble
- L205 (10-27) The listening dot in the live transcript pulses while the microphone is live
