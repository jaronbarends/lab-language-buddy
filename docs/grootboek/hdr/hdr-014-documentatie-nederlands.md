# HDR-014: Documentatie is Nederlands; code, UI en commits blijven Engels

- **Status:** in-progress
- **Date:** 2026-10-30
- **Implementation:** 50
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

De taal volgt het soort tekst.

**Nederlands:** alle documentatie die geen code is. Dat zijn de grootboekdocumenten en hun
registers, alle `CLAUDE.md`-bestanden, `.claude/rules`, de instructies van agents en skills,
de meldingen die een hook aan de agent geeft, en de overige documenten onder `docs/`.

**Engels:** code en de comments in code (scripts en hook-scripts horen daarbij), alle
UI-teksten van de app, commitberichten, `README.md`, `AGENTS.md` en de map `spikes/`.
`AGENTS.md` wordt door `next dev` zelf geschreven en teruggezet; een vertaling zou na de
volgende start weer verdwijnen.

Bestaande Engelstalige documenten worden vertaald. De inhoud van `docs/plan.md` wordt niet
vertaald maar overgezet naar het grootboek, en wordt dan meteen in het Nederlands geschreven.
De volgorde: eerst deze regel, dan de overzetting van het plan, dan de vertaalronde over wat
nog Engels is.

**Vertalen is geen nieuwe beslissing.** Een geïmplementeerd record verandert niet (HDR-001);
bij vertalen verandert alleen de taal, nooit het besluit, de status, de datum of het id. Niet
vertaald worden: sleutels in front matter en registers, id's, code-identifiers, kopteksten
waar een script of `docs/index.yml` naar verwijst, en de labels `Status`, `Date` en
`Implementation` bovenaan een record. Bestaande bestandsnamen blijven zoals ze zijn; nieuwe
documenten krijgen een Nederlandse kebab-case naam.

## Waarom

**Kernprincipe:** de grens loopt langs het soort tekst, niet langs de map. Wat draait of
wordt uitgeleverd (code, comments, UI, commits) is Engels; wat kennis en afspraken draagt
(documentatie en instructies) is Nederlands.

De Engelse regel was een uitzondering op de standaard van het grootboek. De grootboek-skill en
de ARC-documenten waarop die rust zijn Nederlands, en de uitzondering moest op drie plekken
worden vastgelegd: de grootboekregel in de root-`CLAUDE.md`, de algemene taalregel daar, en
`docs/grootboek/CLAUDE.md`.

Het besluit om dat om te draaien is van Jaron, genomen op 2026-10-30, om twee redenen. Hij
wil de werkwijze van ARC volgen, en daarin is Nederlands de standaard. En hij gaat zelf over
op Nederlands in het gesprek met Claude, omdat hij zich daarin beter kan uitdrukken.

## Gevolgen

- **De repo is tijdelijk gemengd.** Tot de vertaalronde klaar is, bestaan Engelse en
  Nederlandse documenten naast elkaar. Daarom staat de implementatie op 50; die gaat naar 100
  als de laatste Engelstalige documentatie vertaald is.
- **Niets dwingt de taal af.** `docs:check` herkent geen taal. Een nieuw Engelstalig document
  valt alleen op in review. Een check bouwen we pas als dit zich herhaalt.
- **De labels blijven Engels.** `scripts/records.mjs` leest `- **Date:**` om HDR-012 af te
  dwingen. Een Nederlands label zou die controle stilletjes uitzetten. Wil je de labels toch
  vertalen, dan eerst de controle en haar test aanpassen.
- **De plan-overzetting begint in het Nederlands.** Records uit `docs/plan.md` worden direct in
  het Nederlands geschreven, zodat ze niet nog een keer vertaald hoeven te worden.
- **Drie leidende documenten wijzigen:** de root-`CLAUDE.md` (twee regels) en
  `docs/grootboek/CLAUDE.md` (één regel). De wijziging is vóór de commit aan Jaron getoond.
  De rest van die bestanden blijft Engels tot de vertaalronde.
