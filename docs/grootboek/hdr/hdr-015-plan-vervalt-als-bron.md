# HDR-015: plan.md vervalt als bron; beslissingen leven in het grootboek

- **Status:** implemented
- **Date:** 2026-11-01
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

`docs/plan.md` wordt niet meer bijgewerkt en niet meer gebruikt. Alles wat daarin een
beslissing, open vraag of werkafspraak is, staat voortaan als record in het grootboek (ADR,
PDR, HDR, JNL), in het Nederlands (HDR-014). Wat alleen beschrijft hoe de code in elkaar zit,
gaat niet mee: de code is de waarheid.

De overzetting volgt deze keuzes, uitgewerkt in de spec `plan-overzetting` (inmiddels verwijderd; git bewaart haar):

- **Decisions-tabel:** 11 records (verwante rijen samen).
- **Decision log (207 rijen):** gegroepeerd per thema; elk record noemt de rijen waar het uit
  komt, zodat geen rij verdwijnt. Een rij die later is ingehaald, staat als voorgeschiedenis
  in het record dat haar vervangt.
- **Open questions:** besliste punten worden ADR of PDR, de rest wordt kwesties in één nieuw
  JNL; punten die al in het grootboek staan, krijgen een verwijzing.
- **Het veld Source komt niet terug.** De oorspronkelijke datum komt in `datum`.
- **Niets valt zonder bestemming weg.** Een script controleert dat elke rij uit Decisions, het
  decision log en Open questions in precies één record onder "Herkomst" staat, of expliciet
  als "vervalt" is gemarkeerd.
- **`plan.md` zelf** wordt bevroren met een kop bovenaan ("niet meer bijwerken, zie het
  grootboek") tot die controle slaagt, en daarna in een aparte commit verwijderd. Git bewaart
  de inhoud.

Dit record vervangt ADR 0001 (decisions live in the plan) en de bepaling in HDR-001
(grootboek-stelsel) dat `docs/plan.md` de bron blijft voor beslissingen van voor 2026-10-20.

## Waarom

**Kernprincipe:** beslissingen horen op één plek. HDR-001 noemde het zelf een bekend risico
dat twee plekken kunnen driften, en eiste dat ADR 0001 geregeld zou zijn vóór de merge naar
`main`. Dit record regelt dat.

Jarón wil de werkwijze van ARC volgen en ook de oude beslissingen op die manier beschikbaar
hebben: vindbaar via de registers, met type, status en reden. Het plan kan dat niet zijn,
want het is één bestand van ruim 1300 regels dat je moet doorzoeken.

## Gevolgen

- **Verwijzingen naar `plan.md` verhuizen.** Dat zijn zeven comments in code (`src`, `scripts`,
  `.claude`), veertien grootboekdocumenten, `README.md`, `docs/index.yml` (`plan_sections` en
  `decisions`), `docs/code-architectuur.md`, `docs/ios-stt-runs.md`, twee agent-bestanden, de
  skill `stage-review`, `.claude/rules` en `scripts/check-docs.mjs` (de plan-check).
- **Leidende documenten wijzigen** en worden elk eerst aan Jarón getoond: de root-`CLAUDE.md`
  (de alinea "Project plan", de bullet over `plan.md` als bron, de tabelrij "Plan and
  decisions"), `src/components/CLAUDE.md` (de zinnen over re-sync en de lijst in `plan.md`) en
  mogelijk `docs/code-architectuur.md`.
- **De regel "plan in dezelfde commit"** wordt vervangen door de bestaande regel dat een
  beslissing zonder registerregel niet bestaat, in dezelfde commit als het record.
- **Wat verloren gaat:** `git blame` op de rijen van het plan, en het veld Source (wie
  bedacht het). Beide zijn bewust opgegeven.
- **De records worden direct in het Nederlands geschreven** en hoeven dus niet meer vertaald.
- **De rijnummers zijn steigerwerk.** De ids L, D en Q en de secties `## Herkomst` verwijzen naar
  `docs/plan.md` en verdwijnen samen met het plan. Ook verwijzingen naar zulke ids in lopende tekst
  worden dan omgeschreven naar de datum of de inhoud van de rij. Dat verandert geen besluit, alleen
  de verwijzing, dus het raakt de status van de records niet. De volledigheidscontrole en de spec
  gaan op hetzelfde moment weg.
- **Uitgevoerd op 2026-11-06.** `plan.md`, de spec `plan-overzetting`, de volledigheidscontrole
  en de `## Herkomst`-secties in de records zijn verwijderd; git bewaart ze. De verwijzingen zijn
  bijgewerkt.
