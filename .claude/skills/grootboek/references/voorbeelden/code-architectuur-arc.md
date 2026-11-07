> # 📚 Voedingsdocument — voorbeeld van een code-architectuur
>
> **Lees dit als inspiratie, niet als instructie.** Dit is een volledig,
> realistisch code-architectuur document van een echt platform (ARC), opgenomen
> als *voeding* bij het refactor-recept (`references/code-architectuur-refactor.md`).
> Het toont de **rijke vorm** — mét bestandsregister, regelaantallen,
> per-component analyse en learnings — zodat je ziet hoe zo'n document kan
> werken en waar de drie soorten geheugen (doctrine / contract / staat) vandaan
> komen. Het recept brengt deze vorm uiteindelijk terug tot kale doctrine; dit
> voorbeeld laat zien wat er dán te scheiden valt.
>
> **De bestandsnamen en getallen zijn echte voorbeelden uit één repo** — ze
> illustreren het patroon en zijn niet bedoeld om op te zoeken; in jouw repo
> heten de bestanden anders. Laat je voeden door de *vorm en de redenering*, niet
> door de namen.
>
> **De tech stack (een volledig TypeScript-gebaseerde PaaS):**
> | Component | Stack | Rol |
> |-----------|-------|-----|
> | Dashboard | React + Next.js (App Router), Tailwind | klant-UI |
> | Backend | Convex (database, serverless functions, real-time) | data + logica |
> | Scanner | Claude Agent SDK (Bun) | prompt-uitvoering |
> | MCP-server | MCP SDK | distributie naar de klant-agent |
>
> Eén taal door de hele keten (TypeScript) — dat is bewust: het maakt de zeven
> spelregels uniform toepasbaar over alle componenten. Dat is de grote lijn die
> deze architectuur draagt.

---

# ARC Control Center — Code-architectuur

## Doel van dit document

Dit document beschrijft **hoe ARC's code georganiseerd moet zijn zodat een
AI-agent er effectief mee kan werken**. Het is de doorsnijding die de stof
"code-kwaliteit voor agentic development" volgt door alle componenten.

```
software-architectuur.md   ← WAT + HOE (systeem, componenten, dataflow)
product-architectuur.md    ← WAAROM (product, coaching, design)
code-architectuur.md       ← HOE (code-organisatie, agent-effectiviteit)
         ▲ dit document
```

Dit is geen traditioneel code-kwaliteitsdocument. De vraag is niet "wat is
perfecte code?" maar **"wat is code waar Claude Code het beste mee werkt?"**

Dat verschuift de prioriteiten:

- **Bestandsgrootte** is niet "hoe groot mag het?" maar "wanneer verliest
  een agent context en maakt fouten?"
- **Naamgeving** is niet "convention X vs Y" maar "welke namen helpen een
  agent begrijpen wat er staat?"
- **Abstractie** is niet "DRY vs WET" maar "wanneer maakt een agent fouten
  door te veel indirectie?"
- **Type-safety** is niet "strict vs loose" maar "welke types geven een
  agent de beste feedbackloop?"

### Leeswijzer

- **Wie wil begrijpen waarom** leest sectie 1 (de these)
- **Wie code schrijft** leest sectie 2 (spelregels) en sectie 4 (per component)
- **Wie een groot bestand tegenkomt** leest sectie 3 (bestandsregister) en
  sectie 5 (god file analyse)
- **Wie de kringloop wil begrijpen** leest sectie 6 (feedback loop)

---

## 1. De these: code-kwaliteit IS agent-productiviteit

ARC's codebase wordt volledig door Claude Code gebouwd en onderhouden. De
Dirigent schrijft niet — de Dirigent voedt. Dat maakt code-kwaliteit geen
kwestie van esthetiek maar van **productiviteit**: hoe goed kan de agent
de code lezen, begrijpen en veilig wijzigen?

Drie onderzoeken onderbouwen dit:

**Agents vereisen hogere code health dan mensen.** CodeScene mat dat
menselijke ontwikkelaars code begrijpen bij een code health van 9.0/10.
AI-agents vereisen **minimaal 9.4/10**. Bij ongezonde code stijgt het
defectrisico met minstens 60%. De verklaring: een agent kan niet vragen
"wat bedoel je hier?" — het raadt, en bij slechte code raadt het vaker
verkeerd.

**84% van agent-tokens gaat naar observatie.** JetBrains Research (NeurIPS
2025) toonde aan dat observatie-tokens — het lezen van bestanden, foutmeldingen,
tool-output — 84% van een gemiddelde agent-beurt uitmaken. Slechts 16% gaat
naar generatie. Minder irrelevante context in bestanden bespaart tokens én
verbetert de kwaliteit van de generatie. Simpele "observation masking" (irrelevante
context weghalen) presteerde even goed als dure LLM-samenvatting, en was
52% goedkoper.

**AI-code produceert meer issues dan menselijke code.** CodeRabbit mat
gemiddeld 10.83 issues per AI-request versus 6.45 voor menselijke code —
1.7x meer. De meest voorkomende: logic/correctness issues (+75%), security
vulnerabilities (1.5-2x), en over-abstractie. Dat is geen argument tegen
AI-code, maar een argument voor **code-architectuur die deze zwaktes
compenseert**.

De conclusie: investeren in code-organisatie is geen overhead — het is de
hefboom die bepaalt hoe effectief de agent kan werken.

---

## 2. Kwalitatieve spelregels

Zeven principes die voor alle componenten gelden. Elk principe beschrijft
het **wanneer**, niet het **hoeveel**. Bestandsgrootte is een signaal, geen
trigger.

### 2.1 Split op de naad van onafhankelijke verandering

De test: "als ik concern A wijzig, moet ik dan concern B in hetzelfde
bestand begrijpen?" Ja → houden. Nee → splitsen.

Een bestand met twee concerns die om verschillende redenen veranderen is
een bestand dat bij elke wijziging onnodige context in het agent-venster
laadt. Dat kost tokens en verhoogt het risico op onbedoelde wijzigingen.

*Voorbeeld:* `convex/scans.ts` bevatte dashboard-queries, scanner-contract
en L3-logica. Die veranderen om compleet andere redenen. Drie naden →
drie bestanden (ADR-043).

### 2.2 Cohesie boven compactheid

Een bestand van 400 regels met één cohesief domein is beter dan vier
bestanden van 100 regels die samen gelezen moeten worden. Het splitsen
van cohesieve code dwingt een agent om meerdere bestanden te openen,
de samenhang te reconstrueren, en meer context te consumeren.

De vraag is niet "is dit bestand te groot?" maar "hoort alles hier
logisch bij elkaar?" Als het antwoord ja is, mag het bestand groter zijn.

### 2.3 Dunne publieke functies, dikke helpers

Geexporteerde functies (queries, mutations, actions, route handlers) zijn
wrappers van maximaal ~20 regels. Business logic leeft in helper-functies
die context-objecten als parameter nemen.

Waarom: helpers zijn testbaar zonder het framework te simuleren. Ze zijn
herbruikbaar zonder de publieke API te wijzigen. En ze maken de intentie
van de publieke functie leesbaar in een oogopslag — ook voor een agent.

*Toepassing:* Convex helpers in `model/` met `MutationCtx`/`QueryCtx` als
eerste argument (ADR-043). Dashboard: presentatie-logica in de component,
data-transformatie in losse functies.

### 2.4 Beschrijvende namen over slimme abstractie

Agents begrijpen de shape van data via TypeScript-types beter dan via
documentatie of class-hierarchieen. Geef de voorkeur aan:

- Beschrijvende functienamen boven clevere class-patronen
- Expliciete type-signatures op publieke API-grenzen
- Bestandsnamen die de inhoud beschrijven (entity + lifecycle-fase),
  niet het technisch type (`mutations/`, `queries/`)
- Platte directorystructuren (max 3-4 niveaus) boven diep geneste
  micro-packages

Een agent dat `scans-scanner.ts` leest weet direct: dit is het
scanner-contract voor scans. Een agent dat `mutations/index.ts` leest
weet niets.

### 2.5 Geen barrel files

Geen `index.ts` die alles re-exporteert. Directe imports:
`from "./scans-scanner"`, niet `from "./scans"`.

Barrel files verbergen de werkelijke dependency-structuur. Bij 20+
exports kiest een agent vaak het verkeerde bronbestand. Directe imports
geven ondubbelzinnige file-locaties.

Atlassian mat 75% snellere builds na verwijdering van barrel files.
Voor agents is het effect groter: de juiste import leidt de agent naar
het juiste bestand, waar de context staat die het nodig heeft.

### 2.6 Rule of Three voor extractie

Gedeelde code verhuist naar een gedeelde locatie pas bij drie
onafhankelijke callers. Twee callers → duplicatie is prima.

Premature abstractie creert koppeling die lastiger te ontvlechten is
dan duplicatie. Een agent dat twee identieke blokken ziet kan die
zelfstandig extraheren wanneer een derde caller verschijnt. Een agent
dat een abstractie wil wijzigen moet eerst begrijpen wie er allemaal
van afhankelijk is — dat is duurder.

### 2.7 Sterke type-signatures op API-grenzen

Types zijn de beste feedbackloop voor agents. Een functie met een helder
input-type en return-type geeft de agent compile-time feedback wanneer
het een fout maakt. Zonder types krijgt de agent runtime-feedback — als
het die al krijgt.

Op interne API-grenzen (tussen componenten, tussen bestanden): altijd
expliciete types. Binnen een functie: TypeScript's type-inference is
voldoende.

---

## 3. Het bestandsregister

### De deurbel: lint op 300

De lint-drempel is **300 regels** als `warn`. Dit getal is geen wet —
het is een deurbel. Wanneer de deurbel gaat, stel je de cohesie-vraag:
"hoort alles hier logisch bij elkaar?"

- **Ja** → verhoog het plafond in het register, documenteer waarom
- **Nee** → split op de naad van onafhankelijke verandering (spelregel 2.1)
- **Ja, maar het is een god file met refactor-potentie** → noteer in het
  register met een herzienmoment

De drempel komt uit het midden van de research: Factory AI adviseert 250,
ADR-043 noemt ~300 met warn bij 350. Drie-honderd detecteert alle bekende
god files in de codebase maar laat gezonde bestanden met rust.

### De code is de waarheid (methodiek)

> **Regelaantallen in dit document en in `code-architectuur-register.json` zijn
> een auto-ververste momentopname — de echte code is leidend.**

De push-hook (`code-review-report.sh`) **meet het regelaantal live** (`wc -l`)
en leest uit het register alleen de *beslissingen*: `positie`, `plafond`, `reden`.
Het opgeslagen `regels`-getal wordt nooit met de hand bijgewerkt; het wordt
afgeleid uit de code door `scripts/register-sync.ts` (draait in de pre-commit).
Een afgeleid getal kan niet driften.

De hook past per niet-uitgesloten bestand deze stoplicht-semantiek toe (live `L`):

| Registratie | Regel | Kleur |
|-------------|-------|-------|
| `plafond` (afspraak P) | `L > P` | 🔴 over afgesproken plafond |
| `plafond` (afspraak P) | `L ≤ P` | 🟢 binnen afspraak |
| `ok` / niet-geregistreerd | `L > 400` (grens) | 🔴 over harde grens |
| `ok` / niet-geregistreerd | `300 < L ≤ 400` | 🟠 boven deurbel → cohesie-vraag |
| elk | `L ≤ 300` | 🟢 |

Twee eigenschappen die het vangnet sluitend maken: het **plafond per bestand
wordt afgedwongen** (een bestand 17 regels over zijn afspraak is 🔴, niet 🟠),
en de codebase-sweep **loopt over de schijf** in plaats van over de
register-sleutels — zo verschijnt elk gegroeid of ongeregistreerd bestand vanzelf,
ook als het ooit als `ok` is afgevinkt.

### De akkoordtabel

Het register werkt als een akkoordtabel — vergelijkbaar met hoe
`akkoordRegels` werken voor scan-maatstaven. Per bestand een bewuste
beslissing: `positie`, `plafond`, `reden`. Het regelaantal in de tabel is
de afgeleide momentopname (zie hierboven), niet de afspraak.

| Bestand | Regels | Plafond | Reden |
|---------|--------|---------|-------|
| **Uitgesloten (geen functionele code)** | | | |
| `convex/schema.ts` | 815 | uitgesloten | Declaratief schema, geen logica |
| `convex/seed/rekeningschemaData.ts` | 1967 | uitgesloten | Data-array |
| `convex/seed/maatstavenData.ts` | 1519 | uitgesloten | Data-array |
| `convex/seed/rekeningMaatstavenData.ts` | 197 | uitgesloten | Data-array, koppelingen |
| `convex/werkplaats/hernummer.ts` | 415 | uitgesloten | Eenmalig migratie-script |
| `convex/werkplaats/schemaUitbreiding.ts` | 342 | uitgesloten | Eenmalig migratie-script |
| `dashboard/.../Animations.tsx` | 680 | uitgesloten | Animatie-definities, pure data |
| `dashboard/.../tabs/DataTab.tsx` | 520 | uitgesloten | Design system showcase |
| `dashboard/.../L3Showcase.tsx` | 516 | uitgesloten | Design system showcase |
| `dashboard/.../tabs/PatronenTab.tsx` | 308 | uitgesloten | Design system showcase |
| `dashboard/.../tabs/ComponentenTab.tsx` | 307 | uitgesloten | Design system showcase (incl. CreditPipsShowcase) |
| `dashboard/lib/mock-data.ts` | 427 | uitgesloten | Mock data, geen productie-logica |
| **Met plafond (cohesief, bewust groot)** | | | |
| `dashboard/.../catalogus/page.tsx` | 272 | — | Gerefactord: types → `lib/`, data → `_hooks/` |
| `dashboard/.../_hooks/useCatalogusData.ts` | 125 | — | Gerefactord: dunne orchestrator, afleidingen → `lib/catalogus-derivations.ts`, expliciet `CatalogusData` type |
| `dashboard/.../[owner]/[repo]/page.tsx` | 218 | — | Gerefactord: utils → `lib/`, data → `_hooks/` |
| `mcp-server-janton/src/auth/oauth-server.ts` | 367 | 390 | OAuth-routehandler: 4 flows + metadata + DCR + foutpagina's, cohesief; Convex-backed handshake-state → `oauth-state-store.ts` (§2.1/§2.7), Clerk-identiteit → `clerk-identity.ts`. 453→367 |
| `mcp-server-janton/src/auth/oauth-state-store.ts` | 150 | — | Typed grens routehandler↔Convex (§2.7): DCR/pending sessions/auth codes/refresh tokens; bezit `mcpSecret` + `mcpOauthActions`-namespace. Vervangt in-memory `oauth-stores.ts` (nu Convex-backed) |
| `dashboard/components/catalogus/RekeningRij.tsx` | 339 | 380 | Types → `rekeningRij-types.ts`, kleur-utils → `lib/catalogus-utils.ts` |
| `convex/mcpActions.ts` | 363 | 450 | Dunne wrapper-laag: data/coaching-acties (eigenaarId + mcpSecret) + `runMemoryLoop`-cron. OAuth-handshake-acties → `mcpOauthActions.ts` (§2.1). 489→363 |
| `convex/mcpOauthActions.ts` | 154 | — | OAuth public action-laag (DCR/refresh tokens/pending sessions/auth codes), dunne wrappers boven `mcpOauth.ts`. Auth via `mcpSecret` (server-state). Geëxtraheerd uit `mcpActions.ts` (§2.1) |
| `dashboard/components/RepoRegistratieRij.tsx` | 314 | 330 | Repo-instellingsrij + sortable-wrapper, cohesief. Types (§2.7) + presentatie-constants → `repoRegistratieRij-types.ts`. 339→314 |
| `scanner/src/pipeline.ts` | 382 | 400 | Pipeline-orchestratie, één doorloop |
| `convex/creditsQueries.ts` | 44 | — | Credit-systeem dashboard-queries (`haalCredits`/`haalWaardeOverzicht` + `TARIEF_EUR_PER_SCAN`), dunne wrappers boven `model/credits.ts` |
| `convex/scansGateQueries.ts` | 61 | — | Globale ops/release-gate-observatie (ADR-051): `haalLopendeProdScans` (stil-detectie via `op_status`, geen auth) + `haalScannerGezondheid`. Eigen verandernaad (ops, niet per repo+eigenaar), §2.1 |
| `dashboard/lib/catalogus-derivations.ts` | 306 | 350 | Pure catalogus-afleidingen (10 functies, score/detectie/metadata). Cohesief, testbaar — body's uit `useCatalogusData` |
| `convex/mcpGeheugen.ts` | 318 | 350 | MCP geheugen-logica |
| `scanner/src/security-collector.ts` | 336 | 350 | Security-detectie aggregatie |
| `dashboard/components/AkkoordReactie.tsx` | 300 | 350 | Interactief formulier |
| `convex/model/profielBibliotheek.ts` | 283 | — | Gedeelde pure profielbibliotheek (JNL-057): BIBLIOTHEEK + bepaalProfielen + herkendAan + beschrijving. Eén bron voor scanner/Convex/dashboard (lost K5/K7 op) |
| `scanner/src/classify-pipeline.ts` | 98 | — | Lichte classificatie-scan (JNL-057), deterministisch, clone-vrij |
| `dashboard/components/OnboardingKaart.tsx` | 267 | — | Vier-gedaantes onboarding-kaart (JNL-057) |
| `dashboard/components/DoorlichtVoortgang.tsx` | 154 | — | Live doorlicht-tickertape (JNL-057) |
| **Afgerond (onder deurbel na refactor)** | | | |
| `dashboard/app/dashboard/page.tsx` | 45 | — | Compositie: ScanPulse/DimensieStrip/VolleKaart/RepoCard → `components/`, afleiding → `_hooks/useRepoKaartData.ts` (375→45) |
| `dashboard/app/dashboard/settings/page.tsx` | 14 | — | Compositie: ScanInstellingenForm + RepoRegistratieLijst/Rij → eigen bestanden (578→14) |
| `convex/scansQueries.ts` | 292 | — | Dashboard queries voor scans (auth-gebonden, per repo+eigenaar). Release-gate-observatie → `scansGateQueries.ts` (§2.1). Herhaalde filter-predicaten (volle-scan + afgerond, 7 callers) → `lib/scanFilters.ts` (Rule of Three §2.6); queries blijven cohesief. 322→292, plafond 320 vervalt |
| `convex/lib/scanFilters.ts` | 35 | — | Gedeelde scans-filter-predicaten (`isVolleScan`/`isAfgerond`) als getypte `FilterBuilder`-helpers. Eén bron voor de scanType-regel, geëxtraheerd uit `scansQueries.ts` (§2.6) |
| `convex/scansScanner.ts` | 256 | — | Dunne contract-schil (cohesief: scanner job-lifecycle achter `scannerSecret`). Completion → `model/scanCompletion.ts`, validators → `model/scannerContract.ts` (JNL-057); watchdog/claim/orphan/patroon-koppeling → `model/scanLifecycle.ts` (§2.3, dunne wrappers). Paden identiek, functioneel gelijk |
| `convex/repokoppelingen.ts` | 235 | — | Schaduwrefactor JNL-057: cold-start → `repokoppelingenColdStart.ts`, App → `repokoppelingenApp.ts`, n.v.t.-berekening → `model/toepasbaarheid.ts` |
| `convex/http.ts` | 28 | — | Dunne router na refactor (ADR-043 #3) |
| `dashboard/components/BreadcrumbBar.tsx` | 166 | — | OperationalZone + ElapsedTimer naar eigen bestanden |
| `dashboard/components/SecurityDot.tsx` | 289 | — | Presentatie (dot + popover + detail). Types → `security-types.ts` (2.7), pure afleiding → `lib/security-state.ts` (2.3, getest). 375→289 |
| `dashboard/components/RepoSelector.tsx` | 220 | — | Hook in `useRepoSelector.ts`, SVG dedup |
| `dashboard/components/Groeipad.tsx` | 221 | — | Lollipop-grafiek (presentatie). Geometrie → `lib/groeipad-layout.ts` (2.3, getest), types → `groeipad-types.ts` (2.7). JSX inline gehouden (cohesie, 2.2). 328→221 |

**Uitgesloten** = structureel anders dan functionele code (declaratief,
data-arrays, migratie-scripts, design system showcases). **Plafond** =
bewuste keuze, herbeoordeeld wanneer het plafond bereikt wordt.

**Machine-leesbaar register:** `docs/grootboek/code-architectuur-register.json`
— de push-hook (HDR-019 Moment 0) leest hieruit de *beslissingen*
(`positie`/`plafond`/`reden`). Bij een nieuwe of gewijzigde beslissing: update
de JSON én deze tabel. Het `regels`-getal niet — dat ververst `register-sync.ts`.

### Onderhoud

De *beslissingen* leven in dit document; de *regelaantallen* zijn afgeleid.
Bij een 🟠 "niet in register" of een nieuwe overschrijding:
1. Beoordeel cohesie (spelregel 2.2)
2. Neem een positie (uitsluiten, plafond afspreken, refactor plannen)
3. Voeg de beslissing toe aan de tabel + JSON (regelaantal laat je leeg/0 —
   `register-sync.ts` vult het)
4. Meld aan de Dirigent (communicatieplicht)

Het regelaantal nooit met de hand bijwerken: `bun scripts/register-sync.ts`
leidt het af uit de echte code (draait in de pre-commit). `--check` meldt drift.

---

## 4. Per component

### 4.1 Dashboard (Next.js App Router)

**78.198 regels totaal | 136 bestanden | gemiddelde 129 regels**

Het dashboard volgt Next.js App Router patronen:

- **Server Components als default.** Client Components markeren met
  `"use client"` alleen waar interactiviteit vereist is. Data-fetching
  in Server Components, doorgestuurd als props naar Client Components.
- **Colocation.** Route-specifieke componenten in `_components/` naast de
  page (underscore-prefix wordt genegeerd door de router). Gedeelde
  componenten buiten `app/` in een root-level `components/` directory.
- **Pages als compositie.** Een page is een compositie van componenten,
  niet een monoliet. Wanneer een page boven de lint-drempel komt: extraheer
  secties naar `_components/` met beschrijvende namen.

**Afgeronde refactors:**
- `catalogus/page.tsx` (565→286 regels) — types naar `lib/catalogus-types.ts`,
  data-fetching naar `_hooks/useCatalogusData.ts`.
- `_hooks/useCatalogusData.ts` (296→125 regels) — afleidingslogica (10 useMemo-body's)
  naar pure helpers in `lib/catalogus-derivations.ts`; expliciet `CatalogusData`
  return-type in `lib/catalogus-types.ts`.
- `[owner]/[repo]/page.tsx` (452→190 regels) — utilities naar `lib/repo-utils.ts`,
  data-orchestratie naar `_hooks/useRepoData.ts`.

### 4.2 Scanner (Node.js + Claude Agent SDK)

**9.542 regels | 119 bestanden | gemiddelde 80 regels**

De scanner is al gezond. Bestanden zijn compact, domein-georganiseerd,
en volgen het Agent SDK patroon: tools als Name + Description + Schema +
Handler.

- **Promptbestanden als .md.** Scanner-prompts leven als Markdown-bestanden,
  niet als template literals in TypeScript. Dat maakt ze leesbaar en
  onafhankelijk van code-wijzigingen.
- **Detectie per dimensie gesplitst.** Elke dimensie heeft eigen bestanden.
  Dit is het patroon dat de andere componenten zouden moeten volgen.

**ESLint:** Geconfigureerd sinds 19 mei 2026 (JNL-048). Gedeelde
`eslint.base.mjs` met `@typescript-eslint/recommended`, `no-explicit-any`
als warn. **Cleanup voltooid (30 mei):** 0 `any` in de scanner; alle
`catch (e: any)` en ongetypeerde mappers vervangen door `unknown` +
narrowing en afgeleide element-types.

### 4.3 Convex (backend)

**11.504 regels | 54 bestanden | gemiddelde 213 regels**

Convex-organisatie wordt gestuurd door ADR-043. De vijf spelregels:

1. Dunne publieke functies, dikke helpers in `model/`
2. Split op de naad van onafhankelijke verandering
3. Organiseer op domein-lifecycle (bestandsnaam = API-namespace)
4. Rule of Three voor extractie naar `lib/`
5. Geen barrel files

**Wat dit document toevoegt boven ADR-043:**

- `convex/schema.ts` (636 regels) en `convex/seed/*.ts` (1500-1950 regels)
  zijn **uitgesloten** van de lint-drempel. Schema is declaratief; seed data
  zijn arrays zonder logica.
- `convex/model/` bevat de helper-laag: `scanBusiness.ts`, `scanResultPersistence.ts`,
  `profielen.ts`, `profielBibliotheek.ts`, `toepasbaarheid.ts`, en sinds de JNL-057
  schaduwrefactor `scanCompletion.ts` (scanner-completion-logica) + `scannerContract.ts`
  (gedeelde output-validators) + `scanLifecycle.ts` (watchdog/claim/orphan/patroon-koppeling,
  geëxtraheerd uit `scansScanner.ts` zodat de publieke functies dunne wrappers blijven —
  §2.3). Alle onder de 300-regellint. Het patroon — dunne publieke wrappers, dikke helpers
  met `ctx` als eerste arg — werkt en groeit mee. De pure `bepaalVastloopReden` heeft een
  unit test (`scanLifecycle.test.ts`), runbaar zonder Convex-runtime.

**ESLint (30 mei):** Convex was het enige component zónder eslint-config —
de blinde vlek waar juist de meeste `any`'s zaten. Nu voorzien van
`convex/eslint.config.mjs` (`warnAnyConfig`, exclusies `_generated/`,
`seed/*Data.ts`, `werkplaats/`). De `any`-casts in de functiebodies zijn
opgeruimd (0 errors; resterende warnings zitten in uitgesloten seed-scripts).
Het aanzetten van de kraan bracht 3 bestaande `no-unused-vars`-fouten boven
water (`lib/auth.ts`, `scans.ts`, `seed/testScan.ts`) — direct opgeruimd.

**TypeScript-typecheck (ADR-050, 4 juni):** Convex was óók het enige component
zónder eigen `tsconfig.json`. Daardoor (a) toonde de editor valse diagnostics op
`convex/**/*.ts` (`Cannot find module './_generated/server'`, implicit-`any` op
`ctx`/`args`) omdat de map buiten elk TS-project viel, en (b) typecheckte
`convex deploy` de functies feitelijk niet — Convex doet dat alléén mét een
tsconfig in de convex-map. Nu voorzien van `convex/tsconfig.json` (canonieke
Convex-config: `strict`, `include ./**/*`, `exclude ./_generated`, `types [node]`).
`@types/node` toegevoegd aan de root zodat `process.env` resolvet; CI-job
`typecheck-convex` in `ci-quality.yml` geeft fail-fast feedback. Het Convex-vangnet
staat nu op eigen benen i.p.v. transitief via de scanner/mcp-builds (DFT-035).

**Widen-migrate-narrow over omgevingen (learning 1 juni):** Convex-migraties
die naar verwijderde schema-velden refereren breken de Next.js build via de
type-chain (`convex/_generated/api.d.ts` → migratie-bestand → verwijderd veld).
Oplossing: `@ts-expect-error` met LG-referentie op de twee regels die het
veld raken. Verwijder het migratie-bestand zodra het op prod is gedraaid.
Geen `as any` — dat is een any die terugkruipt na de eliminatie-ronde.

### 4.4 MCP Server Janton

**5.115 regels | 141 bestanden | gemiddelde 36 regels**

De MCP server is het gezondste component. Bestanden zijn klein, tools
leven als zelfstandige bestanden in `src/tools/`, en de structuur is plat.

- **Tools als zelfstandige bestanden.** Elk tool-bestand exporteert een
  handler met duidelijke naam. Dit is het ideale patroon voor agent-
  navigeerbaarheid.
- **OAuth-server (367 regels)** is het bestand boven de deurbel.
  OAuth vereist meerdere flows (authorization, token exchange, refresh,
  revocation) die cohesief zijn — ze horen bij elkaar, dus de flows blijven
  samen. Concerns die om een eigen reden veranderen zijn wél geëxtraheerd
  (spelregel 2.1): de Convex-backed handshake-state (DCR-clients, pending
  sessions, auth codes, refresh tokens) achter één typed grens naar
  `oauth-state-store.ts` (§2.7 — dit bestand bezit `mcpSecret` + de
  `mcpOauthActions`-namespace en verandert mee met het Convex-contract; het
  vervangt het oude in-memory `oauth-stores.ts` nu de state in Convex leeft),
  en de Clerk-identiteitskoppeling naar `clerk-identity.ts` (één typed grens
  `resolveClerkIdentity`, testbaar zonder env). De Convex-zijde spiegelt dit:
  de OAuth-actie-wrappers verhuisden van `mcpActions.ts` naar
  `mcpOauthActions.ts` (489→363). Plafond 390.

---

## 5. God file analyse

God files zijn bestanden die meerdere verantwoordelijkheden mengen. Ze
werken — maar ze veranderen om verschillende redenen, zijn moeilijk te
testen, en ze stralen geen intentie uit. Een agent moet het hele bestand
lezen om een enkele functie te begrijpen.

Geen actieve god files. Alle bekende gevallen zijn opgelost.

**Afgerond:**
- `convex/scans.ts` → gesplitst in `scans.ts`, `scansScanner.ts`, `scansQueries.ts`, `scansL3.ts` (ADR-043 #1)
- `convex/mcp.ts` → gesplitst in `mcpData.ts`, `mcpGeheugen.ts`, `mcpDistributie.ts`, `mcpOauth.ts` (ADR-043 #2)
- `convex/http.ts` → dunne router (28 regels), handlers in `httpWebhookGithub.ts`, `httpWebhookClerk.ts`, `httpCoach.ts`, `httpTriage.ts` (ADR-043 #3)
- `scanner/src/index.ts` → gesplitst in `index.ts` (58, CLI schil), `pipeline.ts` (279, orchestratie), `worker.ts` (150, infra+shutdown)
- `catalogus/page.tsx` → types naar `lib/catalogus-types.ts`, data naar `_hooks/useCatalogusData.ts` (565→286)
- `[owner]/[repo]/page.tsx` → utils naar `lib/repo-utils.ts`, data naar `_hooks/useRepoData.ts` (452→190)
- `scanner/src/detection/advise.ts` → types naar `advise-types.ts`, parsing naar `advise-parse.ts`, rapport naar `advise-report.ts` (547→230)
- `scanner/src/convex-client.ts` → core naar `convex-core.ts`, lifecycle naar `convex-scan-lifecycle.ts`, completion naar `convex-scan-completion.ts`, L3 naar `convex-l3.ts` (543→verwijderd)

### Toepassingsvolgorde

De volgorde volgt ADR-043: bewijs het patroon op een bestand, evalueer,
breid uit.

```
1. scans.ts      ← afgerond (scansScanner.ts, scansQueries.ts, scansL3.ts)
2. mcp.ts        ← afgerond (mcpData, mcpGeheugen, mcpDistributie, mcpOauth)
3. http.ts       ← afgerond (httpWebhookGithub, httpWebhookClerk, httpCoach, httpTriage)
4. index.ts      ← afgerond (pipeline.ts, worker.ts — eerste toepassing buiten Convex)
5. catalogus/    ← afgerond (lib/catalogus-types.ts, _hooks/useCatalogusData.ts)
6. [repo]/       ← afgerond (lib/repo-utils.ts, _hooks/useRepoData.ts)
7. advise.ts     ← afgerond (advise-types.ts, advise-parse.ts, advise-report.ts)
8. convex-client ← afgerond (convex-core.ts, convex-scan-lifecycle.ts, convex-scan-completion.ts, convex-l3.ts)
```

Elke stap is een zelfstandige wijziging. Geen big bang refactor.
Migratie via de schaduwrefactor-strategie (ADR-044): bouw naast het
origineel, schakel consumers over, verwijder het origineel als laatste.

---

## 6. Feedback loop

De kringloop die code-kwaliteit borgt:

```
LINT (automatisch)                    CODE-ARCHITECTUUR (dit document)
│                                     │
├── warn bij >300 regels              ├── beschrijft het WAAROM
├── pre-commit check (toekomstig)     ├── kwalitatieve spelregels
└── CI-gate (toekomstig)              └── bestandsregister
         │                                      │
         └──────────────┬───────────────────────┘
                        ▼
                  COHESIE-VRAAG
                  "Hoort alles hier logisch bij elkaar?"
                        │
                ┌───────┼───────┐
                ▼       ▼       ▼
              JA      NEE    LATER
              │       │       │
          verhoog   split    noteer in
          plafond   op naad  register met
          in        (2.1)    herzienmoment
          register
```

### Lint als architectuur-leraar

Factory AI beschrijft het patroon: codify standaarden als lint-regels
zodat agents zelf-corrigeren. De lint-fout is de leraar — niet de
documentatie. Wanneer een agent een bestand schrijft dat boven de drempel
komt, ziet het de warning en kan het beslissen: splitsen of de
cohesie-vraag beantwoorden.

### Hooks boven instructies

Anthropic's eigen data: CLAUDE.md-instructies worden ~80% gevolgd. Hooks
worden 100% gevolgd. Wat altijd moet gebeuren = hook, niet instructie.

De toekomstige ESLint-configuratie draait als pre-commit hook. Niet als
documentatie die "gelezen moet worden" maar als automatische bewaker die
bij elke commit controleert.

### 6.2 Werkrecept: god-file opsplitsen

Wanneer de cohesievraag "NEE" oplevert — dit bestand bevat concerns die
om verschillende redenen veranderen — dan is dit het werkrecept.
Onafhankelijk van component (Convex, scanner, dashboard, MCP server).

```
1. NADEN HERKENNEN
   Lees het bestand en stel per blok: "als ik dit wijzig,
   moet ik de rest begrijpen?" Elk "nee" is een naad.

2. DOELSTRUCTUUR SCHETSEN
   Benoem de nieuwe bestanden op concern, niet op technisch type.
   Het origineel wordt de dunne schil die delegeert.

3. EXTRACT — één naad per stap
   Verplaats één concern naar een nieuw bestand.
   Het origineel importeert en delegeert.
   Verifieer: tsc --noEmit (of framework-equivalent).

4. HERHAAL tot het origineel alleen routing/delegatie bevat.

5. OPRUIMEN
   Register bijwerken (sectie 3), god-file verwijderen uit sectie 5.
```

**Altijd de schaduwrefactor-strategie (ADR-044):** bouw naast het
origineel, schakel consumers over, verwijder als laatste. Dit geldt
voor elk component — niet alleen Convex. Het origineel is je referentie
en fallback zolang de migratie loopt.

**Convex extra aandachtspunt:** splitsen is daar ook een API-wijziging
(file-based routing), dus consumers moeten imports aanpassen. Bij
interne code (scanner, dashboard) zijn de consumers je eigen imports —
hetzelfde principe, kleinere blast radius.

**Wanneer NIET splitsen:**
- Eén concern dat groot is maar cohesief (OAuth server: 440 regels, 4 flows
  die bij elkaar horen)
- Minder dan 3 naden — dan is de indirectie duurder dan de winst
- Bestand dat zelden verandert — geen pijn, geen actie

### Geïmplementeerd (19 mei 2026, JNL-048)

De ESLint-configuratie is operationeel:

- `eslint.base.mjs` in root — gedeelde regels (`@typescript-eslint/recommended`,
  `no-unused-vars` als error, `no-explicit-any` als warn)
- Per-component configs: `dashboard/eslint.config.mjs` (+ Next.js),
  `scanner/eslint.config.mjs`, `mcp-server-janton/eslint.config.mjs`,
  `convex/eslint.config.mjs` (toegevoegd 30 mei — alle vier componenten gedekt)
- Pre-commit hook: `scripts/hooks/pre-commit` draait `bunx lint-staged`
  op staged bestanden in alle drie modules
- Push-hook (HDR-019 Moment 0): bij `git push` genereert
  `.claude/hooks/code-review-report.sh` een code-architectuur verslag
  dat bestandsgrootte, `any`-gebruik en cohesie-signalen toetst tegen
  het register in dit document (§3)
- CI: `lint-scanner` en `lint-mcp-server` jobs in `ci-quality.yml`

### 6.3 Repo-brede `any`-eliminatie (30 mei 2026)

De spelregel "sterke type-signatures op API-grenzen" (2.7) is repo-breed
afgedwongen: ~95 `any`-casts in productiecode teruggebracht naar **0 in scope**
(resterende voorkomens zijn comments of uitgesloten seed-scripts). Patroon:
`catch (e: any)` → `unknown` + narrowing, ongetypeerde mappers → afgeleid
element-type, externe-data-grenzen → expliciet type (hergebruik `Doc<…>`).

**Werkwijze — batch van 10 worktree-units.** Het werk is gesneden in tien
onafhankelijke, niet-overlappende units (per module), elk in een eigen
git-worktree door een parallelle agent, elk geverifieerd met `tsc --noEmit`
+ eslint + build en geleverd als PR naar `development`. Disjuncte slices →
conflictvrij samen te voegen.

**Learning — `worktree.baseRef: head` (harde les).** De eerste ronde takte
elke worktree standaard van `main` af in plaats van `development`. Omdat
development vóórloopt, werkten de agents op verouderde bestanden; "clean"
merges combineerden stille-basis-edits met nieuwere code. Symptoom: een
conflict op `arc-pull.ts`/`arc-status.ts` (PDR-021). De fix is een vangrail:
zet `worktree.baseRef: "head"` in `.claude/settings.json` zodat worktrees
altijd van de huidige branch aftakken. Verifieer bij twijfel de basis van een
worktree (merge-base met de werkbranch) vóór je een zwerm loslaat.

### 6.4 Het vangnet sluitend (3 juni 2026)

De push-hook bleek drie lekken te hebben waardoor bestanden door het mandje
vielen — ontdekt toen de register-getallen verlopen bleken (DFT). De oorzaak
was geen slordigheid maar een categoriefout: het register bewaarde een
*meetbaar* feit (regelaantal) met de hand, dus drift was onvermijdelijk.

| Lek | Symptoom | Fix |
|-----|----------|-----|
| Plafond niet afgedwongen | `page.tsx` 17 regels over zijn plafond las als generiek 🟠 | hook leest `plafond` en toetst eraan |
| Sweep over register-sleutels | ongeregistreerde gegroeide bestanden onzichtbaar (`settings/page.tsx` 402, `Groeipad.tsx` 325) | sweep loopt over de schijf |
| `ok`-bestanden overgeslagen | `SecurityDot.tsx` groeide 275→372 ongemerkt | `ok` en onbekend identiek behandeld |

Kern-learning: **bewaar in een register alleen wat je niet kunt meten — de
beslissing. Laat het meetbare meten.** Het regelaantal is sindsdien een
afgeleide momentopname (`register-sync.ts`), geen handwerk. Zie §3 "De code
is de waarheid".

### 6.5 Tests als tweede vangnet — Vitest (3 juni 2026)

Laag 1 van het vangnet (types + lint + hooks) toetst of de code *klopt*. Het
zegt niets over of de code *doet wat we bedoelen*. Daarvoor hangt sinds ADR-049
een tweede net: unit tests met Vitest op de pure logica — het zwaartepunt op de
scoremachine van de scanner, de cijfers die de klant ziet. Een fout daar crasht
niet, hij liegt.

- **Twee momenten.** Lokaal draait de pre-commit alleen de geraakte tests
  (`vitest related`, snel — `scripts/test-related.ts` via lint-staged). In CI
  draait de volledige suite met coverage, blokkerend op PR's én op push naar
  `development`.
- **De lat gaat alleen omhoog.** De coverage-drempel is een ratel
  (`autoUpdate`): stijgt de dekking, dan wordt dat de nieuwe ondergrens; zakt
  ze, dan piept CI. Geen vanity-cijfer.
- **Meet alleen pure logica.** I/O-randen (Convex, OAuth, git, GitHub) blijven
  buiten de meting — die horen bij integratie/E2E, niet bij laag 2.

Fase 4 (een agent die ontbrekende tests zelf aanvult) is bewust nog niet
gebouwd; de open keuzes liggen in JNL-061.

---

## 7. Verwijzingen

### Beslissingen achter dit document

| Beslissing | Relatie |
|------------|---------|
| ADR-043: Convex Code-architectuur | Convex-specifieke spelregels, dit document generaliseert naar alle componenten |
| ADR-044: Schaduwrefactor-strategie | Migratiepad voor god file opsplitsing (strangler fig) |
| ADR-021: Convex Datamodellering | Complementair: data-organisatie vs. code-organisatie |
| ADR-049: Scanner-testarchitectuur | Tweede vangnet — Vitest unit tests, coverage-ratchet, CI-gate (§6.5) |

### Externe bronnen

| Bron | Kernbevinding |
|------|---------------|
| CodeScene — Agentic AI Coding Best Practices (2025) | Agents vereisen code health 9.4+/10; bij ongezonde code 60%+ meer defecten |
| JetBrains Research — Efficient Context Management (NeurIPS 2025) | 84% agent-tokens = observatie; minder irrelevante context = 52% goedkoper |
| Factory AI — Using Linters to Direct Agents (2025) | Codify standaarden als lint-regels; agents self-healen |
| Anthropic — Claude Code Best Practices (2025) | CLAUDE.md ~80% gevolgd, hooks 100% |
| CodeRabbit — State of AI vs Human Code (dec 2025) | AI code: 10.83 issues/request vs 6.45 menselijk (1.7x meer) |
| Addy Osmani — The 80% Problem in Agentic Coding | AI brengt je naar 80%; de overige 20% = NFRs |
| Armin Ronacher — Agentic Coding Recommendations | Vermijd complexe abstractie; agents presteren slecht met ORM-lagen en diepe afhankelijkheden |
| Ben Houston — Agentic Coding Best Practices | Platte directorystructuren, sterke type-signatures |
| Atlassian Engineering — Faster Builds by Removing Barrel Files | 75% snellere builds na verwijdering barrel files |
| Cursor — Agent Best Practices | Modulaire rules <500 regels, composable |

### Codebase-snapshot (6 mei 2026)

| Component | Bestanden | Regels | Gemiddelde |
|-----------|-----------|--------|------------|
| Dashboard | 136 | 17.490 | 129 |
| Scanner | 119 | 9.542 | 80 |
| Convex | 54 | 11.504 | 213 |
| MCP Server | 141 | 5.115 | 36 |
| **Totaal** | **450** | **78.198** | **174** |

### Hoe dit document evolueert

- Nieuwe spelregel → toevoegen aan sectie 2 met rationale en bron
- Nieuw bestand boven drempel → toevoegen aan register (sectie 3)
- God file opgelost → verwijderen uit sectie 5, verplaatsen naar register
  als "afgerond"
- ESLint-configuratie geimplementeerd → sectie 6 bijwerken met concrete
  bestandspaden en regelwaarden

---

*Bron: ARC, code-architectuur.md, juni 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
