# Criteria: onderhoudbaarheidsreview van één stage

Projectspecifiek deel van de stage-review-skill. Het script kopieert dit bestand naast de
reviewresultaten, omdat `.claude/` uit de worktree van de reviewer gestript is.

Scope: wat deze stage veranderde (de stage-diff, zie de reviewprompt). Lees omliggende code om
haar te begrijpen, maar rapporteer alleen bevindingen die in de stage-diff zitten of erdoor
veroorzaakt worden. Code uit eerdere stages die deze diff niet raakte, valt buiten de scope.

De vraag achter elke bevinding: **wat maakt de volgende wijziging hier trager of riskanter dan
nodig is?** Een bevinding die dat niet kan beantwoorden is smaak, geen bevinding.

## Wat je controleert

1. **Grenzen.** Is duidelijk wat op de server draait en wat op de client? Steekt er iets die
   grens over dat dat niet hoort te doen (secrets, foutteksten van de provider,
   server-only imports in clientcode)? Staat logica waar een lezer haar zou zoeken?
   Controleer ook het **eigenaarschap**: voor elke waarde die de client kiest en de server
   onder zijn eigen credential doorgeeft (een id, een sessie- of gespreks-handle, een URL):
   wie mag haar gebruiken? Bindt de server haar aan een aanroeper of sessie, of vertrouwt hij
   erop dat alleen de rechtmatige eigenaar haar kan kennen? Benoem de aanname. Dwingt niets in
   de code het af, rapporteer het dan. Markeer zo'n bevinding `observed` als de code de
   controle zichtbaar mist, en `inferred` als het afhangt van het gedrag van de provider of de
   deployment, en zeg welk feit je nodig zou hebben.
2. **Duplicatie en drift.** Waar de stage parallelle paden heeft (een echte en een mock-
   implementatie, client- en servercopieën van een vorm): waar herhalen ze elkaar, en waar
   kunnen ze ongemerkt uiteenlopen (request-, response- en foutvormen)? Is er voor elk
   contract tussen client en server één enkele bron van waarheid?
3. **Types aan de randen.** Wordt data van buiten (request body, modeloutput, env)
   gevalideerd voordat ze vertrouwd wordt? Zoek naar `any`, `as`-casts, non-null assertions en
   optionele velden die eigenlijk verplicht zijn. Kan een type een combinatie uitdrukken die
   niets betekent?
4. **Falen en state.** Worden faalpaden overal op dezelfde manier afgehandeld (timeout, foute
   invoer, providerfout, leeg resultaat)? Kan de state machine van de sessie een toestand
   bereiken die de UI niet afhandelt? Zijn limieten en deadlines één keer gedefinieerd, of
   verspreid als magic numbers?
5. **Leesbaarheid zonder context.** Kan iemand die het plan of de chatgeschiedenis niet
   gezien heeft begrijpen waarom de code zo is vormgegeven? Ontbrekende "waarom"-comments bij
   niet-vanzelfsprekende keuzes tellen mee. Comments die de code herhalen niet. Een comment
   die iets beweert wat niet waar is (een flag die niet bestaat) is een bevinding.
6. **Dode en achtergebleven code.** Steigerwerk dat deze stage overbodig maakte, ongebruikte
   exports, ongebruikte dependencies in package.json.
7. **Testbaarheid.** Kan de kernlogica worden uitgeoefend zonder de externe dienst aan te
   roepen? Waar zitten de naden (seams), en zitten ze op de juiste plek? (Het project heeft
   besloten voorlopig geen testsuite te hebben; beoordeel alleen of de seam later goedkoop toe
   te voegen is.)
8. **Huisconventies** (controleerbaar, rapporteer als low severity tenzij het een bug
   verbergt): function declarations in plaats van `const f = () =>`; elke `if` met accolades
   en over meerdere regels; early returns boven nesting; booleannamen die als zin lezen
   (`xIsValid`, `yHasValue`, niet `isXValid`); event handlers `handleX`; hooks `useX`;
   kebab-case-mappen.

## Next.js

Deze repo draait een Next.js-versie met breaking changes. Lees, voordat je een route handler,
caching of een routingdetail beoordeelt, de relevante gids in `node_modules/next/dist/docs/`.
Weet je niet zeker of iets fout of gewoon nieuw is, zeg dat dan in plaats van te gokken.

## Buiten scope

- Visueel ontwerp en layout.
- Nieuwe features of "nu je toch bezig bent"-toevoegingen. Ontbreekt er iets, meld dat dan als
  bevinding; stel geen scope voor.
- Stijlvoorkeuren die niet in de conventies hierboven staan.
- Speculatieve schaalzorgen. Beoordeel voor deze app op haar huidige omvang, en zeg het
  wanneer een punt pas op grotere schaal telt.
- Feiten buiten de code (of de app openbaar wordt, of er tests gepland zijn). Hangt een
  bevinding van zo'n feit af, markeer haar dan `suspicion` en zeg welk feit je nodig zou
  hebben. Ze hoort niet bij de medium findings, tenzij de code in beide gevallen fout is.

## Neem geen opzet aan

Neem niet aan dat iets bewust is omdat het er staat. Lijkt een keuze willekeurig, rapporteer
haar dan en zeg wat waar zou moeten zijn om haar juist te laten zijn.
