# Register-voorbeeldrecords — het formaat per registertype

> Dit zijn **formaat-voorbeelden**, geen echte ARC-records: per registertype
> het YAML-kopblok zoals het in `docs/grootboek/registers/` (de register-map
> van jouw project — een conventie die je zelf aanlegt) bovenaan het bestand
> staat, gevolgd door precies één neutraal voorbeeldrecord. De inhoud van de
> records is verzonnen; de velden en de status-lifecycle zijn het patroon.
> Het register is de goedkope index van het grootboek: de agent leest eerst
> het register, dan pas het document.

De gedeelde **status-lifecycle** voor beslisregisters (ADR/HDR/PDR):

```
voorstel → discussion → accepted → in-progress → implemented
                                        │
                            uitfaseren → uitgefaseerd
implemented is ONVERANDERLIJK; wijziging = nieuw record dat het oude
'superseded' maakt (de tegenboeking). 'rejected' = bewust niet gekozen.
```

## ADR-register (`adr-register.yml`) — WAT bouwen we

```yaml
# ADR Register — Centraal overzicht van alle Architecture Decision Records
# Dit bestand is de "index" van het grootboek. Open dit om de status van
# alle beslissingen te zien zonder elk document apart te openen.
#
# Velden:
#   versie        — semver-achtig (1.0, 1.1). Verfijning = minor; koerswijziging = nieuwe ADR.
#   implementatie — percentage (0-100), levende meter
#   omgeving      — waar draait het? dev | prod | geen
#
# Onveranderlijkheidsregel: een 'implemented' ADR wijzigt niet meer;
# een nieuwe ADR supersedeert de oude (de tegenboeking).

adrs:
  - id: "ADR-001"
    titel: "Database-keuze"
    status: implemented
    versie: "1.0"
    implementatie: 100
    omgeving: prod
    datum: 2026-01-15
    implementatie-datum: 2026-01-20
    beslissing: "Relationele database als primaire opslag; documentstore afgewezen wegens query-behoefte"
    bestand: adr-001-database-keuze.md
```

## HDR-register (`hdr-register.yml`) — HOE bouwen we

Zelfde lifecycle en velden als de ADR; het onderwerp is de werkwijze
(harnas, hooks, samenwerking), niet de software.

```yaml
# HDR Register — Centraal overzicht van alle Harness Decision Records
# De index van het harnas-grootboek: hoe mens en agent samenwerken.

hdrs:
  - id: "HDR-001"
    titel: "Branch-protocol"
    status: in-progress
    versie: "1.0"
    implementatie: 75
    omgeving: prod
    datum: 2026-02-01
    beslissing: "Feature-branches mergen via PR naar development; main is productie"
    notitie: "Protocol staat; de bewakende hook is nog niet gebouwd"
    bestand: hdr-001-branch-protocol.md
```

## PDR-register (`pdr-register.yml`) — WAAROM zo

Productbeslissingen dragen een changelog zodra de koers verschuift binnen
dezelfde kernbeslissing.

```yaml
# PDR Register — Centraal overzicht van alle Product Decision Records
# Productbeslissingen documenteren het WAAROM achter feature-keuzes,
# prioritering en productrichting.

pdrs:
  - id: "PDR-001"
    titel: "Onboarding in drie stappen"
    status: implemented
    versie: "2.0"
    implementatie: 100
    omgeving: prod
    datum: 2026-02-10
    beslissing: "Progressieve onthulling: eerst waarde tonen, dan pas account vragen"
    bestand: pdr-001-onboarding.md
    changelog:
      - versie: "1.0"
        datum: 2026-02-10
        wijziging: "Vijf stappen, account eerst"
      - versie: "2.0"
        datum: 2026-03-01
        wijziging: "Drie stappen na gebruikerstest; account naar het einde"
```

## DFT-register (`dft-register.yml`) — KLOPT HET NOG

Een drift-rapport is een reconciliatie: klopt de documentatie nog met de
werkelijkheid (code, schema, omgeving)? Eigen lifecycle: `open` →
`in_progress` → `resolved`.

```yaml
# DFT Register — Centraal overzicht van alle Drift-rapporten

dfts:
  - id: "DFT-001"
    titel: "Deploy-documentatie loopt achter op de pipeline"
    status: resolved
    datum: 2026-03-05
    aanleiding: "De beschreven deploy-stappen bestonden niet meer na de CI-verbouwing"
    bevindingen: 4
    hoog: 1
    midden: 2
    laag: 1
    bestand: dft-001-deploy-documentatie-drift.md
```

## JNL-register (`jnl-register.yml`) — WAT ONTDEKKEN WE

Een journaal telt kwesties in plaats van implementatie-percentages: de
discovery is klaar als de kwesties besloten zijn en in doel-records
(ADR/PDR/HDR) zijn geland.

```yaml
# JNL Register — Centraal overzicht van alle journalen (discovery)

jnls:
  - id: "JNL-001"
    titel: "Notificatie-strategie — Discovery"
    status: grotendeels-besloten
    datum: 2026-03-10
    laatste-sessie: 2026-03-18
    kwesties-totaal: 8
    kwesties-besloten: 6
    kwesties-open: 1
    kwesties-geparkeerd: 1
    doel-records:
      - "PDR-002 (geschreven)"
      - "ADR-004 (open)"
    bestand: jnl-001-notificatie-strategie.md
```

## Assets-register (`assets.yml`) — WAT weten we

Assets zijn geen beslissingen maar denkproducten met hoge herbruikwaarde.
Elk asset leeft op twee plekken: de **bron** op zijn betekenisvolle
thuisplek (de waarheid) en een @-bare **kopie** met `ast-NNN`-prefix.

```yaml
# Assets Register — Inventaris van projectspecifieke denkproducten
# Assets zijn geen beslissingen (die staan in ADR/PDR/HDR); het zijn
# werkproducten die vaak via @-referenties in prompts worden gebruikt.

assets:
  - id: "AST-001"
    naam: "Domeinbegrippenkader"
    bron: docs/ontwerp/domeinbegrippenkader.md
    kopie: docs/assets/ast-001-domeinbegrippenkader.md
    domein: ontwerp
    ontstaan: JNL-001
    bestand: ast-001-domeinbegrippenkader.md
    verwijzingen:
      - docs/grootboek/adr/adr-004-notificatie-model.md
```

---

Twee spelregels die alle registers delen: **append-only** (records verdwijnen
niet — een afgewezen of vervangen record blijft staan met zijn eindstatus,
dat is de boekhouding) en **register vóór document** (een nieuw document
zonder registerregel bestaat niet voor de agent die de index leest).

*Formaat naar het patroon van de ARC-registers (PDR-022); de records zelf
zijn neutrale illustraties.*
