# Status Lifecycle

Verschillende documenttypen gebruiken verschillende statussen. Dit is bewust —
ze beschrijven verschillende processen.

## ADR / HDR / PDR

```
voorstel → discussion → accepted → in-progress → implemented
                                                       ↓
                                                  uitfaseren → uitgefaseerd
                                                       ↓
                                                  superseded (door nieuwe ADR/HDR/PDR)

rejected (op elk moment vóór implemented)
```

| Status | Impl% | Betekenis | Bewerkbaar? |
|--------|-------|-----------|-------------|
| `voorstel` | — | Idee, nog niet besproken | Ja, vrij |
| `discussion` | — | Actief in bespreking | Ja, vrij |
| `accepted` | 0% | Beslissing genomen, nog niet begonnen | Ja |
| `in-progress` | 1-99% | Actief in ontwikkeling | Ja |
| `implemented` | 100% | Volledig in productie | **Nee — onveranderlijk** |
| `uitfaseren` | 100→0% | Wordt vervangen, afbouw loopt | Alleen afbouw-updates |
| `uitgefaseerd` | — | Historisch record | Nee |
| `superseded` | — | Vervangen door nieuwere versie | Nee |
| `rejected` | — | Bewust niet gekozen | Nee |

### Overgangen

- `voorstel` → `discussion`: wanneer het team/Janton erover praat
- `discussion` → `accepted`: wanneer de beslissing genomen is
- `accepted` → `in-progress`: wanneer de eerste code geschreven wordt
- `in-progress` → `implemented`: wanneer het percentage 100% bereikt EN in productie draait
- `implemented` → `uitfaseren`: wanneer een vervangende ADR/HDR/PDR aangemaakt wordt
- Elk moment → `rejected`: wanneer bewust besloten wordt het NIET te doen

### Onveranderlijkheidsregel

Na `implemented` is het document bevroren. De enige manier om een implemented
beslissing te wijzigen:

1. **Verfijning** (zelfde kernbeslissing) → versiebump (1.0 → 1.1) in het document
2. **Koerswijziging** → nieuwe ADR/HDR/PDR aanmaken, oude krijgt status `superseded`

Dit is de tegenboeking — we corrigeren vooruit, niet achteruit.

## DFT (Drift)

Eenvoudiger lifecycle — drift wordt gevonden en opgelost:

```
open → in_progress → resolved
```

| Status | Betekenis |
|--------|-----------|
| `open` | Drift gevonden, nog niet opgepakt |
| `in_progress` | Bezig met oplossen |
| `resolved` | Alle bevindingen opgelost |

DFT's worden nooit `superseded` of `rejected` — ze zijn feiten, geen beslissingen.

## Specs

Specs zijn tijdelijk — na implementatie is de code de waarheid. De spec
wordt historisch document en kan naar archief.

```
concept → review → klaar-voor-uitvoering → geïmplementeerd → archief
```

| Status | Betekenis |
|--------|-----------|
| `concept` | Eerste schets op basis van bron (ADR, PDR, JNL, paraplu-document) |
| `review` | Wordt verrijkt vanuit meerdere perspectieven; open punten leven in het document |
| `klaar-voor-uitvoering` | Alle open punten opgelost, acceptatiecriteria staan |
| `geïmplementeerd` | Code gebouwd en werkend; spec is nu historisch |
| `archief` | Verplaatst naar archief; code is de waarheid |

## JNL (Journaal)

Journalen documenteren een ontdekkingsproces — ze hebben geen
implementatiepercentage, want een journaal is geen implementatie maar de
chronologische vastlegging die het grootboek voedt.

```
discovery → besluiten-genomen → afgerond
```

| Status | Betekenis |
|--------|-----------|
| `discovery` | Open. Kwesties worden doorgewerkt in dialoog |
| `besluiten-genomen` | Alle kwesties besloten of bewust geparkeerd; doel-records nog niet allemaal geschreven |
| `afgerond` | Doel-records (ADR's/PDR's) zijn geschreven en verwijzen terug |

### Overgangen

- `discovery` → `besluiten-genomen`: wanneer alle kwesties zijn besloten
  of geparkeerd. Het besluitenlog is compleet.
- `besluiten-genomen` → `afgerond`: wanneer de ADR's/PDR's in het
  `doel-records` veld daadwerkelijk bestaan en terugverwijzen.

Een journaal wordt niet verwijderd na afronding — het blijft de audit
trail van hoe een beslissing tot stand kwam. De resulterende ADR's/PDR's
verwijzen terug.

## Livegang

```
pending → dev-complete → done
```

| Status | Betekenis |
|--------|-----------|
| `pending` | Checklist aangemaakt, items nog open |
| `dev-complete` | Alle items in dev afgevinkt |
| `done` | Alle items in prod afgevinkt, checklist naar archief |
