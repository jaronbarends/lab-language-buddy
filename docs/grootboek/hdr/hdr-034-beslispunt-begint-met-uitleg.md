# HDR-034: Een beslispunt begint met uitleg, een directe vraag met het antwoord

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een vraag beantwoorden en een keuze voorleggen lijken op elkaar, maar vragen een omgekeerde
volgorde. Wie een directe vraag stelt, kent de context al en wil het antwoord; de redenering komt
eronder. Wie een keuze voorgelegd krijgt, kent de context vaak nog niet: opties en een advies zijn
pas te wegen als duidelijk is wat er speelt. Een advies vóór de uitleg vraagt Jarón te beslissen
over iets wat hij nog niet heeft gezien.

Wat de agent heeft gelezen, kent Jarón niet vanzelf: het reviewbestand, het journaal, de
startprompt. Dat verschil is het grootst bij een startprompt die een andere sessie in Jaróns stem
schreef. Die klinkt alsof Jarón de kwestie kent, terwijl hij haar alleen heeft doorgegeven.

## Besluit

Een werkafspraak in de root-`CLAUDE.md`, onder Werkafspraken:

> **Beslispunten: eerst uitleg** (HDR-034). Leg je Jarón een keuze voor (een reviewbevinding,
> een kwestie, een rij opties), begin dan met 4–6 regels in gewone woorden: wat er speelt, een
> concreet voorbeeld, waarom het ertoe doet. Daarna de opties, het advies als laatste. Een directe
> vraag krijgt juist eerst het antwoord, met de redenering eronder. Een geplakte startprompt is
> geen bewijs dat Jarón de inhoud kent, ook niet als hij in zijn stem is geschreven.

## Waarom: drie incidenten

Het patroon `review-point-context` in het incidentregister (HDR-009, Terugkerende fouten worden per
patroon gelogd en bij drie vastgelegd als regel) bereikte op 2026-11-13 de drempel van drie:

1. **2026-10-03, doorloop van een review.** Een bevinding werd beschreven als een schema met drie
   losse optionele velden en meteen ter beslissing voorgelegd. Jarón moest het reviewbestand
   openen om te begrijpen waar het over ging.
2. **2026-11-13, K9 van JNL-002** (Koude-startjournaal: kan een nieuwkomer werken met alleen de
   repo?). Opties en een advies, zonder eerst uit te leggen waar de kwestie over ging. Jarón noemde
   het irritant en zei dat het vaak gebeurt.
3. **2026-11-13, K10 van JNL-002, een kwartier later.** Hetzelfde: eerst een vetgedrukt advies,
   dan een leesverslag en een optietabel, en nergens wat de kwestie is.

## Waarom het geheugen niet genoeg was

Na het eerste incident stond de afspraak in een geheugennotitie. Drie dingen hielden haar tegen:

- **Privé en te smal aangekondigd.** Geheugen staat niet in de repo en telt niet als maatregel.
  Bovendien noemde de indexregel, die elke sessie laadt, alleen reviewbevindingen, ook nadat de
  notitie zelf na K9 naar elk beslispunt was verbreed. Een kwestie uit een journaal viel daar
  zichtbaar buiten. Het is hetzelfde mechanisme als bij HDR-025 (Een bewering over een document of
  de omgeving komt uit de bron): de indexregel werd gelezen als de inhoud.
- **Een notitie die de andere kant op trok.** De notitie over antwoord-eerst (patroon
  `answer-first`) zegt terecht dat een directe vraag eerst het antwoord krijgt. Zonder grens trok
  ze het advies naar de eerste regel, ook bij een verzoek om opties. Bij K10 stond daardoor het
  advies bovenaan.
- **Startprompts in Jaróns stem.** K9 en K10 begonnen met een startprompt die een lead-sessie in
  Jaróns stem had geschreven: compact, met de vraag om opties en één advies, niet om uitleg. Het
  leek alsof Jarón de kwestie al kende.

De regel pakt alle drie aan. Hij staat in de repo, noemt elk beslispunt, trekt de grens met een
directe vraag, en zegt dat een startprompt geen bewijs is dat Jarón de inhoud kent.

## Waarom een regel aan de leeskant en geen hook of startprompt-regel

- **Een regel aan de schrijfkant**, waarbij een startprompt met een beslisvraag expliciet om eerst
  uitleg vraagt, dekt het incident van oktober niet: daar was geen startprompt. Niet onderzocht is
  of de werkwijze voor startprompts al een plek in de repo heeft.
- **Een hook kan dit niet afdwingen.** Hooks zien prompts en tool-aanroepen, niet het antwoord
  voordat Jarón het leest. En of iets genoeg is uitgelegd, is een oordeel en geen patroon dat een
  script herkent, net als bij HDR-025. Een hook kan wel een herinnering bezorgen, bij
  `UserPromptSubmit` op woorden als "opties" of "advies", of vóór `AskUserQuestion`. Trefwoorden
  missen gevallen en vuren onterecht; het incident van oktober zat midden in een doorloop.

## Gevolgen

- `review-point-context` noemt dit record als `maatregel`, en de waarschuwing van `docs:check`
  ervoor is weg. De titel van het patroon is verbreed van "reviewbevinding" naar "beslispunt",
  omdat de incidenten dat laten zien. Het register is verder alleen-toevoegen; deze aanpassing
  gebeurde met Jaróns akkoord.
- `answer-first` noemt dit record ook als `maatregel`. Dat patroon stond op twee incidenten en
  haalde de drempel niet. De zin over directe vragen legt het toch vast, omdat de botsing tussen de
  twee notities een van de oorzaken was.
- **Niet mechanisch te controleren**, net als HDR-025. Succes is geen vierde incident in
  `review-point-context` en geen derde in `answer-first`. Komt er toch een, dan is een hook die een
  herinnering bezorgt de eerste kandidaat.
- De root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón getoond en door hem
  gecontroleerd.

Verwant: HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel)
Verwant: HDR-025 (Een bewering over een document of de omgeving komt uit de bron)
