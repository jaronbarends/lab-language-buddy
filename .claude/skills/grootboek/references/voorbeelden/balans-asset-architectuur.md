---
titel: "Asset-architectuur — de compounding van denkkennis"
type: leidend-document
datum: 27 april 2026
status: v1
auteurs: Janton van Apeldoorn, Claude
bron: JNL-025
---

> **Illustratieve referentie — onderdeel van de grootboek-skill.**
> De bronverwijzingen hieronder wijzen naar ARC-eigen documenten en code;
> buiten het ARC-project zijn die paden niet op te zoeken — ze illustreren
> *hoe* dit documenttype zijn inhoud draagt, niet een vindbaar pad in jouw
> project. Dit is de kleinste echte ARC-balans, licht ingekort, zodat de
> hele vorm zichtbaar is: frontmatter, hoofdboodschap, het overzicht van
> perspectieven, samenvattende secties met register-verwijzing, en de
> relatie met het geheel.

# Asset-architectuur

## Hoofdboodschap

Dit document is de balans van alle denkproducten die in het project zijn
ontstaan. Net zoals software-architectuur het opgetelde effect van alle
ADR's toont, toont de asset-architectuur het opgetelde effect van alle
assets — de denkkennis die door herhaald gebruik waarde heeft gekregen.

Het is het document dat je opent als je wilt weten: welke kennis hebben
we opgebouwd en waar leeft die?

## Vijf balansen, vijf perspectieven

| Balans | Vat samen | Vraag |
|--------|-----------|-------|
| `software-architectuur.md` | ADR's | WAT bouwen we |
| `product-architectuur.md` | PDR's | WAAROM zo |
| `data-architectuur.md` | ADR's (data) | HOE structureren we data |
| `harnas-architectuur.md` | HDR's | HOE bouwen we |
| **`asset-architectuur.md`** | **AST's** | **WAT weten we** |

## Huidige assets

Het register (`docs/grootboek/registers/assets.yml`) bevat de volledige
inventaris. Hier de samenvatting:

### AST-001: Drielagenmodel doelen

Het conceptuele fundament van ARC's meetmodel. Beschrijft hoe doelen
(tijdloze principes), dimensies (groeifasen met strengheid) en rekeningen
(concrete plekken in de code) samenwerken. Basis voor het rekeningschema
en het groeimodel.

**Leeft in:** `werkplaats/ontwerp/drielagenmodel-doelen.md`
**@-baar via:** `docs/assets/ast-001-drielagenmodel-doelen.md`

### AST-002: Visualisatie-spelregels

Spelregels voor wanneer je Markdown, Mermaid of ASCII gebruikt in
grootboek-documenten. Universeel — geldt in elke repo die het framework
gebruikt. Verankerd in CLAUDE.md en de grootboek-skill.

**Leeft in:** `docs/kompas/framework/grootboek-visualisatie-spelregels.md`
**@-baar via:** `docs/assets/ast-002-visualisatie-spelregels.md`

### AST-005: Voeden, niet activeren

Reasoning-principe voor het grootboek: referentiedocumenten voeden het
model met domeincontext in plaats van output af te dwingen of reasoning te
activeren. Met de drie sturingsniveaus (rigide / voedend / vrij). Universeel —
de toetssteen bij elk schrijfgids-, skill- en prompt-ontwerp.

**Leeft in:** `docs/kompas/framework/grootboek-voeden-niet-activeren.md`
**@-baar via:** `docs/assets/ast-005-voeden-niet-activeren.md`

## Bron en kopie

Elke asset leeft op twee plekken: de bron op zijn betekenisvolle thuisplek
(de waarheid) en een genummerde, @-bare kopie in `docs/assets/`. De kopie
draagt de `ast-NNN`-prefix van zijn registernummer.

## Compounding

Assets zijn de plek waar kennis compound. Elk document dat herhaaldelijk
wordt gebruikt in prompts (@-referenties), als basis voor sessies, of
als toetssteen bij beslissingen, groeit in waarde met elke sessie. De
asset-architectuur maakt die compounding zichtbaar.

Een asset kan promoveren tot leidend document als het ontwerpgeheugen
wordt — wanneer je merkt dat je er niet alleen naar verwijst maar er
beslissingen aan toetst. De grens is vloeiend; de promotie is een
bewuste stap.

## Verwijzingen

- `docs/grootboek/registers/assets.yml` — het volledige register
- `docs/grootboek/ast/` — individuele AST-documenten
- `docs/grootboek/leidende-documenten.md` — het balansdocumentensysteem
- `docs/kompas/framework/grootboek-werkwijze-principes.md` — werkwijze-principes

---

*Bron: ARC, asset-architectuur.md, 27 april 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
