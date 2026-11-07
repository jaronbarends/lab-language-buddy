---
titel: "Een driftsignaal voor leidende documenten"
type: spec
soort: plan van aanpak
status: concept
datum: 27 oktober 2026
auteurs: Jarón, Mama Claude
---

# Een driftsignaal voor leidende documenten

**Waar het om gaat.** REQ-GG-05 (Richt drift-detectie in) wil dat drift wordt gesignaleerd,
geboekt en opgevolgd. DFT-001 bewees het *proces* van een reconciliatie; niets vertelt iemand
*wanneer* er een aan de orde is. Deze feature voegt dat toe: een signaal dat zegt "de code die
dit document beschrijft is veranderd sinds het document voor het laatst is aangeraakt". Het is
een signaal, geen oordeel. Of het document echt fout is, moet een reconciliatie uitzoeken, en
een DFT boekt het resultaat.

## Deel 1: het veld `werkgebied`

Een leidend document dat code beschrijft, zegt in zijn eigen front matter welke code:

```yaml
werkgebied:
  - src/lib
  - src/hooks
  - src/app
  - src/components
  - next.config.ts
  - .env.example
```

- Paden zijn bestanden of mappen in de repo. Het veld staat bij het document waar het bij hoort,
  dus een nieuwe balans brengt zijn eigen werkgebied mee en er hoeft verder niets gelijk
  gehouden te worden (de keuze voor optie 2 boven een aparte lijst).
- Eerste gebruiker: `docs/grootboek/software-architectuur.md`, tot nu toe de enige balans. Dat is
  een wijziging aan een leidend document: gemeld en gecontroleerd vóór het wordt gecommit.
- **Bewust weggelaten: `package.json`.** Sinds de balans voor het laatst is aangeraakt is hij
  vier keer veranderd, steeds tooling (CI, Husky, scripts). Dat zegt niets over de balans, en
  een signaal dat op dag één alarm slaat, wordt genegeerd. Een dependency die ertoe doet, laat
  zich ook in `src/` zien.
- Het werkgebied is per document een afweging. `src/app` wordt als geheel genomen, niet alleen
  `src/app/api`, omdat de balans ook de app-schil beschrijft; CSS-wijzigingen daar laten het
  signaal afgaan.

## Deel 2: het script, `npm run docs:drift`

- Vindt elk `.md`-bestand onder `docs/` waarvan de front matter `werkgebied` heeft.
- **Baseline** is de laatste commit die het document aanraakte. Commits die het werkgebied
  daarna aanraakten zijn de drift: het script toont ze (hash, datum, onderwerp) en de
  gewijzigde bestanden.
- Een pad in `werkgebied` dat niet bestaat is een probleem, geen drift: de lijst zelf is
  verouderd (een map is hernoemd). Exitcode 1.
- Een document dat nog niet gecommit is heeft geen baseline: wordt overgeslagen, met een melding.
- Het verandert nooit iets en eindigt altijd met exitcode 0, tenzij er een probleem is.

## Deel 3: in `docs:check`

- Drift is een **waarschuwing** (zoals die voor een verouderd plan), nooit een fout: drift is
  normaal, en een rode CI daarvoor zou verkeerd zijn. Een ontbrekend pad in het werkgebied is
  een **fout**.
- `docs:check` staat al op de lijst van checks die je draait voordat je iets klaar noemt en
  draait in CI bij elke PR, dus het signaal vraagt geen nieuwe gewoonte.

## Wat het niet doet

- **Het oordeelt niet.** "Achterlopend" betekent dat het werkgebied is veranderd, niet dat het
  document fout is. De volgende stap is een reconciliatie (een agent-ronde tegen de code, zoals
  in DFT-001) en een DFT die de uitkomst boekt.
- **De baseline is "laatst aangeraakt", niet "laatst gecontroleerd".** Een typfout in het
  document herstellen reset het signaal. Een strengere baseline (een veld dat de commit noemt
  die een reconciliatie voor het laatst heeft geverifieerd) is een mogelijke latere stap.
- **De zichtbaarheid is dun.** Een CI-waarschuwing is een regel in een log. Niets plaatst hem op
  de PR.
- **Andere leidende documenten.** `CLAUDE.md`-bestanden zouden ook `werkgebied` kunnen hebben
  (die in `src/components` beschrijft die map). Hier niet gedaan; het mechanisme staat het toe.

## Tests

`node:test` op een wegwerp-repo, zoals voor het renumber-script: geen wijziging geeft geen
drift; een wijziging binnen het werkgebied na het document wordt gemeld met zijn bestand; een
wijziging buiten het werkgebied niet; het document daarna bewerken reset het; een document
zonder `werkgebied` wordt genegeerd; een ongecommit document wordt overgeslagen; een ontbrekend
pad in het werkgebied is een probleem; een mapwerkgebied matcht bestanden eronder.

## Klaar wanneer

- `npm run docs:drift` draait op de huidige repo en meldt niets dat achterloopt (geen wijziging in het
  werkgebied sinds de balans voor het laatst is aangeraakt, hierboven gecontroleerd).
- De tests slagen en draaien in CI (`test:scripts` doet dat al).
- `docs:check` waarschuwt bij drift en faalt bij een ontbrekend pad in het werkgebied, getoond
  op een wegwerp-repo.
- Het bewijs dat het echt iets *vindt*, blijft open tot er een wijziging in het werkgebied
  landt: `arc/bubble-animation` (`ai-bubble.tsx`) is de eerste. Dat staat in het record, niet
  hier nagebootst.
- Een nieuwe HDR boekt het besluit en hoe het signaal leidt tot een reconciliatie en een DFT.

## Bronnen

- **Het denkwerk:** deze sessie; DFT-001 (het reconciliatieproces, geen drift gevonden);
  REQ-GG-05.
- **Het patroon:** `.claude/hooks/leading-documents.json` en HDR-006 (een lijst als data);
  `scripts/renumber-records.mjs` en HDR-007 (script, test op een wegwerp-repo, check in
  `docs:check`); de waarschuwing voor een verouderd plan in `scripts/check-docs.mjs`.
- **Waar het landt:** `scripts/drift-signal.mjs`, `scripts/check-docs.mjs`, `package.json`, de
  front matter van `docs/grootboek/software-architectuur.md`.
- **De eerste echte test:** branch `arc/bubble-animation`.
