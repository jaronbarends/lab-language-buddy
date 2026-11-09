# HDR-001: Invoering van het grootboekstelsel

- **Status:** implemented
- **Date:** 2026-10-20
- **Type:** Harness Decision Record (HOW do we work)

> Gedeeltelijk vervangen door HDR-015 (2026-11-06): `plan.md` is vervallen als bron en verwijderd.
> De bepaling hieronder en de gevolgen over twee plekken zijn voorgeschiedenis.

## Besluit

language-buddy voert het grootboekstelsel in, als experiment op de `arc/*`-branches. Elke
beslissing van betekenis krijgt een genummerd document en een registerregel:

| Type | Vraag | Map |
|------|-------|-----|
| ADR | WAT bouwen we? | docs/grootboek/adr/ |
| HDR | HOE werken we? | docs/grootboek/hdr/ |
| PDR | WAAROM zo? | docs/grootboek/pdr/ |
| DFT | KLOPT HET NOG? | docs/grootboek/dft/ |

De registers in docs/grootboek/registers/ zijn de goedkope index: de agent leest eerst het
register, dan het document. De grondwet (CLAUDE.md) is de operationele samenvatting die altijd
in de context zit.

Twee keuzes die specifiek zijn voor deze repo:

- **`docs/plan.md` blijft de bron voor elke beslissing van vóór 2026-10-20.** Er wordt niets
  overgezet en `docs/adr/0001-decisions-live-in-the-plan.md` blijft van kracht voor `main`.
  Alleen beslissingen vanaf nu, in de experimenten op `arc/*`, worden hier geboekt. Voordat
  deze branch naar `main` mergt, moet ADR 0001 worden afgehandeld (vervangen, of de twee
  plekken verzoend).
- **Geen bronveld.** Het besluitenlog van het plan legt vast wie elke beslissing heeft
  ingebracht (`agent`, `you`, `ported`). Het registerformaat van het grootboek heeft zo'n
  veld niet en het is in de praktijk niet gebruikt, dus nieuwe records dragen er geen.

## Waarom

Zonder grootboek leeft elke beslissing alleen in de sessie waarin ze is genomen. Met een
grootboek is elke keuze traceerbaar (waar staat ze), te volgen (waarom is ze gemaakt) en over
te dragen (elke latere sessie of agent kan erop voortbouwen). Het experiment is uitzoeken of dat
hier loont, naast het plan, voordat wordt besloten of het plan erin opgaat.

## Gevolgen

- De mapstructuur en de registers zijn aangemaakt door het bootstrap-script van de
  grootboek-skill; dit besluit documenteert zijn eigen invoering.
- Vanaf nu: werk het register bij bij elke nieuwe beslissing of statuswijziging. Een document
  zonder registerregel bestaat niet voor een agent die de index leest.
- Een `implemented` besluit verandert niet meer; een nieuw besluit vervangt het oude (de
  tegenboeking).
- Zolang het experiment niet is afgerond, staan beslissingen op twee plekken, dus drift
  daartussen is mogelijk. Het register voor HDR/ADR/PDR is de plek om te kijken voor alles
  vanaf 2026-10-20; `plan.md` voor alles daarvoor.
