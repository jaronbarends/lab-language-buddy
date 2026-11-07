# DFT Schrijfgids

Een DFT wijst aan waar het **grootboek scherper moet** — en formuleert
de **besluiten** om dat door te voeren. Het **signaal** begint bij wat niet
werkt zoals bedoeld, redeneert terug naar de plek waar de
architectuur, het harnas, of de werkwijze te weinig zei, en eindigt
met besluiten die concreet genoeg zijn om direct door te voeren. 

In boekhoudkundige termen: een DFT is de reconciliatie die het verschil
tussen SOLL en IST blootlegt én de correctieboekingen formuleert. In
immuunsysteem-termen: een DFT is de diagnose die niet alleen de
koorts meet maar ook het recept schrijft.

## Wat maakt een DFT goed in dit project

ARC's sterkste DFT's — de Convex env-var routing reeks (DFT-004,
DFT-006, DFT-010) en de Clerk Auth ops-breuk (DFT-008) — komen
hieronder telkens terug. Ze tonen elk een ander kenmerk van een
sterke DFT.

Een sterke DFT begint met het **verschil**, niet het symptoom.
DFT-004 opent niet met "env vars kloppen niet" maar met
"platform-configuratie kennisdrift — dev en prod zijn fundamenteel
asymmetrisch." Het verschil tussen SOLL en IST is de opening; het
symptoom is het bewijs eronder.

De kern is het **patroon**. Een DFT beschrijft niet een incident
maar een terugkerend verschijnsel. DFT-010 herkent dat DFT-004 →
DFT-006 → DFT-010 hetzelfde patroon is en escaleert van toeval naar
bewezen zwakte. Het patroon is wat drift onderscheidt van een
bugmelding — en het patroon bepaalt de diepte van het onderzoek.

Uit het patroon ontstaan **kwesties**, net als in een journaal. Waar
komt het patroon vandaan? Welke aannames klopten niet? Welke
bestaande beslissing was onvolledig? DFT-008 onderzocht: waarom
blokkeert auth de ops-laag? De kwestie leidde tot het inzicht dat
ADR-013 geen rekening hield met CLI-toegang tot productiedata.

De kracht zit in het **besluit**: waar in het grootboek moet het
scherper, en wat precies? Bij een ADR weet je de bestemming vooraf
(paraplu-document), bij een HDR ook (CLAUDE.md). Bij een DFT ontdek
je de bestemming gaandeweg — maar formuleer het besluit zo concreet
dat Claude Code er in plan mode direct mee aan de slag kan. "ADR-013
mist een ops-escape voor admin-queries" is een besluit. "Auth moet
beter" is dat niet. De toets is: kan dit besluit zonder verdere
uitleg worden opgepakt en doorgevoerd?

## Hoe een DFT groeit

Een DFT ontstaat langs vier routes.

Uit het **bouwproces**: je werkt aan een feature en merkt dat
documentatie, configuratie of architectuur niet meer klopt met de
werkelijkheid. DFT-011 (sprint-drift) ontstond doordat registers
niet meebewogen na een intensieve bouwsprint. De IST was veranderd;
de SOLL stond stil.

Uit **ops-monitoring**: een lampje gaat aan. Deploy faalt, dashboard
toont verkeerde data, scanner raakt de verkeerde omgeving. DFT-014
(Vercel deploy stopt) werd ontdekt doordat tien commits stilzwijgend
niet gedeployed waren. Het systeem deed niet wat het moest doen —
terugredenerend bleek de deploy-keten geen faalmelding te geven.

Uit **patroonherkenning**: een eerder opgelost probleem komt terug.
De tweede keer is het terugkerend, de derde keer chronisch. DFT-010
is het schoolvoorbeeld: drie manifestaties van Convex CLI env-routing
over drie weken. Het patroon zelf werd de bevinding — niet het
individuele incident.

Uit **promotie**: bij het promoten van development naar production
blijkt dat omgevingen uiteengelopen zijn. DFT-015 (Vercel Preview
mist Clerk keys) werd ontdekt bij deployment. De livegang-checklist
had het moeten vangen — dat die dat niet deed, is zelf een
drift-bevinding.

Bij elk van deze routes beslist de mens of iets een DFT waard is.
De agent signaleert het moment.

## Sterk voorbeeld

**DFT-010: Convex Env Var Routing — Terugkerend Probleem** is **bijgesloten in
deze skill** (`references/voorbeelden/dft-010-convex-env-var-routing-herhaling.md`).
Open het: een echt ARC-document dat toont hoe een DFT van symptoom via patroon naar
kwesties en doorvoerbare besluiten komt — en waarom het leest als een
detective-rapport, niet als een invulformulier.

> De bronverwijzingen erin wijzen naar ARC-eigen documenten en code; buiten het
> ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe* een DFT drift
> terugvoert op zijn bron, niet een vindbaar pad in jouw project.

## Wat de vorm breekt

Zonder het verschil tussen SOLL en IST is een DFT een bugmelding.
DFT-004 opent met "platform-configuratie kennisdrift" — niet met "env
vars kloppen niet." Als je niet kunt benoemen wat het grootboek zegt
versus wat de werkelijkheid is, beschrijf je een symptoom — schrijf
een spec of een ticket.

Zonder patroon is een DFT een incident. Eén keer is toeval. Wie niet
terugkijkt of dit eerder voorkwam, mist het verschil tussen een
toevallige fout en een structurele zwakte. DFT-010 telt drie
manifestaties — zonder die telling was het drie losse pleisters
gebleven.

Zonder doorvoerbare besluiten is een DFT een klacht. DFT-008 eindigt
niet met "auth blokkeert ops" maar met het besluit: "ADR-013 mist
admin-query varianten voor de ops-laag." Als Claude Code het besluit
niet kan oppakken en doorvoeren, is de DFT nog niet klaar — er zijn
nog kwesties open of het patroon is niet scherp genoeg.

## Relatie tot het geheel

Een DFT voedt bestaande ADR's, HDR's en checklists via het
besluitenlog. Wanneer alle kwesties besloten zijn, is de DFT klaar
om doorgevoerd te worden. Het besluitenlog verwijst naar de
documenten die scherper moeten — een versiebump op een ADR, een
nieuwe HDR, een checklist-aanpassing. De DFT wordt niet verwijderd
— het is de audit trail van hoe een zwakte werd gevonden en
gecorrigeerd.
