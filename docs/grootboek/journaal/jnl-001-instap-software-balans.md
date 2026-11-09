---
titel: "Instapjournaal: de software-balans"
status: afgerond
datum: 2026-10-20
kernvraag: Wat is de technische architectuur van language-buddy, en welke delen ervan zijn besluiten die niemand heeft vastgelegd?
doel-records:
  - "software-architectuur.md (v1.0, geaccepteerd 2026-10-20)"
  - "ADR-001, ADR-002, ADR-003 (K2, K3, K5)"
  - "HDR-002, HDR-003 (K1, K4)"
---

# JNL-001 — Instapjournaal: de software-balans

**Kernvraag.** Wat is de technische architectuur van language-buddy, en welke delen ervan zijn
besluiten die niemand heeft vastgelegd?

**Hoofdboodschap.** De code en `docs/plan.md` komen al op bijna alles overeen wat de balans
zegt. Wat de afleiding niet kon vaststellen gaat vooral over de delivery chain en over wie de
server-routes mag aanroepen. Dat zijn de echte vragen hieronder.

**Hoe dit is gemaakt.** Twee read-only explorers (een voor `src/lib` en `src/hooks`, een voor de
routes en de delivery chain) plus een gerichte zoektocht door de git-geschiedenis. Elke bewering
in de balans verwijst naar een bestand; de vragen hieronder zijn de plekken waar de code niet
zei waarom.

## Kwesties

| # | Kwestie | Status |
|---|---|---|
| K1 | Balans naast plan.md: waar is die voor? | besloten 2026-10-20 |
| K2 | Omgevingen: welke branch wordt waar gedeployd? | besloten 2026-10-20 |
| K3 | De routes hebben geen authenticatie van de aanroeper en geen rate limit | besloten 2026-10-20 (voor nu geaccepteerd) |
| K4 | Geen CI in de repo | besloten 2026-10-20 |
| K5 | Waarom `gemini-3.1-flash-lite`? | besloten 2026-10-20 |
| K6 | De Google TTS-key reist mee als URL-queryparameter | besloten 2026-10-21 |
| K7 | Hoe de routes te beschermen (vervolg op K3) | geparkeerd 2026-11-09; verplaatst naar JNL-004 K14 |
| K8 | CI op pull requests naar `main` (vervolg op K4) | besloten, geboekt in HDR-003 |

### K1 — Balans naast plan.md: waar is die voor?

`docs/plan.md` beschrijft het state-model, de bestandsindeling en de geldende besluiten al
uitgebreid. De meeste secties van de balans zeggen dat opnieuw vanuit een technische bril, met
bestanden als bewijs in plaats van rijen. **Vraag voor de mens:** voegt de balans iets toe wat
het plan niet doet (één plek voor het technische beeld, in één keer te lezen), of is het een
duplicaat dat gaat driften? Dit bepaalt of we doorgaan of na deze proef stoppen.

De critique-ronde liet dit concreet zien: twee van de eerste vier "kandidaat-besluiten" die de
balans noemde (evaluatie als eigen aanroep, de mock-routes) bleken al in plan.md vastgelegd. Voor
zover ik vond staat nog nergens een record van: het antwoord dat wordt vastgehouden tot de
evaluatie klaar is, een onbekende provider-instelling die een fout gooit in plaats van terug te
vallen, en de native STT die na stilte herstart en opgeeft na drie snelle beëindigingen. Ik heb
dat niet rij voor rij gecontroleerd tegen het besluitenlog van het plan.

**Besluit (2026-10-20, de mens):** de balans houden en gebruiken om drift detection uit te
proberen (een DFT-rapport: komt de beschrijving nog overeen met de code?). `docs/plan.md` blijft
voorlopig de bron; de mens is van plan het plan uiteindelijk naar het grootboek te verhuizen,
maar wil het grootboek eerst uitproberen. Tot die tijd is de balans een afgeleid leespad naast
het plan, en het driftrisico tussen die twee wordt voor de duur van het experiment geaccepteerd.
Nog niet geboekt als record; HDR-001 zegt al dat het plan de bron blijft tot het experiment is
afgerond. **Geboekt als HDR-002.**

### K2 — Omgevingen: welke branch wordt waar gedeployd?

Vercel wordt genoemd in de README en het plan, maar er is geen configuratiebestand, dus de
koppeling van branch aan omgeving, de env vars per omgeving en of `arc/*`-branches
preview-deployments krijgen zijn vanuit de repo niet te zien.

**Besluit (2026-10-20, de mens):** `main` is de productiebranch. Voor andere branches is niets
geconfigureerd in Vercel, dus de standaardwaarden van Vercel gelden, wat betekent dat andere
branches (ook `arc/*`) als preview worden gedeployd, nooit naar productie. De mens heeft geen
bezwaar tegen previews van `arc/*`; de eis is alleen dat `arc/*` nooit in productie komt, en dat
geldt tot er iets in `main` wordt gemerged (wat via een pull request gaat). Niets te wijzigen.

**Env vars per omgeving (2026-10-20, de mens, gecontroleerd in het Vercel-dashboard):** de
publieke variabelen (`NEXT_PUBLIC_*`) staan ook voor Preview aan; alle geheime variabelen (de
API-keys) staan alleen voor Production aan. Gevolgen, uit de code:

- Een preview van een `arc/*`-branch bouwt, maar elke route die een vendor aanroept (chat,
  evaluatie, TTS, beide token-routes) heeft geen key en faalt tijdens runtime. Alleen de native
  spraakherkenning, die geen server nodig heeft, werkt daar.
- De mock-routes helpen in een preview niet: ze antwoorden 404 buiten `next dev`.
- Een preview kan dus geen enkele vendor-key uitgeven. Dat begrenst K3 ook tot productie.

Niets te wijzigen; het is een sluitende inrichting voor de uitgesproken wens (geen `arc/*` in
productie, geen bezwaar tegen previews). **Geboekt als ADR-001.**

### K3 — De routes hebben geen authenticatie van de aanroeper en geen rate limit

Niets in de repo controleert wie `/api/chat`, `/api/evaluation`, `/api/tts` of de token-routes
aanroept, en elk daarvan gebruikt een betaalde vendor-key. **Vraag:** is dat een bewuste keuze
voor een persoonlijk project op een niet gedeelde URL (en geaccepteerd tot de repo wordt
gedeeld), of een gat? Of er bescherming aan de Vercel-kant bestaat is vanuit de repo niet te
zien.

**Besluit (2026-10-20, de mens):** het risico wordt voor nu geaccepteerd, maar de mens wil het
snel oplossen (zie K7). Productie wordt gedeployd bij een merge in `main`. Er is bewust geen
Vercel Deployment Protection ingesteld; het dashboard toont Vercel Authentication ("require
login") actief met Standard Protection. Volgens de documentatie van Vercel beschermt die scope
alles behalve het productiedomein: previews en gegenereerde deployment-URL's vragen om een
Vercel-login, het productiedomein blijft publiek. De productie-routes blijven dus bereikbaar voor
iedereen die de URL kent, en K3 blijft staan voor productie. (De bronnen verschillen over
sommige oudere productie-URL's; controleer het dashboard als het ertoe doet.) Bij sommige
vendors bestaan uitgavenlimieten, maar de mens weet niet meer precies welke; dat overzicht
krijgen is een eigen taak van de mens, buiten de repo, om snel op te pakken. Het is de enige
begrenzing van de schade die niet van code afhangt. **Geboekt als ADR-002** (voorlopig; K7 zal
het vervangen).

### K4 — Geen CI in de repo

Checks draaien met de hand. De README noemt CI zodra de repo openbaar wordt. Hangt samen met het
besluit van het plan "geen testsuite". **Vraag:** bewust en afgedaan, of iets om te heroverwegen?

**Besluit (2026-10-20, de mens):** het ontbreken van CI was geen bewuste keuze. De checks (lint,
typecheck, build, `docs:check`) horen te draaien bij een pull request naar `main`. Hoe dat wordt
ingericht is K8. **Geboekt als HDR-003.**

### K5 — Waarom `gemini-3.1-flash-lite`?

De provider (Gemini) lag vooraf vast in plan.md → Fixed constraints. De modelstring is dezelfde
constante in de chat- en de evaluatiecode; de reden voor dit model is niet vastgelegd in de code
of het plan.

**Besluit (2026-10-20, de mens):** een bewuste keuze, gemaakt op prijs. Er is geen uitgebreide
vergelijking met andere modellen gedaan; de metingen in het plan (10-06 tot 10-10) beschrijven
hoe dit model presteert, ze vergeleken het niet met andere. **Geboekt als ADR-003.**

### K6 — Google TTS-key als URL-queryparameter

`src/lib/tts/google.ts` stuurt de key mee in de URL; de andere providers gebruiken een header. De
reden is niet vastgelegd. **Vraag:** bewust, of gewoon zoals het eerst is geschreven?

**Antwoord (2026-10-20, de mens):** geen bewuste keuze. Nog open: of het moet veranderen. Wat er
is gevonden: in het gelezen codepad wordt de URL niet gelogd bij een fout (de foutmelding bevat
alleen de status en de response body, en de route logt die server-side); of de `fetch` van Node
de URL aan een netwerkfout toevoegt is niet getest. De algemene documentatie van Google
beschrijft het meesturen van een API-key in de `x-goog-api-key`-header voor REST-aanroepen, maar
een zoekopdracht bevestigde niet dat het Text-to-Speech-endpoint dat accepteert; verifieer dat
voordat de code verandert.

**Besluit (2026-10-21, de mens):** veranderen. De mens testte beide vormen rechtstreeks tegen het
live endpoint met de eigen key (`Invoke-WebRequest`, een keer met `?key=`, een keer met de
`x-goog-api-key`-header) en kreeg bij beide `200`, wat vastlegt wat een documentatiezoektocht
alleen niet kon. **Geboekt als ADR-004** — het eerste grootboekbesluit in deze repo dat code
veranderde, niet alleen documentatie.

### K7 — Hoe de routes te beschermen (vervolg op K3)

Open. De mens wil de blootstelling van de routes die een vendor aanroepen in productie snel
oplossen. Heeft discovery nodig voor een besluit: welk soort bescherming past bij een persoonlijke
app die vanuit één browser en één iPhone wordt gebruikt (de opties lopen van bescherming op
platformniveau voor de deployment tot een controle binnen de routes), en wat elk kost aan
complexiteit en in de iPhone-flow. Nog niet onderzocht.

**Geparkeerd (2026-11-09, de mens)** en verplaatst naar JNL-004 (Openstaande kwesties), K14: de
kans dat iemand de productie-URL achterhaalt is volgens de mens heel klein. Heroverwegen rond
2026-12-09, met het overzicht van de bestedingslimieten per leverancier erbij (K3).

### K8 — CI op pull requests naar `main` (vervolg op K4)

Besloten en gebouwd: zie HDR-003. De rimpel in de geschiedenis bleek echt; de workflow checkt uit
met `fetch-depth: 0`.

## Besluitenlog

- **2026-10-20 — balans geaccepteerd.** De mens accepteerde `software-architectuur.md` als v1.0
  (leidend document), als geheel. Hierna: de driftproef (een DFT-rapport), in een latere sessie.
- **2026-10-21 — K1, K2, K3, K4, K5 geboekt.** HDR-002, ADR-001, ADR-002, HDR-003 en ADR-003
  kristalliseren die vijf besluiten uit tot eigen records, volgens de eigen regel van het
  grootboek: een kwestie uit een journaal komt in een doelrecord terecht en blijft
  geen journaalpost. K6 blijft ongeboekt: het is beantwoord, maar nog niet besloten of we
  ernaar handelen.
- **2026-10-21 — balans uitgebreid met de frontendlaag.** Het scopegat van REQ-GG-01 is gedicht;
  het meeste van wat de explorer vond was al besloten in `plan.md` (09-29, 09-30, 10-02, 10-03),
  en wordt vanuit de balans aangehaald in plaats van gedupliceerd.
- **2026-10-21 — DFT-001: eerste reconciliatie, geen drift gevonden.** REQ-GG-05 een keer
  uitgeoefend. Sinds het schrijven van de balans is geen code veranderd, dus dit bewees het
  proces (een reconciliatie kan worden aangevraagd en geregistreerd) en niet het vermogen om
  echte drift te vangen. De lus (journaal → besluit → document → code → drift) is nog niet
  end-to-end gesloten; daarvoor moet een echte codewijziging een besluit volgen, wat nog niet is
  gebeurd (REQ-GG-09).
- **2026-10-21 — K6 besloten en geboekt als ADR-004.** `src/lib/tts/google.ts` stuurt de key nu
  als header. Dit is de codestap die de driftproef miste: een toekomstige DFT tegen deze balans
  heeft nu een echte wijziging om tegen te reconciliëren, wat de lus van REQ-GG-09 sluit zodra
  die DFT draait.

- **2026-10-22 — K8 gebouwd (HDR-003).** `.github/workflows/checks.yml` draait op PR's naar
  `main` en `arc/arc-main`, met de driftcontrole van het REQ-AH-12-register in dezelfde workflow.

- **2026-11-07 — DFT-004: de reconciliatie na ADR-004 is gedraaid.** 8095deb stond in het
  driftsignaal, en § 6 van de balans klopt ermee. Daarmee is de lus van K6 rond: journaal → besluit
  (ADR-004) → document (§ 6) → code → drift (DFT-004) (REQ-GG-09). Dezelfde reconciliatie vond dat
  § 5 van de balans de CI uit K8 nooit had opgenomen.

- **2026-11-09 — K7 geparkeerd en journaal gesloten (`afgerond`).** K7 verhuisde als K14 naar
  JNL-004 (Openstaande kwesties), zoals JNL-003 dat op 2026-11-08 deed. ADR-002 (De serverroutes
  hebben geen authenticatie van de aanroeper, voorlopig geaccepteerd) blijft `accepted` en
  voorlopig; een nieuwe ADR vervangt hem pas als er een mechanisme is.

Dit journaal is gesloten op 2026-11-09. De voorwaarde was dat K7 besloten of geparkeerd is; K7 is
geparkeerd, en het open werk staat in JNL-004, K14.
