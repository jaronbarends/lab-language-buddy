---
titel: "MCP Server Janton — Discovery Journaal"
type: spec-journaal
datum: 15 april 2026
status: discovery
auteurs: Janton van Apeldoorn, Claude
doel-records:
  - PDR-011 (productbeslissing)
  - ADR-025 (architectuurbeslissing)
---

# MCP Server Janton — Discovery Journaal

> **Illustratieve referentie — onderdeel van de grootboek-skill.**
> Dit is een echt, ongewijzigd ARC-document, bijgesloten zodat je voelt hoe een
> volwaardig journaal groeit — van kernvraag via organisch ontstane kwesties naar
> een besluitenlog. Verwijzingen naar andere grootboek-documenten en ARC-code
> dienen als illustratie van *hoe* een journaal zijn ontdekkingen vasthoudt —
> buiten het ARC-project zijn die paden niet op te zoeken. Het gaat om de vorm.

## Doel

Dit journaal documenteert het ontdekkingsproces voor de ARC MCP Server
"Janton" — de coach-persona die klanten in Claude Code verbindt met hun
ARC-data, scans, coaching en groeipad. We werken acht kwesties door tot
alle beslissingen helder zijn en vastgelegd in PDR-011 en ADR-025.

## Context

ARC is een Compounding Manager (PDR-004) met drie niveaus:
- **Account** — referentie-grootboek, rekeningschema, adviesposten
- **Organisatie** — security, teamstandaarden, trends
- **Repo** — scanner (de accountant) meet per project

Janton is de **Architect-rol** (zie PDR-004): cross-repo patronen herkennen,
transplantatie suggereren, voorkeuren codificeren. De Scanner is de
Accountant. Janton inspireert, de Scanner oordeelt.

### Bestaande ervaring

Janton heeft eerder `mcp-chessity-data-context` gebouwd — een MCP server
voor MySQL/Convex met 27 tools, metadata-verrijking via Domain Objects en
Recipes, en een dubbele transport (stdio + HTTP). Kernlessen:

| Wat werkte | Wat beter kan |
|------------|---------------|
| Metadata-first (Domain Objects, business context) | 27 tools is te veel — LLM tool selection lijdt |
| Tool descriptions als workflow-instructies | Geen MCP Resources gebruikt (alles als Tools) |
| Server instructions als persona-injectie | Docker-distributie is zwaar voor klanten |
| Convex als intelligence-laag (100-200x sneller) | Credentials in config-bestanden |
| Status-lifecycle (draft/test/published) | `as any` casts verliezen type-safety |

---

## Kwesties

### Kwestie 1 — Productvisie (PDR-011)

**Vraag:** Wat IS MCP Janton en voor wie? Hoe verhoudt het zich tot het
dashboard?

#### Janton's input (15 april 2026)

MCP Janton is **een lerend traject in de terminal**. De klant (premium
gebruiker) werkt in Claude Code aan zijn project. Janton is de extra
informatiebron die ARC-kennis, architectuurprincipes en coaching
beschikbaar maakt — direct in de context waar de developer bouwt.

**Het kernscenario:**

```
Klant in Claude Code:
"Ik lees in mijn dashboard dat ik beveiligingsproblemen heb.
 Kun je mijn scan lezen en een plan maken?"

     │
     ▼

Claude Code vraagt Janton MCP:
→ mijn_scores(repo)
→ mijn_coaching(dimensie: "Productie")
→ mijn_groeipad(repo, dimensie: "Productie")

     │
     ▼

Claude Code maakt plan + implementeert
(branch protection inrichten, secrets roteren, etc.)

     │
     ▼

Klant draait nieuwe scan → scores verbeteren → volgende kwestie
```

**De loop:** Vraag → coaching ophalen → implementeren → scan → herhaal.
Spelenderwijs, al bouwend leren. Het is bijna een Academy, maar dan
als gameloop in de terminal.

**Klantbelofte aan de CEO:** Als al je medewerkers dit product gebruiken,
kunnen ze veilig doorontwikkelen en releasen. Dat maakt het goud.

**Vergelijking:** Het werkt als Context7, maar op een ander
abstractieniveau. Context7 = library docs. Janton = ARC-doelen,
dimensies, architectuurprincipes, leidende principes. Claude Code
haalt die kennis op en helpt vervolgens implementeren.

**Interactiemodel:**
- Claude Code blijft de lead in de terminal
- Janton is puur adviseerend — een extra agent/informatiebron
- De klant vraagt erom (niet proactief pushen)
- Maar: CLAUDE.md kan aansporen ("als je vastloopt, vraag Janton")
- Later: na een scan automatisch tips ophalen

**De persona:**
- Vernoemd naar Janton van Apeldoorn — het IS Janton als persona
- Begint recht-toe-recht-aan, later verfijnen met humor en karakter
- Later mogelijk instelbaar (tone, stijl)
- Persoonlijk, niet corporate

**Niet alleen technisch, ook educatief:**
- Legt uit WAAROM (leidende principes, niet alleen how-to)
- Leidende principes opslaan in Convex zodat Janton intelligent coacht
- Later: Academy-materiaal, video's, coaching-content via MCP ophaalbaar

**Onboarding:**
- Onboarding e-mails die uitleggen hoe je samenwerkt met MCP Janton
- CLAUDE.md-snippets die de klant toevoegt aan zijn project

#### Onderzoeksbevindingen (aanvullend)

Janton is de Architect-rol uit PDR-004 (Compounding Manager). Vier
toekomstige kernwaarden (voorbij MVP):

1. **Patroonherkenning** — cross-repo patronen detecteren
2. **Transplantatie** — successen van ene repo naar andere suggereren
3. **Voorkeurcodificatie** — herhaalde keuzes als adviespost vastleggen
4. **Risicocorrelatie** — risico's die per repo onzichtbaar zijn maar
   als patroon wél

**Afbakening Dashboard vs. MCP Janton:**

| Aspect | Dashboard | MCP Janton |
|--------|-----------|------------|
| Medium | Browser | Claude Code terminal |
| Interactie | Kijken, klikken | Vragen, converseren, implementeren |
| Perspectief | Per repo (L1/L2/L3) | Per repo + cross-repo (toekomstig) |
| Rol | Spiegel (meten + weten) | Coach + versneller (groeien + doen) |
| Data | Real-time Convex subscriptions | On-demand Convex queries |
| Doelgroep | Alle ARC-klanten | Premium gebruikers |
| Kernwaarde | Inzicht | Actie |

**Status:** [x] Besproken — klaar voor PDR-011

#### Aanvullende besluiten (15 april, ronde 2)

**Persona-prompt:** Komt als systeem-prompt in Convex (tabel `personaConfig`).
Doorontwikkelbaar zonder code-deploy. Invulling: architectuurniveau nu,
verfijning later. Onderdeel van ADR-025.

**Tips-systeem:** Janton heeft een eigen tiplijst naast de catalogus-tips
uit het dashboard. Tips worden context-aware aangeboden: gevraagd én
ongevraagd vanuit het dialoog. Bronnen:
- Catalogus-rekeningen (adviesposten uit het grootboek/dashboard)
- Janton-eigen tips (coaching, best practices, CLAUDE.md-snippets)
- Structuurtips (hoe je project in te richten)

**Academy-koppeling:** Als concept meenemen in de architectuur, maar niet
in de eerste release. Later: video's, coaching-materiaal, leerpaden
ophaalbaar via MCP.

#### Gesloten punten kwestie 1

- [x] Persona-tone → systeem-prompt in Convex, doorontwikkelbaar
- [x] Tips/snippets → onderdeel van tips-systeem (Janton geeft tips)
- [x] Academy-relatie → concept, niet in MVP, architectuur houdt rekening

---

### Kwestie 2 — Functioneel ontwerp (tools & resources)

**Vraag:** Welke tools en resources biedt de MCP server?

**Onderzoeksbevindingen:**

Les uit MySQL MCP: 27 tools is te veel. Janton moet compact zijn. Voorstel
voor een **gefocust tool-oppervlak** (~6-8 tools):

```
LEZEN (queries naar Convex)
├── mijn_scores          — Laatste scan per repo, dimensie-scores, trend
├── mijn_coaching        — Coaching per dimensie (badge + zin + actie)
├── mijn_groeipad        — 43 doelen met status, prioriteit, stappen
├── mijn_catalogus       — Rekeningschema gefilterd op rol/template
└── mijn_uitzonderingen  — Bewuste afwijkingen per repo

SCHRIJVEN (mutations naar Convex)
├── stel_vraag           — Logt de vraag + context in Convex
└── geef_feedback        — Klant reageert op coaching (nuttig/niet nuttig)

META
└── wie_ben_ik           — Klantprofiel, org, repos, rol, doeldimensies
```

**Metadata-strategie (uit MySQL MCP):**

De kracht zit in de tool descriptions — niet als API-docs maar als
**workflow-instructies** voor de LLM. Server instructions definiëren
de persona en de beslisboom.

**MCP Resources (nieuw vs. MySQL MCP):**

MySQL MCP gebruikte geen Resources. Janton kan Resources wél inzetten
voor semi-statische content:

- `arc://groeimodel` — de 43 doelen als referentie
- `arc://rekeningschema` — het volledige rekeningschema
- `arc://profiel/{org}` — klantprofiel

#### Aanscherping vanuit MCP Builder Skill (15 april, ronde 3)

De Anthropic MCP Builder Skill (`npx skills add`) levert concrete
verbeteringen voor het tool-ontwerp:

**Structured data (outputSchema + structuredContent):**

Elke tool retourneert twee lagen:
- `content` → tekst voor de gebruiker (coaching-zin, advies)
- `structuredContent` → gestructureerde data voor Claude Code (scores
  als getallen, dimensies als enum, doelen als array)

Dit maakt het mogelijk dat Claude Code met de data redeneert (bijv.
"welke dimensie heeft de laagste score?") zonder de tekst te parsen.

```typescript
return {
  content: [{ type: "text", text: "Je Productie-score is 45%. ..." }],
  structuredContent: {
    dimensie: "Productie",
    score: 45,
    coaching: "Begin met branch protection",
    doelen: [{ code: "P2", naam: "Branch protection", score: 0 }]
  }
};
```

**Tool annotations (alle tools zijn read-only):**

```typescript
annotations: {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true  // Convex is extern systeem
}
```

**Resources vs. Tools — verduidelijking:**

| | Resources | Tools |
|---|-----------|-------|
| **Wat** | Statische/semi-statische data via URI | Operaties met parameters en logica |
| **Hoe** | `arc://groeimodel` → Claude Code leest als context | `mijn_scores(repo)` → Claude Code roept aan |
| **Wanneer** | Data die altijd beschikbaar moet zijn | Data op verzoek, met filters |
| **Voorbeeld** | Groeimodel (43 doelen), rekeningschema (107 items) | Scores per repo, coaching per dimensie |
| **Token-impact** | Wordt vooraf geladen in context | Alleen bij aanroep |

Resources zijn dus als een **boekenkast** die Claude Code kan raadplegen.
Tools zijn als een **telefoon** waarmee Claude Code Convex belt.

**Token-efficiëntie spelregels:**

1. Resources compact houden (alleen wat Claude Code nodig heeft)
2. Tools retourneren gefilterd (niet alle 43 doelen als er maar 1 gevraagd wordt)
3. CHARACTER_LIMIT = 25.000 tekens per response
4. Paginatie bij grote resultsets
5. Markdown voor menselijke output, JSON voor structured data

#### Aanscherping vanuit MCP Builder Skill (25 april, ronde 4)

De Anthropic MCP Builder Skill (`mcp-builder`, geïnstalleerd via
`npx ai-builder add skill anthropic/mcp-builder`) levert verdere
aanscherpingen op het tool-ontwerp:

**Tool descriptions als complete workflow-instructies:**

Elke tool description moet vijf secties bevatten — niet alleen een
korte omschrijving maar een volledige briefing voor de LLM:

```
Description:   Wat het doet (en expliciet wat NIET)
Args:          Elk parameter met type, constraints en uitleg
Returns:       Volledige schema van de output (met voorbeelden)
Examples:      "Use when..." en "Don't use when..." scenario's
Error Handling: Welke fouten kunnen optreden, wat dan te doen
```

Dit is de kern van de handshake — de tool descriptions ZIJN de
persoonlijkheid, samen met de server instructions.

**`response_format` parameter per tool:**

Elke tool krijgt een `response_format` parameter:
- `markdown` (default) — voor de mens, leesbare coaching-tekst
- `json` — voor Claude Code's redenering, gestructureerde data

Dit is een aanvulling op `structuredContent` (dat altijd meekomt).
Het verschil: `response_format` bepaalt de `content` tekst-laag,
`structuredContent` is altijd gestructureerd.

**Tool naamgeving bevestigd:**

`janton_{actie}_{resource}` (snake_case met prefix). Voorkomt
conflicten met andere MCP servers die de klant mogelijk draait.
De eerder voorgestelde namen (`mijn_scores`, `mijn_coaching`)
worden: `janton_get_scores`, `janton_get_coaching`, etc.

**Evaluatiefase als kwaliteitsborging:**

De skill introduceert een vierde ontwikkelfase: 10 evaluatievragen
schrijven die testen of de LLM effectief met Janton kan werken.
Bijvoorbeeld: "De klant heeft een Productie-score van 45% en vraagt
om de snelste verbetering. Welke tools roep je aan en in welke
volgorde?" Dit is een kwaliteitslaag boven unit tests.

**Status:** [x] Besproken — klaar voor implementatie

---

### Kwestie 3 — Architectuur (ADR-025)

**Vraag:** Welk framework, transport, communicatielaag?

**Onderzoeksbevindingen:**

| Beslissing | Keuze | Rationale |
|------------|-------|-----------|
| **Taal** | TypeScript | ARC is volledig TS; type-safety door hele keten |
| **MCP SDK** | `@modelcontextprotocol/sdk` v1.29.0 | Officiële SDK, Zod v3.25+ of v4 |
| **Transport** | stdio | Claude Code native; inherent veilig (geen auth nodig) |
| **Convex client** | `convex/browser` (ConvexHttpClient) | Lightweight, query-only, geen WebSocket nodig |
| **Distributie** | npm package (`npx @arc/mcp`) | Geen Docker; CLI install |
| **Logging** | `console.error()` alleen | stdout = MCP protocol (NOOIT console.log) |

**Best practices uit MCP SDK (Context7):**

- Server metadata: `name`, `version`, `instructions` (persona-prompt)
- Tool schemas via Zod (v3.25+ of v4) met `.describe()` per veld
- Return format altijd `{ content: [{ type: "text", text: "..." }] }`
- Capabilities expliciet declareren
- Error handling via `isError: true` in tool results

**Convex MCP server (onderzocht):**

Er bestaat een **officiële Convex MCP server** ingebouwd in het `convex`
npm package (sinds v1.19.5, nu GA). Start: `npx convex mcp start`.
Biedt 11 generieke tools (tables, data, run, functionSpec, logs, etc.).

**Drie opties voor Janton:**

| Optie | Beschrijving | Pro | Contra |
|-------|-------------|-----|--------|
| A. Officiële Convex MCP + custom wrapper | Janton als aparte MCP die Convex MCP aanroept | Hergebruik | Twee MCP servers, complexer |
| B. Eigen MCP met ConvexHttpClient | Janton als standalone, leest Convex direct | Eenvoudig, één server | Moet zelf queries schrijven |
| C. `@vllnt/convex-mcp` community wrapper | Convex functies als MCP tools | Zero boilerplate | Jong, onbewezen |

**Aanbeveling:** Optie B — eigen MCP met ConvexHttpClient. De officiële
Convex MCP is een generiek dev-tool. Janton is een domein-specifieke coach.
De kracht zit in de persona, de metadata, de coaching-logica — niet in
generieke CRUD.

Twee community packages bestaan (`@vllnt/convex-mcp`, `@vibeflowai/convex-mcp`)
maar zijn jong en niet nodig als we ConvexHttpClient direct gebruiken.

**MCP TypeScript SDK:** v1.29.0, `@modelcontextprotocol/sdk`. Zod v3.25+ of v4.
Er is een v2 alpha (`@modelcontextprotocol/server` 2.0.0-alpha.2) maar die
is pre-alpha — wij bouwen op v1 (stabiel).

#### Aanscherping vanuit MCP Builder Skill (25 april)

**Projectstructuur bevestigd en verfijnd:**

De MCP Builder Skill bevestigt de structuur uit K11 en voegt
details toe:

```
janton-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # McpServer init + transport-keuze
│   ├── types.ts          # Interfaces (scores, coaching, groeipad)
│   ├── constants.ts      # URLs, CHARACTER_LIMIT, freshness-drempels
│   ├── tools/            # Per domein
│   │   ├── scores.ts     # janton_get_scores, janton_get_trend
│   │   ├── coaching.ts   # janton_get_coaching, janton_get_groeipad
│   │   ├── catalogus.ts  # janton_get_catalogus, janton_get_uitzonderingen
│   │   ├── memory.ts     # janton_get_context (klant-geheugen)
│   │   └── feedback.ts   # janton_log_vraag, janton_give_feedback
│   ├── resources/        # Semi-statische kennisbank
│   │   ├── groeimodel.ts # arc://groeimodel (43 doelen)
│   │   ├── schema.ts     # arc://rekeningschema
│   │   └── templates.ts  # arc://template/{type}
│   ├── services/
│   │   ├── convex.ts     # ConvexHttpClient wrapper
│   │   └── freshness.ts  # Memory-freshness (synthesesysteem-patroon)
│   ├── schemas/          # Zod input + output schemas
│   ├── persona/          # Server instructions, toonregels
│   └── evaluation/       # 10 evaluatievragen (kwaliteitsborging)
└── dist/
```

**Transport-keuze verduidelijkt:**

| Scenario | Transport | Rationale |
|----------|-----------|-----------|
| **MVP** | stdio | Simpelst. Claude Code start Janton als subprocess |
| **Met dashboard** | Streamable HTTP | Daemon op localhost:4200. Claude Code + browser verbinden via HTTP |

Claude Code ondersteunt beide:
- stdio: `"command": "npx", "args": ["@arc/mcp-janton"]`
- HTTP: `"url": "http://localhost:4200/mcp"`

**SSE is deprecated** in het MCP protocol. K9 noemde SSE voor de
browser-verbinding — dit wordt Streamable HTTP met stateless JSON.

**Security voor localhost (dual-transport):**

- Bind op `127.0.0.1` (niet `0.0.0.0`) — geen netwerk-toegang
- Valideer `Origin` header (DNS rebinding protection)
- CORS beperkt tot `arc.janton.ai` origin

**TypeScript als taal bevestigd:**

De MCP Builder Skill beveelt TypeScript aan boven Python:
"high-quality SDK support, good compatibility, AI models are good
at generating TypeScript code." Past bij ARC's volledige TS-stack.

**`registerTool()` bevestigd:**

Niet het verouderde `server.tool()`. `registerTool` biedt betere
type-safety, automatische schema-handling, en is de aanbevolen API.

**Status:** [ ] Open — architectuurbeslissingen nog vast te leggen in ADR-025

---

### Kwestie 4 — Data-architectuur

**Vraag:** Welke Convex-tabellen raakt Janton? Wat is nieuw?

**Onderzoeksbevindingen:**

**Bestaande tabellen (lezen):**

| Tabel | Wat Janton nodig heeft |
|-------|----------------------|
| `scans` | Status, scores, timing, kosten |
| `metingen` | 43 doelresultaten per scan |
| `coaching` | 5 dimensie-coaching per scan |
| `maatstaven` | 43 blauwdrukken (referentiedata) |
| `rekeningen` | ~107 rekeningschema-items |
| `rekeningMaatstaven` | Mappings rekening ↔ doel |
| `repokoppelingen` | Welke repos bewaakt ARC |
| `organisaties` | Multi-tenant org-data |
| `uitzonderingen` | Bewuste afwijkingen |
| `l3Perspectieven` | L3 deep-scan dimensie-oordelen |
| `l3Bevindingen` | L3 individuele bevindingen |

**Nieuwe tabellen (MCP-specifiek):**

| Tabel | Doel |
|-------|------|
| `mcpInteracties` | Elke vraag gelogd: timestamp, org, repo, vraag, tools gebruikt, response-samenvatting |
| `klantProfielen` | Persona-data: voorkeuren, tone, frequentie, leerstijl |
| `mcpFeedback` | Feedback op coaching: nuttig/niet nuttig, waarom |
| `personaConfig` | Janton persona-definitie: prompt, toon, regels (beheerbaar, niet hardcoded) |

**Metadata-verrijking (les uit MySQL MCP):**

Elke tabel die Janton leest, krijgt een **business context laag**:
- Wat de tabel representeert (voor de LLM)
- Hoe de data geïnterpreteerd moet worden
- Welke queries zinvol zijn
- Dit wordt onderdeel van de tool descriptions

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 5 — Persona & Prompt-strategie

**Vraag:** Hoe wordt Janton intelligent? Hoe past de toon zich aan?

**Onderzoeksbevindingen:**

**Persona-bron:** Janton is de Architect uit PDR-004. Niet de Accountant
(scanner). Kerngedrag:

- **Scoort NOOIT** — de scanner scoort, Janton inspireert
- **Vindt patronen** — cross-repo, cross-dimensie
- **Suggereert** — "hier doe je het goed, wil je transplanteren?"
- **Viert** — inconsistenties zachtjes, successen luid

**Toonaanpassing (uit PDR-005):**

| Dimensie | Toon |
|----------|------|
| Fundament | Stevig, eerlijk |
| Bouw | Actief, energiek |
| Productie | Professioneel, serieus |
| Schaal | Ambitieus, groei |
| Autonoom | Visionair, lonkend |

| Scoreband | Aanpak |
|-----------|--------|
| 0-25% | Warm, bemoedigend |
| 25-50% | Bevestigend, richtinggevend |
| 50-75% | Professioneel, coachend |
| 75-100% | Strategisch, inspirerend |

**Prompt-architectuur:**

```
Server Instructions (bij initialize)
├── Persona-definitie (wie is Janton)
├── Toonregels (dimensie × scoreband matrix)
├── Beslisboom (welk tool wanneer)
└── Gedragsregels (nooit scoren, altijd coachen)

Tool Descriptions (per tool)
├── Wat het tool doet
├── Wanneer te gebruiken
├── Workflow-stappen (voor de LLM)
└── Interpretatie-hints (hoe data te lezen)
```

**Beheer:** Persona-config in Convex (tabel `personaConfig`), niet
hardcoded. Zo kan de persona evolueren zonder code-deploy.

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 6 — Distributie & Installatie

**Vraag:** Hoe komt Janton bij de klant?

**Onderzoeksbevindingen:**

**Les uit MySQL MCP:** Docker werkt maar is zwaar. Klanten willen
`npx install` of een simpele CLI.

**Voorstel:**

```bash
# Installatie
npm install -g @arc/mcp-janton

# Of zonder install
npx @arc/mcp-janton

# Claude Code configuratie (.claude/settings.json)
{
  "mcpServers": {
    "janton": {
      "command": "npx",
      "args": ["@arc/mcp-janton"],
      "env": {
        "CONVEX_URL": "https://spotted-emu-126.eu-west-1.convex.site",
        "ARC_API_KEY": "<klant-api-key>"
      }
    }
  }
}
```

**Authenticatie:**
- API key per organisatie (opgeslagen in Convex, verstrekt bij onboarding)
- Convex HTTP client met Bearer token
- Geen OAuth nodig (stdio = lokaal, inherent veilig)

**Updates:**
- npm versioning (semver)
- `npx` haalt altijd latest op (of pinned version)

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 7 — Feedback-loop & Monitoring

**Vraag:** Hoe leert het systeem van klantinteracties?

**Onderzoeksbevindingen:**

**De loop (drie lagen):**

```
1. VRAAG                    2. ANTWOORD                 3. ACTIE
Klant stelt vraag      →   Janton coacht          →   Klant implementeert
in Claude Code              met context                 in codebase

        ↑                                                     │
        │                                                     ▼
        │                                              4. SCAN
        │                                              Scanner detecteert
        │                                              wijziging
        │                                                     │
        └─────────────── 5. CORRELATIE ◄──────────────────────┘
                         Vraag X leidde tot
                         verbetering Y (of niet)
```

**Wat we loggen in `mcpInteracties`:**
- Timestamp, org, repo-context
- Vraag (gehashte samenvatting, geen volledige prompt)
- Welke tools aangeroepen
- Coaching-dimensie/doel dat geraakt werd
- Response-type (score-opvraag, coaching, patroon, etc.)

**Correlatie met GitHub releases:**
- Na een scan: vergelijk coaching-suggesties met daadwerkelijke wijzigingen
- "Janton suggereerde branch protection → 2 dagen later ingeschakeld" = positief
- Bouwt evidence op voor welke coaching effectief is

**Klantpersona (tabel `klantProfielen`):**
- Leerstijl: veel vragen vs. weinig, diep vs. breed
- Voorkeursdimensies: waar vraagt de klant het meest over
- Frequentie: dagelijks, wekelijks, bij problemen
- Tone-voorkeur: zakelijk, informeel, technisch

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 8 — Ontwikkelstrategie & MVP

**Vraag:** Hoe bouwen we iteratief? Wat is MVP?

**Onderzoeksbevindingen:**

**MVP-scope (fase 1):**

| In MVP | Niet in MVP |
|--------|-------------|
| 4-5 lees-tools (scores, coaching, groeipad, catalogus) | Feedback-loop |
| Server instructions met persona | Klantpersona/memory |
| stdio transport | HTTP transport |
| npm package | Cross-repo patroonherkenning |
| Vraag-logging (basis) | Correlatie met GitHub releases |
| Convex HTTP client | Convex subscriptions |

**Fasering:**

| Fase | Inhoud | Doorlooptijd |
|------|--------|-------------|
| 1. MVP | Lees-tools + persona + logging | ~1 week |
| 2. Intelligence | Patroonherkenning, cross-repo | +1 week |
| 3. Memory | Klantpersona, feedback-loop | +1 week |
| 4. Polish | Distributie, onboarding, docs | +1 week |

**Ontwikkelworkflow:**
- Convex schema eerst (nieuwe tabellen)
- `npx convex dev --once` voor elke schema-wijziging
- MCP server ontwikkelen met TypeScript SDK
- Testen via Claude Code (eigen dogfooding)
- npm publish wanneer stabiel

**Status:** [ ] Nog te bespreken met Janton

---

## Nieuwe kwesties (ontstaan tijdens onderzoek)

### Kwestie 9 — Dual-Transport Architectuur (Dashboard ↔ Terminal)

**Vraag:** Hoe verbinden we het ARC dashboard (arc.janton.ai) met de lokale
Janton MCP server van de klant, zodat er echt twee-richtingsverkeer ontstaat?

#### Achtergrond (15 april 2026)

Tijdens onderzoek naar Claude Code Channels ontdekten we een cruciaal
architectuurinzicht: **de browser draait op de machine van de klant.**
JavaScript dat `arc.janton.ai` serveert, draait lokaal in de browser.
`fetch("http://localhost:4200")` bereikt dus de lokale MCP server — geen
tunnel nodig.

Dit is hetzelfde patroon als Vite (dev server), VS Code Server, en Figma's
local font helper. Browsers behandelen `localhost` als "potentially
trustworthy origin" (W3C Secure Contexts spec), dus HTTPS → HTTP localhost
werkt zonder mixed-content fouten in Chrome en Firefox.

#### Claude Code Channels — Onderzocht en afgebakend

Claude Code Channels (research preview, maart 2026) zijn MCP servers die
events pushen naar een draaiende Claude Code sessie. Kernbeperking: de
channel is een **subprocess van Claude Code via stdio** — het kan niet
onafhankelijk draaien op een remote server.

**Conclusie:** Channels zijn een developer-tool voor lokale sessies, niet
geschikt als primair SaaS-integratiemechanisme. Maar het concept — events
pushen naar Claude Code — is wel waardevol. We lossen het op met een eigen
dual-transport server.

#### Het architectuurconcept: Dual-Transport MCP Server

Eén Node.js proces, twee interfaces:

```
                  Janton MCP Server
                  (één proces op klant's machine)
                       │
          ┌────────────┴────────────┐
          │                         │
   Streamable HTTP            Streamable HTTP + SSE
   (MCP protocol)             (MCP protocol + push)
   /mcp endpoint              /mcp + /health
          │                         │
          ▼                         ▼
     Claude Code               Browser
     (terminal)                (arc.janton.ai)
```

**Cruciale ontwerpkeuze: standalone daemon, niet stdio subprocess.**
Met stdio spawnt Claude Code de MCP server. Als Claude Code stopt,
sterft de MCP server mee — en de browser-verbinding valt weg. Daarom
draait de MCP server als standalone daemon. Claude Code verbindt via
Streamable HTTP (`http://localhost:4200/mcp`), niet via stdio.

**Interface 1 — Streamable HTTP → Claude Code:**
Claude Code configuratie: `"url": "http://localhost:4200/mcp"`.
Tools als `mijn_scores`, `mijn_coaching`, `mijn_groeipad`. Claude Code
kan stoppen en opnieuw verbinden zonder dat het dashboard zijn
verbinding verliest.

**Interface 2 — Streamable HTTP + SSE → Browser:**
Dezelfde HTTP server bedient ook de browser. SSE (Server-Sent Events)
biedt server→client push met automatische reconnectie via
`Last-Event-ID`. Geen WebSocket nodig — SSE is MCP-native.

**MCP SDK ondersteunt dit natively.** De TypeScript SDK biedt:
- `StreamableHTTPServerTransport` voor HTTP/SSE
- `StreamableHTTPClientTransport` werkt in de browser met `window.fetch`
- Eén `McpServer` instance bedient meerdere sessies

**Chrome LNA (Local Network Access):** Vanaf Chrome 141/142 vraagt de
browser eenmalig toestemming voor localhost-verbinding vanuit een
publieke origin. Vergelijkbaar met Figma's local font helper.

#### Twee-richtingsverkeer: De use cases

**Dashboard → Terminal (push):**

```
Klant in dashboard:
  "Mijn branch protection ontbreekt. Fix dit."
       │
       ▼ WebSocket naar localhost:4200
Janton MCP Server ontvangt prompt
       │
       ▼ stdio naar Claude Code
Claude Code voert uit:
  - Leest repo via GitHub API
  - Schakelt branch protection in
  - Rapporteert terug via MCP
       │
       ▼ WebSocket naar browser
Dashboard toont: "Branch protection ingeschakeld ✓"
```

**Terminal → Dashboard (push-back):**

```
Klant pusht naar GitHub main
       │
       ▼ Webhook → Convex → Scanner (Railway)
Scanner draait 9 minuten...
       │
       ▼ Scan voltooid → Convex mutation
Convex notificeert Janton MCP Server
(via ConvexHttpClient polling of subscription)
       │
       ▼ WebSocket naar browser
Dashboard toont ping: "Scan klaar! Score: 72 → 81"
       │
       ▼ Optioneel: stdio naar Claude Code
Terminal meldt: "Nieuwe scanresultaten: 3 verbeteringen"
```

**CoachPanel als proactieve chatbot:**

```
Klant praat met CoachPanel in dashboard:
  "Hoe verbeter ik mijn Productie-score?"
       │
       ▼ POST naar /api/coach (Convex, server-side)
AI Coach antwoordt met advies + uitvoerbaar plan
       │
       ▼ Coach vraagt: "Wil je dat ik dit doorgeef
         aan je terminal?"
       │
       ▼ Klant: "Ja"
       │
       ▼ WebSocket naar localhost:4200
Janton MCP Server → stdio → Claude Code
Claude Code voert plan uit in de codebase
       │
       ▼ Status updates stromen terug
Dashboard toont live voortgang
```

#### Graceful degradation

Het dashboard detecteert of de lokale MCP server draait:

```typescript
// Dashboard: health check bij laden
const [mcpConnected, setMcpConnected] = useState(false);

useEffect(() => {
  fetch("http://localhost:4200/health")
    .then(r => r.ok && setMcpConnected(true))
    .catch(() => setMcpConnected(false));
}, []);
```

| MCP status | UI-gedrag |
|------------|-----------|
| **Verbonden** | "Push naar Claude Code" knop, proactieve notificaties, live status |
| **Niet verbonden** | "Kopieer prompt" knop (huidige flow), CoachPanel server-side |

De CoachPanel werkt altijd (server-side via Convex `/api/coach`). De
push-naar-terminal functionaliteit is een verrijking, geen vereiste.

#### Bestaande bouwstenen

| Component | Status | Rol in dual-transport |
|-----------|--------|----------------------|
| CoachPanel (`components/CoachPanel.tsx`) | Gebouwd, werkend | Chatbot UI, wordt verrijkt met push-knop |
| CopyButton (`components/shared/CopyButton.tsx`) | Gebouwd | Fallback als MCP niet draait |
| PromptBlock (`components/shared/PromptBlock.tsx`) | Gebouwd | Prompt-weergave, krijgt push-variant |
| `/api/coach` (Convex HTTP) | Gebouwd | Server-side AI, blijft werken zonder MCP |
| Janton MCP Server (K2-K8) | Ontwerp | Krijgt HTTP/WS interface erbij |

#### Bevindingen uit MCP SDK (Context7)

De MCP TypeScript SDK v1.29+ biedt:
- **Meerdere transports per server:** `StdioServerTransport` én
  `StreamableHTTPServerTransport` op dezelfde `McpServer` instance
- **Server notifications:** `notifications/progress` met progress token
  voor live voortgangs-updates
- **Server logging:** `notifications/message` voor log-berichten naar
  connected clients
- **Streamable HTTP:** SSE-gebaseerd, geschikt voor browser-consumptie

#### Bevindingen uit webonderzoek

- **agent-http** (github.com/mberg/agent-http): HTTP API bridge voor
  Claude Code. Biedt `POST /message`, `GET /events` (SSE), `GET /chat`
  (web UI). Bevestigt dat het patroon werkt, maar is gebonden aan Claude
  Code's channel-systeem.
- **fakechat** (Anthropic officieel): Localhost web UI op port 8787.
  WebSocket two-way. Bewijst dat browser ↔ lokale MCP server werkt.
- **Hookdeck CLI**: Documenteert het patroon van externe webhooks naar
  lokale channels. Bevestigt localhost als betrouwbaar endpoint.
- **W3C Secure Contexts:** `localhost` is expliciet uitgezonderd van
  mixed-content restricties. Chrome, Firefox, Safari ondersteunen dit.

#### Open vragen

- [ ] **Poort-keuze:** Welke poort? Vast (bijv. 4200) of configureerbaar?
  Conflict-detectie nodig?
- [ ] **Authenticatie:** Bearer token per sessie? CORS op `arc.janton.ai`
  origin. Bind op 127.0.0.1 (niet 0.0.0.0) voorkomt netwerk-toegang.
- [ ] **Convex-notificatie naar MCP:** Hoe weet de lokale MCP server dat
  een scan klaar is? Polling van Convex? ConvexHttpClient subscription?
  Of een lightweight webhook?
- [ ] **Meerdere tabs:** SSE broadcast naar alle verbonden sessies.
  MCP SDK handelt sessie-management af.
- [x] **Reconnect-strategie:** SSE biedt ingebouwde reconnectie via
  `Last-Event-ID`. Geen custom logica nodig.
- [x] **Claude Code sessie-lifecycle:** Opgelost door standalone daemon
  keuze. MCP server draait onafhankelijk, Claude Code verbindt via
  Streamable HTTP. Stoppen/herstarten van Claude Code raakt het
  dashboard niet.
- [ ] **Chrome LNA prompt:** Eenmalige toestemming nodig in Chrome 141+.
  UX-uitleg en graceful fallback ontwerpen.

#### Relatie tot andere kwesties

- **K2 (Tools & Resources):** Tools blijven hetzelfde, transport wordt
  uitgebreid
- **K3 (Architectuur):** ADR-025 documenteert de dual-transport beslissing
- **K6 (Distributie):** `npx @arc/mcp-janton` start beide interfaces
- **K7 (Feedback-loop):** SSE maakt real-time feedback vanuit het
  dashboard mogelijk

**Status:** [x] Besproken — klaar voor ADR-025

---

### Kwestie 10 — ARC Skills Repository & Skill-distributie

**Vraag:** Hoe distribueren we ARC-skills naar klanten, en hoe integreert
de MCP server met het skills-ecosysteem?

#### Janton's input (15 april 2026)

ARC heeft al meerdere eigen skills (arc-design, changelog, grootboek, ops,
convex-data). Die kunnen we in een **publieke GitHub repo** zetten, zodat
klanten ze via `npx skills add` kunnen installeren — net als Anthropic's
eigen skills en de Convex skills.

**Het tweewegverkeer:**

```
Janton MCP coacht: "Je Bouw-score is laag. Je hebt nog geen
Design System. Wil je de ARC Design System skill installeren?"

     │
     ▼

Klant: "Ja graag"

     │
     ▼

npx skills add https://github.com/aichark/arc-skills --skill design-system

     │
     ▼

Skill geïnstalleerd → Claude Code heeft nu instructies voor het
opzetten van een Design System met shadcn/ui, Tailwind, tokens

     │
     ▼

Claude Code bouwt het Design System → scan → score verbetert
```

**Skill ≠ MCP Server (verduidelijking):**

| | Skill | MCP Server |
|--|-------|------------|
| Wat | SKILL.md + reference docs (prompt-injectie) | Draaiend proces met tools/resources |
| Installeert via | `npx skills add` (GitHub repo) | `npx @arc/mcp-janton` (npm package) |
| Draait | In Claude Code's context (geen apart proces) | Als apart Node.js proces (stdio/HTTP) |
| Biedt | Kennis, workflow-instructies, best practices | Data-access, coaching, logging |

**Drie lagen van ARC-integratie bij de klant:**

```
Laag 1: CLAUDE.md snippet     "Ken je Janton? Gebruik hem als coach"
Laag 2: MCP Server Janton     Data, coaching, tips uit Convex
Laag 3: ARC Skills            Domein-specifieke instructies + best practices
```

**Skills die we al hebben / kunnen maken:**

| Skill | Bron | Klantwaarde |
|-------|------|-------------|
| `design-system` | arc-design | shadcn/ui setup, tokens, componenten |
| `changelog` | changelog | Release-management, versioning |
| `grootboek` | grootboek | Architectuurdocumentatie opzetten |
| `ops` | ops | Pipeline monitoring |
| `security-setup` | nieuw | DeepGuard, branch protection, secrets |
| `ci-cd-setup` | nieuw | GitHub Actions, deploy-strategie |

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 11 — Spelregeldocument & Ontwikkelconventies

**Vraag:** Welke spelregels hanteren we bij het doorontwikkelen van de
MCP server? Hoe borgen we dat Claude Code verstandige keuzes maakt?

#### Janton's input (15 april 2026)

Er moet een spelregeldocument komen — vergelijkbaar met een CLAUDE.md
maar dan specifiek voor de MCP server ontwikkeling. Dit document stuurt
Claude Code bij het bouwen en uitbreiden van de MCP server.

**Onderwerpen voor het spelregeldocument:**

1. **Structured data conventies**
   - Elke tool retourneert `content` (tekst) + `structuredContent` (data)
   - Scores altijd als getallen (0-100), niet als strings
   - Dimensies als enum, niet als vrije tekst
   - Doelen met code (bijv. "P2"), naam, en score

2. **Token-efficiëntie**
   - CHARACTER_LIMIT = 25.000 tekens per response
   - Paginatie bij >20 items
   - Resources compact (alleen wat Claude Code nodig heeft)
   - Tools retourneren gefilterd, niet alles

3. **Tool-ontwerp regels**
   - Alle tools `readOnlyHint: true` (Janton schrijft niet)
   - Uitzondering: `stel_vraag` en `geef_feedback` (logging)
   - Tool descriptions als workflow-instructies (les uit MySQL MCP)
   - Zod schemas met `.describe()` per veld

4. **Naamgeving**
   - Server: `janton-mcp-server`
   - Tools: `janton_{actie}_{resource}` (snake_case met prefix)
   - Resources: `arc://{type}` URI scheme

5. **MCP SDK conventies**
   - `registerTool()` (NIET deprecated `server.tool()`)
   - `console.error()` voor logging (NOOIT `console.log()`)
   - Zod (v3.25+ of v4) voor validatie
   - `outputSchema` definiëren waar mogelijk

6. **Projectstructuur**
   ```
   janton-mcp-server/
   ├── package.json
   ├── tsconfig.json
   ├── src/
   │   ├── index.ts          # McpServer init + transports
   │   ├── types.ts          # TypeScript interfaces
   │   ├── tools/            # Per domein (scores, coaching, catalogus)
   │   ├── resources/        # Resource handlers (groeimodel, schema)
   │   ├── services/         # ConvexHttpClient wrapper
   │   ├── schemas/          # Zod validatie-schemas
   │   ├── persona/          # Persona-prompt, toonregels
   │   └── constants.ts      # URLs, limieten, configuratie
   └── dist/                 # Gebouwde JavaScript (npm publish)
   ```

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 12 — Dashboard UI voor MCP-verbinding

**Vraag:** Welke interface-elementen krijgt het dashboard om de lokale
MCP-verbinding te benutten? Hoe wordt het proactief?

#### Janton's input (15 april 2026)

De dual-transport architectuur (K9, ADR-025) maakt een nieuwe klasse
dashboard-interacties mogelijk. De kern: elke plek die nu een "Kopieer"
knop toont, kan een "Push naar Claude Code" knop worden. En de MCP server
kan ongevraagd het dashboard aanspreken.

#### 1. Verbindingsindicator

Altijd zichtbare statusbadge in de dashboard-header:

```
● Janton verbonden        (emerald, MCP draait)
○ Janton offline          (muted, fallback naar kopieer)
```

Detectie via `fetch("http://localhost:4200/health")`. Klikbaar voor
connectie-instructies of reconnect. Dit is de basis waarop alle andere
ideeën bouwen.

#### 2. Split-button: Push / Kopieer

Overal waar nu `<CopyButton>` staat, een **split-button** met twee modi:

```
MCP verbonden:                    MCP offline:
┌──────────────────┬───┐          ┌──────────────────┐
│ ▶ Push naar CC   │ ▼ │          │ 📋 Kopieer       │
└──────────────────┴───┘          └──────────────────┘
  dropdown: "Kopieer prompt"
```

Raakt bestaande componenten:
- `BevindingKaart.tsx` (regel 66) — bevinding-prompts
- `VolgendeZetten.tsx` (regel 59) — volgende-zet prompts
- `DoelTelescoop.tsx` (regel 32) — stap-voor-stap prompts
- `CoachPanel.tsx` (regel 58) — code-blokken in chat

#### 3. Scan-ping met context

Na afronding van een scan, toast-notificatie in het dashboard:

```
┌──────────────────────────────────────┐
│ 🔔 Scan voltooid                     │
│ Score: 72 → 81 (+9)                  │
│ 2 bevindingen opgelost, 1 nieuw      │
│                                      │
│ [Bekijk details]  [Laat Janton uitleggen] │
└──────────────────────────────────────┘
```

De MCP server detecteert de scan-voltooiing via Convex polling en pusht
`scan_complete` naar het dashboard via SSE. "Laat Janton uitleggen" opent
de CoachPanel met de scan-delta als context.

Zonder MCP-verbinding: het dashboard toont dezelfde toast via Convex
real-time subscriptions (al gebouwd), maar zonder de "uitleggen" optie.

#### 4. CoachPanel wordt twee-weg

De bestaande CoachPanel (`components/CoachPanel.tsx`) praat nu server-side
met `/api/coach`. Met MCP-verbinding wordt het twee-weg:

```
Coach: "Branch protection ontbreekt. Zal ik het instellen?"
       [Ja, doe het]  [Laat me het plan zien]  [Nee]
              ↓
       "Bezig... ████░░░░ 60%"
              ↓
       "Klaar ✓ — branch protection ingeschakeld op main"
```

De coach stuurt het plan als `push_prompt` via de MCP-verbinding naar
Claude Code, en ontvangt `progress` en `prompt_result` updates terug.
Zonder MCP-verbinding blijft de CoachPanel werken als nu (server-side
AI + kopieer-prompt).

#### 5. Proactieve Janton-tips

De MCP server kan ongevraagd tips pushen naar het dashboard:

```
┌─ Janton tip ───────────────────────────┐
│ Je Productie-score staat al 2 weken    │
│ op 45%. De snelste winst: secrets      │
│ roteren. Kost ~5 minuten.              │
│                                        │
│ [Doe het voor me]  [Later]  [Stop tips]│
└────────────────────────────────────────┘
```

Verschijnt als floating card (niet modal). Respecteert "Stop tips"
(voorkeur opgeslagen in `klantProfielen` tabel). Tip-logica in de MCP
server: vergelijkt scores met drempels, detecteert stagnatie, kiest
de hoogste-impact suggestie.

#### 6. Live terminal-status

Compact statusblokje onderaan het dashboard als Claude Code actief is:

```
┌─ Claude Code ──────────────────────────┐
│ ▶ Bezig: branch protection instellen   │
│   ████████░░ 80% — schrijft config...  │
└────────────────────────────────────────┘
```

Toont alleen tijdens actieve prompt-uitvoering. Gevoed door `progress`
events via SSE. Klikbaar om CoachPanel te openen voor details.

#### 7. Dimensie-kaart met directe actie

Op de scorecard per dimensie een actie-knop:

```
┌─ Productie ────────── 45% ─────────┐
│ ██████████░░░░░░░░░░               │
│                                     │
│ Grootste kans: branch protection    │
│ Impact: +12 punten                  │
│                                     │
│ [▶ Fix nu]                          │
└─────────────────────────────────────┘
```

"Fix nu" pusht de aanbevolen prompt naar Claude Code. Eén klik van
inzicht naar actie.

#### 8. Batch-modus voor volgende zetten

Op de VolgendeZetten-pagina meerdere acties selecteren en uitvoeren:

```
┌─────────────────────────────────┐
│ 3 aanbevolen volgende zetten    │
│                                 │
│ ☑ Branch protection instellen   │
│ ☑ CLAUDE.md aanvullen           │
│ ☐ ADR-structuur opzetten        │
│                                 │
│ [▶ Geselecteerde uitvoeren]     │
└─────────────────────────────────┘
```

Prompts worden sequentieel naar Claude Code gestuurd met voortgang
per item.

#### Prioritering

| Prio | Idee | Effort | Impact | Vereist |
|------|------|--------|--------|---------|
| 1 | Verbindingsindicator | S | Basis voor alles | `/health` endpoint |
| 2 | Split-button (push/kopieer) | S | Vervangt huidige flow | `/mcp` endpoint |
| 3 | Scan-ping toast | S | Directe waarde | SSE `scan_complete` |
| 4 | Dimensie-kaart actie | S | Snelle winst | `push_prompt` |
| 5 | CoachPanel twee-weg | M | Game-changer | `progress` + `prompt_result` |
| 6 | Proactieve tips | M | Differentiator | Tip-logica in MCP |
| 7 | Live terminal-status | M | Premium gevoel | `progress` events |
| 8 | Batch-modus | L | Power-user feature | Sequentiële push |

Prio 1-4 kunnen gebouwd worden zodra de MCP server `/health` en `/mcp`
endpoints heeft. De rest groeit daar organisch uit.

#### Bestaande componenten die geraakt worden

| Component | Huidige functie | Aanpassing |
|-----------|----------------|------------|
| `CopyButton.tsx` | Kopieer naar clipboard | Wordt basis voor split-button |
| `PromptBlock.tsx` | Prompt tonen + kopieer | Krijgt push-variant |
| `CoachPanel.tsx` | Server-side chatbot | Twee-weg met progress |
| `BevindingKaart.tsx` | Bevinding + kopieer-prompt | Split-button |
| `VolgendeZetten.tsx` | Volgende zetten + kopieer | Split-button + batch |
| `DoelTelescoop.tsx` | Doel-detail + stappen | Split-button |

**Status:** [ ] Nog te bespreken met Janton

---

### Kwestie 13 — Modi & Functiescheiding (Architect-rol)

**Vraag:** Hoe krijgt Janton meerdere modi, en hoe scheiden we de
operationele coach van de enterprise architect en de dashboard-companion?

#### Achtergrond (16 april 2026)

Tijdens een discovery-sessie over de Architect-rol (zie
`architect-rol-journaal.md`) werd duidelijk dat Janton niet één rol
heeft, maar **drie natuurlijke modi** met elk een ander data-access-
patroon, toolset, en persona:

```
MODUS 1: OPERATIONEEL        MODUS 2: ARCHITECT        MODUS 3: DASHBOARD
(per repo, Claude Code)       (cross-repo, strategie)   (browser, educatief)
                |                       |                       |
Scope: deze repo              Scope: org/account        Scope: scherm-context
Tools: mijn_scores, etc.      Tools: portfolio, gap     Tools: leg_uit, simuleer
Persona: coach                Persona: architect        Persona: gids
```

**Waarom functiescheiding cruciaal is:**

- Een operationele modus die over 8 repo's begint te praten is
  verwarrend voor een developer die aan één project werkt
- Een architect die micro-coaching geeft over één bestand mist het
  overstijgende perspectief
- Een dashboard-companion die terminal-tools aanroept heeft geen zin

De modus bepaalt: welke tools beschikbaar zijn, welk persona-prompt
geladen wordt, en welke data-scope de queries hebben.

**Aanbevolen implementatie:** Eén MCP server met modus-concept. De
`personaConfig` tabel (K4) krijgt een modus-dimensie. Geen drie
aparte servers — dat is overkill.

**Raakvlakken met andere kwesties:**

- **K2 (Tools & Resources):** Toolset per modus verschilt
- **K4 (Data-architectuur):** Cross-repo queries zijn nieuw
- **K5 (Persona & Prompt):** Prompt-template per modus
- **K9 (Dual-Transport):** Dashboard-modus loopt via HTTP, niet stdio

**Volledig uitgewerkt in:** `docs/grootboek/specs/architect-rol-journaal.md`
(kwesties A1-A6, met concreet uitgewerkte patronen, visualisaties, en
fasering).

**Status:** [ ] Open — wacht op uitwerking Architect-rol journaal

---

### Kwestie 14 — Catalogus als MCP Resource (één waarheid)

**Vraag:** Hoe benadert de Janton MCP-server het rekeningschema?

De catalogus leeft in Convex. Niet in markdown. `arc://rekeningschema`
(K2) wordt de MCP Resource die de catalogus ontsluit. Janton, de
scanner, het dashboard en de grootboek-skill (HDR-schrijfgids) lezen
allemaal dezelfde bron via MCP.

Ontdekt tijdens het schrijven van de HDR-schrijfgids: verwijzingen
naar lokale bestanden breken bij hergebruik in andere repo's.

**Status:** [ ] Open

---

### Kwestie 15 — Repo-locatie (map binnen arc/ of aparte repo)

**Vraag:** Leeft de Janton MCP server als map binnen de `arc/` mono-repo,
of als aparte repository?

#### Argumenten (25 april 2026)

| | Binnen `arc/` (map/workspace) | Aparte repo |
|---|---|---|
| **Voor** | Convex schema + types direct beschikbaar | Eigen release-cyclus, eigen npm publish |
| **Voor** | Eén CI/CD pipeline, alles bij elkaar | Schonere scheiding product vs platform |
| **Voor** | Eenvoudiger Convex dev workflow (deelt deployment) | Klant hoeft niet de hele arc-repo te klonen |
| **Tegen** | Vervuilt arc-repo met npm package concerns | Moet Convex-types importeren of dupliceren |
| **Tegen** | Release-cyclus gekoppeld aan dashboard/scanner | Aparte CI/CD nodig |
| **Tegen** | `npx @arc/mcp-janton` publiceert vanuit monorepo (complexer) | Twee repo's synchroon houden |

**Tussenweg:** Map binnen `arc/` met eigen `package.json` (workspace),
later uitlichten als het groeit. Begin samen, splits als het knelt.

**Relevante context:** ARC's Convex-schema, types en queries zijn de
primaire databron voor Janton. In dezelfde repo zitten betekent directe
import van `convex/_generated/api` en gedeelde types. Bij een aparte
repo moeten deze types geëxporteerd of gedupliceerd worden.

**Status:** [ ] Open — beslissing door Janton

---

### Kwestie 16 — Drielaags-ziel (Handshake × Resources × Memory)

**Vraag:** Hoe krijgt Janton een "ziel" — het gevoel dat de coach je
kent, onthoudt, en meegroeit?

#### Achtergrond (25 april 2026)

Tijdens de discovery-sessie van 25 april werden drie lagen
geïdentificeerd die samen Janton's karakter vormen. Geen enkele laag
is op zichzelf voldoende — de ziel ontstaat in de combinatie.

#### De drie lagen

```
  HANDSHAKE              RESOURCES            MEMORY
  "Ik ben Janton,        "Hier is het         "Jij vroeg 3 weken
   je coach"              groeimodel"          geleden over security,
                                               je score is sindsdien
                                               niet veranderd"
       │                      │                      │
       └──────────────────────┴──────────────────────┘
                              │
                         JANTON'S ZIEL
                    "Ik ken je, ik help je groeien,
                     ik onthoud waar je staat"
```

| Laag | Wat | Bron | Karakter |
|------|-----|------|----------|
| **Handshake** | Wie is Janton bij elk gesprek | `personaConfig` in Convex + server instructions | Identiteit (statisch per sessie) |
| **Resources** | Welke kennis kan Janton aanreiken | Templates, groeimodel, rekeningschema | Kennisbank (gedeeld, niet-persoonlijk) |
| **Memory** | Wat weet Janton over *deze* klant | `mcpInteracties` + freshness-analyse | Relatie (groeit per klant) |

#### Memory-laag: synthesesysteem-patroon

Het freshness-model uit het synthesesysteem (`/Users/jt2025/synthesesysteem`)
is transplanteerbaar naar Convex voor het klant-geheugen:

```
  actief (≥0.8) ──decay 5%/dag──► afnemend ──► slapend (<0.3)
       ▲                                           │
       │         reactivatie (+0.2)                 │
       └───────────────────────────────────────────┘
                    (klant vraagt weer)
```

**Synthesesysteem werkt:** lokaal, cross-project, op bestanden.
**Janton werkt:** per-klant, in Convex, op interacties.
**Gedeeld patroon:** ademend geheugen met freshness, decay, consolidatie.

Elke interactie wordt gelogd in `mcpInteracties` (K4). Freshness per
dimensie, per klant. Consolidatie van oude gesprekken naar
kernbevindingen. Reactivatie als een klant na weken terugkomt.

#### Resources als kennisbank (niet alleen data)

Resources zijn niet alleen scores en schema's. Ze omvatten ook
**bouwmateriaal** dat klanten helpen bij hun eigen project:

- `arc://template/software-architectuur` — template voor software-
  architectuurdocument
- `arc://template/product-architectuur` — template voor product-
  architectuurdocument
- `arc://groeimodel` — de 43 doelen als referentie
- `arc://rekeningschema` — het rekeningschema

Vergelijkbaar met Confluence-templates: downloadbare referentie-
documenten die helpen bij het opzetten van je eigen repo-structuur.

#### Raakvlakken

- **K2 (Tools):** Memory-tool (`janton_get_context`) leest klant-geheugen
- **K4 (Data):** `mcpInteracties` + freshness-velden in Convex
- **K5 (Persona):** Handshake-laag = persona × toonregels
- **K7 (Feedback):** Feedback voedt de memory-laag
- **K14 (Catalogus):** Resources-laag bevat de catalogus

#### Memory-loop: nachtelijke Convex cron (25 april 2026)

Het synthesesysteem's lint-loop (`scripts/lint-loop.sh`) is een
7-staps pijplijn: detect → prepare → synthesize → decay → validate →
status → log. Drie lagen: detectie (deterministisch), synthese
(probabilistisch/LLM), decay (deterministisch).

**Vertaling naar Convex:**

| Synthesesysteem (lokaal) | Janton in Convex |
|---|---|
| `lint-loop.sh` (bash cron) | `convex/crons.ts` → `dailyMemoryRun` (03:00 UTC) |
| `detect-changes.sh` (git log) | `internalQuery` op `mcpInteracties` sinds laatste sync |
| `prepare-prompt.ts` (state laden) | `internalQuery` op `klantGeheugen` |
| `claude -p` (headless LLM) | LLM-call voor consolidatie (zie K19) |
| `freshness.ts` (decay) | `internalMutation` op `klantGeheugen` |
| `_meta.yml` per bron | `klantGeheugen` document per klant × dimensie |
| Wiki markdown pages | `geheugenSamenvattingen` tabel |
| `wiki/log.md` | `mcpRunLog` tabel |

**Nachtelijke loop in 7 stappen:**

```
  03:00 CRON
     │
     ▼
  DETECT ──► DECAY ──► BOOST ──► CONSOLIDEER ──► STATUS ──► LOG
  (query)   (mut)     (mut)     (action/LLM)    (mut)      (mut)
  Welke     Alles     Actieve   Slapende combos  Herbereken Append
  klant×dim ×0.95     +0.1/+0.2 samenvatten      statussen  entry
  had                           tot kern-
  interactie?                   bevindingen
```

**Nieuwe Convex-tabellen:**

```typescript
klantGeheugen: defineTable({
  organisatieId: v.id("organisaties"),
  dimensie: v.string(),
  freshness: v.number(),          // 0.0 - 1.0
  status: v.union(v.literal("actief"), v.literal("afnemend"), v.literal("slapend")),
  laatsteInteractie: v.number(),
  laatsteSync: v.number(),
  interactieCount: v.number(),
  archiefCount: v.number(),
})

geheugenSamenvattingen: defineTable({
  organisatieId: v.id("organisaties"),
  dimensie: v.string(),
  type: v.union(v.literal("kernbevinding"), v.literal("voorkeur"), v.literal("patroon")),
  inhoud: v.string(),
  bronInteracties: v.array(v.id("mcpInteracties")),
  status: v.union(v.literal("actief"), v.literal("gearchiveerd")),
})

mcpRunLog: defineTable({
  runDatum: v.string(),
  startTime: v.number(),
  duurSeconden: v.number(),
  klantenVerwerkt: v.number(),
  decaysToegepast: v.number(),
  consolidatiesUitgevoerd: v.number(),
  reactivaties: v.number(),
  fouten: v.array(v.string()),
})
```

**Tenant-isolatie:** Alle queries filteren op `organisatieId`. Klant A
kan nooit data van Klant B zien. De API key bepaalt de organisatie.

**Twee aandachtspunten:**

1. **Multi-tenant schaal:** Bij 100 klanten × 5 dimensies = 500
   freshness-entries. Decay is goedkoop (één scan). Consolidatie is
   duur (LLM per slapende combo).
2. **Convex action timeout:** 10 minuten. Niet alles in één run
   consolideren — top-N per nacht, of chunked via `scheduler.runAfter`.

**Status:** [ ] Open — memory-loop ontworpen, implementatie-keuzes
nog te maken (K19 voor LLM-runtime)

---

### Kwestie 18 — JantonArc (intern, cross-klant patronen)

**Vraag:** Hoe aggregeren we geanonimiseerde patronen over alle klanten
heen voor productverbetering?

#### Achtergrond (25 april 2026)

Parallel aan het per-klant geheugen (K16) bestaat de mogelijkheid om
een interne MCP server te bouwen die cross-klant patronen detecteert.
Dit is het equivalent van de `wiki/cross/patronen.md` laag in het
synthesesysteem: inzichten die alleen zichtbaar worden als je meerdere
bronnen combineert.

**Voorbeelden van cross-klant inzichten:**

- "72% van klanten met Productie-score 25-50% stelt dezelfde vraag
  opnieuw na 2 weken → coaching-tekst is niet actionable genoeg"
- "Klanten die CLAUDE.md eerst aanpakken verbeteren sneller op alle
  dimensies → groeipad-volgorde heroverwegen"
- "38 van 50 klanten met freshness < 0.3 hebben geen scan in 21+ dagen
  → retentie-risico, re-engagement triggeren"

**Privacy:** Alleen geaggregeerde statistieken en patronen, nooit
individuele klantdata. Zelfde principe als analytics: trends, geen
individuen.

**Scope:** Toekomstig concept, niet in MVP of eerste releases. Pas
relevant bij voldoende klantvolume voor statistische significantie.

**Status:** [ ] Geparkeerd — toekomstig concept

---

### Kwestie 19 — LLM-runtime voor memory-consolidatie

**Vraag:** Welke LLM-runtime en welk model gebruiken we voor de
nachtelijke memory-consolidatie?

#### Achtergrond (25 april 2026)

De memory-loop (K16) heeft een LLM-stap: slapende klant×dimensie
combinaties met >5 losse interacties samenvatten tot kernbevindingen.

**Drie opties:**

| Optie | Runtime | Model | Pro | Contra |
|-------|---------|-------|-----|--------|
| A | Convex internalAction | Haiku (direct API) | Alles in Convex, geen extra infra | 10 min timeout, max ~20 per run |
| B | Railway (naast scanner) | Agent SDK + Haiku | Geen tijdslimiet, schaalbaar | Extra infra, scanner-repo raken |
| C | Convex + chunking | Haiku (direct API) | Geen timeout-probleem, Convex-native | Complexer, maar bewezen patroon |

**Overwegingen:**

- De scanner gebruikt Agent SDK met Opus voor diepe analyse (minuten,
  zelfcorrigerend, meerdere rondes)
- Memory-consolidatie is eenvoudiger: 5-10 interacties → 1 samenvatting
- Haiku volstaat (seconden per call)
- Agent SDK is mogelijk overkill voor dit specifieke stuk — een directe
  API call is efficiënter
- Maar: consistentie in de stack heeft ook waarde

**Voorlopige richting:** Haiku via directe Anthropic API call in Convex
action. Agent SDK bewaren voor waar de agentic loop nodig is.

**Status:** [ ] Open — beslissing door Janton

---

### Kwestie 17 — Transport-keuze (stdio vs Streamable HTTP)

**Vraag:** Welk transport gebruikt de Janton MCP server? En is dat
dezelfde keuze voor MVP en voor de volledige versie?

#### Achtergrond (25 april 2026)

Er zijn twee mogelijkheden, elk met een fundamenteel ander
operationeel model:

**Optie A — stdio (subprocess):**

Claude Code start Janton als kindproces. Communicatie via stdin/stdout
pipes. Als Claude Code stopt, sterft Janton mee.

```
Claude Code ──stdio──► Janton MCP ──► Convex
  (start)      (pipe)    (subprocess)
```

Configuratie:
```json
{
  "mcpServers": {
    "janton": {
      "command": "npx",
      "args": ["@arc/mcp-janton"],
      "env": { "ARC_API_KEY": "<key>" }
    }
  }
}
```

| Pro | Contra |
|-----|--------|
| Simpelst mogelijk | Sterft met Claude Code |
| Geen poort/netwerk nodig | Browser (dashboard) kan niet verbinden |
| Inherent veilig (geen netwerk) | Geen dual-transport mogelijk |
| Native Claude Code support | Eén client tegelijk |

**Optie B — Streamable HTTP (daemon):**

Janton draait als los proces op `localhost:4200`. Claude Code én
de browser verbinden via HTTP. Janton overleeft Claude Code-sessies.

```
Claude Code ──HTTP──► Janton MCP ◄──HTTP── Browser
                      (daemon)              (arc.janton.ai)
                      localhost:4200
```

Configuratie:
```json
{
  "mcpServers": {
    "janton": {
      "url": "http://localhost:4200/mcp"
    }
  }
}
```

| Pro | Contra |
|-----|--------|
| Dashboard kan verbinden | Daemon moet gestart/beheerd worden |
| Overleeft Claude Code stop/herstart | Poort-conflicten mogelijk |
| Meerdere clients tegelijk | Security-overwegingen (localhost binding, CORS, Origin) |
| Toekomstbestendig (K9 dual-transport) | Complexer voor de klant |

**Optie C — Gefaseerd (stdio eerst, HTTP later):**

MVP met stdio (simpelst). Dual-transport daemon als de dashboard-
integratie (K9, K12) gebouwd wordt. Eén codebase, transport-keuze
via environment variable (`TRANSPORT=stdio|http`).

**Relevante context:**
- SSE is deprecated in het MCP protocol — Streamable HTTP vervangt het
- De MCP Builder Skill toont hoe één server beide transports kan bedienen
- K9 (Dual-Transport) gaat uit van HTTP, maar is als apart kwestie
  ontworpen (niet in MVP)

#### Claude Code Channels — heronderzoek (25 april 2026)

De conclusie van 15 april (K9) is opnieuw getoetst. Channels zijn
**nog steeds research preview** (niet GA). Kernbeperking onveranderd:

- Subprocess van Claude Code via stdio — sterft met de sessie
- Geen persistent endpoint — events verloren als sessie sluit
- Lokale HTTP-poort mogelijk, maar vereist tunnel (Hookdeck) voor
  externe systemen — extra afhankelijkheid
- Permission relay toegevoegd (v2.1.81+), maar irrelevant voor ons

**Conclusie bevestigd:** Channels zijn niet geschikt als primair
push-mechanisme van dashboard naar terminal.

#### Doorbraakinzicht: Convex als queue (25 april 2026)

De consequentie van "alles sterft met de sessie" is **silent failure**:
het dashboard toont "verstuurd ✓" maar niets is aangekomen. Dat is het
ergste soort fout.

**Mitigatie: Convex als queue.** Het dashboard schrijft acties naar
Convex (altijd beschikbaar), Janton MCP leest ze bij de volgende sessie.
Dit is hetzelfde claim pattern als de scanner (ADR-016).

```
Dashboard                    Convex                     Janton MCP
    │                           │                           │
    ├── createPendingAction ──► │                           │
    │   status: "pending"       │                           │
    │                           │   (sessie start)          │
    │                           │   ◄── janton_check_queue ─┤
    │                           ├── [{type:"fix",...}] ────► │
    │                           │   ◄── claimAction ────────┤
    │                           │       status: "running"   │
    │                           │   ◄── completeAction ─────┤
    │   ◄── subscription ──────┤       status: "done"       │
```

**Cruciaal inzicht:** MCP servers mogen NIET proactief pushen naar
Claude Code. De LLM roept tools aan, niet andersom. Daarom wordt
queue-lezen een tool: `janton_check_queue`.

**CLAUDE.md snippet bij de klant:**

```markdown
Bij het starten van een sessie, vraag Janton of er
openstaande acties zijn: gebruik janton_check_queue.
```

Dan krijgt de klant bij sessie-start:

```
> Janton: "Er staan 2 acties klaar vanuit je dashboard:
>   1. Branch protection instellen (3 dagen geleden)
>   2. CLAUDE.md aanvullen met security-richtlijnen
>   Wil je deze nu uitvoeren?"
```

**Wat dit betekent voor transport-keuze:**

Met Convex als queue is HTTP **niet meer nodig** voor dashboard →
terminal communicatie. stdio volstaat voor alles:

| Aanpak | Push-model | Risico |
|---|---|---|
| Direct HTTP naar localhost | Synchroon, fragiel | Silent failure |
| Channel + tunnel | Synchroon, fragiel + dep | Zelfde + Hookdeck |
| **Convex als queue** | Asynchroon, betrouwbaar | Wacht tot sessie |

Het enige dat je verliest: real-time uitvoering. Maar de klant opent
toch Claude Code om te werken — dan pikt Janton de queue op.

**Optie D — stdio + Convex queue (nieuw):**

stdio voor alle MCP-communicatie. Convex als persistente queue voor
dashboard-acties. Geen HTTP daemon, geen tunnel, geen Channels.
Eenvoudigst mogelijk, betrouwbaarst mogelijk.

**Impact op K2 (Tools):** Nieuwe tool `janton_check_queue` toegevoegd:
- Leest pending actions uit Convex
- Retourneert lijst met type, beschrijving, aanmaakdatum
- Claude Code kan de klant vragen welke acties uit te voeren

**Impact op K9 (Dual-Transport):** Het twee-richtingsverkeer
dashboard→terminal wordt opgelost via Convex, niet via HTTP.
De HTTP daemon (K9) blijft relevant voor real-time features
(live terminal-status, progress updates), maar is niet meer
vereist voor de kern push-functionaliteit.

**Status:** [ ] Open — optie D (stdio + queue) is sterkste kandidaat

---

## Kwestieoverzicht (actueel)

| # | Kwestie | Status | Kern |
|---|---------|--------|------|
| 1 | Productvisie | [x] Besloten | Lerend traject, premium, Janton persona → PDR-011 |
| 2 | Functioneel ontwerp | [x] Besloten | Tools, Resources, structured data, workflow-descriptions → spec tooloppervlak |
| 3 | Architectuur | [x] Besloten | Eigen MCP + ConvexHttpClient (optie B). TypeScript, `registerTool()` → ADR-025 |
| 4 | Data-architectuur | [x] Besloten | Alle tabellen tegelijk. 8 nieuwe MCP-tabellen → data-architectuur.md update |
| 5 | Persona & Prompt | [x] Besloten | Via `systeempromptversies` (Convex). Testbaar via lab. Versiebeheer als scanner-prompts |
| 6 | Distributie | [ ] Open | npm + CLAUDE.md snippet. CI/CD apart (K20) |
| 7 | Feedback-loop | [x] Samengevoegd | Opgegaan in K16 (memory = feedback-loop) |
| 8 | Ontwikkelstrategie | [x] Besloten | Fase 1 = documenten + skelet. Fase 2 = code. Geen code zonder ontwerp |
| 9 | Dual-Transport | [x] Vervangen | Opgelost door K17 (Convex queue). HTTP alleen voor real-time (toekomstig) |
| 10 | Skills Repository | [ ] Geparkeerd | Eerst MCP server bouwen |
| 11 | Spelregeldocument | [ ] Open | Deliverable, wordt geschreven bij start implementatie |
| 12 | Dashboard UI voor MCP | [ ] Geparkeerd | Wacht op werkende MCP server |
| 13 | Modi & Functiescheiding | [x] Besloten | Via prompt, niet via code. Terminal = coach, dashboard = gids (CoachPanel) |
| 14 | Catalogus als MCP Resource | [x] Besloten | Convex enige bron. Conversaties ook in Convex. Alles via `arc://` resources |
| 15 | Repo-locatie | [x] Besloten | Workspace binnen `arc/` (zoals scanner). Convex-types direct beschikbaar |
| 16 | Drielaags-ziel + Memory-loop | [x] Besloten | Volledig in scope incl. synthesesysteem-patroon → spec memory-loop |
| 17 | Transport-keuze | [x] Besloten | Optie D: stdio + Convex queue. Definitief. Geen HTTP daemon nodig |
| 18 | JantonArc (cross-klant) | [ ] Geparkeerd | Toekomstig concept |
| 19 | LLM-runtime memory | [x] Besloten | Optie A: Haiku in Convex action. Proberen en leren |
| 20 | CI/CD voor MCP package | [ ] Open | Versie-strategie, npm publish, changelog. Spec wordt geschreven → later oppakken |
| 21 | Documentatie-structuur | [x] Besloten | Optie B: integratie in grootboek. PDR-011, ADR-025, specs in `docs/grootboek/` |
| 22 | Authenticatiestrategie | [x] Besloten | Clerk Machine Auth (API keys). CLI login (gh-stijl). Verify server-side in Convex. Geen custom tabel → ADR-025 §5 |

---

## Besluitenlog

| # | Datum | Kwestie | Besluit | Vastgelegd in |
|---|-------|---------|---------|---------------|
| 1 | 15-04-2026 | K1 Productvisie | MCP Janton = lerend traject in terminal. Puur adviseerend, premium feature, Janton als persona. Claude Code = lead, Janton = informatiebron/coach. Gameloop: vraag→coach→implementeer→scan→herhaal. | journaal K1 |
| 2 | 15-04-2026 | K1 Persona/Tips/Academy | Persona-prompt in Convex (doorontwikkelbaar). Tips-systeem: catalogus + eigen tips, context-aware, gevraagd én ongevraagd. Academy = concept, niet in MVP. | journaal K1 |
| 3 | 15-04-2026 | K9 Dual-Transport | Janton MCP server wordt dual-transport: stdio (Claude Code) + HTTP/WS (browser). Dashboard detecteert lokale MCP via health-check, graceful degradation naar kopieer-knop. | journaal K9 |
| 4 | 15-04-2026 | K2 Structured Data | Elke tool retourneert content (tekst) + structuredContent (data). Tool annotations: readOnlyHint=true. Resources voor statische data, Tools voor operaties. Token-efficiëntie: CHARACTER_LIMIT 25k, paginatie, gefilterd. | journaal K2 |
| 5 | 25-04-2026 | K2 Tool-ontwerp verrijkt | Tool descriptions worden vijf-secties workflow-instructies (Description, Args, Returns, Examples, Error Handling). `response_format` parameter per tool. Toolnamen met prefix: `janton_get_scores` etc. Evaluatiefase (10 vragen) als kwaliteitsborging. | journaal K2 |
| 6 | 25-04-2026 | K3 Architectuur aangescherpt | Projectstructuur bevestigd door MCP Builder Skill. TypeScript bevestigd. `registerTool()` (niet deprecated `server.tool()`). SSE deprecated → Streamable HTTP. Security: bind 127.0.0.1, Origin-validatie. | journaal K3 |
| 7 | 25-04-2026 | K16 Drielaags-ziel geïdentificeerd | Janton's karakter = Handshake (identiteit) × Resources (kennis) × Memory (relatie). Synthesesysteem freshness-patroon transplanteerbaar naar Convex voor klant-geheugen. Memory-loop als nachtelijke cron (03:00 UTC). Tenant-geïsoleerd. | journaal K16 |
| 8 | 25-04-2026 | K18 JantonArc geparkeerd | Cross-klant patroondetectie als toekomstig concept. Niet in MVP. Pas bij voldoende klantvolume. | journaal K18 |
| 9 | 25-04-2026 | K19 LLM-runtime geïdentificeerd | Consolidatie-stap in memory-loop: Haiku in Convex action. Drie opties onderzocht. | journaal K19 |
| 10 | 25-04-2026 | K17 Convex-queue doorbraak | Channels heronderzocht (research preview, silent failure). Convex als queue voor dashboard→terminal push. `janton_check_queue` tool. CLAUDE.md triggert bij sessie-start. Optie D definitief. | journaal K17 |
| 11 | 25-04-2026 | K3 Eigen MCP besloten | Optie B definitief: eigen MCP server met ConvexHttpClient. Niet de officiële Convex MCP (generiek) of community wrapper (jong). | ADR-025 |
| 12 | 25-04-2026 | K5 Prompts via systeempromptversies | Persona-prompt in `systeempromptversies` tabel (zoals coach-prompt al werkt). Testbaar via lab/varianten/. Versiebeheer met register. | journaal K5 |
| 13 | 25-04-2026 | K9 Vervangen door K17 | Dual-transport niet meer nodig. Dashboard communiceert via Convex (CoachPanel server-side + pending actions queue). HTTP daemon alleen voor toekomstige real-time features. | journaal K9/K17 |
| 14 | 25-04-2026 | K13 Modi via prompt | Terminal-modus en dashboard-modus zijn twee gescheiden paden: Janton MCP (stdio, coach) en CoachPanel (Convex /api/coach, gids). Geen code-scheiding nodig. | journaal K13 |
| 15 | 25-04-2026 | K14 Convex enige bron | Alle data in Convex. Catalogus via MCP resource `arc://rekeningschema`. Conversaties in `mcpInteracties`. Geen lokale bestanden als bron. | journaal K14 |
| 16 | 25-04-2026 | K15 Workspace in arc/ | MCP server als workspace-map binnen arc/ (zoals scanner). Convex-types direct importeerbaar. Later splitsen als het knelt. | ADR-025 |
| 17 | 25-04-2026 | K17 stdio + Convex queue definitief | Optie D: stdio voor MCP-protocol, Convex als persistente queue voor dashboard→terminal push. Geen HTTP daemon, geen tunnel, geen Channels. | ADR-025 |
| 18 | 25-04-2026 | K19 Haiku in Convex action | Optie A: Haiku via directe Anthropic API in Convex action. Proberen en leren. Agent SDK bewaren voor zware taken. | ADR-025 |
| 19 | 25-04-2026 | K4 Alles tegelijk | Alle MCP-tabellen in één keer ontwerpen (8 tabellen). Geen gefaseerde toevoeging. Gas geven, geen klanten om rekening mee te houden. | data-architectuur.md |
| 20 | 25-04-2026 | K8 Fase 1 = documenten | Fase 1 levert documenten + skelet-mapstructuur, geen code. PDR-011, ADR-025, specs, data-architectuur update. Fase 2 = implementatie. | journaal K8 |
| 21 | 25-04-2026 | K16 Volledig in scope | Memory-loop inclusief synthesesysteem-patronen. Niet beperkt tot MVP-scope. K7 (feedback-loop) samengevoegd — memory IS de feedback-loop. | spec memory-loop |
| 22 | 25-04-2026 | K21 Docs in grootboek (optie B) | Documentatie geïntegreerd in bestaand grootboek. Eén waarheid. PDR en ADR in bestaande registers. Specs in `docs/grootboek/specs/`. | journaal K21 |

---

## Fase 1 deliverables

| Deliverable | Type | Status | Bron-kwesties |
|---|---|---|---|
| PDR-011: MCP Server Janton | productbeslissing | te schrijven | K1 |
| ADR-025: MCP Architectuur | architectuurbeslissing | te schrijven | K3, K15, K17, K19 |
| Spec: Janton MCP tooloppervlak | contract-spec | te schrijven | K2, K14 |
| Spec: Janton memory-loop | implementatieplan | te schrijven | K16, K7 |
| Spec: CI/CD MCP package | feature-spec | te schrijven | K20 |
| Data-architectuur.md update | paraplu-document | te updaten | K4 |
| Mapstructuur `mcp-server-janton/` | skelet | te maken | K15 |

---

## Verwijzingen

| Document | Relevantie |
|----------|------------|
| `pdr-004-compounding-manager.md` | Architect vs. Accountant rollen |
| `pdr-005-coaching-taalregister.md` | Toon, badges, coaching-lagen |
| `software-architectuur.md` | Technische bouwstenen |
| `product-architectuur.md` | Informatielagen, dataspiraal |
| `data-architectuur.md` | Data-organisatie, entiteitenmodel (K4 landing) |
| `convex/schema.ts` | Huidige datamodel |
| `convex/http.ts` | CoachPanel `/api/coach` — bevestigt server-side Claude in dashboard |
| `referentie/groeimodel.md` | 43 doelen |
| MySQL MCP server | Vorige MCP ervaring |
| Claude Code Channels docs | Onderzocht, afgebakend (K9), heronderzocht (K17) — nog steeds research preview |
| `@modelcontextprotocol/sdk` v1.29+ | MCP TypeScript SDK |
| `lab/register.yml` | Lab-infrastructuur voor prompt-varianten en versiebeheer (K5) |
| `lab/varianten/` | Testbare prompt-varianten met hypotheses (K5) |
| `scanner/src/prompts/coach.md` | Bestaande coach-prompt in systeempromptversies |
| `architect-rol-journaal.md` | Discovery Architect-rol, kwesties A1-A6 |
| MCP Builder Skill (`mcp-builder`) | Anthropic officiële skill, vier fasen, best practices |
| `/Users/jt2025/synthesesysteem` | Freshness/decay/consolidatie-patroon voor memory-laag (K16) |
| `synthesesysteem-softwarearchitectuur.md` | Technisch ontwerp ademend geheugen |

---

*Bron: ARC, jnl-001-mcp-server-janton.md, 15 april 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
