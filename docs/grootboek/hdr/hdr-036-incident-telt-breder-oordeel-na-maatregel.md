# HDR-036: Het incidentregister telt elke gevonden fout, en een incident na de maatregel vraagt een oordeel

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een telling meet alleen iets als iedereen hetzelfde telt, en ze blijft alleen iets meten als ze na
de maatregel nog wordt gelezen. HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie
vastgelegd als regel) bouwde de telling tot aan de maatregel. Daarna leunde ze weer op iemands
geheugen: wat een nieuw incident betekende, stond alleen in de tekst van het record dat de
maatregel boekte.

## Besluit

**Een incident is een fout in hoe de agent werkt, wie of wat hem ook vond:** een correctie van
Jarón, een review, een check, een koude-startbeoordeling of de agent zelf. Een toolfout telt als
hij eerder zo is voorgekomen. Dit vervangt de twee aanleidingen in de logplicht van HDR-009 (een
correctie van Jarón, een toolfout die eerder gebeurde) en legt vast wat het register al telde.

**Een incident na de maatregel vraagt een oordeel.** Elk patroon met een `maatregel` krijgt het
veld `beoordeeld-tot`: de telling tot waar de incidenten tegen de maatregel zijn beoordeeld. Komt
de telling erboven, dan waarschuwt `docs:check`. De waarschuwing stopt na een oordeel: "de
maatregel hield" in de `wat` van het incident, of een stevigere maatregel als nieuwe HDR. Daarna
gaat `beoordeeld-tot` omhoog, met Jaróns akkoord. Een `maatregel` zonder `beoordeeld-tot`, het veld
zonder `maatregel`, een waarde die geen geheel getal van nul of meer is, of een waarde boven de
telling is een fout.

De werkafspraak in de root-`CLAUDE.md` wordt:

> **Incidentregister** (HDR-009, HDR-036): telt terugkerende fouten zodat ze regels kunnen worden.
> Maakt de agent een fout in hoe hij werkt, wie of wat die ook vindt (Jarón, een review, een check,
> een koude-startbeoordeling, de agent zelf), of faalt een tool opnieuw op dezelfde manier, voeg
> dan één regel toe onder een passend patroon in `docs/grootboek/registers/incident-register.yml`
> (of begin een nieuw patroon) en zeg dat in één zin. Waarschuwt `docs:check` dat een patroon er
> drie heeft, los de oorzaak dan op met een regel, hook of skill, boek een HDR en zet het id in de
> `maatregel` van het patroon. Waarschuwt hij voor een incident na de maatregel, leg Jarón dan voor
> of de maatregel hield of dat er iets stevigers nodig is, en hoog na zijn oordeel `beoordeeld-tot`
> op.

## Waarom

Twee gaten, allebei genoemd in K11 van JNL-002 (Koude-startjournaal: kan een nieuwkomer werken met
alleen de repo?) en niet besloten door HDR-035 (Een afwezigheidsclaim noemt waar ze op rust).

**Na de maatregel zag niemand een nieuw incident.** `docs:check` keek per patroon naar één ding:
drie of meer incidenten en geen `maatregel`. Kreeg `document-not-fully-read` een vijfde incident,
dan meldde `docs:incidents` alleen "codified in HDR-035". Dat zo'n incident de maatregel ter
discussie stelt, stond in de Gevolgen van HDR-025 (Een bewering over een document of de omgeving
komt uit de bron), HDR-034 (Een beslispunt begint met uitleg, een directe vraag met het antwoord)
en HDR-035, en die leest niemand op het moment van loggen.

**De definitie was smaller dan de praktijk.** Van de vier incidenten in `document-not-fully-read`
was er één een correctie van Jarón; de andere vonden een koude-startbeoordeling en de agent zelf.
`branch-before-edit` en `date-assumed` komen uit koude-startruns, `promised-follow-up-dropped` uit
een DFT, een record en een coachingsronde. K11 besloot dat zo'n incident telt, maar HDR-009 en de
root-`CLAUDE.md` zeiden nog iets anders. Een agent die de tekst volgde, logde minder dan het
register gewend was.

**De casus die beide raakt.** In de sessie die HDR-035 boekte, concludeerde de lead uit een grep,
zonder het uit te spreken, dat de index geen HDR's bevat. `docs:check` ving het op, geen
correctie. Dit rust op Jaróns samenvatting; hoe het precies ontstond, is niet nagegaan. Volgens de oude tekst was dat geen incident. Nu is het het vijfde in
`document-not-fully-read`, en het eerste incident na een maatregel dat op een oordeel wacht.

## Afgewogen

Voor het eerste gat:

- **Alleen tekst:** wie logt bij een patroon met maatregel, zegt erbij dat het incident erna valt.
  Dat leunt op de agent die net de fout maakte, en een latere sessie ziet het niet.
- **Op datum:** waarschuwen bij een incident dat later valt dan de datum van het maatregel-record.
  Geen nieuw veld, maar een incident op dezelfde dag is niet te plaatsen (de casus valt op de
  datum van HDR-035), en de enige uitweg is een nieuwe maatregel. Elk incident erna telt dan als
  falen: de strenge maat die HDR-035 afwees.

Voor het tweede gat:

- **Smal houden en de praktijk terugdraaien.** Botst met K11 en maakt minstens vier bestaande
  regels ongeldig.
- **Alleen bij een bestaande afspraak of een correctie.** Minder ruis, maar een nieuw soort fout
  die niemand corrigeert, begint geen telling, terwijl het register het eerste en tweede voorkomen
  nodig heeft om een derde te herkennen.

Gekozen (Jarón, 2026-11-13): de oordeelsteller, omdat alleen die later zichtbaar blijft en een
incident na een regel die niet af te dwingen is als oordeelsvraag behandelt. En de fout telt, wie
hem ook vond, omdat de drempel van drie ruis al opvangt.

## Gevolgen

- **De succesmaat is voortaan één maat:** elk incident na de maatregel krijgt een oordeel. "Geen
  volgend incident" in HDR-025 en HDR-034 was te streng voor een regel die niet mechanisch te
  controleren is; HDR-035 zei dat al voor HDR-025. HDR-034 en HDR-035 wijzen hierheen.
- **Ingevuld voor de zeven patronen met een maatregel**, op hun telling van vandaag, behalve
  `document-not-fully-read`: dat staat op 4 van 5, omdat het vijfde incident nog niet is
  beoordeeld. `docs:check` waarschuwt daar vanaf de eerste dag.
- **Tellingen lopen sneller op.** De bredere definitie levert meer regels; de drempel blijft drie.
- **Loggen hangt nog steeds van de agent af**, zoals HDR-009 zei. Bij een fout die de agent zelf
  vindt nog sterker, want daar kijkt niemand mee.
- **Ophogen zonder oordeel zet de waarschuwing stil**, zoals een willekeurige `maatregel` dat al
  deed. De borging is Jaróns akkoord.
- **De casus laat een gat in HDR-035 zien**, hier niet besloten: een conclusie die nooit wordt
  uitgesproken, heeft geen zin om een basis bij te zetten.
- HDR-009, HDR-034 en HDR-035 wijzen hierheen (versie 1.1). De kop van het incidentregister
  beschrijft het veld en de definitie; `scripts/incidents.mjs` en de tests dragen de controle.
- De root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón getoond en door hem
  gecontroleerd.

Verwant: HDR-009 (Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel)
Verwant: HDR-034 (Een beslispunt begint met uitleg, een directe vraag met het antwoord)
Verwant: HDR-035 (Een afwezigheidsclaim noemt waar ze op rust)
