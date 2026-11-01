---
titel: "plan.md overzetten naar het grootboek"
type: spec
soort: plan van aanpak
status: concept
datum: 1 november 2026
auteurs: Jaron, Mama Claude
---

# plan.md overzetten naar het grootboek

**De kern.** `docs/plan.md` (1334 regels) stopt als bron. Alles wat daarin een beslissing, regel
of open vraag is, wordt een record in het grootboek, in het Nederlands, met het *waarom* intact.
Wat alleen beschrijft hoe de code in elkaar zit, gaat niet mee: daar is de code de waarheid.
Niets valt weg zonder dat je het kunt aanwijzen: elke regel van het plan krijgt een bestemming,
en een script controleert dat.

Dit document is de inventaris. Het zegt per onderdeel van het plan waar het heen gaat, welke
keuzes nog bij jou liggen, en in welke volgorde het werk loopt. Tot jij de keuzes in
"Wat jij beslist" hebt gemaakt, is het een voorstel.

## Wat er in het plan staat

Vier soorten inhoud, en alleen de eerste twee worden records.

| Soort | Waar | Omvang |
|---|---|---|
| **Beslissingen** | tabel Decisions, decision log, delen van Stage 4 en Design system | 16 rijen + 207 logregels |
| **Open vragen en geaccepteerde risico's** | Open questions | 14 punten |
| **Werkafspraken** | Verification, Keeping the experiment honest | twee blokken |
| **Beschrijving van de code** | State model, Config flow, File layout, Next.js 16 specifics, Build stages | zo'n 530 regels |

Het decision log is de zware: 207 rijen van 23 september tot 30 oktober 2026, waarvan 112 met
Source `you`, 87 `agent` en 8 `ported`. Acht rijen zijn van 20 oktober of later (de grens uit HDR-001,
grootboek-stelsel), omdat een wijziging die het plan tegensprak in het plan moest worden gelogd.

## Per onderdeel: waar het heen gaat

De regelnummers zijn die van de koppen in `docs/plan.md`, nu.

| Onderdeel | Regels | Voorstel |
|---|---|---|
| Voorwoord | 1–12 | Vervalt. De regel "plan in dezelfde commit" wordt vervangen in `CLAUDE.md`. |
| Context | 14–28 | Wat de app is staat in README ("Who it is for"). Het experiment-kader gaat naar één PDR, herschreven naar het experiment dat blijft: werkwijze, met een app die echt gebruikt wordt (keuze 6). De spike-beschrijving vervalt (de spike staat in de repo, `findings.md` blijft). |
| Fixed constraints | 32–43 | Eén PDR (geen persistentie, Safari als harde eis, geen WebSocket-server van ons). De technische punten komen terug in de ADR's hieronder. |
| Decisions | 47–66 | ADR's, een paar PDR/HDR. Zie keuze 1 voor het aantal. ADR-001 (omgevingen en deployment) overlapt met de rij Hosting. |
| State model | 70–170 | Beslissingen eruit (waarom `editing` een eigen state is, waarom het live transcript buiten de thread leeft) naar ADR's. De beschrijving vervalt of gaat naar de software-balans. |
| Config flow | 171–193 | Beschrijving: vervalt of balans. |
| File layout | 194–299 | Vervalt: de code en `src/*/CLAUDE.md` zijn de waarheid. |
| Design system | 300–414 | Redenen van eenmalige keuzes worden records; feiten over de code en de afwijkingenlijst vervallen (keuze 4). |
| Reused from the spike | 415–434 | Vervalt (historie). |
| Safari/iPhone requirements | 435–484 | Eén ADR met de genummerde eisen en hun reden. `.claude/rules/safari-ios.md` blijft de korte vorm en verwijst ernaar. |
| Next.js 16 specifics | 485–514 | Vervalt: afgeleid van `node_modules/next/dist/docs`, waar `AGENTS.md` al naar verwijst. |
| Build stages 1–4 | 515–786 | Het ontwerp van stage 4 (evaluatie per beurt in een eigen call, drie-weg-vergelijking) wordt een ADR; de zwakke plekken gaan naar een JNL. De rest is historie: git en de PR's bewaren het. |
| Out of scope | 787–799 | Eén PDR (geen open-microfoonmodus, geen landscape-minimum). |
| Verification | 800–818 | Overlapt met de bullet "Checks before you call something done" in `CLAUDE.md`. Het verschil gaat naar een HDR, de rest vervalt. |
| Open questions | 819–1053 | Drie zijn beslist (1, 3, 5) en worden ADR/PDR. Twee staan al in het grootboek: punt 9 in ADR-002 (routes zonder authenticatie) en JNL-001 (instap software-balans), punt 11 in JNL-003 (animatie chatbubbels). De overige negen gaan als kwesties in één nieuw JNL. |
| Decision log | 1054–1278 | Zie keuze 2. |
| Keeping the experiment honest | 1279–1334 | Eén HDR in kortere vorm (keuze 6): de bestaande repo is geen bron, tenzij Jaron een specifiek bestand aanwijst. Het logboek van wat de agent zag gaat als archief mee. |

## Wat jij beslist

1. **Granulariteit van de Decisions-tabel.** 16 rijen kunnen 16 records worden, of 11 als je
   verwante rijen samen neemt (State + Turn states + Turn identity; de drie TTS-rijen;
   Conversation history met de achterhaalde "Chat response shape"). *Besloten: 11.* Het
   scheelt vijf records die elkaar steeds moeten citeren.
2. **Het decision log (207 rijen).** Eén record per rij is te zwaar, en veel rijen zijn
   uitwerking ("Session config line removed from the conversation screen"). *Besloten:*
   groeperen per thema, één record per thema. Elk record noemt de rijen waar het uit komt
   (datum en eerste woorden), zodat geen rij verdwijnt. Een rij die later is ingehaald, komt
   als voorgeschiedenis in het record dat haar vervangt. Het aantal records weet ik pas na
   de classificatie van de 207 rijen. Dat is de eerste stap van de proef.
3. **Source-kolom en datums.** *Besloten:* het veld Source komt niet terug. Het experiment
   "wat bouwt een AI op eigen houtje" wordt niet meer formeel vergeleken, dus Jaron zou het
   veld in de praktijk niet gebruiken. Overgezette records krijgen geen `herkomst`; de
   oorspronkelijke datum komt in `datum`. De acht `ported`-rijen houden hun inhoud (dat iets
   uit de bestaande app komt, staat in de tekst). Een nieuwe HDR (HDR-015) boekt de
   overzetting en vervangt ADR 0001; HDR-001 zelf verandert niet.
4. **Waar hoort het design system en de productkant?** De PDR-register is leeg en de
   software-balans dekt "design" bewust niet. Drie opties: PDR's per beslissing, een eigen
   product-balans, of de regels laten in `src/components/CLAUDE.md` en alleen de redenen
   overzetten. *Besloten:* de app wordt vanaf nu zelfstandig uitgebouwd en niet meer gesynchroniseerd
   met de bestaande app, dus een lijst afwijkingen is niet nodig. De redenen van de
   eenmalige keuzes (fonts, safe area, bevel, iconen) worden records; de feiten over de code
   vervallen. De regels blijven in `src/components/CLAUDE.md`, waar de zinnen over re-sync
   en de lijst in `plan.md` vervallen (leidend document: jij ziet eerst het diff).
5. **Wat gebeurt er met `plan.md`?** *Besloten:* bevriezen met een kop bovenaan ("niet meer
   bijwerken, zie het grootboek") tot de volledigheidscontrole slaagt, en daarna verwijderen
   in een aparte commit. Git bewaart het.
6. **Het experiment en de referentie-app.** *Besloten:* de bestaande app is geen bron
   meer, tenzij Jaron een specifiek bestand aanwijst; deze app staat op zichzelf en wordt
   verder uitgebouwd. Het experiment blijft, maar
   als experiment in werkwijze (hoe werk je met een AI die de code schrijft), niet als
   vergelijking met de referentie, en met als doel een app die daadwerkelijk gebruikt wordt.
   De regel "Keeping the experiment honest" blijft, korter, als HDR. *Nog open:* de README ("Why this repo
   exists") past hier niet meer bij; dat is Jaron's eigen tekst.

## Werkwijze

1. **HDR-015 boeken**: het besluit om het plan te laten vervallen, inclusief de keuzes van
   hierboven. Daarnaast PDR-001: waarom dit project bestaat en dat het op zichzelf staat.
   Ook `docs/index.yml` en het register.
2. **Een volledigheidscontrole bouwen** (script met test, in het Engels zoals alle code). Hij
   leest een bevroren versie van `plan.md` en eist dat elke regel uit Decisions, het
   decision log en Open questions in precies één record onder "Herkomst" voorkomt of
   expliciet als "vervalt" is gemarkeerd. Verwijzingen gebruiken het commit-hash van het
   plan, zodat regelnummers niet verschuiven.
3. **De proef**: vijf rijen uit verschillende soorten (een `you`-rij, een `agent`-rij, een
   `ported`-rij, een ingehaalde rij, een Decisions-rij). Jij leest ze. Daar beslis je
   definitief over getrouw of herschreven; mijn voorstel is getrouw, met het waarom
   overgenomen.
4. **De rest per thema in batches**, met subagents die elk hun eigen recordbestanden
   schrijven (disjuncte bestanden). De registers en `CLAUDE.md` blijven mijn werk in de
   hoofdthread. Elke batch krijgt een reviewer die bron en record naast elkaar legt, met de
   vraag: is de reden nog dezelfde?
5. **Afbouwen**: de verwijzingen naar `plan.md` bijwerken, `CLAUDE.md` herschrijven (waar je
   de wijziging eerst ziet), de plan-check in `check-docs.mjs` aanpassen, ADR 0001 vervangen,
   en dan `plan.md` bevriezen en later verwijderen.

## Wat er mee moet verhuizen

Dit verwijst nu naar `plan.md` en moet na de overzetting naar het grootboek wijzen:
zeven comments in code (`src`, `scripts`, `.claude`), veertien grootboekdocumenten,
`CLAUDE.md`, `README.md`, `docs/index.yml` (`plan_sections` en `decisions`),
`docs/code-architectuur.md`, `docs/ios-stt-runs.md`, twee agent-bestanden, de skill
`stage-review`, `.claude/rules` en `scripts/check-docs.mjs`.

## Vervalt

Rijen van het plan die niet als record meegaan, met de reden.

- L13 (09-25) This plan moved into the repo as `docs/plan.md` — het plan zelf vervalt als bron (HDR-015, plan.md vervalt als bron)
- L23 (09-28) This Source column added, filled retroactively — het veld Source komt niet terug (HDR-015, plan.md vervalt als bron)

## Bronnen

- `docs/plan.md`: de bron van de overzetting; regelnummers hierboven zijn van de koppen.
- `docs/adr/0001-decisions-live-in-the-plan.md`: het besluit dat HDR-015 vervangt.
- HDR-001 (grootboek-stelsel): de grens van 20 oktober en het ontbreken van het veld Source.
- HDR-014 (documentatie in het Nederlands): de taal waarin de nieuwe records worden geschreven.
- `docs/grootboek/software-architectuur.md`: de balans waar beschrijvend materiaal heen kan.
- `docs/grootboek/registers/`: waar elke nieuwe record een regel krijgt.
