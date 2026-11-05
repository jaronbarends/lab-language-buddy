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

## Groepering van de rijen

Voorstel van 1 november 2026, gemaakt na het lezen van alle 237 rijen (16 Decisions, 207 logrijen,
14 open vragen). Elke rij staat op precies één plek; dat is mechanisch gecontroleerd. De Decisions
zijn hierin opgenomen bij het thema waar ze bij horen, zodat een record zowel de beslissing als de
latere rijen over hetzelfde onderwerp draagt. Jaron beslist per regel: record, samenvoegen met een
ander record, of vervalt. Dit is een voorstel, geen besluit.

Het levert 33 nieuwe records op (R19 vervalt, R25 gaat in R24), plus één JNL, bovenop de vijf van de
proef en de vier van batch 1.

| Nr | Voorstel | Type | Rijen | Opmerking |
|---|---|---|---|---|
| R1 | Next.js 16 met TypeScript strict | ADR | D1 |  |
| R2 | Hosting: Vercel | ADR | D2 | Overlapt met ADR-001 (omgevingen en deployment); dit record draagt de reden van de keuze |
| R3 | Styling: CSS Modules over het overgenomen design system | ADR | D4 |  |
| R4 | Sessiestate: één reducer, beurtstatus als discriminated union | ADR | D5-D7, L24, L26, L28, L101, L150 | L101 en L150 zijn codeniveau; schrap ze als je de reducer-comments genoeg vindt. Neem op: de lege-tekstcontroles in de reducer (`USER_TURN_SENT`) en in `ComposingControls` blijven bewust naast `composedTextOf` bestaan (uit L61) |
| R5 | Chat-API en gespreksgeschiedenis | ADR | D8-D9, L72, L75, L78, L81, L83 | D9 (response shape stage 2) is later ingehaald door de evaluatie; komt als voorgeschiedenis |
| R6 | TTS-providers en stemmen | ADR | D10, D12-D13, L92-L95, L106, L109, L180 |  |
| R7 | STT: providerkeuze en configuratie | ADR | D11, L161-L164, L168, L177, L181-L182, L187, L192-L193 | L177 is ingehaald door L181 (voorgeschiedenis); L161 vervangt een vaste randvoorwaarde |
| R8 | Vlaggen: flag-icons | ADR | D14, L4 |  |
| R9 | Fouten en herstel | ADR | D15, L25, L79-L80, L82, L86, L97, L103-L105, L110, L130, L149 | Groot (13 rijen); kan in twee: server en browser |
| R10 | Geen testsuite, behalve scripts die documenten herschrijven | HDR | D16, L202 | Q2 (tests) gaat naar het JNL |
| R11 | Persona van de AI | PDR | Q3 | Beslist voor stage 2; één open vraag van het plan |
| R12 | Sessieflow en schermen | PDR | L5, L8-L9, L16, L71 | L71 (Reply tijdens aiSpeaking) is gedrag, geen scherm |
| R13 | Knoppen | PDR | L6-L7, L55 |  |
| R14 | De luisterstip | PDR | L14-L15, L205 |  |
| R15 | Scroll en tekstvakken | PDR | L3, L63-L65, L138, L147 |  |
| R16 | De bubbel en het bewerkvak | ADR | L51-L54, L59, L137 |  |
| R17 | Markering van het gesproken woord | PDR | L46, L48-L49, L68, L98 | Hoort bij PDR-004 (L46 en L48 zijn daar al genoemd) |
| R18 | Design system overgenomen uit de bestaande app | ADR | L17-L18, L30 | Eenmalige overname, geen afwijkingenlijst (keuze 4) |
| R19 | (vervalt, zie sectie Vervalt) | — | L31-L34 | De redenen staan in de CSS-comments en er is geen afwijkingenlijst meer (besloten) |
| R20 | Typografie en iconen | PDR | L21, L43, L50, L56 | Kan in twee: typografie en iconen |
| R21 | Setup-formulier | PDR | L35-L39, L42 |  |
| R22 | Contrast en forced-colors: bewust geaccepteerd | PDR | L20, L40-L41, L57, L70, Q5 | Q5 (open vraag 5) is dezelfde zaak |
| R23 | Safari/iPhone: safe area en geaccepteerde beperkingen | ADR | L66-L67, L69 | Q7 en Q8 staan in het JNL |
| R24 | Native engine op iPhone: herstart en twee mitigaties | ADR | L166-L167, L173, L178-L179, L183-L185 | Q14 (niet begrepen) staat in het JNL. Samengevoegd met R25 (besloten) |
| R25 | (samengevoegd met R24) | — | — | |
| R26 | Deepgram-provider | ADR | L88-L90, L111, L165, L175 |  |
| R27 | ElevenLabs Scribe-provider | ADR | L188-L189, L191, L194-L197, L199 | Deels codeniveau |
| R28 | Taalregistry | ADR | L58, L169, L174, L190 |  |
| R29 | Evaluatie per beurt, in een eigen call | ADR | L112, L115-L116, L121, L123, L131-L132, L135, L145-L146, L154, Q1 | Heeft ingehaalde stappen (één call, stateless); de metingen blijven |
| R30 | Hoe de correctie eruitziet | PDR | L113-L114, L117-L119, L128-L129, L136, L140 | L114 is ingehaald door L117 |
| R31 | Prompts van de corrector | ADR | L120, L124-L126, L133, L153, L171 |  |
| R32 | Antwoord pas na de correctie | PDR | L127, L134, L141-L142 |  |
| R33 | Mockmodus voor ontwikkeling | ADR | L73-L74, L84-L85, L91, L96, L107, L122, L139, L155, L157, L203 | Veel dev-tooling; kan deels naar Vervalt |
| R34 | Animatie van bubbels (stand 30 oktober) | PDR | L204, L206-L207 | JNL-003 (animatie chatbubbels) bevat de ontdekking; Q11 staat daar al |
| R35 | Logo en favicons | PDR | L159-L160 |  |

| Overig | Type | Rijen | Opmerking |
|---|---|---|---|
| Nieuw JNL: openstaande kwesties uit het plan | JNL | Q2, Q4, Q6-Q8, Q10, Q12-Q14 | Negen open vragen, elk een kwestie |
| Staat al elders | — | L1, L102, L200-L201, Q9, Q11 | Q9: ADR-002 en JNL-001. Q11: JNL-003. L1: HDR-014. L102: Q10. L200: README en PDR-001. L201: HDR-008 (drift-signaal), twijfel |
| Vervalt: staat in code of code-commentaar | — | L27, L29, L60-L62, L77, L100, L143, L151-L152, L170 |  |
| Vervalt: historie van een afgesloten stap | — | L87, L99, L108, L148, L156, L158, L172, L176, L186, L198 | Reviews en stage-afsluitingen; de uitkomsten staan in de records hierboven |
| Vervalt: tijdelijk of overbodig | — | L2, L22, L76, L144 |  |
| Al gedaan in de proef | — | D3, L10-L13, L19, L23, L44-L45, L47 | PDR-002, PDR-003, ADR-005, ADR-006, PDR-004 en de Vervalt van de spec |

## Vervalt

Rijen van het plan die niet als record meegaan, met de reden.

- L13 (09-25) This plan moved into the repo as `docs/plan.md` — het plan zelf vervalt als bron (HDR-015, plan.md vervalt als bron)
- L23 (09-28) This Source column added, filled retroactively — het veld Source komt niet terug (HDR-015, plan.md vervalt als bron)
- L31 (09-30) Body line-height, heading line-height and `:focus-visible` moved from `reset.css` to `elements.css` — de reden staat in de CSS-comments en er is geen afwijkingenlijst meer (PDR-001, een app voor dagelijks gebruik en een experiment in werkwijze)
- L32 (09-30) `legend { padding: 0 }` added to the reset — idem
- L33 (09-30) `main { padding-bottom }` not taken over; no `fieldset` `min-inline-size` reset — idem
- L34 (09-30) `legend` in `elements.css` uses `--color-text-label` and `--font-weight-label` — idem

## Bronnen

- `docs/plan.md`: de bron van de overzetting; regelnummers hierboven zijn van de koppen.
- `docs/adr/0001-decisions-live-in-the-plan.md`: het besluit dat HDR-015 vervangt.
- HDR-001 (grootboek-stelsel): de grens van 20 oktober en het ontbreken van het veld Source.
- HDR-014 (documentatie in het Nederlands): de taal waarin de nieuwe records worden geschreven.
- `docs/grootboek/software-architectuur.md`: de balans waar beschrijvend materiaal heen kan.
- `docs/grootboek/registers/`: waar elke nieuwe record een regel krijgt.
