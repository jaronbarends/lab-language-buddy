# HDR-008: Een driftsignaal meldt wanneer de code die een leidend document beschrijft is doorgegroeid

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

REQ-GG-05 (Richt drift-detectie in) vraagt om drift te signaleren, te boeken en op te volgen.
DFT-001 bewees het proces van een reconciliatie, maar niets zei wanneer er een aan de beurt was.
Dit record voegt het signaal toe en de regel voor wat erop volgt.

- **Een veld `werkgebied`** in de front matter van een leidend document dat code beschrijft: de
  bestanden en mappen waar het over gaat. Het hoort bij het document, dus een nieuwe balans
  brengt zijn eigen werkgebied mee en er hoeft geen aparte lijst gelijk te worden gehouden. Eerste
  gebruiker: `software-architectuur.md` (`src/lib`, `src/hooks`, `src/app`, `src/components`,
  `next.config.ts`, `.env.example`).
- **Een script**, `npm run docs:drift` (`scripts/drift-signal.mjs`). De baseline is de laatste
  commit die het document raakte; de drift is elke commit die daarna zijn werkgebied raakte, met
  de bestanden. Het verandert nooit iets.
- **In `docs:check`:** een document dat achterloopt is een **waarschuwing**, een pad in het
  werkgebied dat niet bestaat is een **fout** (de lijst zelf is verouderd). `docs:check` staat op
  de lijst met checks vóór je iets afrondt en draait in CI bij elke PR.
- **Wat op een signaal volgt:** een reconciliatie, een agent-ronde tegen de bestanden die het
  script noemt (zoals in DFT-001), en een DFT die de uitkomst boekt, ook als dat "geen drift
  gevonden" is. Het signaal blokkeert niets.

## Waarom

**Kernprincipe:** drift is normaal; onopgemerkte drift is het gevaar (kennisdocument,
het-gedirigeerde-grootboek). Het signaal beantwoordt alleen "wanneer moet iemand kijken"; of het
document daadwerkelijk fout is, is een oordeel dat bij een reconciliatie hoort. Die twee
gescheiden houden maakt het signaal goedkoop en eerlijk: het kan mechanisch zijn omdat het weinig
beweert.

Het is een waarschuwing, nooit een fout, omdat een rode CI voor drift de normale toestand zou
straffen en mensen zou leren CI te negeren. `package.json` is buiten het werkgebied van de balans
gelaten: het veranderde vier keer sinds de balans voor het laatst werd aangeraakt, steeds
tooling (CI, Husky, scripts), en een signaal dat op dag één alarm slaat wordt genegeerd. Een
dependency die ertoe doet, laat zich ook in `src/` zien.

## Gevolgen

- **Bewezen op echte data op 2026-10-27**, zonder een branch aan te raken: in een wegwerp-checkout
  van `arc/bubble-animation` met het veld toegevoegd noemde het signaal commit 750dc49 en zijn
  vier bestanden (`ai-bubble.tsx`, `ai-bubble.module.css`, `conversation-thread.tsx`,
  `thinking-bubble.tsx`). Op deze branch meldt het dat er niets achterloopt, wat klopt: er is
  niets in het werkgebied veranderd sinds de balans voor het laatst werd aangeraakt. De tests
  (`drift-signal.test.mjs`) dekken de andere gevallen op een wegwerp-repo.
- **Nog open voor REQ-GG-05:** de reconciliatie die op een echt signaal volgt. De eerste is aan de
  beurt als `arc/bubble-animation` wordt gemerged; dan boekt DFT-003 (of het eerstvolgende vrije
  nummer) of `software-architectuur.md` moet veranderen voor de bubbel. Dit record doet niet
  alsof dat al is gebeurd.
- **Grenzen, geaccepteerd:** de baseline is "laatst aangeraakt", niet "laatst gecontroleerd", dus
  een typfout in het document herstellen zet het signaal terug. Een strengere baseline (een veld
  dat de commit noemt die een reconciliatie het laatst heeft geverifieerd) is een mogelijke stap.
  De zichtbaarheid is een regel in een CI-log; niets plaatst het op de PR. `src/app` wordt als
  geheel genomen, dus een CSS-wijziging daar laat het signaal afgaan.
- **Een nieuwe balans moet zijn `werkgebied` declareren.** De balansgids van de skill zegt dat
  niet; `docs/grootboek/CLAUDE.md` nog ook niet. Andere leidende documenten (de
  `CLAUDE.md`-bestanden) zouden het veld ook kunnen dragen; hier niet gedaan.
- **Nummering.** Deze branch boekt HDR-008. `arc/bubble-animation` bevat ook een HDR-008 (de
  Modern Web Guidance-proef); volgens HDR-007 hernummert die naar het eerstvolgende vrije nummer
  als hij weer `arc/arc-main` merget, met `npm run docs:renumber`.
