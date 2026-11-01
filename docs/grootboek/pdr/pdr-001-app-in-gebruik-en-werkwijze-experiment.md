# PDR-001: Een app voor dagelijks gebruik, en een experiment in werkwijze

- **Status:** implemented
- **Date:** 2026-11-01
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Dit project is twee dingen tegelijk, en het ene dient het andere:

1. **Een app die Jaron zelf dagelijks gebruikt** om gesproken gesprekken in een vreemde taal
   te oefenen, tegen een AI-persona, met een korte correctie per beurt. Eén gebruiker, geen
   accounts, geen persistentie. De app wordt verder uitgebouwd; openstellen voor anderen is
   niet gepland (README, "Who it is for").
2. **Een experiment in werkwijze:** hoe werk je met een AI die het grootste deel van de code
   schrijft? Het grootboek, het werkmodel met subagents en de checks zijn de onderdelen van
   dat experiment. Het doel blijft een app die echt gebruikt wordt.

**De bestaande Language Buddy-app is geen bron meer.** Deze app staat op zichzelf. Er is geen
synchronisatie met de bestaande tokens of stylesheets en afwijkingen worden niet bijgehouden.
De agent gebruikt de bestaande repo niet als bron, tenzij Jaron een specifiek bestand aanwijst:
de beslissingen in deze app horen niet beïnvloed te worden door wat er in de bestaande stond.
De regel "Keeping the experiment honest" uit `docs/plan.md` gaat in een kortere vorm over in
HDR-016 (de bestaande repo is geen bron, tenzij Jaron een bestand aanwijst); de reden verschuift van "het experiment meetbaar houden" naar "deze app zijn
eigen beslissingen laten nemen".

**Wat niet meer gebeurt:** de vergelijking "wat maakt een AI op eigen houtje, afgezet tegen
de bestaande app". Jaron maakt die niet meer, en het veld Source uit het decision log, dat
daarvoor bedoeld was, komt niet terug.

## Waarom

**Kernprincipe:** het project moet eerlijk zeggen waarvoor het bestaat, want daar sturen de
keuzes op. Het zei dat niet meer eerlijk.

De README ("Why this repo exists"), `docs/plan.md` (Context en "Keeping the experiment
honest") en `CLAUDE.md` ("No AI-or-self verdicts") beschrijven het project als een experiment
waarin de agent zelf de architectuur kiest, gemeten tegen de bestaande app. Jaron begon zo,
maar legt die vergelijking in de praktijk niet meer vast. De werkwijze is nog steeds het
experiment; de app moet daarnaast gewoon in gebruik komen. Waar de tekst een ander doel
noemt dan het werkelijke doel, kiest de agent bij twijfel verkeerd, bijvoorbeeld door
beslissingen te bewaren voor een vergelijking die niemand meer maakt.

## Landing

- `docs/plan.md` vervalt als bron (HDR-015, plan.md vervalt als bron). De regel over de
  bestaande repo blijft bestaan, in een kortere vorm, als HDR-016 (de bestaande repo is geen bron).
- **De README** ("Why this repo exists") is op 2026-11-01 door Jaron aangepast aan dit besluit.
  `CLAUDE.md` ("What this is", "No AI-or-self verdicts") liep al gelijk.

## Gevolgen

- **De Design system-sectie van het plan krijgt geen afwijkingenlijst meer.** De redenen van
  eenmalige keuzes (fonts, safe area, bevel, iconen) blijven als records bestaan; de zin in
  `src/components/CLAUDE.md` over re-sync en de lijst in `plan.md` vervalt.
- **Wie de tokens aanpast, hoeft niet meer te vergelijken met de bestaande app.** Dat is geen
  vrijbrief: de tokens blijven de enige bron voor kleur, spacing en radius.
- **De acht `ported`-rijen uit het decision log** blijven als beslissingen bestaan; dat iets
  uit de bestaande app komt, staat in de tekst.
