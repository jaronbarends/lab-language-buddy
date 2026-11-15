# HDR-038: Een Stop-hook houdt de beurt tegen bij een record-id zonder omschrijving

- **Status:** implemented
- **Date:** 2026-11-15
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een regel over de vorm van een antwoord zakt weg zodra de aandacht bij iets anders ligt. Is de
overtreding een patroon in de tekst en staat het goede antwoord in een register, dan hoeft de
regel niet op aandacht te leunen: een script kan haar na de beurt vangen. Het doel is niet de
exacte titel, maar dat Jarón ziet waar een document over gaat.

## Besluit

**Een Stop-hook, `guard-id-with-title`, leest na elke beurt de tekst van de assistent** en houdt
het stoppen tegen bij een record-id zonder omschrijving. Het slotbericht komt uit
`last_assistant_message` in de hookinvoer, de rest van de sessie uit het transcript.

- **Welke ids:** ADR, HDR, PDR, DFT en JNL (`HDR-038`). REQ-ids en kwesties (K7) vallen erbuiten:
  die hebben geen register met titels, en een kwestie heeft context nodig. Die blijven bij de
  werkafspraak.
- **Wanneer:** in proza bij de eerste vermelding in de sessie. Een codeblok zonder taal (een
  startprompt of overdracht, gelezen buiten de sessie) is een eigen eenheid: daar geldt de eerste
  vermelding in dat blok. Inline code en codeblokken met een taal (`diff`, `yaml`) zijn citaten en
  worden overgeslagen.
- **Wat een omschrijving is:** direct na het id, ook op de direct volgende regel, staat een woord
  tussen haakjes, na `:`, `—`, `–` of `,`, in de volgende tabelcel of tussen aanhalingstekens; een
  link telt als het id. Een id is nooit een omschrijving, dus `HDR-009, HDR-034` blijft kaal. Of
  de omschrijving klopt, controleert de hook niet.
- **Wat hij terugstuurt:** de kale ids met hun titel uit het register. Bij proza vraagt hij om een
  korte aanvulling, bij een codeblok om het blok opnieuw te sturen, omdat een aanvulling eronder
  een startprompt niet repareert.
- **Wanneer hij stil blijft:** bij een schone beurt (geen uitvoer, dus geen tokens), bij
  `stop_hook_active` (de beurt na een blokkade) en bij elke fout in invoer of transcript, zodat een
  kapot bestand geen sessie vastzet. Claude Code heeft daarnaast een eigen grens op het aantal
  blokkades achter elkaar.

De werkafspraak in de root-`CLAUDE.md` wordt:

> **Ids met titel** (HDR-038). Haal je een genummerd document aan (ADR, HDR, PDR, DFT, JNL, REQ,
> een kwestie zoals K7), zeg dan bij de eerste vermelding in de sessie en in elke startprompt waar
> het over gaat: de titel of een paar woorden daaruit. Zoek die op in het register; leid hem niet
> af uit de bestandsnaam. De hook `guard-id-with-title` controleert ADR, HDR, PDR, DFT en JNL na
> elke beurt; REQ-ids en kwesties niet.

## Waarom

**Twee tekstdragers hielden het niet tegen.** Het patroon `id-with-title` telde zes incidenten.
Het tweede gebeurde terwijl de geheugennotitie in de context stond, en drie op 13 november
terwijl de werkafspraak in de geladen root-`CLAUDE.md` stond: kale ids in een bericht over een
mergeconflict, in een kop en in twee startprompts. Een HDR rond de bestaande werkafspraak had de
waarschuwing in `docs:check` stilgezet zonder iets te veranderen op het moment van schrijven.

**Hier kan een script wat bij HDR-034 en HDR-035 niet kan.** Bij HDR-034 (Een beslispunt begint
met uitleg, een directe vraag met het antwoord) en HDR-035 (Een afwezigheidsclaim noemt waar ze op
rust) is een overtreding een oordeel. Een kaal id is een tekstpatroon, en de titel staat in een
register.

**Per sessie, niet per bericht.** Een replay op het transcript van de sessie van HDR-037 (Het
incidentregister telt elke gevonden fout, en een incident na de maatregel vraagt een oordeel) liet
zien dat "eerste vermelding in elk bericht" 12 à 13 van de 16 beurten zou blokkeren. Jarón boekte
er vijf vermeldingen van: ids die hij in die sessie nog niet had gezien, en startprompts. De rest
waren ids die hij uit de sessie al kende. Per sessie blokkeert de hook daar 5 van de 16 beurten,
en hij vangt het mergeconflict en beide startprompts.

**Het slotbericht komt uit de hookinvoer.** De eerste live test bleef stil: het slotbericht kreeg
zijn tijdstempel 15 ms voordat de hook startte en stond nog niet op schijf. Met de hand op hetzelfde
transcript blokkeerde de hook wel. Het schema van de Stop-hook in Claude Code geeft
`last_assistant_message` mee, "Avoids the need to read and parse the transcript file". De tweede
live test, in de terminal, blokkeerde op een kaal id in proza en in een codeblok, bleef stil op een
schone beurt en blokkeerde de aanvulling niet opnieuw.

## Afgewogen

- **Alleen tekst:** een HDR rond de werkafspraak. Zet de waarschuwing stil terwijl de afspraak al
  drie keer faalde toen ze geladen was.
- **Een herinnering bij elke prompt** (`UserPromptSubmit`): dichter bij het schrijven, maar nog
  steeds tekst, en ze kost elke beurt context.
- **Een prompt-hook** die een model laat oordelen: kost elke beurt een modelaanroep, waar een
  regex en een register genoeg zijn.
- **Per bericht:** 12 à 13 van 16 beurten geblokkeerd in de sessie van HDR-037.
- **Streng, de exacte registertitel:** vangt ook een verkeerde titel, maar blokkeert op elke
  ingekorte omschrijving; Jarón vindt een paar woorden genoeg.
- **Een uitzondering bij een uitdrukkelijk verzoek** om kale ids: niet betrouwbaar te herkennen, en
  zo'n verzoek is zeldzaam.
- **"HDR-034 heet "…"" als omschrijving:** niet herkend, één vals alarm in een vorm die de
  testprompt uitlokte. Uitbreiden als het in echt werk opvalt.

Gekozen (Jarón, 2026-11-13 tot 2026-11-15): de Stop-hook, per sessie, met de losse check en de
vier extra vormen.

## Gevolgen

- **Kosten:** een schone beurt kost niets. Een blokkade kost een extra modelaanroep over de context
  van dat moment, plus de aanvulling. Over alle opgenomen sessies van vóór de hook zou hij ongeveer
  1 op 8 beurten blokkeren; of dat daalt nu de agent het merkt, laat het gebruik zien.
- **Wat de hook mist:** REQ-ids en kwesties (het eerste incident, een REQ-id, en het zesde, K1 en K2
  uit JNL-005 (Metingen van de corrector), vallen erbuiten); een id dat laat in een lange sessie
  kaal terugkomt; een verkeerde omschrijving, zoals de titel uit een bestandsnaam op 9 november; een
  kaal id gevolgd door een komma en een ander lijstitem ("HDR-035, HDR-037, de kop van …").
- **Waar hij vals alarm geeft:** citaten van tool-uitvoer of commitberichten, en een omschrijving
  met een woord ertussen ("HDR-034 heet …"). Vals alarm in een startprompt is het duurst, omdat het
  hele codeblok opnieuw moet.
- **Hij leunt op een optioneel veld.** Ontbreekt `last_assistant_message`, dan valt de hook terug op
  het transcript en mist hij het slotbericht, zoals in de eerste live test.
- **In het incidentregister** krijgt `id-with-title` `maatregel: HDR-038` en `beoordeeld-tot: 7`.
  Het zevende incident viel tijdens het boeken: de lead noemde HDR-038 kaal, de net gekoppelde hook
  blokkeerde en de aanvulling volgde. Oordeel van Jarón: de maatregel hield.
- **Oordeel na de maatregel** (HDR-037): valt een volgend incident binnen het bereik van de hook,
  dan is de vraag of de check moet veranderen; valt het erbuiten (REQ, een kwestie, laat in de
  sessie), dan is de vraag of het bereik groter moet.
- **De repo heeft nu een hook die antwoorden leest.** HDR-025 (Een bewering over een document of de
  omgeving komt uit de bron) noemde alleen hooks op tool-aanroepen. Zijn afweging blijft staan:
  ook een hook die het antwoord leest, kan niet beoordelen of een bewering gedekt is.
- **Code en test:** `.claude/hooks/guard-id-with-title.cjs` (met `--replay <transcript>` om een
  sessie na te meten), gekoppeld als `Stop`-hook in `.claude/settings.json`;
  `scripts/guard-id-with-title.test.mjs` draait in `test:scripts` en in CI. ESLint slaat
  `.claude/hooks/**` over.
- De root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón getoond en door hem
  gecontroleerd.

Verwant: HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel)
Verwant: HDR-034 (Een beslispunt begint met uitleg, een directe vraag met het antwoord)
Verwant: HDR-037 (Het incidentregister telt elke gevonden fout, en een incident na de maatregel vraagt een oordeel)
