# Register Format

Alle registers zijn YAML-bestanden in `docs/grootboek/registers/` — dat pad is
de **conventie** die het grootboek in jouw project aanlegt (de registers-map
binnen de grootboek-map), geen bestaand bestand dat je ergens opzoekt. De
registers zijn de deterministische index van het grootboek — de enige plek waar
je het totaaloverzicht van alle beslissingen vindt zonder elk document apart te
openen.

## ADR/HDR/PDR Register

Alle drie gebruiken hetzelfde format:

```yaml
adrs:  # of hdrs: of pdrs:
  - id: "ADR-001"
    titel: "Runtime Model"
    status: implemented
    versie: "1.0"
    implementatie: 100
    omgeving: prod
    datum: 2026-04-02
    implementatie-datum: 2026-04-04
    beslissing: "Claude Agent SDK (scanner) + Convex (backend)"
    bestand: adr-001-runtime-model.md
```

### Velden

| Veld | Verplicht | Toelichting |
|------|-----------|-------------|
| `id` | Ja | Uniek ID (ADR-NNN, HDR-NNN, PDR-NNN) |
| `titel` | Ja | Korte beschrijving |
| `status` | Ja | Zie status-lifecycle.md |
| `versie` | Ja | Semver-achtig (1.0, 1.1, 2.0) |
| `implementatie` | Ja | Percentage (0-100), levende meter |
| `omgeving` | Ja | `dev`, `prod`, of `geen` |
| `datum` | Ja | Aanmaakdatum (YYYY-MM-DD) |
| `beslissing` | Ja | Kernbeslissing in één zin |
| `bestand` | Ja | Bestandsnaam (relatief aan de type-map) |
| `implementatie-datum` | Bij implemented | Datum waarop 100% bereikt |
| `notitie` | Optioneel | Toelichting, restpunten |
| `changelog` | Bij versie > 1.0 | Versiegeschiedenis als lijst |

### Changelog format

```yaml
    changelog:
      - versie: "1.1"
        datum: 2026-04-06
        wijziging: "Clerk waitlist-modus toegevoegd"
      - versie: "1.2"
        datum: 2026-04-07
        wijziging: "PAT fallback deprecated"
```

### ID-nummering

Nummering is doorlopend per type. Het eerstvolgende vrije nummer gebruiken:
- ADR's: kijk naar het hoogste nummer in `adr-register.yml`, tel er 1 bij op
- HDR's: idem in `hdr-register.yml`
- PDR's: idem in `pdr-register.yml`
- DFT's: idem in `dft-register.yml`
- JNL's: idem in `jnl-register.yml`

## DFT Register

DFT's hebben een iets ander format — ze zijn geen beslissingen maar reconciliaties:

```yaml
dfts:
  - id: "DFT-001"
    titel: "Harnas-drift reconciliatie"
    status: resolved
    datum: 2026-04-04
    aanleiding: "System prompt gaf verouderde metric-namen na bouwsprint"
    bevindingen: 17
    hoog: 5
    midden: 5
    laag: 7
    bestand: dft-001-harnas-drift-reconciliatie.md
```

### DFT-specifieke velden

| Veld | Verplicht | Toelichting |
|------|-----------|-------------|
| `id` | Ja | DFT-NNN |
| `titel` | Ja | Korte beschrijving |
| `status` | Ja | `open`, `in_progress`, `resolved` |
| `datum` | Ja | Ontdekkingsdatum |
| `aanleiding` | Ja | Wat triggerde de drift? |
| `bevindingen` | Ja | Totaal aantal bevindingen |
| `hoog` / `midden` / `laag` | Ja | Ernst-verdeling |
| `bestand` | Ja | Bestandsnaam |

## JNL Register

Journaals documenteren ontdekkingsprocessen die ADR's en PDR's voeden. Het
voorbeeld hieronder draagt de oude naam MCP Janton (sinds PDR-025 heet de
server MCP ARC):

```yaml
jnls:
  - id: "JNL-001"
    titel: "MCP Server Janton — Discovery"
    status: discovery
    datum: 2026-04-15
    kwesties-open: 9
    kwesties-gesloten: 4
    doel-records:
      - "PDR-011"
      - "ADR-025"
    bestand: jnl-001-mcp-server-janton.md
```

### JNL-specifieke velden

| Veld | Verplicht | Toelichting |
|------|-----------|-------------|
| `id` | Ja | JNL-NNN |
| `titel` | Ja | Korte beschrijving |
| `status` | Ja | `discovery`, `besluiten-genomen`, of `afgerond` |
| `datum` | Ja | Startdatum |
| `kwesties-open` | Ja | Aantal open kwesties |
| `kwesties-gesloten` | Ja | Aantal gesloten kwesties |
| `kwesties-geparkeerd` | Optioneel | Aantal bewust geparkeerde kwesties |
| `doel-records` | Ja | Welke ADR/PDR het journaal voedt |
| `verwijst-naar` | Optioneel | Andere JNL's of documenten die als input dienen |
| `bestand` | Ja | Bestandsnaam |

## Livegang Register

```yaml
features:
  - id: "LG-001"
    feature: "Clerk Auth"
    branch: "feature/clerk-auth"
    status: done
    bestand: lg-001-clerk-auth.yml
    aangemaakt: 2026-04-04
    dev-voltooid: 2026-04-05
    prod-voltooid: 2026-04-05
    notitie: "Eerste livegang — alle env vars handmatig gezet"
```
