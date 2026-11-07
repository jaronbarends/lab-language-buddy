---
titel: "ADR-021: Convex Datamodellering — Leidende Principes"
type: architecture-decision-record
datum: 12 april 2026
status: voorstel
versie: "1.0"
implementatie: 0
omgeving: geen
context: >
  ARC gebruikt Convex als operationele document store (ADR-003). Convex heeft
  geen JOINs — dat verandert de afwegingen rond normalisatie fundamenteel.
  Dit ADR legt twee leidende principes vast en beschrijft vier patronen
  waarmee elke tabel- en relatiebeslissing consistent wordt genomen.
---

# ADR-021: Convex Datamodellering — Leidende Principes

> **Illustratieve referentie — onderdeel van de grootboek-skill.**
> Dit is een echt, ongewijzigd ARC-document, bijgesloten zodat je voelt hoe een
> ADR van botsende krachten via principes en patronen naar een beslissingsmatrix
> komt. Verwijzingen naar andere grootboek-documenten en ARC-code dienen als
> illustratie van *hoe* een ADR zijn omgeving aanhaakt — buiten het ARC-project
> zijn die paden niet op te zoeken. Het gaat om de vorm.

## Kernboodschap

Drie principes sturen elke databeslissing in ARC:

1. **Normaliseer tenzij** bewezen performance-probleem
2. **Aggregeer incrementeel tenzij** het cross-tenant of historisch is
3. **Respecteer cohesie** — wat als één ding bestaat, leeft als één ding

Alle drie werken omdat Convex flexibel is: schema-wijzigingen zonder
downtime (widen-migrate-narrow) maken elke keuze reversibel. Begin
eenvoudig, pas aan als het moet. De kosten van te vroeg optimaliseren
(complexiteit, fan-out bugs) zijn hoger dan de kosten van later migreren.

---

## Principe 1: Normaliseer tenzij

**Aparte tabellen, referenties via ID, index op de foreign key.**

In SQL is normalisatie goedkoop omdat JOINs efficiënt zijn. In Convex
zijn er geen JOINs — je doet meerdere lookups. Maar elke lookup op een
index is ~ms, en Convex's reactieve cache elimineert herhaalde reads.
N+1 lookups op kleine N (< ~50) zijn geen probleem.

**ARC-voorbeeld: metingen als eigen tabel**

Het V2 datamodel (data-v2-informatieontwerp) slaat metingen op als eigen
tabel — niet als JSON-string in het scan-record:

```
scans (1 per analyse-run)
  │
  └──< metingen (43 per scan, eigen tabel)
              └── steps[] (2-5 per goal, embedded array — Principe 3)
```

Waarom metingen als eigen tabel? Omdat je per dimensie wilt kunnen
filteren (`by_scan_and_dimension`), en omdat een admin-tool metingen
los moet kunnen tonen en doorzoeken. Zodra data een eigen query-patroon
heeft, hoort het in een eigen tabel.

Waarom steps embedded? Omdat stappen altijd samen met het doel worden
geladen en nooit los worden doorzocht (Principe 3: cohesie).

**Wanneer afwijken:** Alleen bij bewezen performance-probleem. Meld het,
meet het, beslis samen (zie escalatieprotocol).

---

## Principe 2: Aggregeer incrementeel tenzij

**Werk aggregaten bij in dezelfde mutation als de brondata.**

Convex is reactief: als je een aggregaat bijwerkt bij elke scan, ziet
het dashboard de wijziging instant via de subscription. Geen polling,
geen nachtelijke cron, geen stale data.

**ARC-voorbeeld: trend-berekening**

Het V2 ontwerp berekent trends uit de laatste 8 scans — geen aparte
trend-tabel. Dat is de genormaliseerde start. Als dit later te traag
wordt (veel scans, complexe berekeningen), bouw je een materialized
aggregate dat bij elke scan-completion wordt bijgewerkt.

```typescript
// In de mutation die een scan opslaat:
await ctx.db.patch(aggregateId, {
  avgScore: recalculate(agg, newScanScore),
  totalScans: agg.totalScans + 1,
  lastScanAt: Date.now(),
});
```

**Wanneer afwijken:** Bij cross-tenant analytics (alle klanten samen)
of complexe historische berekeningen (90-dagen trends over duizenden
records). Dan een nachtelijke rebuild of een externe analytics-database.
Maar: bouw die pas als je een concrete vraag hebt die Convex niet kan
beantwoorden.

---

## Principe 3: Respecteer cohesie

**Wat als één ding bestaat, leeft als één ding.**

Cohesie is het tegengif tegen overengineering. Als data nooit los van
de parent wordt gelezen, geschreven of doorzocht, dan is het een
**onderdeel** van de parent — geen eigen entiteit.

De embed-vuistregels (zie Patroon 2) zijn de test. Dit principe is
de reden. Het voorkomt dat je dingen uit elkaar trekt die bij elkaar
horen. Net zoals naam en adres bij een user horen tenzij je adressen
los gebruikt, horen stappen bij een doel tenzij je stappen los
doorzoekt.

In Domain-Driven Design heet dit het **aggregate-patroon**: een cluster
van entiteiten dat als één eenheid wordt behandeld. De buitenwereld
praat met de **aggregate root** (bijv. Goal). De binnenwereld (bijv.
Stappen) is onzichtbaar van buitenaf.

**Lakmoesproef:**

> *"Gebruik ik dit ooit los, zonder de parent?"*
> - **Ja** → eigen tabel (Principe 1: normaliseer)
> - **Nee** → het hoort bij de parent (Principe 3: cohesie)

**ARC-voorbeeld: stappen embedded in metingen**

Stappen (2-5 concrete checks per doel) worden altijd samen met het
doel geladen, nooit los doorzocht, en zijn zinloos zonder het doel.
Alle vier de embed-vuistregels kloppen → embedding als `v.array()`.

```typescript
// Goal met embedded steps — cohesie in actie
metingen: defineTable({
  scanId: v.id("scans"),
  goalCode: v.string(),
  // ...
  steps: v.array(v.object({
    label: v.string(),
    completed: v.boolean(),
    prompt: v.optional(v.string()),
  })),
})
```

**Wanneer twijfel:** Als je niet zeker weet of data ooit los gebruikt
wordt, begin dan embedded (cohesie). Uitbreken naar een eigen tabel
is een eenvoudige migratie in Convex. Samenvoegen is lastiger.

---

## Vier patronen

### Patroon 1: Genormaliseerd (standaard)

Aparte tabellen met referenties. Altijd een index op de foreign key.

**ARC:** `metingen` verwijst naar `scans` via `scanId`. `coaching` verwijst
naar `scans` via `scanId`. Beide met eigen index.

**Wanneer:** Altijd de startpositie.

### Patroon 2: Embedded subdocument

Data als `v.array(v.object({...}))` of `v.object({...})` in het
parent-record. De data leeft fysiek in hetzelfde document — geen
tweede query nodig.

**Vuistregel — embed alleen als alle vier kloppen:**
- Altijd samen met de parent geladen
- Beperkt aantal items (< ~20)
- Geen eigen query-patronen (niet los doorzoeken)
- Zinloos zonder de parent

**ARC-leermoment: stappen.** Een eerder technisch advies suggereerde
stappen als eigen tabel. Na doorleving met de producteigenaar is de
beslissing: **embedded array in metingen**. Waarom? Stappen scoren vier
van vier op de embed-vuistregels: altijd samen geladen, beperkt aantal
(2-5), geen eigen query-patronen, zinloos zonder het doel.

De admin-bril (metingen bewerken, stappen aanpassen) gaat altijd via het
doel — nooit via de stap. Dat is het cohesie-principe (Principe 3)
in actie.

### Patroon 3: Materialized aggregate

Een apart record dat afgeleide data bijhoudt, incrementeel bijgewerkt
bij elke relevante mutatie. Niet hetzelfde als denormalisatie — het
aggregaat is een berekening, geen kopie.

**ARC:** Een toekomstige `orgAggregates`-tabel die per enterprise de
gemiddelde scores, aantal scans en repo-breakdown bijhoudt. Bijgewerkt
bij elke scan-completion. Het dashboard leest één record.

**Wanneer:** Als dezelfde berekening herhaaldelijk wordt uitgevoerd
en de brondata niet verandert na creatie (scans zijn immutable snapshots).

### Patroon 4: Denormalisatie (bewuste uitzondering)

Data kopiëren naar het leesrecord om lookups te elimineren. Introduceert
fan-out writes: bij elke wijziging aan de bron moeten alle kopieën
worden bijgewerkt.

**Fan-out grenzen:**

| Scope | Acceptabel? |
|-------|-------------|
| < 100 records | Altijd OK |
| 100 - 1.000 | OK als zelden (< 1x/week) |
| 1.000 - 10.000 | Alleen met batch-mutation |
| > 10.000 | Vermijd — gebruik patroon 1 of 3 |

**Wanneer:** Alleen als patroon 1 een bewezen performance-probleem geeft
en patroon 3 (aggregatie) niet past. Documenteer waarom in een ADR.

---

## Beslissingsmatrix

Bij elke nieuwe tabel of relatie:

```
                    Verandert ZELDEN          Verandert VAAK
                 ┌────────────────────┬────────────────────┐
  Gelezen        │  Kandidaat voor    │                    │
  VAAK           │  denormalisatie    │  Normaliseer       │
                 │  (maar alleen bij  │                    │
                 │  bewezen probleem) │                    │
                 ├────────────────────┼────────────────────┤
  Gelezen        │                    │                    │
  ZELDEN         │  Normaliseer       │  Normaliseer       │
                 │                    │                    │
                 └────────────────────┴────────────────────┘
```

---

## Migratie is reversibel

De keuze voor normalisatie als default is risicovrij dankzij
widen-migrate-narrow:

1. **Widen** — voeg nieuwe optionele velden toe (schema breekt niet)
2. **Migrate** — batch-mutation vult de nieuwe structuur (zonder downtime)
3. **Narrow** — code leest nieuwe velden, oude worden deprecated

Dit werkt in beide richtingen: genormaliseerd → gedenormaliseerd, en
terug. ARC heeft dit bewezen bij de ownerId-migratie.

---

## Operationele store vs. analytics

Convex is een operationele store: real-time reads/writes per tenant.
Cross-tenant analytics is niet waar het voor gebouwd is.

**Nu (ARC-schaal):** Aggregatietabellen in Convex volstaan. Max ~100
repo's per enterprise, scans per dag — incrementele aggregatie is
meer dan genoeg.

**Later (enterprise-schaal):** Export naar analytics-database als
cross-tenant queries of complexe historische analyses nodig zijn.

**Spelregel:** Bouw geen analytics-database tot je een concrete vraag
hebt die Convex niet kan beantwoorden.

---

## Escalatieprotocol

Als Claude Code een performance-risico detecteert:

1. **Signaleer** — "Dit patroon kan traag worden bij > N records"
2. **Meet** — Toon de geschatte kardinaliteit en leesfrequentie
3. **Adviseer** — Welk patroon past beter, en waarom
4. **Wacht op Janton** — Denormalisatie is een bewuste keuze

Claude Code mag zelfstandig kiezen tussen patroon 1 en 2 op basis van
de vuistregels. Patroon 3 en 4 vereisen afstemming.

---

## Begrippenlijst

| Begrip | Betekenis |
|--------|-----------|
| **Atomiciteit** | Alles-of-niets. Alle writes in één Convex mutation slagen, of geen enkele. Faalt de derde write, dan worden de eerste twee teruggedraaid. |
| **Kardinaliteit** | De verhouding tussen records in tabellen. 1:1 (één-op-één), 1:N (één-op-veel), N:M (veel-op-veel). Bepaalt hoe je relaties modelleert. |
| **Normalisatie** | Elke entiteit in een eigen tabel, verbonden via referenties (ID's). Geen gedupliceerde data. Single source of truth. |
| **Denormalisatie** | Data kopiëren naar het leesrecord zodat je minder lookups hoeft te doen. Sneller lezen, maar wijzigingen moeten op meerdere plekken worden doorgevoerd. |
| **Fan-out write** | Het gevolg van denormalisatie: als de bron verandert, moeten alle kopieën worden bijgewerkt. Bij 1.000 kopieën = 1.000 writes. |
| **Embedded subdocument** | Data die fysiek in het parent-document leeft, als nested object of array. Geen aparte tabel, geen extra query. |
| **Materialized aggregate** | Een apart record dat een berekening bijhoudt (som, gemiddelde, telling). Incrementeel bijgewerkt, niet telkens opnieuw berekend. |
| **Widen-migrate-narrow** | Convex-migratestrategie: (1) nieuwe optionele velden toevoegen, (2) data overzetten, (3) oude velden verwijderen. Zonder downtime, reversibel. |
| **Subscription** | Convex's reactieve mechanisme: het dashboard abonneert zich op een query en krijgt automatisch updates als de data verandert. Geen polling nodig. |
| **Index** | Een zoekstructuur op een tabel die lookups snel maakt. Zonder index moet Convex alle records doorlopen. Met index vindt het direct het juiste record. |
| **Foreign key** | Een veld dat verwijst naar een record in een andere tabel, bijv. `scanId: v.id("scans")`. De lijm tussen genormaliseerde tabellen. |
| **N+1 probleem** | Bij genormaliseerde data: eerst 1 query voor de parent, dan N queries voor de children. In SQL opgelost met JOINs, in Convex opgelost met indexes en caching. |
| **Operationele store** | Database geoptimaliseerd voor real-time lezen en schrijven per gebruiker/tenant. Convex is dit. |
| **Analytics store** | Database geoptimaliseerd voor zware queries over grote datasets heen. Bijv. "gemiddelde score over alle klanten." Convex is dit niet. |
| **Immutable snapshot** | Data die na creatie niet meer verandert. Goals in ARC zijn snapshots per scan — je vergelijkt ze over tijd, je wijzigt ze niet. |
| **Single source of truth** | Eén plek waar de waarheid leeft. Bij normalisatie is dat de eigen tabel. Bij denormalisatie heb je kopieën die uit sync kunnen raken. |

---

## Verwijzingen

- ADR-003: Backend & Database (Convex-keuze)
- ADR-020: Scorecard Datamodel (widen-migrate-narrow in praktijk)
- `docs/grootboek/specs/data-v2-informatieontwerp.md` (V2 datamodel)
- `docs/kompas/product/archief/productarchitectuur-v2.md` (productarchitectuur)

---

*Bron: ARC, adr-021-convex-datamodellering-principes.md, 12 april 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
