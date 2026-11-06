@AGENTS.md

# Beslissingen

Beslissingen leven in het grootboek (`docs/grootboek/`): ADR (wat), PDR (waarom, product) en HDR
(hoe we werken), geïndexeerd door registers in `docs/grootboek/registers/`. Lees eerst het
register en dan alleen het record dat je nodig hebt: veel keuzes die in de code willekeurig lijken
zijn bewust gemaakt, en de redenering staat daar en niet in de diff. `docs/index.yml` is de
inhoudsopgave.

**Houd records bij in dezelfde commit als de code.** Spreekt een wijziging een record tegen,
werk het record dan in diezelfde commit bij of vervang het. Als losse klus gebeurt het niet, en
een verouderd record is erger dan geen record.

# Grootboek (experiment, `arc/*`-branches)

Genummerde beslissingsrecords (ADR, HDR, PDR), driftrapporten (DFT) en ontdekkingsjournalen (JNL)
onder `docs/grootboek/`, geïndexeerd door YAML-registers in `docs/grootboek/registers/`. Lees
eerst een register en dan alleen het document dat je nodig hebt. `docs/grootboek/CLAUDE.md` laadt
vanzelf in die map en bevat de documenttypen en afspraken. Start de skill `grootboek`
(`.claude/skills/grootboek/`) voor elk grootboekdocument: de schrijfgidsen daarvan zijn een harde
eis.

- **Communicatieplicht.** Leidende documenten: elke `CLAUDE.md` in de repo,
  `docs/grootboek/software-architectuur.md` (de enige balans tot nu toe; een nieuwe balans komt
  op deze lijst zodra hij wordt gemaakt) en `docs/code-architectuur.md`. Verandert er een: zeg
  wat er verandert en waarom, laat de concrete wijziging zien en vraag om een check. Geen stille
  bewerkingen. Dit geldt ook wanneer een record tot een wijziging van een leidend document leidt.
  Records (ADR, HDR, PDR, DFT, JNL) en de README vallen buiten deze plicht.
- Een beslissing zonder registerregel bestaat niet voor de volgende sessie. Werk het register bij
  in dezelfde commit als het record.
- **Incidentregister** (HDR-009): telt terugkerende fouten zodat ze regels kunnen worden. Corrigeert
  Jarón de agent, of faalt een tool opnieuw op dezelfde manier, voeg dan één regel toe onder een
  passend patroon in `docs/grootboek/registers/incident-register.yml` (of begin een nieuw patroon)
  en zeg dat in één zin. Waarschuwt `docs:check` dat een patroon er drie heeft, los de oorzaak dan
  op met een regel, hook of skill, boek een HDR en zet het id in de `maatregel` van het patroon.

# Wat dit is

Een persoonlijk leerproject, dat de bouwer ook dagelijks gebruikt, om gesproken gesprekken in een
vreemde taal te oefenen met een AI-persona. Details en ambitie: de sectie "Who it is for" in
`README.md`.

# Werkafspraken

Deze beschrijven wat de codebase en haar geschiedenis al doen. Vind je een tegenvoorbeeld, zeg dat
dan in plaats van een van beide blind te volgen.

- **Taal** (HDR-014). Code, commentaar in code, UI-teksten en commitberichten zijn Engels, net als
  `README.md`, `AGENTS.md` en `spikes/`. Alle andere documentatie is Nederlands: het grootboek en
  zijn registers, elke `CLAUDE.md`, de regels, de instructies van agents en skills, hookberichten
  en de rest van `docs/`. Bestaande Engelse documenten worden vertaald; nieuwe documenten schrijf
  je meteen in het Nederlands. Vertaal alleen proza, nooit keys, ids of de labels
  `Status`/`Date`/`Implementation` van een record. Bestandsnamen van documenten volgen de taal
  van hun inhoud (een Nederlands document krijgt een Nederlandse kebab-case naam); namen waar
  gereedschap op steunt (`CLAUDE.md`, `README.md`, `SKILL.md`, `index.yml`, registerbestanden, namen
  van agents en skills) blijven Engels. Houd vaktermen Engels in plaats van Nederlandse
  termen te verzinnen (hook, worktree, branch, dryrun; niet "werkboom" of "droogloop").
- **Geen AI-of-zelf-oordelen.** Dit project is een experiment in bouwen met een AI die het
  meeste van de code schrijft. Sla de eenregelige aanbeveling "laat AI dit genereren / schrijf dit
  zelf" en de framing van de Next.js/TypeScript-leerdoelen uit de globale instructies over. Wijzen
  op een vage prompt of spec blijft welkom.
- **De bestaande app is geen bron** (HDR-016, PDR-001). Lees, toon of doorzoek de bestaande
  Language Buddy-repo (`jaronbarends/language-buddy`) niet, tenzij Jarón een specifiek bestand
  aanwijst. Zou het lezen van een bestand echt tijd besparen, vraag dan eerst; noem hardop alles
  wat je wel leest. Kom je per ongeluk bij het materiaal uit, zeg dat dan in plaats van het
  stilletjes te gebruiken.
- **Codestijl** in één regel: TypeScript strict, function declarations, `if`s met accolades en
  early returns, booleans die als zin lezen (`microphoneIsLive`), bestandsnamen in kleine letters
  met streepjes. De volledige lijst laadt zodra je `src/` aanraakt (`.claude/rules/code-style.md`).
- **Commits.** Eén korte zin in de gebiedende wijs die zegt wat er veranderde ("Handle all
  documented Scribe error types"), geen prefixen behalve de zeldzame `chore:`. Geen
  `Co-Authored-By`-trailer. Een record dat door de wijziging verouderd raakt, gaat in dezelfde
  commit mee (zie Beslissingen).
- **Branches.** Eén branch per stuk werk, via een pull request in `main` gemerged: `stage/N-name`
  voor bouwstages, een beschrijvende naam voor fixes en features, `spike-*` voor experimenten.
  Reviewfixes krijgen eigen commits op de branch die wordt gereviewd. Code gaat via een branch en
  een PR; alleen kleine notities in de docs of tooling-aanpassingen zijn rechtstreeks op `main`
  gecommit, en alleen met Jaróns akkoord. Maak de branch vóór de eerste bewerking, niet erna. Werk
  in de grootboekexperiment-branches (`arc/*`) vanaf `arc/arc-main` en ga er via een PR terug in,
  terwijl `arc/arc-main` de integratiebranch is; `main` is productie (HDR-011).
- **Hooks.** `.claude/settings.json` koppelt hooks onder `.claude/hooks/`. De uitvoer van een hook
  is een bevel, geen suggestie: vuurt er een, voer dan precies uit wat er staat — niets overslaan,
  niets uitstellen, niet omzeilen met een ander gereedschap of een andere formulering. Een hook die
  een procedure draagt (een checklist, een release-ritueel) bewaart die procedure in een eigen
  bestand naast het script en injecteert haar op het juiste moment — de checklist is data, de hook
  is bezorging, dus een wijziging van de procedure betekent nooit een codewijziging.
- **Werkmodel: subagent-tenzij.** De lead thread stuurt aan en beslist; hij schrijft zelf geen
  broncode. Bewerkingen in `src/` of `spikes/` gaan via een builder-subagent — een
  `guard-kenniswerker`-hook dwingt dit af voor de lead thread (aanroepen van subagents komen
  erdoor; `docs/`, `.claude/` en andere bestanden die geen code zijn vormen een uitzondering, dus
  dit bestand of een hookscript kan nog direct worden bewerkt). Er is een tijdgebonden override
  voor als Jarón uitdrukkelijk vraagt dat de lead thread één wijziging zelf doet: die maakt
  `.claude/.hoofdthread-override.json` aan
  (`{"activatedAt": "<ISO timestamp>", "durationMinutes": 15}`, 15 minuten tenzij Jarón een langere
  duur noemt), en de hook honoreert het alleen tot het verloopt.
- **Staffel.** Laad vóór je een builder start de skill `triage` en classificeer de taak —
  trivial / normal / risky, op type, nooit op omvang — en zet het eenregelige oordeel
  (`regime: ... — <reden>`) op de eerste regel van de opdracht aan de builder. Een
  `triage-guard`-hook weigert een builderstart vanuit de lead thread zonder die regel (een builder
  die door een andere agent wordt gestart komt erdoor — de aansturende agent is daar de borging,
  volgens de skill). `trivial` krijgt een opdracht van één regel en een rapport van drie regels,
  geen reviewer; al het andere houdt het volledige contract.
- **Fork mode.** Standaard aan, geen setup nodig. Gebruik hem voor synthesewerk waarbij het gesprek
  de bron is — een spec, een concept, een verslag waarbij de dialoog zelf de bron is. Levende
  documenten en registers (de grootboekregisters) blijven werk voor de lead thread; ze zijn geen
  materiaal voor een fork.
- **Refactor loop.** Voordat de lead thread pusht, doorzoekt een `guard-push-sweep`-hook `src/` op
  bestanden voorbij de doorbell/hard-limit zonder registerbeslissing. Vindt hij nieuwe, dan weigert
  hij de push en noemt ze; de lead thread start de agent `refactor-werkplaats` voor die bestanden
  en probeert het dan opnieuw. Een pending-marker (`docs/.refactor-pending.json`, 24 uur TTL)
  voorkomt dat de volgende push een bestand opnieuw markeert waarvoor al een voorstel op review
  wacht. Een hook op git-niveau die dit onbewaakt start, naar ARC's eigen conventie, werd geweigerd
  door de eigen veiligheidsclassifier van het harnas ("Create Unsafe Agents") — wat echt is gebouwd
  is deze sessiegebonden versie; zie de REQ-AH-13-notitie in `docs/code-architectuur.md`.
- **Controles voordat je iets af noemt.** `npm run lint`, dan `npx next typegen && npx tsc --noEmit`,
  `npm run docs:check` (drift tussen docs en repo), `npm run test:scripts` (de tests van de scripts
  die documenten herschrijven), `npm run register:check` (het code-architectuurregister wijkt niet
  af), en dan `npm run build`. Alles wat audio, opname of layout raakt, vraagt ook een test op
  een echte iPhone: Safari is een harde eis.
- **Mappen.** `src/app` routes en globale CSS, `src/components` schermen en UI, `src/hooks`
  sessiecontext en effectdrivers, `src/lib` state machine, providerregistries en pure helpers.
  `spikes/` is een aparte app, uitgesloten van lint en typecheck.

# Waar de rest van de context staat

De context is gelaagd zodat een sessie laadt wat ze nodig heeft. `docs/index.yml` is de
machineleesbare inhoudsopgave: lees die eerst en open dan alleen het document dat je nodig hebt.

| Laag | Waar | Laadt |
|---|---|---|
| Codestijl | `.claude/rules/code-style.md` | wanneer een bestand in `src/` wordt aangeraakt |
| Safari / iPhone | `.claude/rules/safari-ios.md` | wanneer componenten, hooks of STT-code worden aangeraakt |
| Design system, componenten | `src/components/CLAUDE.md` | bij werk in `src/components/` |
| Providers, state machine | `src/lib/CLAUDE.md` | bij werk in `src/lib/` |
| Beslissingen | `docs/grootboek/` (ADR, PDR, HDR), via de registers en `docs/index.yml` | op aanvraag |
| Code-architectuur | `docs/code-architectuur.md` + `docs/code-architectuur-register.json` | op aanvraag; vóór het splitsen of laten groeien van een bestand |
| Grootboek | `docs/grootboek/`, via `registers/` | op aanvraag; `docs/grootboek/CLAUDE.md` laadt bij werk daar |
| Procedures | `.claude/skills/` | bij aanroep (`/stage-review`, `/grootboek`) |
| Agents | `.claude/agents/` (`builder`, `reviewer`) | bij delegatie; parallelle builders krijgen elk een eigen bestandsgrens en delen deze context |
