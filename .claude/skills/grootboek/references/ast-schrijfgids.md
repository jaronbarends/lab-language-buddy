# AST Schrijfgids

Een asset-document erkent waardevolle content die herhaaldelijk wordt
gebruikt. Het is geen beslissing (dat is ADR/PDR/HDR), geen ontdekking
(dat is JNL), maar een erkenning: "hier zit iets dat we steeds weer
nodig hebben."

## Wat maakt een asset-document goed

Het helpt ons omdat we het dan heel makkelijk met @ kunnen oproepen. Daarom doen we dit. 

Soms is een asset één bestand (de visualisatie-spelregels). Soms is
het een verzameling (het lab met varianten, resultaten en scripts).


## Bron en kopie

**Meestal is een asset een uniek document**: het AST-bestand zelf draagt de
volledige inhoud en is de bron — je weeft het met `@` in en krijgt alles. Soms
hoort het denkwerk elders thuis (bijvoorbeeld een framework-map, de werkplaats of
de operatie); dan blijft die plek de bron en draagt het AST-bestand een volledige
kopie daarvan, óf een verwijzing die ernaar routeert. De dirigent bepaalt welke
van de drie het is — bij twijfel: een uniek document.

Het @-bare bestand staat in `docs/assets/` — een **conventiepad** dat het
grootboek in jouw project aanlegt — met de `ast-NNN`-prefix van zijn
registernummer, zodat je de asset via `@` kunt inweven en op nummer oproepen.
Illustratief: `@docs/assets/ast-002-visualisatie-spelregels.md` (een ARC-asset,
hier alleen als naamvoorbeeld). `@` heeft nu eenmaal een fysiek bestand op een
vindbaar pad nodig; de prefix houdt het consistent met het register.

### Kopie of router — twee soorten @-bare bestand

Standaard is de @-bare kopie een **volledige kopie** van de bron: typ `@` en de
hele inhoud landt in de prompt. Voor de meeste assets is dat precies goed.

Maar soms is de bron groot en bestaat ze uit **meerdere lagen** waarvan je niet
altijd alles tegelijk nodig hebt. Dan mag de @-bare kopie een **voed-router**
zijn in plaats van een volledige kopie: een korte tekst die de afweging voedt
("ga je voor A of B?") en de agent naar de juiste bron(nen) doorverwijst — die
hij pas inleest als de afweging dat vraagt. Token-licht, en beter gevoed (ast-005:
voeden, niet alles tegelijk in het gezicht). Voorbeeld: `ast-002` (visualisatie-
spelregels) routeert tussen de tekstlaag en de HTML-laag. Markeer zo'n asset met
`vorm: voed-router` in de frontmatter, zodat duidelijk is dat `@` níét de volledige
inhoud inweeft.

### Bij het inboeken

Een asset inboeken is een bewust moment, geen automatisme. Bespreek met
de Dirigent de naamgeving van de kopie en koppel een registernummer
(`AST-NNN`) — dat nummer komt terug in het register, het AST-document en
de bestandsnaam van de kopie. Pas daarna kopieer je de bron naar
`docs/assets/ast-NNN-<naam>.md`.

## Structuur

- **Hoofdboodschap** (2-3 zinnen): wat is het en waarom is het waardevol
- **Locatie**: bron (de waarheid) én @-bare kopie in `docs/assets/`, relatief aan de repo-root
- **Bevat**: wat je er aantreft (bij een verzameling: beknopte opsomming)
- **Ontstaan**: welk journaal, sessie of proces het voortbracht
- **Gebruik**: hoe het typisch wordt ingezet (bijv. @-referentie in prompts)

Standaard draagt het AST-document de **volledige inhoud** — zo weeft `@` meteen
alles in de prompt, zonder dat de agent nog een pad moet volgen. Alleen wanneer je
het expliciet markeert als `vorm: voed-router` of `vorm: verwijzing` (zie "Kopie of
router" hierboven) draagt het minder dan de hele inhoud.

## Wat de vorm breekt

Zonder locatie is een AST-document nutteloos — het hele punt is
vindbaarheid. Zonder "waarom een asset" is het een index-entry die
net zo goed in de YAML kan leven. Het document voegt waarde toe
doordat het de context geeft die een YAML-regel niet kan bevatten.

Een AST-document dat alléén een pad noemt zonder de inhoud is het zwakke
patroon: de agent moet het pad dan nog volgen en de kracht van `@` — de inhoud
meteen ingeweven — gaat verloren. Draag de inhoud, tenzij je bewust een
voed-router maakt.

## Relatie tot het geheel

Assets hebben een register (`docs/grootboek/registers/assets.yml`)
dat als index dient — vergelijkbaar met de ADR/HDR/PDR-registers.
Het AST-document leeft in `docs/grootboek/ast/`. Beide paden zijn
**conventiepaden** — de plekken die het grootboek in jouw project
aanlegt (zie `references/register-format.md`). Het AST-document is
de menselijk leesbare pendant van de YAML-entry.

Een asset kan promoveren tot leidend document als het ontwerpgeheugen
wordt. De grens: als je merkt dat je het niet alleen als referentie
gebruikt maar er beslissingen aan toetst, is het geen asset meer
maar een balans.
