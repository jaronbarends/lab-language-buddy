# HDR-023: Een driftrapport dat langer dan veertien dagen open staat, meldt zich

- **Status:** implemented
- **Date:** 2026-11-07
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een vervolgstap die van iemands geheugen afhangt, blijft liggen. Wat moet gebeuren, krijgt een
signaal dat vanzelf afgaat. Een regel die zegt dat je eraan moet denken, is geen signaal.

## Besluit

`npm run docs:check` geeft een **waarschuwing** voor elke DFT met `status: open` of
`status: in_progress` waarvan de `datum` meer dan veertien dagen vóór vandaag ligt (gelezen in
Europe/Amsterdam, zoals bij HDR-012). Op dag veertien nog niet, op dag vijftien wel. Een afgesloten
DFT waarschuwt nooit. De melding zegt hoeveel dagen geleden de DFT werd geopend en dat ze blijft
waarschuwen tot hij is afgesloten. Moet een DFT open blijven, dan staat in het record waarom; de
waarschuwing blijft dan wel staan.

Dit record is de maatregel voor het incidentpatroon `promised-follow-up-dropped` (Een toegezegde
vervolgstap hangt af van iemands geheugen en blijft liggen tot een controle van buitenaf hem vindt),
samen met HDR-022:

| Incident | Vorm | Signaal |
|---|---|---|
| HDR-003 gebouwd zonder dat de balans werd bijgewerkt | een record verandert code, het document niet | HDR-022: het werkgebied (nu met `.github/workflows`) meldt drift tot een DFT |
| De reconciliatie die HDR-008 bij de bubbelmerge beloofde | een beloofde controle blijft uit | HDR-022: het signaal wordt alleen stil door een afgesloten DFT |
| DFT-003 bleef op `in_progress` staan | een DFT wordt niet gesloten | dit record |

## Waarom

**Veertien dagen** is de keuze van Jarón (2026-11-07). Ik had zeven voorgesteld. Met veertien heeft
een DFT die op een builder, een merge of een iPhone-test wacht, twee weken voordat hij zich meldt.

**Een waarschuwing en geen fout**, om dezelfde reden als bij HDR-008: een rode CI voor iets wat
legitiem open mag staan, leert mensen CI te negeren.

**Afgewezen:**
- **HDR-022 als enige maatregel boeken.** Dan wordt `docs:check` stil terwijl één vorm van het
  patroon nog open is: het "stil zonder controle" dat HDR-022 juist repareert.
- **Een regel** ("loop de open DFT's na bij elke merge"). De grootboek-skill zegt dat al ("Na merge
  naar main: zijn statussen actueel?"), en DFT-003 bleef toch open. Een regel alleen werkt hier
  aantoonbaar niet.

## Gevolgen

- **DFT-003 is op 2026-11-08 gesloten**, na een opmerking van CodeRabbit op PR #37. Anders had
  hij zich op 2026-11-11 gemeld (geopend op 2026-10-27; 2026-11-10 is dag veertien).
- De leeftijd wordt gemeten vanaf de `datum` van de DFT, het moment waarop hij werd geopend. Er is
  geen veld voor "sinds wanneer in deze status". Een DFT die lang `open` stond en net op
  `in_progress` is gezet, waarschuwt dus gewoon door. Dat is bedoeld: de vraag is of hij dicht
  kan.
- **Grens:** dit vangt een DFT die blijft liggen, niet een record (ADR, HDR) dat op `in-progress`
  blijft hangen. HDR-002 staat er zo bij. Breidt het patroon zich uit naar die records, dan is dat
  een volgend incident.

Verwant: HDR-022 (Het driftsignaal meet vanaf de laatste reconciliatie, niet vanaf de laatste aanraking)
Verwant: HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel)
Verwant: HDR-012 (Geen record mag na vandaag gedateerd zijn)
