---
titel: "Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?"
status: discovery
datum: 2026-10-27
kernvraag: Waar beschrijft de repo zichzelf niet goed genoeg voor een agent die niets heeft dan de repo?
doel-records:
  - "HDR-011 (K1, K2)"
  - "HDR-030 (K7)"
  - "K8: geen eigen record; de regel staat in CLAUDE.md (Controles)"
  - "HDR-031 (K9)"
  - "HDR-033 (K10)"
  - "per kwestie een record zodra er een besluit valt (K11)"
---

# JNL-002 — Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?

**Kernvraag.** REQ-GG-10 (Stroomlijn onboarding tot zelfde-dag-productief) vraagt dat een nieuwe
agent of teamgenoot dezelfde dag productief is. Waar beschrijft de repo zichzelf niet goed genoeg
voor iemand die niets heeft dan de repo?

**Hoofdboodschap.** De oriëntatie werkt; de werkwijze heeft twee gaten. Een verse agent zonder
geheugen en zonder hints beantwoordde vier oriëntatievragen uit de geladen `CLAUDE.md`-bestanden
zonder iets te verzinnen, en maakte een correcte kleine wijziging. Hij miste twee dingen die de
repo nergens uitdrukkelijk zegt: van welke branch arc-werk uitgaat, en dat de branch vóór de
eerste edit wordt gemaakt.

**Na ronde drie (2026-11-10).** De werkwijze komt aan, op één regel na. Een verse agent die voor
het eerst code wijzigde, maakte de branch op tijd, deed triage, liet een builder en een reviewer
het werk doen en draaide alle checks. Hij zag het driftsignaal, maar boekte geen reconciliatie: die
regel staat alleen in `docs/grootboek/CLAUDE.md`, en dat laadt niet bij werk in `src/` (K7).

**Hoe dit is gemaakt.** Een verse clone in `repo-cold` (geen geheugen, geen lokale settings, push
uitgeschakeld) op `arc/arc-main` bij bd508d5, en een nieuwe Claude Code-sessie. Twee prompts,
geen hints: vier oriëntatievragen waarbij niets hoefde te veranderen, en daarna "de README zegt
welke checks je draait: controleer dat en repareer het". Beoordeeld aan de hand van de working
tree en het transcript van Jarón. Een ronde, dus het meet het eerste uur en niet de dag. Een
voorspelling van mij klopte niet: de README noemde drie checks, niet een; ik had een zoekopdracht
gelezen die `npx`-regels mist.

## Wat de run liet zien

| Onderdeel | Resultaat |
|---|---|
| Wat is dit project | Goed. Correct, uit de geladen `CLAUDE.md`-bestanden; de Next.js-waarschuwing in `AGENTS.md` inbegrepen |
| Hoe besluiten worden vastgelegd | Goed. Twee lagen (`plan.md` voor 2026-10-20, het grootboek erna), eerst de registers |
| Wat te doen vóór een wijziging | **Gedeeltelijk.** Eigen branch, plan, skills: goed. De basisbranch voor arc-werk: ontbreekt |
| Wat je niet alleen doet | Goed, en grondig: hooks, override, triage, leidende documenten, het incidentregister, de volgorde van de checks, en het conflict tussen het Co-Authored-By-verzoek van de sessie en de regel van het project, in het voordeel van het project beslecht |
| Verzonnen antwoorden | Geen. Hij zei welke documenten hij niet had geopend |
| De kleine wijziging | Correct: de drie ontbrekende checks, in de volgorde van `CLAUDE.md`, met de iPhone-test bewust weggelaten en dat ook gezegd |
| Vragen gesteld, correcties gegeven | Geen, geen |
| Branch | **Geen.** Hij bewerkte `README.md` op `arc/arc-main`, ongecommit, en zei pas achteraf dat er een branch nodig is |
| Checks gedraaid | **Nee**, en dat zei hij. `docs:check` heeft geen `npm install` nodig |

De oriëntatie kwam volledig uit de `CLAUDE.md`-bestanden die vanzelf laden: hij opende de README,
`docs/index.yml`, `plan.md` of de registers niet. De gelaagdheid werkt.

## Kwesties

| # | Kwestie | Status |
|---|---|---|
| K1 | De basisbranch voor arc-werk staat niet in de root-`CLAUDE.md` | besloten 2026-10-27, geboekt in HDR-011 |
| K2 | Nergens staat dat de branch vóór de eerste edit komt | besloten 2026-10-27, geboekt in HDR-011 |
| K3 | De checks zijn niet gedraaid, hoewel dat kon | besloten 2026-10-27: niet herhaald in ronde twee |
| K4 | De README linkt naar een privé-artifact dat een nieuwkomer niet kan openen | besloten 2026-10-27: de link blijft |
| K5 | Wat bewijst een run van een uur? | besloten 2026-10-27 |
| K6 | Houdt de regel "geen AI-of-zelf-oordeel" stand? | besloten 2026-10-27: houdt stand in twee runs |
| K7 | De reconciliatieregel bereikt wie in `src/` werkt niet | besloten 2026-11-13, geboekt in HDR-030 |
| K8 | `npx next typegen` zonder `node_modules` wijzigt `package.json` | besloten 2026-11-13 |
| K9 | Telt lint plus `tsc` als gedekt pad bij triage? | besloten 2026-11-13, geboekt in HDR-031 |
| K10 | De reviewer draait op het model van de lead | besloten 2026-11-13, geboekt in HDR-033 |
| K11 | Een afwezigheidsclaim uit een grep: incident of niet? | open |

### K1 — De basisbranch voor arc-werk staat niet in de root-`CLAUDE.md`

De root zegt dat branches "merged into `main` through a pull request" worden. Voor arc-werk
gebeurt dat niet: het vertrekt van `arc/arc-main` en gaat daar weer in terug. Dat staat in
`docs/grootboek/CLAUDE.md`, die alleen laadt als je in die map werkt, en in de CI-workflow. Het
antwoord van de verse agent op "wat doe ik vóór een wijziging" volgde de root exact:
`stage/N-name`, een beschrijvende naam of `spike-*`, en nooit committen op `main`. Geen
basisbranch.

**Besloten (Jarón, 2026-10-27):** een zin in de root-regel `Branches`, die `arc/arc-main` noemt
als basis zolang het de integratiebranch is, en `main` als productie. **Geboekt als HDR-011.** De
zin moet veranderen wanneer `arc/arc-main` in `main` wordt gemerged.

### K2 — Nergens staat dat de branch vóór de eerste edit komt

"Een branch per stuk werk" is waar, maar zegt niet wanneer. De agent bewerkte op `arc/arc-main`
en meldde terecht dat hij een branch en een PR nodig heeft. Er is niets gecommit, dus er is geen
regel gebroken; Jarón verwachtte eerst de branch.

**Besloten (Jarón, 2026-10-27):** dezelfde zin zegt dat de branch vóór de eerste edit wordt
gemaakt. **Geen hook ervoor.** Het is één incident en de regel is nog niet eens geschreven; als
het na de regel terugkomt, escaleert het patroon (HDR-010 geeft de redenering). Gelogd als het
patroon `branch-before-edit` in het incidentregister. **Geboekt als HDR-011.**

### K3 — De checks zijn niet gedraaid, hoewel dat kon

De agent noemde de drie scripts correct en controleerde dat ze in `package.json` staan, maar
draaide geen enkele check voordat hij zei "I've fixed it", en zei dat ronduit. `docs:check` heeft
niets nodig dan Node, dus de ontbrekende install was geen excuus. Dit is gedrag, geen ontbrekende
zin: de regel staat in `CLAUDE.md`. **Besloten (2026-10-27):** het kwam niet terug. In ronde twee
draaide de agent alle zes de checks, `build` inbegrepen, plus de dev server, en zei wat hij niet
had gedaan. Geen regelwijziging.

### K4 — De README linkt naar een privé-artifact

De Arc-alinea van de README wijst naar een privé-artifact, gemarkeerd als "for my own reference
only". Een nieuwkomer kan het niet openen. De run testte dit niet: de agent las die alinea nooit.
Of de principes bereikbaar moeten zijn voor een nieuwkomer is aan Jarón. **Besloten (Jarón,
2026-10-27):** de link blijft. In ronde twee zag de agent hem, liet hem met rust en zei dat een
nieuwkomer hem niet kan openen.

### K5 — Wat bewijst een run van een uur?

Het bewijst dat de kennis er is en in de juiste lagen zit. Het bewijst niet "dezelfde dag", en
een run is een datapunt. **Besloten (2026-10-27):** het eerste uur is de maat, een run telt als
productief met hoogstens twee correcties die de repo al beantwoordt (de incidentdrempel is
drie), en REQ-GG-10 telt als bijna gehaald tot een tweede ronde na de fixes beter uitpakt. Dat
gebeurde op 2026-10-27, zie ronde twee hieronder.

### K6 — Houdt de regel "geen AI-of-zelf-oordeel" stand?

Zwak bewijs dat het zo is. De globale instructies van Jarón zeggen een eenregelige aanbeveling
"let AI generate this / write it yourself" te geven vóór elke nieuwe taak, en de tweede prompt
was een nieuwe taak. De agent had die instructies gelezen (hij citeerde de Co-Authored-By-regel
ervan tegen het verzoek van de sessie) en gaf geen oordeel. **Besloten (2026-10-27):** het hield
opnieuw stand in ronde twee, bij een andere taak, dus het houdt stand in twee runs. Een eerdere
versie van dit journaal zei ten onrechte dat er in ronde één geen aanleiding was geweest.

### K7 — De reconciliatieregel bereikt wie in `src/` werkt niet

In ronde drie gaf `docs:check` na de codewijziging twee waarschuwingen:

```
warning  drift: docs/grootboek/software-architectuur.md is 1 commit(s) behind its werkgebied (1 file(s)); run npm run docs:drift
warning  drift: src/lib/CLAUDE.md is 1 commit(s) behind its werkgebied (1 file(s)); run npm run docs:drift
```

De agent draaide `docs:drift` niet. Hij oordeelde dat het labelformaat niet in die documenten staat,
en wilde ze niet aanpassen vanwege de communicatieplicht. Hij las de waarschuwing dus als "pas het
document aan", niet als "reconcilieer en boek een DFT". Ook toen Jarón om een pull request vroeg,
kwam er geen DFT.

De regel van HDR-026 (Een pull request die code in een werkgebied raakt, sluit met een
reconciliatie) staat alleen in `docs/grootboek/CLAUDE.md`, dat laadt bij werk in die map. Wie
alleen `src/` raakt, krijgt hem niet te zien, en de waarschuwing noemt geen DFT. Wat `docs:drift`
bij een achterstand zegt, is niet getoetst: de agent draaide het niet.

Mogelijke plekken voor een fix: de tekst van de waarschuwing, de controles in de root-`CLAUDE.md`
(een leidend document), of `builder.md` en `reviewer.md`.

**Besloten (Jarón, 2026-11-13):** een hook. `guard-reconciliatie-pr` weigert `gh pr create` van de lead
thread als de branch een werkgebied raakt zonder nieuwe DFT, en zegt dat de agent `docs:drift` moet
draaien en een DFT moet boeken in dezelfde pull request. De waarschuwing van `docs:check` noemt
voortaan ook de DFT. **Geboekt als HDR-030** (Een hook houdt een pull request zonder reconciliatie
tegen). Niet gemeten of dit in de praktijk werkt: dat vraagt een volgende koude-startronde met een
taak die code in een werkgebied raakt.

### K8 — `npx next typegen` zonder `node_modules` wijzigt `package.json`

De builder draaide de checks in de verse clone vóór een `npm install`. `npx` haalde `next@16.4.6`
op, niet de 16.3.6 uit `package.json`. Die installeerde dependencies en zette `@types/react` op
`19.3.0` en `typescript` op `5.9.3`. De auto-mode-classifier weigerde de builder om dat terug te
draaien (`git checkout --`), waarna de lead het aan Jarón vroeg. De README noemt `npm install`; de
controles in de root-`CLAUDE.md` niet.

**Besloten (Jarón, 2026-11-13):** allebei de maatregelen. De typecheck krijgt npm-scripts in
`package.json` (`typegen` is `next typegen`, `typecheck` is `tsc --noEmit`), zodat een script
zonder `node_modules` zichtbaar faalt in plaats van stil een andere versie op te halen. En
`npm install` is de eerste stap van de controles. De root-`CLAUDE.md` (Controles), de README,
`builder.md`, `reviewer.md`, `refactor-werkplaats.md` en `.claude/stage-review/project.conf`
noemen nu de scripts; `.github/workflows/checks.yml` blijft ongemoeid (die draait eerst `npm ci`,
en de map valt in het werkgebied van de balans). `npm install` staat alleen in `CLAUDE.md` en de
README: builder en reviewer draaien in de checkout van de lead, waar `node_modules` er al is.
**Geen eigen record:** de regel staat in `CLAUDE.md` zelf en het waarom staat hier. Niet gemeten
of een verse agent nu eerst installeert: dat vraagt een volgende koude-startronde.

### K9 — Telt lint plus `tsc` als gedekt pad bij triage?

Voor `trivial` vraagt de triage-skill onder meer een gedekt pad: een mechanische poort zoals een
test, lint of een check. De agent las dat als "er is een test" en koos `normal` ("no test on the
path"). De antwoordsleutel ging uit van lint en `tsc` als dekking, en dus `trivial`. HDR-028
(Mutatietests bij het risky-regime zijn geparkeerd tot `src/` een testsuite heeft) noemt deze vraag
al een eigen kwestie. Het verschil kostte hier een Opus-builder en een reviewer voor zes labels.

**Besloten (Jarón, 2026-11-13):** lint en `tsc` tellen als gedekt pad bij een wijziging zonder
gedragseffect (weergavetekst, hernoemen, verplaatsen, imports, types), en niet bij een wijziging
die gedrag verandert. Daaronder valt tekst die een model aanstuurt en tekst die de gebruiker iets
toezegt over wat de app doet; die twee tellen als gedrag, dus `normal`. Afgewogen: lint en `tsc`
tellen altijd (een gedragswijziging kan dan zonder reviewer door), nooit (`trivial` is dan leeg
voor `src/`, want daar zijn geen tests), en open laten. Bij tekst is de borging de diff die de
lead naloopt, niet de poort: `tsc` ziet niet of een label goed staat. De regel staat in vraag 4
van de triage-skill, met een ijkgeval. **Geboekt als HDR-031** (Lint en `tsc` tellen bij triage
alleen als gedekt pad bij een wijziging zonder gedragseffect). Niet gemeten of een volgende koude
agent nu `trivial` kiest: dat vraagt een volgende koude-startronde met een taak zonder
gedragseffect.

### K10 — De reviewer draait op het model van de lead

`builder.md` pint `model: opus`; `reviewer.md` pint niets, en de reviewer nam Sonnet over van de
lead. HDR-024 (Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`) laat de reviewer
buiten het besluit, maar rekent in zijn Waarom met een reviewer op Opus. Dit valt buiten de
kernvraag van dit journaal, maar het is hier gevonden en wordt hier gesloten.

Bij `trivial` is er geen reviewer, dus de vraag speelt alleen bij `normal` en `risky`, waar de
builder altijd op Opus draait. Afgewogen: de reviewer vastzetten op Opus, hem de lead laten volgen
en dat in HDR-024 opschrijven, of per regime kiezen met het model in de aanroep. Jarón koos de pin:
de controle is dan minstens zo sterk als het werk dat ze controleert, en het Waarom van HDR-024
klopt weer. Het kost alleen iets bij een lead op Sonnet. `/stage-review` start een
`general-purpose`-subagent en valt erbuiten. **Geboekt als HDR-033** (De reviewer draait op Opus,
vastgepind in `reviewer.md`); HDR-024 wijst ernaar.

### K11 — Een afwezigheidsclaim uit een grep: incident of niet?

"Het labelformaat staat niet in die documenten" kwam uit een grep op `Intermediate|\(B1\)`, niet
uit lezen. Het klopte (bevestigd met `git grep`), maar het is de vorm die HDR-025 (Een bewering
over een document of de omgeving komt uit de bron) noemt. Telt het als vierde incident in het
patroon `document-not-fully-read`? Het is gedrag van een koude agent, geen correctie in een
werksessie. **Open**, aan Jarón.

## Ronde twee

Een nieuwe clone (`repo-cold-2`) bij ad88f62, nadat HDR-011 was gemerged: geen geheugen, geen
lokale settings, push uitgeschakeld, dezelfde vier oriëntatievragen en een nieuwe taak ("walk the
README as a newcomer, run what can be run, fix what does not match"). Beoordeeld aan de hand van
de working tree, de reflog en het eigen rapport van de agent; zijn beweringen over de repo zijn
tegen de repo gecontroleerd.

| Onderdeel | Resultaat |
|---|---|
| Basisbranch (K1) | Genoemd: "grootboekwerk (`arc/*`) vertrekt vanuit `arc/arc-main` en gaat via een PR terug. `main` is productie" |
| Branch vóór de eerste edit (K2) | Genoemd in het oriëntatieantwoord en gedaan: de branch is gemaakt om 15:23:51 en de README is voor het laatst gewijzigd om 15:24:06 |
| Checks gedraaid (K3) | Alle zes, `build` inbegrepen, plus de dev server met de mocks; zei wat hij niet had gedaan (een browser, een iPhone, echte API-keys) |
| Privé-link (K4) | Opgemerkt, met rust gelaten, gemeld |
| AI-of-zelf-oordeel (K6) | Niet gegeven |
| Vragen gesteld, correcties gegeven, toestemming gevraagd voor `npm install` of `build` | Geen, geen, geen |
| Verzonnen beweringen | Geen gevonden; de README-beweringen zijn gecontroleerd tegen `src/lib/tts/`, de `engines` van Next, `findings.md` en de getrackte bestanden |
| De wijziging | Correct: de TTS-rij, de checks, de indeling, de alinea over findings, de Node-versie, een verwijzing naar `CLAUDE.md` en `docs/index.yml`. De laatste twee zijn eerder toevoegingen dan correcties |

Een automatische veiligheidscheck weigerde de eerste poging van de agent om de dev server te
stoppen (`taskkill` op elk node-proces); daarna stopte hij alleen zijn eigen server. `npm install`
meldde vier kwetsbaarheden (een kritieke, drie hoge); de agent zocht dat niet uit en het viel ook
niet onder de scope van dit journaal. Volgens de regel uit K5 is het criterium voor REQ-GG-10
gehaald. Wat dat bewijst is beperkt: twee runs van hetzelfde soort agent, met de globale
instructies van Jarón geladen, op het eerste uur, bij een taak die de agent naar een document
wijst dat naar al het andere wijst. Een menselijke nieuwkomer, een ander model en "dezelfde dag"
zijn niet getest.

De README-wijzigingen van ronde twee zijn overgenomen uit de diff van de clone op
`arc/cold-start-round-2`.

## Ronde drie

Sinds ronde twee veranderde de werkwijze: werk vertakt van `main` (HDR-021, Werk vertakt van
`main`; `arc/arc-main` vervalt), `plan.md` is vervangen door het grootboek (van 17 naar 84
records), de documentatie is Nederlands, builders krijgen een model per regime (HDR-024), en een
pull request die code in een werkgebied raakt, sluit met een reconciliatie (HDR-026). Ronde drie
toetste of een nieuwkomer dat oppikt, met voor het eerst een taak die code raakt.

**Hoe dit is gemaakt.**

- Een clone `repo-cold-3` bij `92c2c27` (`main` na PR #49): geen geheugen, geen lokale settings,
  push uit met `remote.origin.pushurl no-push`.
- Dezelfde omgeving als ronde één en twee. Dit journaal legde die niet vast; ze komt uit hun
  transcripts: Claude Code in VS Code, model `claude-sonnet-5-5`, permission mode `auto`, de
  MCP-servers van het account aan, de globale instructies van Jarón geladen.
- Drie prompts. De vier oriëntatievragen letterlijk als in ronde één en twee. Dan: "In de
  level-select staat het CEFR-niveau tussen haakjes achter de omschrijving, bijvoorbeeld
  "Intermediate (B1)". Ik wil dat omgedraaid hebben: "B1 (Intermediate)". Doe dat voor alle
  niveaus." Daarna "commit en push de changes; maak een PR aan", zoals in ronde twee.
- Protocol, antwoordsleutel en de volledige score staan buiten de repo, in
  `../resources/trials/koude-start-ronde-3.md`, zodat een koude clone ze niet bevat.
- **Een fout in de uitvoering.** Prompt 3 kwam eerst te vroeg: de agent had nog een vraag open en
  had de reviewer en de meeste checks nog niet gedaan. Hij commitde toen alleen de wijziging. Na
  "Ja, zet de package-bestanden terug. Maak het daarna af zoals je van plan was; push blijft uit."
  maakte hij het af, en kwam prompt 3 opnieuw. De uitslag gaat over beide delen.

| Onderdeel | Resultaat |
|---|---|
| Oriëntatie | Goed, uit de geladen `CLAUDE.md`-bestanden: grootboek en registers zonder `plan.md`, een branch vanaf `main` vóór de eerste bewerking, triage, builder, checks, communicatieplicht. Niet genoemd: de grootboek-skill en het model per regime. Het `Co-Authored-By`-conflict weer in het voordeel van het project beslecht |
| Branch | Vanaf `main`, gemaakt 13 seconden vóór de eerste bewerking |
| Triage en model | Skill geladen, regime `normal`, builder op Opus. De sleutel verwachtte `trivial` (K9) |
| Builder, reviewer, checks | Builder schreef de code, reviewer APPROVED, alle zes checks groen |
| Builderrapport | Tegen de diff gecontroleerd voordat hij het overnam |
| Reconciliatie | **Gemist.** Zag beide driftwaarschuwingen, draaide `docs:drift` niet, geen DFT, ook niet bij het PR-moment (K7) |
| Push | De blokkade gelezen en niet omzeild, twee keer |
| Ids met titel | Niet van toepassing: hij noemde geen ids en zei waarom |
| Correcties | 0 live, 1 nodig: de DFT |
| Verbruik | 3 procentpunt van de sessielimiet en 1 van de week (Pro-plan), in 17 minuten |

Volgens K5 is het criterium gehaald: één correctie die de repo al beantwoordt. Maar die ene
correctie is precies de nieuwste regel. De beslisregel (alleen live ingrijpen, of ook wat achteraf
nodig was) is niet vooraf vastgelegd; hier maakt dat niet uit, want beide blijven onder drie. De
grenzen van ronde twee gelden nog: één run, een Sonnet-lead, de globale instructies van Jarón
geladen.

**Voor een volgende ronde.** Stuur prompt 3 pas na een expliciet "klaar", en beantwoord een vraag
van de agent eerst. Leg de beslisregel vóór de run vast. Het protocol staat nu in het trials-bestand
hierboven.

## Besluitenlog

- **2026-10-27 — K1 en K2 besloten en geboekt als HDR-011.** Een zin in de root-regel
  `Branches`. Het incident `branch-before-edit` is gelogd. K5 besloten: een maat van het eerste
  uur.
- **2026-10-27 — Ronde twee, en K3, K4 en K6 besloten.** K3 kwam niet terug, de link in de README
  blijft (Jarón), en de AI-of-zelf-regel hield een tweede keer stand. Elke kwestie is besloten en
  HDR-011 bestaat en wijst terug, dus het journaal is `afgerond`. REQ-GG-10 voldoet aan het
  criterium van K5, met de beperkingen hierboven.
- **2026-11-10 — Ronde drie, en het journaal is heropend.** Vijf nieuwe kwesties, K7 t/m K11,
  allemaal open. REQ-GG-10 voldoet ook in ronde drie aan K5, maar de reconciliatie per pull request
  bereikt een nieuwkomer niet (K7).
- **2026-11-13 — K7 besloten en geboekt als HDR-030.** Een hook op `gh pr create`; de
  drift-waarschuwing noemt de DFT. K8 t/m K11 blijven open.
- **2026-11-13 — K8 besloten, zonder eigen record.** Npm-scripts `typegen` en `typecheck`, en
  `npm install` als eerste controle. K9 t/m K11 blijven open.
- **2026-11-13 — K9 besloten en geboekt als HDR-031.** Lint en `tsc` tellen als gedekt pad bij een
  wijziging zonder gedragseffect; prompts en tekst die iets toezegt tellen als gedrag. K10 en K11
  blijven open.
- **2026-11-13 — K10 besloten en geboekt als HDR-033.** `reviewer.md` pint `model: opus`; HDR-024
  wijst ernaar (versie 1.1). K11 blijft open.
