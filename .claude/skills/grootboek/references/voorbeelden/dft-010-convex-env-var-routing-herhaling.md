---
titel: "DFT-010: Convex Env Var Routing — Terugkerend Probleem"
type: drift-rapport
datum: 7 april 2026
status: resolved
aanleiding: >
  SCANNER_URL op Convex dev stond op de prod Railway URL. Scans werden
  naar de verkeerde omgeving gestuurd. Derde keer dat env vars op de
  verkeerde Convex deployment terechtkomen (zie DFT-004 #9, DFT-006).
bevindingen: 6
hoog: 2
midden: 2
laag: 2
---

# DFT-010: Convex Env Var Routing — Terugkerend Probleem

> **Illustratieve referentie — onderdeel van de grootboek-skill.**
> Dit is een echt, ongewijzigd ARC-document, bijgesloten zodat je voelt hoe een
> DFT van symptoom via patroon naar kwesties en doorvoerbare besluiten komt — als
> een detective-rapport. Verwijzingen naar andere grootboek-documenten en ARC-code
> dienen als illustratie van *hoe* een DFT drift terugvoert op zijn bron — buiten
> het ARC-project zijn die paden niet op te zoeken. Het gaat om de vorm.

## Hoofdboodschap

**Convex env vars belanden herhaaldelijk op de verkeerde deployment. Dit is een structureel probleem, geen incidentele fout.**

Dit is de derde keer:
1. **DFT-004 #9** (6 april 2026) — SCANNER_SECRET mismatch tussen Convex prod en Railway prod
2. **DFT-006** (6 april 2026) — `npx convex env set --url` negeert de `--url` flag als `CONVEX_DEPLOYMENT` in `.env.local` staat
3. **DFT-010** (7 april 2026) — SCANNER_URL op dev Convex wijst naar prod Railway. Scan-resultaten komen niet terug.

## Aanleiding

7 april 2026: scan gestart vanuit het dashboard op dev. Scanner op Railway ontving geen trigger. Na 4 minuten wachten: geen resultaat. Diagnose: `SCANNER_URL` op Convex dev stond op `https://arc-production-31f7.up.railway.app` (prod) in plaats van `https://arc-dev.up.railway.app` (dev).

## Root Cause

De Convex CLI (`npx convex env set`) target de deployment op basis van de lokale `.env.local` configuratie. Er is geen expliciete `--deployment` flag. Na een branch-wissel verandert `.env.local` via de post-checkout hook, maar:

1. Als de env var gezet wordt **tijdens** een branch-wissel of **vlak erna** (voordat de hook klaar is), gaat het naar de verkeerde deployment
2. Er is **geen validatie** dat env vars per omgeving kloppen
3. Er is **geen waarschuwing** als een env var een waarde heeft die bij een andere omgeving hoort

## Bevindingen

| # | Bevinding | Ernst | Status |
|---|-----------|-------|--------|
| 1 | SCANNER_URL op dev Convex wees naar prod Railway — scans kwamen niet terug | hoog | resolved |
| 2 | Geen automatische validatie van env vars per omgeving | midden | open |
| 3 | Convex CLI heeft geen expliciete deployment-selector voor env commando's | laag | platform-beperking |
| 4 | Railway dev miste 6 env vars compleet — Dashboard toonde "found in production, missing in this one" | hoog | resolved |
| 5 | ANTHROPIC_API_KEY op Railway dev was corrupt door encoding — `"CLAUDE_DEBUG="1"` geplakt aan het einde | midden | resolved |
| 6 | `reportScanFailure` callback bereikt Convex niet bij auth-fouten — pending scan blijft hangen | laag | open (ADR-016) |

## Impact

- Scan-resultaten verloren (scanner rapporteert succes maar callback gaat naar verkeerde Convex)
- Uren debugging over meerdere sessies
- Vertrouwen in de omgevingsscheiding (ADR-012) ondermijnd
- Terugkerend patroon: drie keer in twee dagen

## Oplossingsrichtingen

### 1. Convex MCP in plaats van CLI (direct)
De Convex MCP tool heeft een expliciete `deploymentSelector` — die kan niet naar de verkeerde deployment gaan. Regel: **gebruik nooit `npx convex env set` voor env vars. Gebruik altijd de MCP tool of het Convex Dashboard.**

### 2. Env var validatie-script (kort termijn)
Een script dat de verwachte env var waarden per omgeving checkt:

```bash
# scripts/verify-convex-env.sh
# Controleert of Convex env vars kloppen voor de huidige omgeving
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "development" ]; then
  EXPECTED_SCANNER_URL="https://arc-dev.up.railway.app"
elif [ "$BRANCH" = "main" ]; then
  EXPECTED_SCANNER_URL="https://arc-production-31f7.up.railway.app"
fi
ACTUAL=$(npx convex env get SCANNER_URL 2>/dev/null)
if [ "$ACTUAL" != "$EXPECTED_SCANNER_URL" ]; then
  echo "FOUT: SCANNER_URL is '$ACTUAL', verwacht '$EXPECTED_SCANNER_URL'"
  exit 1
fi
```

### 3. Env vars in code definiëren (lang termijn, ADR-016)
Bij de scanner communicatielaag (ADR-016): de SCANNER_URL hoeft geen env var te zijn als de scanner een Convex client gebruikt. De URL wordt dan een code-constante per deployment.

## Relatie met andere documenten

- **DFT-004** — eerste manifestatie (SCANNER_SECRET mismatch)
- **DFT-006** — CLI routing bug gedocumenteerd
- **ADR-012** — omgevingsarchitectuur (de scheiding die we proberen te handhaven)
- **ADR-016** — scanner communicatielaag (structurele oplossing)

## Resolutie (7 april 2026, avond)

### Chronologie van de avondsessie

1. **SCANNER_URL op Convex dev** wees naar prod Railway → gecorrigeerd via MCP envSet
2. **SCANNER_SECRET op Convex dev** was de prod waarde → gecorrigeerd naar dev waarde (`050e9b38...`)
3. **Railway CLI was gelinkt aan production** → alle eerdere CLI-output toonde prod vars, niet dev
4. **Railway dev miste 6 env vars** → Dashboard toonde "6 variables found in production, missing in this one". CONVEX_DEPLOY_KEY, CONVEX_URL, SCANNER_SECRET, CLAUDE_DEBUG, GITHUB_TOKEN, CONVEX_SITE_URL ontbraken volledig op dev
5. **ANTHROPIC_API_KEY was corrupt** → bevatte `"CLAUDE_DEBUG="1"` aan het einde door Railway Raw Editor encoding. Scanner gaf "Invalid API key"
6. **Alle vars in één push gezet** via `npx railway variables set` met 6 key=value pairs
7. **Vier-ogen verificatie** via Railway Dashboard (browser) → 9 Service Variables bevestigd
8. **Scan geslaagd** → overall 84, resultaten teruggekomen in Convex dev

### Werkregel: vier-ogen principe

Bij env var wijzigingen altijd:
1. CLI (of MCP) om te wijzigen
2. Browser (Dashboard) om te verifiëren
3. `npx railway status` vóór elke Railway CLI operatie om environment te checken

### Openstaand

- Bevinding 2: geen automatische validatie van env vars per omgeving
- Bevinding 6: `reportScanFailure` callback werkt niet bij auth-fouten (ADR-016 scope)
- Root cause van verdwijnende Railway dev vars is onbekend

## Status

**Resolved** — alle env vars gecorrigeerd op Convex dev en Railway dev. Scan werkt op dev en prod. Structurele oplossing (automatische validatie) nog open.

---

*Bron: ARC, dft-010-convex-env-var-routing-herhaling.md, 7 april 2026 — bijgesloten als
illustratief voorbeeld (PDR-022).*
