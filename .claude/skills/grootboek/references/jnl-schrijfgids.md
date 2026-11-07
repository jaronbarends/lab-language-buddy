# JNL Schrijfgids

Een journaal documenteert een ontdekkingsproces dat nog niet in een
beslissing is gekristalliseerd.
Het is de werkplek waar denken plaatsvindt voordat het in ADR's en PDR's
kristalliseert. In boekhoudkundige termen: het journaal is de chronologische
vastlegging die het grootboek voedt.

Jouw uiteindelijke doel is om de dirigent te helpen alle te nemen kwesties en beslissingen in kaart te brengen en hem te coachen naar het punt waarop alle beslissingen zijn gemaakt en elke kwestie dus is gesloten. Het journaal is het middel, het Markdown document wat je hiervoor inzet, zodat de gedachtes, de gesprekken en de keuzes en beslissingen landen in dat journaal.

Het is jouw verantwoordelijkheid om goed en diepgaand onderzoek te doen, daar waar nodig. Je mag altijd extra Explorer Agents inzetten, of een Claude Guide Agent, of MCP Context 7, of extra web research doen, etcetera, etcetera. Gebruik je hulpmiddelen en tools om diepgaand onderzoek te doen, zodat je weet waar het over gaat. 

## Wat maakt een journaal goed in dit project

ARC's eerste journaals — de MCP Server Janton discovery (13 kwesties) en de
Architect-rol discovery (6 kwesties) — tonen het patroon: een groot onderwerp
wordt opgebroken in **kwesties**, elk met een vraag, onderzoeksbevindingen,
en een status.

Een sterk journaal begint met de **kernvraag** die het onderzoek drijft. Bij
de MCP Server: "Wat IS MCP Janton en voor wie?" Bij de Architect-rol: "Hoe
maakt ARC de impliciete IST/SOLL gap expliciet?" De kernvraag bepaalt de
scope.

Kwesties ontstaan organisch — het MCP-journaal begon met 8 kwesties en
groeide naar 13 toen nieuwe vragen opdoken tijdens onderzoek. Dat is geen
scope creep, dat is ontdekking. Elke nieuwe kwestie krijgt een nummer en
een status.

De kracht zit in het **besluitenlog** onderaan: welke kwesties zijn besloten,
wat is besloten, en waar is het vastgelegd (welke ADR/PDR). Dit is de brug
van journaal naar grootboek.

## Hoe dit journaal groeit

Een journaal ontstaat in dialoog. De mens bepaalt richting en zet begrippen
vast. De agent zorgt dat het journaal meegroeit met wat besproken wordt.

De agent helpt bij het executieve werk van het herordenen — kwesties
schuiven mee terwijl het denken vordert. Wat aanvankelijk één kwestie leek
blijkt soms drie; wat urgent leek verliest prioriteit. Door die beweging
scherp te houden wordt het journaal de plek waar ruwe gedachten zich ordenen
tot de eenduidigheid die ADR's en PDR's nodig hebben.

Het journaal is de plek waar het overzicht leeft: welke kwesties openstaan,
wat is begrepen, welke besluiten zijn genomen. Het gesprek is de plek waar
ontdekking gebeurt — waar een kwestie van meerdere kanten wordt bekeken
voordat het journaal de uitkomst vastlegt.

Begrip dat in het gesprek wordt opgebouwd, landt in het journaal. Het
journaal werkt daarmee toe naar zijn einddoel: de ADR's en PDR's die in het
doel-records veld zijn benoemd. Wanneer die documenten er zijn en alle
kwesties zijn besloten of bewust geparkeerd, is het journaal afgerond.

## Sterk voorbeeld

Het **MCP Server Janton — Discovery Journaal** is **bijgesloten in deze skill**
(`references/voorbeelden/jnl-001-mcp-server-janton.md`). Open het: een echt
ARC-document dat toont hoe een volwaardig journaal eruitziet — van kernvraag via
organisch groeiende kwesties tot besluitenlog.
Het voorbeeld draagt de oude naam MCP Janton (sinds PDR-025 heet de server MCP ARC).

> De bronverwijzingen erin wijzen naar ARC-eigen documenten en code; buiten het
> ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe* een journaal
> zijn ontdekkingen vasthoudt, niet een vindbaar pad in jouw project.

## Wat de vorm breekt

Een journaal onderscheidt zich door drie structurele eigenschappen. Als een
daarvan wegvalt, ontstaat een ander soort document.

Zonder kwestie-structuur wordt het journaal een onsplitsbare stroom.
Ontdekking valt niet meer te scheiden in onderdelen, voortgang is alleen
in zijn geheel zichtbaar. Het journaal kan dan wel groeien, maar niet
besloten worden — er is nergens waar een deel "klaar" kan zijn. Wat
overblijft is een vergaderverslag.

Zonder einddoel in de frontmatter heeft het journaal geen reden om ooit
afgerond te worden. Kwesties kunnen blijven openstaan zonder dat dat
problematisch voelt. Het journaal verliest richting en vervaagt tot
dagboek. Het is dus belangrijk om het einddoel goed voor ogen te houden. En door te vragen als het nodig is, als het einddoel nog niet scherp genoeg is. Het helpt daarbij altijd in Pyramid Stijl te onderbouwen, waarbij de hoofdboodschap met kernpunten wordt onderbouwd. Be concise! En leg functioneel uit waar nodig, zodat je de product engineer, de dirigent, goed meeneemt in wat hij of zei nodig heeft. 

Wanneer het journaal te vroeg naar een ADR of PDR sluit, wordt de uitkomst
bepaald voordat het onderzoek af is. Resterende kwesties worden dan
verantwoording achteraf in plaats van open ontdekking. Doorgaans is het juiste moment voor het schrijven van de ADR's, de PDR's, eventueel specs of het maken van een bouwplan in een spec of via de planmodus. Een goed moment is doorgaans als de kwesties zijn gesloten en er besluiten zijn genomen. De dirigent geeft vaak opdracht. Als jij nog onzekerheid hebt of vindt dat dingen nog niet duidelijk zijn, push je terug op die opdracht. En vraag je gewoon door. Uiteindelijk moet je er samen uit zijn. Jij bent uiteindelijk verantwoordelijk voor de documenten die volgen en ook de bouw zelf. Dus het is belangrijk dat jullie samen op één lijn zitten. 

## Relatie tot het geheel

Een journaal voedt ADR's en PDR's via het `doel-records` veld. Wanneer alle
kwesties besloten zijn, wordt het journaal `afgerond` en verwijzen de
resulterende ADR's/PDR's terug. Het journaal wordt niet verwijderd — het
is de audit trail van hoe een beslissing tot stand kwam.
