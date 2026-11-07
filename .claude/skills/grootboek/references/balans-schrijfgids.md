# Balans Schrijfgids

Een balans beschrijft het **geheel vanuit één perspectief** — de huidige
staat, niet de geschiedenis. In boekhoudkundige termen: waar een beslissing
(ADR/PDR/HDR) een boeking is, is de balans het saldo. Elke boeking verandert
het saldo; de balans toont wat al die boekingen samen opleveren, zonder dat
je ze stuk voor stuk hoeft na te lezen. In samengestelde-rente-termen: de
balans is de plek waar kennis rendeert — één document dat elke sessie het
hele perspectief beschikbaar maakt.

Een project kent typisch vier balans-perspectieven: **technisch** (de
software-architectuur: componenten, omgevingen, protocollen), **functioneel**
(de product-architectuur: wat de klant ervaart), **werkwijze** (de
harnas-architectuur: hoe mens en agent samenwerken) en **denkproducten**
(de asset-architectuur: wat herbruikbaar is). Ze staan naast elkaar als
lenzen op dezelfde werkelijkheid — een wijziging kan in meerdere balansen
landen, elk vanuit de eigen lens.

## Wat maakt een balans goed

Een sterke balans **voedt, in plaats van alleen te specificeren**. Een kale
invariantenlijst ("wij gebruiken X, Y, Z") is technisch juist maar
krachteloos: de agent die ermee werkt weet *wat* er is, niet *waarom* het zo
is of *hoe erover gedacht wordt*. De leidende principes en het waarom horen
in het document zelf — compacter én rijker, niet kaler. Toets per sectie:
kan een agent die dit leest een goede volgende beslissing nemen, of alleen
de bestaande naspreken?

Een sterke balans is **het opgetelde effect van beslissingen, met de
onderbouwing op afroep**. Elke sectie steunt op één of meer beslissingen
(ADR's voor de technische balans, PDR's voor de functionele, HDR's voor de
werkwijze) en verwijst ernaar bij nummer. De balans vat samen; de beslissing
draagt de volledige rationale. Wie dieper wil, volgt het nummer. Zo blijft
de balans leesbaar in één sessie terwijl niets verloren gaat.

Een sterke balans heeft een **leeswijzer**. Niet iedereen leest alles: wie
de keten wil begrijpen leest sectie 1, wie aan component X werkt leest
sectie N. De leeswijzer maakt het document bruikbaar als naslagwerk in
plaats van verplichte kost.

Een sterke balans **scheidt drie geheugens**: de *doctrine* (het waarom en
wanneer — evergreen, onderhouden in het document), het *contract*
(per-onderdeel beslissingen — een register of tabel), en de *staat* (de
meting van nu — live af te leiden uit code of systeem, niet met de hand
bijgehouden). Wat live gemeten kan worden hoort niet in het document: het
veroudert vanaf de dag dat je het opschrijft.

## Hoe een balans groeit

Een balans ontstaat niet blanco. De eerste versie (v0.1) wordt **afgeleid
uit wat er al is**: de code, de mappenstructuur, de zichtbare keuzes. Dat is
een momentopname met status *draft* — de mens valideert elke sectie voordat
de balans leidend wordt. Secties waarvoor geen stof bestaat krijgen "geen
beslissing aangetroffen"; een eerlijk gat is voedender dan vulsel.

Daarna groeit de balans via één route: **beslissingen**. Eerst de ADR (of
PDR/HDR), dan de balans-update. Formuleer bij het schrijven van de
beslissing alvast welke balans-sectie geraakt wordt — dat dwingt scherpte
af en maakt de landing triviaal. Een balans die wijzigt zonder beslissing
erachter is drift: maak er een DFT van of haal de wijziging terug.

De balans kent een **eigenaar-paar**: de agent schrijft en houdt actueel,
de mens valideert op juistheid. Elke wijziging wordt gemeld — wat wijzigt,
waarom, en een vraag om check. De balans is te belangrijk om stilzwijgend
te muteren.

Periodiek verdient de balans een **indik-ronde**: secties waarvan de inhoud
inmiddels elders geborgd is (in een register, een hook, de code zelf)
worden teruggebracht tot een verwijzing. Het document blijft zo de
samenvatting, niet het archief.

## Sterk voorbeeld

Een echte balans is **bijgesloten in deze skill**
(`references/voorbeelden/balans-asset-architectuur.md`) — het kleinste
balans-perspectief, integraal, zodat de hele vorm zichtbaar is: frontmatter
met versie-historie, doel-sectie, leeswijzer, de samenvattende secties met
beslissings-verwijzingen, en de relatie met het register.

> De bronverwijzingen erin wijzen naar ARC-eigen documenten en code; buiten
> het ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe*
> een balans zijn perspectief draagt, niet een vindbaar pad in jouw project.

## Wat de vorm breekt

Zonder één perspectief wordt de balans een alleskunner die niets scherp
beschrijft. Toets: kun je in één zin zeggen vanuit welke lens dit document
kijkt? De technische en functionele beschrijving van hetzelfde systeem zijn
twéé balansen, geen hoofdstukken van één.

Zonder beslissingen eronder wordt de balans een mening. Elke stellige
sectie zonder ADR/PDR/HDR-verwijzing is óf een gat in het grootboek (maak
de beslissing alsnog aan) óf vulsel (schrap het).

Zonder onderhoud wordt de balans een bevroren foto — gevaarlijker dan geen
document, want hij claimt actualiteit. Een balans is evergreen: leeft mee
of wordt expliciet gearchiveerd.

Met staat-in-het-document (regelaantallen, versienummers van dependencies,
URL-lijsten die elders leven) veroudert de balans per week. Meet de staat
live; beschrijf in het document alleen wat traag beweegt.

## Relatie tot het geheel

De keten is: **beslissingen → balansen → grondwet**. ADR/PDR/HDR voeden de
balansen; de balansen condenseren tot de grondwet (CLAUDE.md) — de
operationele samenvatting die altijd in context is. Van uitgebreid naar
gecondenseerd: de beslissing draagt de rationale, de balans het overzicht,
de grondwet de werkregel.

Naast balansen bestaan **themakaarten**: doorsnijdingen die één stof door
meerdere componenten volgen (zie `themakaart-schrijfgids.md`). Vuistregel:
beschrijft het document het geheel vanuit één lens → balans; volgt het één
stof dwars door de lagen → themakaart.

Een balans hoort bij een register wanneer het perspectief een inventaris
kent (assets, beslissingen): het register is de goedkope index, de balans
de dure samenvatting. De agent leest eerst het register, dan pas het
document — houd ze allebei actueel.
