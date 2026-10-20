# Themakaart Schrijfgids

Een themakaart is een **doorsnijding**: één stof gevolgd dwars door meerdere
componenten, perspectieven en lagen. Waar een balans het geheel beschrijft
vanuit één lens, volgt een themakaart één draad door het hele weefsel. In
boekhoudkundige termen: de balans is het saldo per perspectief; de themakaart
is de kolom die je dwars door alle rekeningen heen optelt — alleen de
boekingen die déze stof raken, maar dan wel allemaal, waar ze ook vandaan
komen.

In wiskundige termen: een balans is het geheel B beschreven vanuit perspectief
P. Een themakaart is de doorsnede A ∩ B ∩ C — het stuk waar meerdere
componenten elkaar raken, maar alleen voor zover het die ene stof betreft.
Een themakaart is dus géén subset van één balans en géén hoofdstuk dat
toevallig apart is gezet: het bestaansrecht zit precies in het dwarse.

## Wat maakt een themakaart goed

Een sterke themakaart heeft **één scherp benoembare stof**. Data. Distributie.
Code-kwaliteit. Toets: kun je in één woord of korte zinsnede zeggen welke
draad dit document volgt? Als het antwoord twee draden bevat, zijn het twee
kaarten. Als de draad samenvalt met één component, hoort de inhoud in de
balans van dat component — dan is er geen doorsnede te beschrijven.

Een sterke themakaart **toont de keten, niet de onderdelen**. De waarde zit
in de overgangen: waar de stof van component naar component reist, welke
contracten daar gelden, en waar het misgaat als één schakel wijzigt. De
afzonderlijke componenten staan al in de balansen; de themakaart beschrijft
wat geen enkele balans kan zien — het verband.

Een sterke themakaart **voedt, in plaats van alleen te specificeren** — net
als de balans. De leidende principes en het waarom van de keten horen in het
document zelf. Toets per sectie: kan een agent die dit leest een goede
volgende zet in deze stof doen, of alleen de bestaande keten naspreken?

Een sterke themakaart steunt, waar dat kan, op **beslissingen met de
onderbouwing op afroep**: verwijs bij nummer naar de ADR/PDR/HDR die een
schakel verklaart. De kaart vat samen; de beslissing draagt de rationale.

Sommige stoffen hebben een **eigen levende kern**: kennis die nergens
anders een thuis heeft — vaak als code (een model, een woordenlijst, een
configuratie) die door meerdere componenten wordt gelezen. Zo'n kaart
draagt dan méér dan overgangen: hij draagt het **waarheids-register** —
waar leeft welke waarheid, en welke plek wint bij tegenspraak. Toets: als
twee plekken hetzelfde beweren, moet de kaart kunnen zeggen welke de bron
is en welke de afgeleide.

## Wanneer verdient een stof een themakaart

Niet elke rode draad verdient een eigen document. Drie signalen, het liefst
alle drie tegelijk:

- **De stof raakt drie of meer componenten.** Bij twee volstaat meestal een
  sectie in een balans; vanaf drie ontstaat een keten die nergens anders
  zichtbaar is.
- **De stof vormt een kringloop of keten met eigen logica** — een volgorde,
  een ritme, contracten tussen schakels die je moet kennen om veilig te
  wijzigen.
- **Je keert er regelmatig naar terug en mist dan overzicht.** Een
  terugkerend gevoel van "waar stond dit ook alweer, en wat raakt het
  allemaal?" is het sterkste signaal van een ontbrekende kaart.

Twijfel je? Begin met een sectie in de meest betrokken balans. Groeit die
sectie uit zijn jasje en begint hij over ándere componenten te vertellen,
dan is de doorsnede geboren en verhuist de stof naar een eigen kaart.

## Hoe een themakaart groeit

Een themakaart ontstaat meestal **uit gemis**: het overzicht ontbrak op het
moment dat je het nodig had. De eerste versie wordt afgeleid uit wat er al
is — de code, de beslissingen, de keten zoals die feitelijk loopt — met
status *draft* totdat de mens elke sectie gevalideerd heeft. Secties zonder
stof krijgen "geen beslissing aangetroffen"; een eerlijk gat is voedender
dan vulsel.

Themakaarten hebben **geen eigen register**. Wijzigingen gaan direct in het
document wanneer de stof verandert — meestal in het kielzog van een
beslissing die één van de schakels raakt. Formuleer bij zo'n beslissing
alvast welke kaart geraakt wordt; dat houdt de doorsnede actueel zonder
aparte boekhouding.

Ook de themakaart kent het **eigenaar-paar**: de agent schrijft en houdt
actueel, de mens valideert op juistheid. Elke wijziging wordt gemeld — wat
wijzigt, waarom, en een vraag om check.

Keert werk aan de stof steeds terug in dezelfde vorm, beschrijf het dan
als **workflow** — en geef de lezer een prijsmodel voor wijzigingen. Een
bruikbare ladder: *taal* (formulering schuift — gratis), *betekenis* (wat
iets betekent schuift — kost een meting), *structuur* (het model zelf
schuift — kost een release mét meting). Wie eerst de trede kent, kent de
impact vóór hij snijdt.

## Sterk voorbeeld

Een themakaart-skelet is **bijgesloten in deze skill**
(`references/voorbeelden/themakaart-skelet.md`) — de vorm in het klein:
frontmatter, de stof in één zin, de keten over de componenten, en de
beslissings-verwijzingen per schakel. Het skelet toont de structuur; de
inhoud komt uit jouw eigen doorsnede.

## Wat de vorm breekt

Zonder echte doorsnede wordt de themakaart een vermomde balans-sectie. Als
álle inhoud over één component gaat, hoort hij in de balans van dat
component — een aparte kaart versplintert dan alleen het overzicht.

Zonder scherpe stof wordt de kaart een vergaarbak. "Alles rondom X en wat
daarbij hoort" is geen draad maar een knoop; splits tot elke kaart weer in
één zinsnede te benoemen is.

Met componentbeschrijvingen in plaats van overgangen dupliceert de kaart de
balansen — en veroudert dan dubbel zo snel. Beschrijf wat tússen de
componenten gebeurt; verwijs voor de componenten zelf naar hun balans.

Zonder onderhoud is de kaart gevaarlijker dan geen kaart: wie de keten volgt
zoals beschreven, terwijl de keten allang anders loopt, breekt precies de
schakel die de kaart moest beschermen.

Met standen en voortgang wordt de kaart een logboek dat per dag veroudert.
Statuskolommen, "af per…"-datums en percentages horen in de code, de
meetlogs en de actieplannen — de kaart draagt wat langer meegaat. De toets
is simpel: veroudert deze zin als er morgen gebouwd wordt? Dan hoort hij
hier niet.

## Relatie tot het geheel

De keten is: **beslissingen → balansen en themakaarten → grondwet**.
Beslissingen voeden beide soorten staat-documenten; samen condenseren ze tot
de grondwet (CLAUDE.md) — de operationele samenvatting die altijd in context
is.

Naast themakaarten bestaan **balansen**: geheel-beschrijvingen vanuit één
perspectief (zie `balans-schrijfgids.md`). Vuistregel: beschrijft het
document het geheel vanuit één lens → balans; volgt het één stof dwars door
de lagen → themakaart. Een wijziging kan in beide landen — de balans toont
het effect op het perspectief, de kaart het effect op de keten.
