# HDR-002: De software-balans naast `plan.md` houden, als proef voor driftdetectie

- **Status:** implemented
- **Date:** 2026-10-20
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

> Vervangen door HDR-027 (De software-balans blijft bestaan als leidend document) op 2026-11-09. De
> proef is afgerond en `plan.md` bestaat niet meer (HDR-015); de tekst hieronder is voorgeschiedenis.

## Besluit

`docs/grootboek/software-architectuur.md` blijft bestaan, als tweede, afgeleid leespad naast
`docs/plan.md`. `plan.md` blijft de bron voor elke beslissing van vóór 2026-10-20 (zie
HDR-001). Het uitdrukkelijke doel van het behouden van de balans is het driftmechanisme van het
grootboek uitproberen (een DFT-rapport: komt de balans nog overeen met de code), dat op geen
andere manier te proberen is zonder een balans om tegen te toetsen.

## Waarom

Een kritiekronde met verse context vond dat het grootste deel van de inhoud van de balans al in
`plan.md` stond, vanuit een andere hoek. Een tweede document bijhouden dat het eerste grotendeels
herhaalt, is driftrisico zonder voordeel, tenzij het punt juist is om het onderdeel van het
grootboek te beproeven dat `plan.md` zelf niet kan bieden: een mechanische controle of een
leidend document de code nog beschrijft. De mens heeft aangegeven `plan.md` uiteindelijk in het
grootboek te willen onderbrengen, maar eerst het grootboek te willen proberen; dit besluit is het
middel voor die proef, geen toezegging dat de balans blijvend bestaat.

## Gevolgen

- De balans vraagt nu dezelfde discipline als elk leidend document: de communicatieplicht bij
  wijziging, en een update in dezelfde commit als een beslissing die erop raakt.
- De driftproef (REQ-GG-05) is de volgende concrete stap; dit record maakt haar mogelijk.
- Als de proef laat zien dat de balans niets toevoegt wat driftdetectie niet ook op een andere
  manier kon zeggen, is dat een reden om de balans op te heffen in plaats van een bijna-kopie van
  `plan.md` te blijven onderhouden.
- Bron: JNL-001, kwestie K1.
