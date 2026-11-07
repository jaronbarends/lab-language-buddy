# HDR-016: De bestaande Language Buddy-repo is geen bron, tenzij Jarón een bestand aanwijst

- **Status:** implemented
- **Date:** 2026-11-01
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

De agent gebruikt de bestaande Language Buddy-repo (`jaronbarends/language-buddy`) niet als bron.
Niet doorzoeken, geen boomlijst opvragen, niet "even kijken", ook niet voor onderdelen die in
deze app al bestaan.

- **Wijst Jarón een specifiek bestand aan,** dan mag de agent dat lezen en gebruiken. Wat hij
  leest, noemt hij hardop.
- **Denkt de agent dat het lezen van een bestand echt tijd bespaart,** dan vraagt hij het
  eerst. Het antwoord mag nee zijn.
- **Komt de agent er per ongeluk iets van tegen** (een import die ergens heen leidt, een
  bestand met meer erin dan verwacht), dan zegt hij dat in plaats van het stilletjes te
  gebruiken. Hij kan iets niet ongezien maken.
- **Kleur, typografie, spacing en de bevel** zijn smaak en merk. Die verzint de agent niet.
  Wijst Jarón ernaar, dan geldt wat daar staat.

## Waarom

**Kernprincipe:** deze app neemt zijn eigen beslissingen, en in een correctieronde leidt Jarón.
Een agent die ongevraagd de bestaande implementatie leest, wordt niet meer gecorrigeerd maar
gaat overschrijven; de diff gaat dan over "wat de agent in de andere app beter vond" in plaats
van over wat er gevraagd is. Dat is de controle die de regel beschermt.

De regel komt uit de sectie "Keeping the experiment honest" in `docs/plan.md`. Daar had hij
nog een tweede reden: het experiment meetbaar houden, door te zien wat een AI op eigen houtje
bouwt, afgezet tegen de bestaande app. Die vergelijking maakt Jarón niet meer (PDR-001, een
app voor dagelijks gebruik en een experiment in werkwijze). De eerste reden blijft, en is
daarmee de enige.

## Gevolgen

- **De regel is proza.** Geen hook. Dat is een bewuste keuze: de regel bestaat sinds september,
  een afdwinging bouwen we pas als het zich herhaalt, via het incident-register (HDR-009,
  incident-register).
- **Hij staat als bullet in de root-`CLAUDE.md`,** onder Working agreements (2026-11-01). Dat
  is een leidend document: de tekst is vóór het toevoegen aan Jarón getoond en door hem
  goedgekeurd.
- **Het logboek van wat de agent heeft gezien** staat hieronder, als archief van wat toen
  gebeurd is. Het is geen regel en niet meer bijgehouden.

## Archief: wat de agent heeft gezien (uit plan.md)

Gelekt, op eigen initiatief van de agent, voordat de regel bestond: twee volledige
boomlijsten van de repo, dus de paden en bestandsnamen van ongeveer 35 stylesheets zijn
bekend, waaronder `Evaluation.module.css`. Alleen namen en bestaan, geen inhoud.

Gelezen omdat Jarón ernaar wees: `src/styles/settings/` (de tokens), `components/button/Button.*`,
`chatSetup/components/` (`LanguagePicker`, `SetupForm`, `SegmentedControl`, `SelectBox`),
`styles/elements.css` en `styles/reset.css`.

Incidenteel gezien in `SetupForm.tsx`, niet gebruikt: een controle op ondersteuning van
spraakherkenning in de browser die Start uitschakelt, props per taal voor stemondersteuning,
en een scenario-concept (`freeformScenarios`). Jarón vond het spraakdeel geen punt, omdat het
native browserfunctionaliteit betreft die deze versie niet gebruikt. Het scenario-concept
raakt de open vraag over de persona.

Eén rij in het decision log is om deze reden gemarkeerd als `ported`: `LanguagePicker` was
tegelijk ontwerp en techniek. Het hele onderdeel overnemen gooide een antwoord weg dat de
agent al had gegeven.
