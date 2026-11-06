# PDR-004: Tekst in spraakbubbels: regelhoogte 1.25 en gewicht medium

- **Status:** implemented
- **Date:** 2026-09-30
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Alle spraakbubbels gebruiken `--line-height-body-tight` (1.25, de waarde van de originele app) en
`--font-weight-medium`. Dat geldt voor elke bubbel: de beurten, het live transcript en de
denkbubbel via `.bubble`, en de conceptbubbel via `.draft`.

De foutbox is geen bubbel en blijft ongewijzigd. De bewerkbare tekst is sinds het gedeelde
`Bubble` ook een bubbel.

## Waarom

De conceptbubbel moet overeenkomen met het live transcript, anders verandert de tekst op het
moment dat de opname stopt. De twee regels (`.bubble` en `.draft`) droegen de waarden eerst los
van elkaar, tot het gedeelde `Bubble` het frame tot één regel maakte.

## Voorgeschiedenis

Dezelfde dag is de regelhoogte nog heen en weer gegaan:

1. **1.25.** Bij 1.25 raakten de banden van de gesproken-woordmarkering elkaar.
2. **1.3.** De token zelf is verhoogd, met als bijwerking dat ook de knoppen (minder dan 1px)
   meegingen. Dit was een afwijking van de tokens van de originele app.
3. **Terug naar 1.25.** De bubbels zagen er bij 1.3 niet goed uit. De knoppen kwamen terug op hun
   eerdere hoogtes (Reply en End session 62,5px, "Start chat" 65px, gemeten) en de token is weer
   letterlijk gelijk aan het origineel; de afwijking van de vorige stap is weg.

Het probleem van de elkaar rakende banden is niet via de regelhoogte opgelost maar via de
markering zelf: die werd een `linear-gradient` met een transparante strook boven en onder, zodat banden op naastliggende regels bij 1.25 uit elkaar
blijven zonder de regelhoogte aan te raken.
