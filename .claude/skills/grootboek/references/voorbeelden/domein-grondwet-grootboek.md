# Voorbeeld: domein-grondwet — docs/grootboek/CLAUDE.md (ARC)

> **Illustratieve referentie — onderdeel van de grootboek-skill.**
> Dit is de echte domein-CLAUDE.md van de grootboek-map in het ARC-project,
> bijgesloten zodat je voelt wat een domein-grondwet doet: regels die alleen
> gelden bij werk in díé map, on-demand geladen naast de hoofdgrondwet. De
> bronverwijzingen hieronder wijzen naar ARC-eigen documenten en code; buiten
> het ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe*
> dit documenttype zijn inhoud draagt, niet een vindbaar pad in jouw project.

---

```markdown
# Grootboek — Domeincontext

## Start altijd de grootboek-skill

Bij het aanmaken of hervatten van elk grootboek-document: start `/grootboek`.
De schrijfgids is een harde eis — zonder die context schrijf je een
invulformulier in plaats van een levend document.

## Documenttypen

| Type | Prefix | Vraag | Voorbeeld |
|------|--------|-------|-----------|
| ADR | adr-NNN | WAT bouwen we? | adr-016-scanner-communicatielaag |
| HDR | hdr-NNN | HOE bouwen we? | hdr-013-dev-server-monitoring |
| PDR | pdr-NNN | WAAROM zo? | pdr-020-mcp-als-sync-oppervlak |
| DFT | dft-NNN | KLOPT HET NOG? | dft-036-deployment-chain-drift |
| JNL | jnl-NNN | WAT ONTDEKKEN WE? | jnl-009-begrippenkader |

Registers in `docs/grootboek/registers/` (YAML).

## Visualisatie-spelregels

Per diagram kiezen, niet per document. Vier vragen:
1. **Tabulaire data?** → Markdown-tabel
2. **Gestandaardiseerd patroon** (sequence, state, ER, flowchart)? → Mermaid
3. **Cyclisch, terugkoppelend, niet-lineair?** → ASCII
4. **Moet werken zonder renderer?** → ASCII

*Markdown voor data, Mermaid voor patronen die al bestaan, ASCII voor vormen
die je zelf tekent.*

Kijk ook wat ontbreekt: signaalwoorden als "orthogonaal", "cyclus", "drieluik"
in de tekst verraden een gemiste visualisatie.

Soms is tekst niet de eindvorm: wanneer een mens iets moet *zien, doen of
ervaren*, escaleer je naar een zelfstandig HTML-artefact (alleen op verzoek,
Markdown blijft ~80%).

Volledig: `docs/kompas/framework/grootboek-visualisatie-spelregels.md` ·
bouw-laag: `grootboek-html-artefact-bouwgids.md`

## Schrijfconventies

- Documentatie: Nederlands
- Bestanden: kebab-case
- Elke feature/bugfix krijgt een spec in `docs/grootboek/specs/`
- Specs zijn wegwerpproducten — na oplevering is de code de waarheid
- Bij omgevingswerk: livegang-checklist in `docs/grootboek/livegang/`

## Leidende documenten

Lees het relevante leidende document voordat je aan een domein werkt:
- `software-architectuur.md` — technisch perspectief
- `product-architectuur.md` — functioneel/klant perspectief
- `harnas-architectuur.md` — werkwijze perspectief
- `data-architectuur.md` — doorsnijding: data
- `kalibratie-architectuur.md` — doorsnijding: intelligentie-kringloop
- `distributie-architectuur.md` — doorsnijding: distributie naar klant
- `code-architectuur.md` — doorsnijding: code-kwaliteit voor agentic dev

## Communicatieplicht

Bij wijziging aan een balansdocument: meld wat er wijzigt, waarom, en vraag
de Dirigent om een check. Dit geldt voor alle bovenstaande leidende documenten
plus CLAUDE.md.
```

---

Wat dit voorbeeld laat zien: een domein-grondwet **herhaalt de hoofdgrondwet
niet**, maar draagt de regels die alleen hier gelden — de documenttypen-tabel,
de schrijfconventies van deze map, en de leeswijzer naar de leidende
documenten. Hij blijft kort genoeg om als geheel geladen te worden.

*Bron: ARC, docs/grootboek/CLAUDE.md, 10 juni 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
