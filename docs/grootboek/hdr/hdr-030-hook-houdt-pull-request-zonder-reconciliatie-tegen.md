# HDR-030: Een hook houdt een pull request zonder reconciliatie tegen

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een regel werkt alleen als ze er is op het moment dat ze telt. De reconciliatieregel van HDR-026
(Een pull request die code in een werkgebied raakt, sluit met een reconciliatie) stond in een
document dat niet laadt bij werk in `src/`. Zet de regel dus op het moment van handelen: bij het
openen van de pull request.

## Probleem

In ronde drie van JNL-002 (Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?, K7)
zag een verse agent twee driftwaarschuwingen van `docs:check`, draaide `docs:drift` niet en boekte
geen DFT, ook niet toen Jarón om een pull request vroeg. De regel staat alleen in
`docs/grootboek/CLAUDE.md`, en de waarschuwing noemde geen DFT. De agent las haar als "pas het
document aan", niet als "reconcilieer en boek".

## Besluit

**Een PreToolUse-hook, `guard-reconciliatie-pr`, weigert `gh pr create` van de lead thread** als
de branch een bestand in een werkgebied raakt en er geen nieuw DFT-bestand bij zit.

- **De werkgebieden komen uit `scripts/drift-signal.mjs`**, dezelfde bron als `docs:check` en
  `docs:drift`. De hook heeft geen eigen lijst. Het pad van een leidend document telt niet mee,
  net als bij `docs:drift`.
- **De toets is een diff, geen commitlijst.** `git diff origin/main...HEAD`: raakt die een bestand
  in een werkgebied, en is er geen toegevoegd bestand onder `docs/grootboek/dft/`, dan weigert de
  hook.
- **De weigering zegt wat te doen:** `npm run docs:drift` draaien, reconcilieren, een DFT boeken
  met `documenten`, `getoetst-tegen` en status `resolved` in dezelfde pull request, en opnieuw
  proberen.
- **Ook in een samengestelde regel** (`git push && gh pr create`) en alleen voor de lead thread;
  een subagent heeft al geen recht op een pull request.
- **De drift-waarschuwing van `docs:check` noemt voortaan ook de DFT**, niet alleen `docs:drift`.
- **Alles wat onverwacht is, laat het commando door** (geen `origin/main`, een fout bij het lezen
  van de werkgebieden), net als bij de andere guards.

## Waarom

De keuze van Jarón (2026-11-13): een hook. Afgewogen in JNL-002: de tekst van de waarschuwing, de
controles in de root-`CLAUDE.md` (een leidend document), of `builder.md` en `reviewer.md`. Een
regel op een andere plek is nog steeds een regel die iemand moet lezen en toepassen; de agent die
in ronde drie de regel miste, had ook de waarschuwing gezien. De hook is de enige plek die vuurt
op het moment dat de fout gemaakt wordt. HDR-025 (Een bewering over een document of de omgeving
komt uit de bron) koos bij zijn patroon bewust een regel en geen hook; hier is het patroon een
gemiste stap in een vaste procedure, en dat is wat een hook goed kan afdwingen.

## Gevolgen

- **Een grove maat.** De hook ziet alleen of er een DFT-bestand bij is gekomen, niet of die de
  juiste documenten noemt, `resolved` is of het goede `getoetst-tegen` heeft. Daarvoor blijven
  `docs:check` en de reviewer. Hij vergelijkt met `origin/main`, niet met het nulpunt van het
  signaal (HDR-022): een achterstand uit een eerdere pull request ziet hij niet.
- **Alleen waar Claude Code de aanroep ziet.** Een `gh pr create` in een gewone terminal of een
  pull request via de website passeert hem; de drift-waarschuwing van `docs:check` is daar het
  vangnet, zoals bij `guard-merge-renumber`.
- **Elke sessie krijgt hem** via `.claude/settings.json`, ook elke koude clone.
- **Niet gemeten of dit K7 in de praktijk oplost.** Dat vraagt een volgende koude-startronde met
  een taak die code in een werkgebied raakt.
- **HDR-026 blijft het besluit;** dit record is de afdwinging. De werkregel in
  `docs/grootboek/CLAUDE.md` is niet gewijzigd.

Verwant: HDR-026 (Een pull request die code in een werkgebied raakt, sluit met een reconciliatie)
Verwant: HDR-005 (De branch die als tweede merget hernummert zijn records), waarvan de hook `guard-merge-renumber` de vorm van deze hook voorbeeld was
