# HDR-025: Een bewering over een document of de omgeving komt uit de bron

- **Status:** implemented
- **Date:** 2026-11-08
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een zoekresultaat, een indexregel en een geheugennotitie vatten een bron samen. Ze bestaan om de
bron snel te vinden, niet om haar te vervangen. Wie de aanwijzing rapporteert als de inhoud,
rapporteert een deel als het geheel.

Alle drie de incidenten zijn een bewering dat iets *ontbreekt*: de README noemt alleen lint en
build, er was geen aanleiding om een regel te testen, `gh` is niet geïnstalleerd. Zo'n bewering is
op een gedeeltelijke lezing het gevaarlijkst, want niets in dat deel spreekt haar tegen. Een
zoekopdracht die niets vindt, bewijst alleen dat het patroon niet trof.

## Besluit

Een werkafspraak in de root-`CLAUDE.md`, onder Werkafspraken:

> **Beweringen uit de bron** (HDR-025). Een bewering over wat een document zegt of wat de
> omgeving heeft, komt uit de bron: lees het document helemaal of draai het commando. Een
> zoekresultaat, een indexregel of een geheugennotitie is een aanwijzing, geen bewijs.

## Waarom: drie incidenten

Het patroon `document-not-fully-read` in het incidentregister (HDR-009) bereikte op 2026-11-08 de
drempel van drie:

1. **2026-10-27, koude-startrun 1.** De agent zei dat de README alleen lint en build noemt. Hij
   baseerde dat op een zoekopdracht naar `npm run`, die de regels miste die met `npx` beginnen; de
   typecheck stond er ook in.
2. **2026-10-27, voorbereiding van koude-startrun 2.** In het journaal schreef de agent dat er
   geen aanleiding was geweest om de AI-of-zelf-regel te testen, zonder de globale instructie te
   lezen die vóór elke nieuwe taak om dat oordeel vraagt.
3. **2026-11-08, PR van `drift-baseline-from-dft`.** De agent zei dat `gh` hier niet geïnstalleerd
   is en dat Jarón de PR moest maken. Hij baseerde dat op de indexregel van een geheugennotitie;
   de notitie zelf zei dat `gh` er wel is en dat eerst `gh auth status` moet draaien.

Het gereedschap verschilt per incident, de fout niet: een bewering zonder dat de bron zelf is
gelezen of het commando is gedraaid. Daarom noemt de regel de vormen van de aanwijzing en niet één
gereedschap.

## Waarom een regel en geen hook

De hooks van deze repo zitten op `PreToolUse` en `PostToolUse`: ze zien tool-aanroepen, en een
bewering is tekst in een antwoord. Ook een hook die die tekst wel leest, kan niet beoordelen of een
zin iets over een bron beweert en of die bron helemaal is gelezen. Dat is een oordeel, geen patroon
dat een script herkent. Bij incident 3 viel er ook niets tegen te houden: geen bewerking, geen
commit, alleen een zin in de chat.

## Gevolgen

- `document-not-fully-read` noemt dit record als `maatregel`, en de waarschuwing van `docs:check`
  ervoor is weg.
- **Niet mechanisch te controleren**, net als HDR-010. Succes is dat er geen vierde incident in dit
  patroon wordt gelogd. Komt er toch een, dan was een regel niet genoeg en groeit het patroon door
  naar iets steviger.
- **Sinds 2026-11-13 staat er een vierde incident.** In koude-startronde 3 (2026-11-10) oordeelde
  een koude agent, met deze regel in de geladen `CLAUDE.md`, op basis van een grep dat het
  labelformaat niet in twee documenten stond. De bewering klopte; ze telt omdat de regel de vorm
  noemt, niet de uitkomst (K11 van JNL-002). Wat steviger is dan deze regel, is nog niet besloten.
- **Helemaal lezen kost context**, bij een groot document merkbaar. De regel geldt voor een
  bewering over wat het document zegt; een zoekopdracht om de plek te vinden blijft een goede
  eerste stap.
- De root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón getoond en door hem
  gecontroleerd.

Verwant: HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel)
Verwant: HDR-010 (Een naam wordt getoetst aan wat hij belooft)
