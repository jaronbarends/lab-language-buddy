# Grondwet-frameworkblok — het kopieerbare hart van CLAUDE.md

> De grondwet (CLAUDE.md) van een project bestaat uit twee helften: een
> **universeel framework-blok** dat in elke repo vrijwel gelijk is, en een
> **repo-specifieke helft** die alleen jouw project kan invullen. Hieronder
> staan beide: het framework-blok als kopieerbaar kader, de repo-helft als
> invulkader met aanwijzingen. Waar ARC-inhoud als voorbeeld dient, is dat
> gemarkeerd — buiten het ARC-project zijn die paden en namen niet op te
> zoeken; ze illustreren *hoe* een grondwet zijn inhoud draagt.

---

## Deel 1 — Het universele framework-blok (kopieerbaar)

Dit blok kan vrijwel letterlijk in de CLAUDE.md van elke repo landen.
Vervang alleen `<projectnaam>` en pas de toon aan je eigen samenwerking aan.

```markdown
# <Projectnaam> — Claude Code Instructieset

## Grootboek-framework

**Actoren:** de mens dirigeert — voedt en beslist. De agent bouwt — schrijft
documenten en code. Het grootboek borgt — discipline via registers,
schrijfgidsen en de grootboek-skill.

**Communicatieplicht:** bij wijziging aan een balansdocument of CLAUDE.md:
meld wat er wijzigt, waarom, en vraag de mens om een check. Deze documenten
zijn te belangrijk om stilzwijgend te muteren.

**Documenttypen** (beslissingen voeden de balansen):

| Type | Vraag | Trigger |
|------|-------|---------|
| ADR | WAT bouwen we? | architectuurkeuze, technologie, structuur |
| HDR | HOE bouwen we? | werkwijze, harnas, hooks, samenwerking |
| PDR | WAAROM zo? | productkeuze, prioritering, gebruikerservaring |
| DFT | KLOPT HET NOG? | documentatie en werkelijkheid lopen uiteen |
| JNL | WAT ONTDEKKEN WE? | discovery, kwesties die nog geen besluit zijn |

**Leidende documenten** in `docs/grootboek/` (de grootboek-map van jouw
project — een conventie die je zelf aanlegt): balansen (geheel vanuit één
perspectief), themakaarten (één stof door de lagen), en deze grondwet.
Registers in `docs/grootboek/registers/` (YAML) zijn de goedkope index:
lees eerst het register, dan pas het document.

Start de grootboek-skill bij elk grootboek-document — de schrijfgids is
een harde eis. Code is het functioneel ontwerp; specs zijn wegwerpproducten.

## Conventies

- Documentatie: <taal van het team>
- Code: Engels (variabelen, functies, comments)
- Commit messages: Engels, imperative mood
- Bestandsnamen: kebab-case
```

---

## Deel 2 — De repo-specifieke helft (invulkader)

Deze secties kan alleen jouw project vullen. Per sectie: wat erin hoort en
een gemarkeerd ARC-voorbeeld als gevoel voor het niveau.

### Projectcontext — wat is dit, in twee of drie zinnen

Wat het product doet en voor wie. Geen historie, geen roadmap.

> *ARC-illustratie:* "ARC (Agentic Resource Center) is een
> transformatie-partnerschap dat bedrijven agentic maakt. Het Control Center
> monitort GitHub-repo's op manier van werken en agentic maturity."

### Tech stack — de korte lijst, met de dragende keuzes

Eén regel per laag (backend, frontend, auth, taal, toolchain). Verwijs bij
een afwijkende keuze naar de ADR die hem draagt.

> *ARC-illustratie:* "Backend: Convex · Frontend: Next.js op Vercel ·
> Taal: TypeScript · Toolchain: Bun tenzij — gebruik `bun`, niet `npm`
> (ADR-045)."

### Omgevingen — welke er zijn en hoe je wisselt

Een tabel dev/prod per component, plus de werkregel die ongelukken voorkomt.
Hardcode nooit secrets of deployment-namen in de grondwet.

> *ARC-illustratie:* twee branches (`development`/`main`) schakelen de hele
> keten mee — Convex-deployment, hosting-URL, observability-project. Werkregel:
> "Dev-secrets raken nooit prod."

### Domein-grondwetten — welke mappen een eigen CLAUDE.md verdienen

De hoofdgrondwet is altijd in context; een domein-CLAUDE.md laadt on-demand
bij werk in die map. Geef een domein een eigen grondwet zodra de regels er
specifiek genoeg voor zijn (zie `domein-grondwet-grootboek.md` voor een
bijgesloten voorbeeld).

> *ARC-illustratie:* `docs/grootboek/CLAUDE.md` (documenttypen, schrijf-
> conventies), `skills-bron/CLAUDE.md` (distributieregels).

### Werkregels — de twee tot vijf regels die het vaakst misgaan

Geen volledige procesbeschrijving; alleen wat de agent élke sessie moet
weten. Leg het waarom uit in plaats van een MUST in kapitalen.

---

De toets voor het geheel: de grondwet is de **operationele samenvatting**
van de balansen — van uitgebreid naar gecondenseerd. Staat er iets in dat
geen beslissing of balans achter zich heeft, dan is het óf een gat in het
grootboek óf vulsel. Houd de grondwet kort genoeg om altijd in context te
mogen leven.

*Bron: ARC, .claude/CLAUDE.md (fragmenten), 10 juni 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
