---
titel: "HDR-009: Livegang-checklists — Gestructureerde promotie van feature naar productie"
type: harness-decision-record
datum: 5 april 2026
status: in-progress
versie: "1.1"
implementatie: 80
omgeving: prod
context: >
  Bij de implementatie van Clerk authenticatie (ADR-013) bleek dat de overgang
  van feature branch naar development en uiteindelijk productie veel handmatig
  werk vereist dat nergens is gedocumenteerd: env vars instellen, externe
  diensten configureren, datamigraties uitvoeren. Deze kennis leeft in
  gesprekken en verdwijnt na de sessie.
changelog:
  - versie: "1.0"
    datum: 2026-04-05
    wijziging: "Initiële versie: YAML-checklists, register, learnings"
  - versie: "1.1"
    datum: 2026-04-21
    wijziging: "Kernprincipe, werkregel en doorsnijding expliciet gemaakt (review tegen HDR schrijfgids v2, JNL-013)"
---

# HDR-009: Livegang-checklists

> **Illustratieve referentie — onderdeel van de grootboek-skill.**
> Dit is een echt, ongewijzigd ARC-document, bijgesloten zodat je voelt hoe een
> HDR van concrete pijn via een kernprincipe naar een werkregel komt.
> Verwijzingen naar andere grootboek-documenten en ARC-code dienen als illustratie
> van *hoe* een HDR het harnas aanhaakt — buiten het ARC-project zijn die paden
> niet op te zoeken. Het gaat om de vorm.

## Status

**In-progress** (5 april 2026)

## Kernprincipe

Deze HDR beschermt niet het YAML-formaat of de mapstructuur — het
beschermt het principe dat **omgevingskennis gestructureerd moet worden
vastgelegd op het moment dat ze ontstaat, niet achteraf**.

Deployment-kennis is vluchtig. Ze ontstaat terloops tijdens het bouwen
("oh, deze env var moet ook in prod"), leeft in het gesprek, en verdwijnt
zodra de sessie eindigt. De volgende sessie — of de volgende mens — begint
weer op nul. Het format kan veranderen; het principe dat je vluchtige
kennis externaliseert vóór de sessie eindigt, niet.

## Context

Elke feature die omgevings-configuratie, externe diensten, datamigraties
of handmatige stappen vereist, heeft een "schaduw" van ongedocumenteerd
werk. Dit werk is niet in de code zichtbaar, maar blokkeert promotie naar
productie.

In boekhoudtaal (ADR-009): het zijn **voorzieningen** — bekende
toekomstige kosten die bij de feature horen en alvast geboekt moeten
worden.

Concrete momenten waarop het ontbreken van dit patroon pijn deed:

- **Clerk auth (ADR-013, april 2026)** — JWT template moest bestaan vóór
  eerste login, Convex env vars hadden encoding-issues via MCP, de
  Save-knop in Clerk Dashboard vereiste scroll. Dit kostte een volledige
  extra sessie om te reconstrueren.
- **Omgevingsarchitectuur (ADR-012)** — post-checkout hook, Railway
  env vars, Convex deployment-URLs: elke omgeving had eigen stappen die
  nergens centraal stonden.
- **Scanner deployment (Railway)** — env vars voor GitHub App, Convex
  URLs, systeemprompt-configuratie: per omgeving anders, alleen bekend
  bij wie het had gebouwd.

## Beslissing

**Elke feature die omgevingswerk vereist krijgt een livegang-checklist in
YAML-formaat. Een register op development houdt de status bij. Learnings
worden verzilverd in volgende checklists.**

## Werkregel

Dit is de instructie zoals deze in CLAUDE.md staat — de brug van HDR naar
dagelijkse praktijk:

> Features met omgevingswerk (env vars, externe diensten, datamigraties)
> krijgen een **livegang-checklist** in `docs/grootboek/livegang/`.
>
> 1. Tijdens feature-ontwikkeling → checklist-items toevoegen zodra je
>    omgevingswerk tegenkomt
> 2. Bij merge naar development → checklist reist mee, status
>    `dev-complete`
> 3. Bij promotie naar productie → lees register, voer checklist uit,
>    lees learnings
> 4. Na voltooiing → status `done`, learnings toevoegen, bestand naar
>    `archief/`

## Doorsnijding

HDR-009 versterkt het harnas als geheel — het is een doorsnijding van het
rekeningschema die consolideert op reeks-niveau.

```
HDR-009 (Livegang-checklists)
│
├─ 4000  Harnas (consolidatie)         ← de doorsnijding: werkwijze als geheel
│
├─ raakt 4110  CLAUDE.md project       ← daar staat de werkregel
├─ raakt 4220  Project skills          ← grootboek-skill triggert bij merge
├─ raakt 4550  CI/CD hooks             ← checklist is manuele deploy gate
└─ raakt 4950  Context-management      ← kennis overleeft de sessie
```

De consolidatie-boeking op 4000 vangt het samenspel. De geraakte
rekeningen zijn de individuele componenten die HDR-009 orkestreert. Zie
JNL-013 voor de ontdekking van dit patroon.

## Structuur

```
docs/grootboek/livegang/
├── register.yml              ← overzicht alle checklists, status per omgeving
├── learnings.md              ← groeiend document met deployment-wijsheid
├── lg-001-clerk-auth.yml     ← individuele checklist (uitvoerbaar)
├── lg-002-xxx.yml            ← volgende feature
└── archief/                  ← voltooide checklists (status: done)
```

### register.yml

Token-efficiënt overzicht — Claude Code leest alleen dit bestand om te
weten waar alles staat.

```yaml
checklists:
  - id: "LG-001"
    feature: "clerk-auth"
    branch: "feature/clerk-auth"
    status: dev-complete        # pending → dev-complete → prod-ready → done
    bestand: lg-001-clerk-auth.yml
    aangemaakt: 2026-04-05
    dev-voltooid: 2026-04-05
    prod-voltooid: null
```

Status-lifecycle:
- `pending` — checklist aangemaakt, feature in ontwikkeling
- `dev-complete` — alle dev-items afgevinkt, feature op development
- `prod-ready` — klaar om naar productie gepromoveerd te worden
- `done` — alles uitgevoerd, bestand verplaatst naar `archief/`

### Individuele checklist (YAML)

Gestructureerd zodat Claude Code items kan oppakken en uitvoeren:

```yaml
id: "LG-001"
feature: "clerk-auth"
items:
  - taak: "Clerk prod instance activeren"
    type: extern               # extern | env-var | data-migratie | code | verificatie
    omgeving: prod
    status: pending            # pending → done | skipped
    notities: ""

  - taak: "CLERK_JWT_ISSUER_DOMAIN instellen in Convex prod"
    type: env-var
    omgeving: convex-prod
    status: pending
    waarde: "https://clerk.<domein>"
```

Item-types:
- `extern` — handeling in externe dienst (Clerk Dashboard, Vercel, etc.)
- `env-var` — environment variabele instellen
- `data-migratie` — database-wijziging of backfill
- `code` — code-aanpassing die per omgeving verschilt
- `verificatie` — test of check die bevestigt dat het werkt

### learnings.md

Groeit na elke promotie. Wordt gelezen bij het aanmaken van de volgende
checklist.

```markdown
## LG-001: clerk-auth (5 april 2026)
- Clerk JWT template Save-knop vereist scroll + is soms niet zichtbaar
- Convex MCP envSet tool heeft encoding-issues — gebruik `npx convex env set`
- JWT template moet bestaan VOOR eerste login, anders loopt Convex auth in een loop
```

## Werkwijze

### Bij feature-ontwikkeling

1. Tijdens het bouwen: checklist-items toevoegen zodra je weet dat er
   omgevingswerk is
2. Bij merge naar development: checklist en register-entry mee-mergen
3. Status op `dev-complete`

### Bij promotie naar productie

1. Claude Code leest `register.yml` → vindt open checklists
2. Claude Code leest individuele checklist → voert items uit per omgeving
3. Claude Code leest `learnings.md` → kent bekende valkuilen
4. Na voltooiing: status → `done`, eventuele learnings toevoegen

### Branching en schaling

Elke feature branch maakt zijn eigen checklist-bestand aan. Dit zijn
losse bestanden, dus geen merge-conflicten. Het register is append-only
per feature.

```
feature/clerk-auth    → voegt lg-001-clerk-auth.yml + register-entry toe
feature/repo-manager  → voegt lg-002-repo-manager.yml + register-entry toe
                         ↓ merge naar development
development           → register.yml heeft beide entries, twee losse bestanden
```

## Relatie met andere beslissingen

- **ADR-009** (Documentatie als Boekhouding) — checklists zijn
  *voorzieningen* op de balans
- **ADR-012** (Omgevingsarchitectuur) — de checklists overbruggen het
  verschil tussen dev en prod
- **HDR-007** (Omgevingsisolatie) — checklists documenteren wat per
  omgeving verschilt
- **ADR-013** (Authenticatie) — eerste toepassing van dit patroon
- **JNL-013** (Rekeningschema consolidatieniveau) — de doorsnijding die
  dit patroon zichtbaar maakte in het rekeningschema

## Waarom YAML en niet markdown

- **Machine-leesbaar** — Claude Code kan items oppakken als takenlijst
- **Status-tracking** — `status: pending/done` is parseable; markdown
  checkboxes niet betrouwbaar
- **Token-efficiënt** — register geeft overzicht zonder alle bestanden
  te openen
- **Scanner-compatibel** — kan meten of er open checklists zijn
  (harnas-hygiëne)
- **Consistent** — zelfde patroon als ADR/HDR-registers

## Risico's

| Risico | Mitigatie |
|--------|-----------|
| Vergeten checklist aan te maken bij feature | Scanner detecteert features zonder checklist (toekomstig) |
| Checklist onvolledig | Learnings uit eerdere promoties voeden nieuwe checklists |
| Register merge-conflicten | Append-only structuur, losse bestanden per feature |
| Overhead bij kleine features | Alleen verplicht als er omgevingswerk is; niet elke feature heeft een checklist nodig |

---

*Bron: ARC, hdr-009-livegang-checklists.md, 5 april 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
