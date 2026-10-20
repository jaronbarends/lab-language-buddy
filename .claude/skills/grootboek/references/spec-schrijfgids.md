# Spec Schrijfgids

Specificeren is in de wereld van agentic werken totaal veranderd. Ik als dirigent werk nu met een agent(claude code) samen die zowel op functioneel niveau in begrijpbare taal kan praten met mij als dirigent. En tegelijkertijd kan mijn agent ook de code lezen. Dan kom je dus op het punt dat de code de absolute waarheid vormt en dus ook feitelijk eigenlijk het functioneel ontwerp is. 

Dus een functioneel ontwerp schrijven is niet meer interessant, want het is verdampt in de code en onderhouden doen we het niet. 

En dan is de belangrijkste vraag die we allemaal met elkaar moeten blijven begrijpen: waarom heb ik dan toch nog behoefte aan specs? En dat is eenvoudig te beantwoorden omdat de samenwerking heel veel denkwerk oplevert die we samen doorlopen. Die denkkant wil je vastleggen omdat de mens nou eenmaal niet een onbeperkt geheugen heeft en af en toe moet teruglezen.

En dat geldt ook voor onze agents (claude code), want elke nieuwe sessie begint de agent met een schoon contextwindow, en dat is waarom je de denkkant en de learnings van de maakkant wil vastleggen. 

Als jij de opdracht krijgt om een spec te maken, wil ik dat je nog een keer diepgaand je hele contextwindow onderzoekt om te begrijpen wat we hebben gedaan. En als ik instructies heb gegeven voor de spec, dat je daar heel scherp je doel formuleert in je gedachten van wanneer de dirigent tevreden is. Want als je dat weet kun je de juiste spec kiezen en kun je de juiste tone of voice kiezen die bij die spec hoort. Soms hebben we wow momenten gehad, of heb je me taal gegeven of een bepaald inzicht, en je weet heel goed hoe je me in die sessie hebt kunnen helpen, en dat zie ik dan terug in de spec. 

De lezer is de dirigent en de dirigent houdt van Functioneel, leesbaar en concise. Ik hou vaak van de pyramidstijl waarbij je de hoofdboodschap met kenpunten onderbouwt. Dit op een manier dat de bedoeling heel duidelijk verwoord is.  Je neemt me mee als lezer zodat het fijn leest en dat ik ons taal, ik ben erg gevoelig voor taal, ook gebruikt wordt wat we in het gesprek hebben gebruikt, wat ik belangrijk vond. De woorden, de principes, de spelregels, de doorbraken, de formuleringen waardoor wij in dezelfde film zaten, die wil ik terugzien in de spec. Dat is je hoofddoel die je meekrijgt in deze schrijfgids en die wil ik dat je die aan het eind, als je klaar bent met schrijven, nog een keer verifieert. 

## Spec is hier een breed woord

De Dirigent zegt "spec" tegen elk document dat hij uit een gesprek wil
vasthouden: een plan van aanpak, een designdocument, een denkkant-notitie, een
onderzoeksrapport, een bouwplan of een testplan. Er is geen vaste opbouw, ook
niet die van een eerdere spec. Het gesprek bepaalt de vorm, de lengte, de toon
en wat erin staat — ook code, als daarom gevraagd is.

## Vooraf: wat verwacht de Dirigent?

Vooraf duidelijk weten wat voor spec ik verwacht, bepaalt ook of je de vorm, de inhoud goed hebt.

Is dat niet duidelijk uit het gesprek, dan is het belangrijk dat je hebt uitgevraagd wat de verwachting van de gebruiker is. En kun je hem helpen door zelf al aan te geven wat jij in de spec wil opnemen.

## Inboeken — het vaste deel

Hoe de spec eruitziet is vrij. Hoe hij in het grootboek landt niet: dat is wat
deze skill bewaakt, zodat elke spec later terug te vinden is.

- **Plek en naam.** De spec komt in de conventiemap `docs/grootboek/specs/`, met een
  bestandsnaam in kebab-case die zegt waar het over gaat.
- **Kopgegevens.** Bovenaan staat dit blok:

  ```yaml
  ---
  titel: "<titel>"
  type: spec
  soort: <in één term wat het document is, bv. plan van aanpak>
  status: concept
  datum: 4 oktober 2026
  auteurs: <naam van de Dirigent>, Mama Claude
  ---
  ```

  De mogelijke statussen staan in `references/status-lifecycle.md`.
- **Een plan uit de planmodus.** Bij een implementatieplan of een bouwplan heb je vaak de planmodus gebruikt en is het plan al ergens in de context opgeslagen op de schijf waar claude code op een bepaalde plek. Dan is er de instructie om het gewoon naar de specs map te halen en op de juiste manier te registreren en een mooie, goede, passende naam te geven.
- **Bronnen aan het eind.** Zie hieronder.

## Bronnen — de brug terug (voor de agent)

Bronnen worden altijd aan het einde van een spec genoemd. De bronnenlijst is —
anders dan de rest van de spec — **voor de agent, niet voor de Dirigent.** Hier
horen de paden en grootboeknummers thuis. Het is de brug terug naar het
materiaal, zodat een verse agent die later moet graven in één blik de weg vindt,
ook naar de leidende documenten.

Elke bron is een **vindbaar pad** plus **één zin context** — wat het is, waarom het telt.
Drie soorten kunnen voorkomen, niet altijd alle drie; groepeer ze als er meer zijn:

- **Het denkwerk** — het journaal, een ander spec, een asset: waar het inzicht vandaan kwam.
- **De realisatie** — de code en bestanden waarin het gebouwd is. Voor een spec over iets
  dat draait mag je hier heel concreet zijn: wijs naar de componenten, naar de implementatie.
- **De plek in het systeem** — het systeemdesign of de balans waar het in past.

## Relatie tot het geheel

Een spec is geen beslissing (dat is een ADR of PDR), geen werkwijze (een HDR) en
geen ontdekking (een JNL). Komt er in het gesprek een beslissing, werkregel of
ontdekking boven, stel dan dat document voor naast de spec.
