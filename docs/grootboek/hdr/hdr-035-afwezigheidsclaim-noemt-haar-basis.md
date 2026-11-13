# HDR-035: Een afwezigheidsclaim noemt waar ze op rust

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een bewering dat iets ontbreekt, heeft niets om te citeren. Wie zegt dat iets ergens staat, kan het
aanwijzen; wie zegt dat het er niet staat, kan alleen zeggen hoe hij heeft gekeken. Blijft dat weg,
dan ziet de lezer niet of er gelezen of alleen gezocht is, en klinkt een zwakke basis even stellig
als een sterke.

HDR-025 (Een bewering over een document of de omgeving komt uit de bron) vraagt de agent eerst de
bron te lezen. Dat is een eis aan het werk vóór de zin, en wie hem overslaat, laat geen spoor na.
Dit record legt de eis op de zin zelf, zodat een overtreding opvalt waar de lezer al kijkt.

## Besluit

De werkafspraak in de root-`CLAUDE.md` krijgt twee zinnen erbij:

> **Beweringen uit de bron** (HDR-025, HDR-035). Een bewering over wat een document zegt of wat
> de omgeving heeft, komt uit de bron: lees het document helemaal of draai het commando. Een
> zoekresultaat, een indexregel of een geheugennotitie is een aanwijzing, geen bewijs. Zeg je dat
> iets ontbreekt, zeg er dan bij waar dat op rust: "helemaal gelezen", "grep op `X`: geen
> treffers", "volgens de indexregel van Y". Een afwezigheid die op een aanwijzing rust, meld je
> als vermoeden.

De laatste zin houdt de twee records verenigbaar. Een genoemde basis maakt een grep geen bewijs;
ze maakt alleen zichtbaar dat het een grep was.

## Waarom: het vierde incident

HDR-025 legde vast: komt er een vierde incident in `document-not-fully-read`, dan was een regel niet
genoeg. Op 2026-11-13 telde Jarón dat vierde incident (K11 van JNL-002, Koude-startjournaal: kan
een nieuwkomer werken met alleen de repo?). In koude-startronde 3 oordeelde een koude agent, met
HDR-025 in de geladen `CLAUDE.md`, op basis van een grep op `Intermediate|\(B1\)` dat het
labelformaat niet in twee documenten stond. Het klopte, maar de vorm is wat de regel verbiedt. De
bewering kwam boven bij de beoordeling van de ronde. De agent was een Sonnet-lead; of het model
meespeelt, is met één run niet te zeggen.

De vier incidenten samen (incidentregister, HDR-009, Terugkerende fouten worden per patroon gelogd
en bij drie vastgelegd als regel):

- **Alle vier zijn afwezigheidsclaims.** De README noemt alleen lint en build; er was geen
  aanleiding een regel te testen; `gh` is niet geïnstalleerd; het labelformaat staat er niet in.
- **Het gereedschap verschilt.** Twee keer een zoekopdracht (1 en 4), één keer de indexregel van
  een geheugennotitie (3), één keer een bron die niet geopend is (2).
- **Drie van de vier komen uit koude-startwerk**, waar "wat ontbreekt er?" het product zelf is.
- **Met een genoemde basis was elk incident zichtbaar geweest.** "Grep op `npm run`", "volgens de
  indexregel" en "grep op `Intermediate`" vallen een lezer meteen op. Bij incident 2 minder scherp:
  daar had de agent moeten opschrijven dat hij de bron niet had geopend.

## Afgewogen

- **De regel is genoeg, de succesmaat wordt aangepast.** Het signaal is zwak: de bewering klopte,
  ze werd bij de beoordeling gevonden, en hoeveel afwezigheidsclaims sinds 2026-11-08 wél uit de
  bron kwamen, weet niemand. Maar de maat aanpassen nadat ze is geraakt, is de doelpaal
  verschuiven.
- **Een hook bij een lege zoekopdracht.** Een `PostToolUse`-hook die na een zoekopdracht zonder
  treffers de regel in beeld zet, op het enige moment dat een script herkent. HDR-025 sloot een
  hook uit die de bewering beoordeelt; deze beoordeelt niets. Hij dekt alleen incident 4: bij 1
  vond de grep wél iets, bij 2 en 3 was er geen zoekopdracht. Hij vuurt ook bij gewoon zoeken naar
  een plek, en ruis wordt genegeerd. Of een Bash-`grep` met exitcode 1 in `PostToolUse`
  binnenkomt, is niet uitgezocht.
- **De controle in de koude-startprocedure.** Daar zitten drie van de vier incidenten, maar gewone
  werksessies (incident 3) blijven erbuiten. Waar die procedure staat, is niet uitgezocht.
- **Een skill** laadt op een taakomschrijving, en een afwezigheidsclaim is geen taak.
- **Een prompt-hook op `Stop`**, waarin een klein model elk eindantwoord beoordeelt, is het enige
  dat de bewering zelf toetst. Hij draait elke beurt: tokens, vertraging, valse alarmen. Of Claude
  Code dat hooktype in deze versie heeft, is niet nagekeken.

Gekozen (Jarón, 2026-11-13) is de basis bij de zin: de enige vorm die alle vier de incidenten
raakt, en per bewering een bijzin kost in plaats van een heel document lezen.

## Gevolgen

- **Nog steeds een regel.** Steviger dan HDR-025 omdat een overtreding opvalt, niet omdat ze wordt
  afgedwongen. Een deel van het oordeel ligt nu bij de lezer.
- **De succesmaat van HDR-025 was te streng.** "Geen vierde incident" haalt geen regel die niet
  mechanisch te controleren is. Een volgend incident in `document-not-fully-read` krijgt in het
  register erbij of de basis genoemd was. Was ze genoemd, dan deed de regel wat hij moest: de lezer
  zag het. Was ze niet genoemd, dan bereikt ook deze regel de agent niet, en is de hook bij een
  lege zoekopdracht de kandidaat die overblijft, na een spike op de ruis. Die hook is hier niet
  besloten.
- `document-not-fully-read` noemt dit record als `maatregel`, in plaats van HDR-025. Het register
  is verder alleen-toevoegen; deze aanpassing gebeurde met Jaróns akkoord. HDR-025 wijst hiernaar
  (versie 1.2).
- **Een eigen record**, zoals HDR-033 naast HDR-024: de titel van HDR-025 blijft kloppen.
- De root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón getoond en door hem
  gecontroleerd.

Verwant: HDR-025 (Een bewering over een document of de omgeving komt uit de bron)
Verwant: HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel)
