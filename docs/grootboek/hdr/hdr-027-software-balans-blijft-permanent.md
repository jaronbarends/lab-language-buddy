# HDR-027: De software-balans blijft bestaan als leidend document

- **Status:** implemented
- **Date:** 2026-11-09
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een document dat de staat van het systeem vanuit één perspectief beschrijft, is alleen iets waard
zolang het wordt getoetst aan de code. De balans heeft die toets: het driftsignaal (HDR-008,
HDR-022) en de reconciliatie per pull request (HDR-026). Dat maakt hem onderhoudbaar als leidend
document, en dat is de reden om hem te houden in plaats van als proef te laten hangen.

## Besluit

`docs/grootboek/software-architectuur.md` blijft permanent bestaan als leidend document, onder
dezelfde discipline als de andere: de communicatieplicht bij wijziging, een update in dezelfde commit
als een beslissing die erop raakt, en een reconciliatie bij elke pull request die code in zijn
werkgebied raakt (HDR-026).

Dit record vervangt HDR-002 (De software-balans naast `plan.md` houden, als proef voor
driftdetectie). Die proef is afgerond, en haar vergelijkingsobject bestaat niet meer: `plan.md` is
vervallen (HDR-015).

Er komt geen eigen heroverweging van de balans. De heroverweging na DFT-010 (HDR-026) gaat over het
ritme van de reconciliatie, niet over het bestaan van de balans. Het opheffingscriterium van HDR-002
("als de balans niets toevoegt wat driftdetectie niet ook anders kon zeggen") vervalt met dat record.

## Waarom

**De keuze van Jarón (2026-11-09):** de balans permanent aanhouden. Zijn reden: hij wil dit project
doen volgens de methode van ARC. Daarin hoort de balans, en niet `plan.md`, dat uit de
oorspronkelijke fase van dit project komt.

Het bewijs uit de proef is gemengd, en dit record doet niet alsof het sterker is. Drie
reconciliaties tot nu toe:

- DFT-001: geen drift.
- DFT-004: twee bevindingen in de balans (§ 5 zei dat er geen CI is, midden; de dev-previews
  ontbraken in § 3, laag) en één, de zwaarste, in `src/components/CLAUDE.md`. De CI-bewering stond
  alleen in de balans; geen ander document kon haar tegenspreken.
- DFT-005: geen drift, en de nieuwe rij in § 3 was in dezelfde commit als de beslissing toegevoegd.

De bevinding over de CI kwam deels voort uit het bijhouden zelf: de commit die HDR-003 bouwde,
werkte de balans niet bij. Dat is wat het houden van de balans kost.

**Afgewogen** (opties van 2026-11-09):

- **Parkeren tot DFT-010.** Zou het besluit laten meewegen met gemeten kosten per reconciliatie. Het
  laat HDR-002 echter openstaan als een record met een verouderd vergelijkingsobject, zoals
  HDR-023 dat voor andere records wil voorkomen. Jarón koos het niet.
- **Opheffen.** Het werkgebied van de HDR-026-trigger kromp dan tot de twee `CLAUDE.md`-bestanden
  onder `src/`, en bevinding 2 en 3 van DFT-004 hadden geen document gehad om tegen te toetsen. Jarón
  koos het niet.

## Gevolgen

- **Elke pull request die code raakt in `src/lib`, `src/hooks`, `src/app`, `src/components`,
  `next.config.ts`, `.env.example` of `.github/workflows` sluit ook met een reconciliatie van de
  balans** (HDR-026). De kosten tellen mee in de kostenmeting tot en met DFT-010.
- **HDR-002 is vervangen** en staat op `implemented`. Zijn tekst blijft als voorgeschiedenis.
- **De notitie in de front matter van de balans** zegt niet meer "Aangehouden als proef volgens
  HDR-002", maar verwijst naar dit record. Dat is een wijziging van een leidend document en is aan
  Jarón getoond voordat ze werd doorgevoerd.
- **HDR-023 noemde HDR-002 als voorbeeld van een record dat blijft hangen.** Dat voorbeeld was met
  dit record achterhaald; de zin in HDR-023 is op 2026-11-09 aangepast ("HDR-002 stond er zo bij, tot
  HDR-027 het verving"). Verder blijft HDR-023 ongewijzigd.

Vervangt: HDR-002 (De software-balans naast `plan.md` houden, als proef voor driftdetectie)
Verwant: HDR-015 (plan.md vervalt als bron; beslissingen leven in het grootboek)
Verwant: HDR-026 (Een pull request die code in een werkgebied raakt, sluit met een reconciliatie)
Verwant: DFT-004 (Eerste reconciliatie op een echt signaal — `src/components/CLAUDE.md` beschrijft een context die nooit heeft bestaan, de balans mist de CI)
Verwant: DFT-005 (Reconciliatie na ADR-031 — geen drift)
