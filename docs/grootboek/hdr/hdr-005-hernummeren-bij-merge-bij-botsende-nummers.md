# HDR-005: De branch die als tweede merget hernummert zijn records

- **Status:** implemented
- **Date:** 2026-10-23
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Grootboekrecords worden doorlopend genummerd (HDR-005, JNL-002, ...), en meerdere `arc/*`-branches
lopen parallel, elk met het volgende vrije nummer vanaf zijn eigen basis. Twee branches delen dus
hetzelfde nummer uit. De volgorde waarin ze mergen is vooraf niet bekend.

De regel: **de branch die als tweede merget, hernummert zijn eigen records, in die branch,
voordat hij merget.** In de praktijk:

1. Merge `arc/arc-main` in de branch (een merge, geen rebase: een gepushte branch wordt niet
   herschreven, dus geen force-push).
2. Zoek de nummers die de branch heeft geboekt en die `arc/arc-main` nu ook heeft.
3. Geef de records van de branch de volgende vrije nummers, in één ronde over de bestandsnamen,
   de registerregels, `docs/index.yml` en elke verwijzing in lopende tekst (andere records, de
   balans, code comments).
4. Draai `npm run docs:check` en open dan de pull request.

Een record dat al in `arc/arc-main` of `main` is beland, houdt zijn nummer, altijd. Nummers worden
achteraf nooit hergebruikt of verschoven.

## Waarom

**Kernprincipe:** een nummer is pas een identiteit als het in gedeelde history staat; daarvoor is
het een conceptlabel. Een concept hernummeren kost één zoek-en-vervang; een gemerged record
hernummeren herschrijft commitberichten, pull requests en de verwijzingen die anderen al hebben
overgenomen, en breekt de eigen regel van het grootboek dat records append-only zijn.

De botsing oplossen in het mergeconflict op `main` ziet er verleidelijk uit, maar git geeft alleen
een conflict op wat beide kanten op dezelfde regels bewerken. De registerstaarten en
`docs/index.yml` botsen wel. De recordbestanden niet (`hdr-005-a.md` en `hdr-005-b.md` zijn
verschillende bestanden), en de verwijzingen in lopende tekst ook niet. Alleen het conflict
oplossen laat twee verschillende "HDR-005" in de repo achter, zonder dat iets dat zegt. Het in de
branch doen, vóór de merge, brengt de hele klus in één bewuste stap.

De mergevolgorde ligt hier bewust niet vast. De regel werkt welke branch ook eerst gaat, dus
niemand hoeft de volgorde te bepalen omwille van de nummers.

## Gevolgen

- `docs/grootboek/CLAUDE.md` bevat de regel als korte werkafspraak, zodat elke sessie in die map
  hem laadt.
- `arc/bubble-animation` boekte HDR-005 (de Modern Web Guidance-proef) voordat dit record
  bestond. Als die `arc/arc-main` merget, is hij de eerste branch die deze regel toepast: zijn
  HDR-005 krijgt het volgende vrije HDR-nummer. JNL-002 botst niet.
- `npm run docs:check` controleert geen record-id's (`scripts/check-docs.mjs` vergelijkt alleen
  `docs/index.yml` met de bestanden, env vars en paden tussen backticks). Zolang dat zo is, is
  stap 3 een handmatige controle; elk register moet elk id één keer bevatten.
