# HDR-013: Modern Web Guidance proberen op de bubbelanimatie, met eerst de eigen baseline

- **Status:** in-progress
- **Date:** 2026-10-23
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een tool die beweert de output van de agent te verbeteren, verdient zijn plek in de harness op
bewijs uit dit project. Het bewijs heeft een baseline nodig, en die baseline moet bestaan voordat
de tool wordt geraadpleegd, want achteraf is "wat hadden we zonder gedaan" niet eerlijk te
reconstrueren.

## Besluit

**Modern Web Guidance** proberen (de agent skills van het Chrome-team met actuele richtlijnen
voor het webplatform, `GoogleChrome/modern-web-guidance`) op de animatie van de chatbubbel
(JNL-003), en achteraf beslissen of het blijft.

De methode kost bijna geen extra werk:

1. Vóór de spike schrijft de agent zijn eigen aanpak voor JNL-003 K3 (een bubbel laten groeien in
   hoogte en breedte), vanuit zijn eigen kennis. Gedaan op 2026-10-23, in K3.
2. De opdracht van de spike aan de builder bevat één extra zin: raadpleeg de richtlijnen voor K3
   en rapporteer wat ze aanbevelen en of dat afwijkt van de baseline in K3.
3. De spike draait op een echte iPhone, zoals sowieso gepland.
4. Eén regel komt in JNL-003 K10: hetzelfde / anders en beter / anders en slechter / niets
   toegevoegd, en of de iPhone het bevestigde.

**Exitcriterium.** Direct na die regel beslist de mens: houden, uitzetten of bijstellen. Een
verschil dat de iPhone niet bevestigt, telt niet als winst. "Hetzelfde" is een geldige uitkomst
en een reden om het niet te houden. Dit record gaat dan naar `implemented` (gehouden) of wordt
vervangen of afgewezen.

## Uitbreiding (2026-10-23): meer dan één test

De mens wil met nog een paar CSS-gerelateerde taken testen voordat hij beslist, dus de procedure
hierboven wordt herhaald en niet maar één keer uitgevoerd. Ze geldt voor elke taak waarvoor de
skill zelf zegt dat hij moet starten (UI en layout, scroll en motion, performance, web-API's,
formulieren en toegankelijkheid), en niet voor backendwerk, scripts, tooling of triviale
bewerkingen.

Voor elke zo'n taak, in deze volgorde:

1. De agent schrijft zijn eigen aanpak op **voordat** de richtlijnen worden geraadpleegd, in het
   journaal of de spec van die taak. De eigen beschrijving van de skill zegt dat hij eerst moet
   draaien ("mandatory" voor HTML/CSS-werk); in de lead thread wordt dat bewust **niet**
   gevolgd totdat de baseline is geschreven. De builder krijgt in zijn opdracht te horen dat hij
   ze moet raadplegen, zoals in K10.
2. De builder raadpleegt de richtlijnen en rapporteert wat ze aanbevelen en hoe dat verschilt van
   de baseline.
3. Een rij gaat in het proeflog hieronder, en de mens geeft het oordeel voor die taak.

**Les uit de eerste test (JNL-003):** schrijf de baseline *na* de ontwerpbeslissingen die het
probleem begrenzen. Daar veranderde K4 waar K3 over ging nadat de baseline al bestond, dus de
vergelijking was deels achterhaald. Een baseline geschreven tegen een probleem dat nog beweegt, meet
de richtlijnen niet.

**De proef eindigt na in totaal drie tests** (de bubbelanimatie plus twee meer; besloten door de
mens, 2026-10-23). Dan beslist de mens: houden, uitzetten of bijstellen.

### Proeflog

| # | Taak | Baseline (waar) | Aanbeveling van de richtlijnen | Verschil | iPhone bevestigd | Oordeel (mens) |
|---|---|---|---|---|---|---|
| 1 | Bubbel onthullen (JNL-003 K3) | JNL-003 K3 | `clip-path` voor onthullingen; `interpolate-size` alleen Chromium | Hetzelfde op het kernpunt; het uiteindelijke ontwerp kwam van de mens, buiten beide om | De eerste spike draaide; het uiteindelijke ontwerp is op het oog afgesteld | hetzelfde (2026-11-08) |
| 2 | Gebruikersbubbel onthullen bij verzenden (JNL-003 K11) | JNL-003 K11 | Een gedeelde module, alleen `scale` en `opacity`, reduced motion uit, dezelfde curve; één extra regel: identiteitsbasis `scale: 1` (`individual-transform-properties`); niets over een `transform-origin` die van de kant afhangt | Hetzelfde op elk inhoudelijk punt; de ene extra regel is bewust niet toegepast | Nog niet getest op de iPhone | hetzelfde (2026-11-08) |
| 3 | Pulse van de live-indicator (JNL-003 K13) | JNL-003 K13 | Geen gids voor een pulserende ring; de algemene `motion`-regels (compositor-properties, reduced motion per regel afgehandeld, geneste `@media`); de identiteitsbasis `scale: 1`; onder reduced motion de animatie vertragen in plaats van stoppen (`spinner`) | Dezelfde techniek en eindtoestand. De `scale: 1` is eerst toegepast en daarna verwijderd op besluit van de mens (2026-10-28), zoals bij test 2; "vertragen, niet stoppen" is in strijd met K13 "geen pulse onder reduced motion" en is niet gevolgd | Door de mens op de iPhone getest met de definitieve stip en minimale breedte: alle punten geslaagd | hetzelfde (2026-11-08) |

## Uitkomst (2026-11-08): houden, voor de zekerheid

Het oordeel van de mens over alle drie de tests is **hetzelfde**: de richtlijnen veranderden op
geen enkel inhoudelijk punt wat er gebouwd is. Het besluit is **houden**. De reden, in de woorden
van de mens: "simpelweg voor de zekerheid: baat het niet, dan schaadt het niet."

Dat wijkt bewust af van het exitcriterium hierboven, dat "hetzelfde" een reden noemt om het niet
te houden. Dit record legt die afwijking vast, zodat het besluit zijn eigen criterium niet stil
tegenspreekt.

Wat houden meebrengt, is nog niet gedaan, en daarom blijft dit record `in-progress`:

- de werkregel in `CLAUDE.md` (zie Gevolgen; een leidend document, dus via de communicatieplicht);
- of de installatie op scope `local` blijft (besluit 5), nu ze niet meer alleen een proef is;
- of elke run met de hand wordt goedgekeurd (besluit 2), wat alleen voor de duur van de proef was
  besloten.

## Waarom

Het animatiewerk hangt af van webplatformfeatures waarvan de ondersteuning snel verandert (animeren
naar een onbekende grootte, entry-animaties, reduced motion), en de kennis van de agent eindigt
bij zijn training cutoff. Richtlijnen die actueel worden gehouden kunnen die kloof dichten. Het is
een bewering, nog geen feit voor dit project: de gemelde verbetering van Google (37
procentpunten) komt uit zijn eigen interne benchmark. Dit is bewust een proef, zoals HDR-002,
maar met het exitcriterium vooraf vastgelegd.

## Wat er is gevonden vóór het installeren (2026-10-23)

Gelezen uit de README, `SKILL.md`, `plugin.json` en `package.json` van het project op GitHub (via
een samenvattende fetch-tool, dus een tweedehandslezing) en rechtstreeks uit de npm-registry.

**Gecontroleerd tegen de npm-registry (uit eerste hand):** versie 0.0.195, Apache-2.0, geen
lifecycle-scripts (er draait niets bij het installeren), geen dependencies, 260 bestanden, 33 MB
uitgepakt, vier maintainers die Chrome-teamleden zijn, 195 versies waarvan de laatste is
gepubliceerd op 2026-10-19.

**Wat het doet als de agent het gebruikt (uit `SKILL.md`):** bij UI-, layout-, scroll- en
motion-werk (niet bij backend, infrastructuur of triviale bewerkingen) voert de agent
`npx -y modern-web-guidance@latest search "<query>" --skill-version <date>` uit, daarna `retrieve
"<id>"`. De skill staat alleen toe dat precies dat commandopatroon op de allowlist komt, nooit
kale `npx *`. Hij vertelt de agent ook elk antwoord dat een gids gebruikte te laten eindigen met
een sectie "Modern Web Guidance" met de gids-id's en de regel die elk toepaste.

**Antwoorden op de open punten:**

- **Installatiebereik.** Niet vermeld in de README. De plugincommando's zijn `/plugin marketplace
  add GoogleChrome/modern-web-guidance` en `/plugin install modern-web-guidance@googlechrome`; het
  alternatief `npx modern-web-guidance@latest install` draait een wizard waarvan de
  bestandsschrijfacties niet gedocumenteerd zijn. Na het installeren te observeren, in het
  `/plugin`-scherm. Deze repo houdt zijn skills ingecheckt onder `.claude/skills/`; een plugin op
  gebruikersniveau zou niet met de repo meereizen.
- **Updates en pinnen.** Niets is gepind: elk commando gebruikt `@latest`, het pakket zit op
  0.0.x en verandert vaak. De plugin heeft een AutoUpdate-schakelaar in `/plugin`. Of een vaste
  versie kan worden gebruikt, is niet gedocumenteerd. npm zelf zou `modern-web-guidance@0.0.195`
  toestaan, maar de skilltekst zegt `@latest`, dus een gepinde run zou iets anders zijn dan wat de
  leverancier uitlevert. Niet getest.
- **Telemetrie.** De README zegt dat Google anonieme gebruiksinformatie verzamelt:
  installatieaantallen, de naam van de aanroepende agent, opgehaalde gids-id's en de
  **CLI-zoekopdrachten**, geen ruwe prompts; opt-out met `DISABLE_TELEMETRY=1`. `SKILL.md`
  beschrijft niets daarvan. **De twee bronnen spreken elkaar tegen; de README is de specifiekere,
  dus behandel telemetrie als aan.** Het zoeken zelf draait een offline model (geen
  netwerkaanroep); het netwerk is nodig om het pakket via `npx` op te halen.
- **Verwijderen.** Niet vermeld.
- **Baseline-target.** Niet instelbaar volgens de README. De Chrome-documentatie noemt één regel
  in `CLAUDE.md` of `AGENTS.md` ("This project's Baseline target is Baseline 2024."), en
  `SKILL.md` volgt een eigen ondersteuningsbeleid als er een is ingesteld. Zonder valt hij terug
  op Baseline Widely available.

**Niet gelezen:** de eigen code van de CLI (`skills/modern-web-guidance/modern-web.mjs`). De
telemetriebewering kan vanaf hier dus niet worden geverifieerd buiten de README om.

## Besluiten voordat de status naar `in-progress` gaat

Genomen door de mens op 2026-10-23:

1. **Telemetrie: uit.** `DISABLE_TELEMETRY=1` voor de shell van de agent. De zoekopdrachten zijn
   kort en gaan over CSS, maar ze verlaten de machine. Die variabele zetten is een harnesswijziging
   op zich: gedaan op 2026-10-23 als `env`-blok in `.claude/settings.json`. De naam is generiek,
   dus hij kan ook andere tools bereiken die hem lezen. Geverifieerd 2026-10-23: de shell van de
   builder-subagent heeft `DISABLE_TELEMETRY=1`.
2. **Toestemming: elke run met de hand goedkeuren** voor de duur van de proef. Geen
   allowlist-regel.
3. **Het Baseline-target: de default** (Baseline Widely available). Er wordt hiervoor niets aan
   `CLAUDE.md` toegevoegd.
4. **De extra sectie in antwoorden: laten staan.** De skill laat de agent een antwoord eindigen
   met een sectie "Modern Web Guidance". Tijdens de proef aangehouden, omdat ze de gids-id's en
   regels noemt die de code hebben gevormd, wat het bewijs is voor de eenregelige uitkomst in
   JNL-003 K10. Te letten bij de eerste run: of ze het vaste rapportformat van de builder
   verstoort.
5. **Installatieroute: de `/plugin`-commando's.** Gedaan op 2026-10-23, in een terminalvenster: het
   commando `/plugin` is niet beschikbaar in de VS Code-extensie ("isn't available in this
   environment"), maar `/reload-plugins` wel. Resultaat, gelezen uit
   `~/.claude/plugins/installed_plugins.json`: versie 0.0.195, **scope `local`** (deze gebruiker,
   alleen dit projectpad; ingeschakeld in de gitignored `.claude/settings.local.json`), gecachet
   onder `~/.claude/plugins/cache/googlechrome/`. Gevolg: er staat niets ervan in de repo, dus het
   reist niet mee naar een andere machine of clone; prima voor een proef, opnieuw te bekijken als
   het blijft. De gecachete plugin is gepind op 0.0.195, maar de CLI die hij aanroept wordt nog
   steeds bij elke run als `@latest` opgehaald. Verwijderen is niet door de leverancier
   gedocumenteerd; het `/plugin`-scherm in een terminal is de route.

## Gevolgen

- Als het blijft, komt het als werkregel in `CLAUDE.md` (de HDR is de redenering, `CLAUDE.md` de
  instructie). Voorgestelde formulering, niet toegepast: *"For CSS and web-platform work, consult
  Modern Web Guidance first; the project's Baseline target is X."* Het wijzigen van `CLAUDE.md`
  volgt de communicatieplicht: zeg wat er verandert en vraag om een check.
- Installeren doet de mens met de `/plugin`-commando's; de agent kan die niet uitvoeren.
- Bron: JNL-003, issue K10.
