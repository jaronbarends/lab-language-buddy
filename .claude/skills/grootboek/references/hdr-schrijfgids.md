# HDR Schrijfgids

Een HDR versterkt het harnas. Elke HDR maakt de AI zelfstandiger in
de executie — door betere context te geven, betere reflexen in te
bouwen, of betere werkwijzen vast te leggen. In immuunsysteem-termen:
een HDR is het antilichaam dat voorkomt dat dezelfde infectie
terugkomt. In samengestelde-rente-termen: een HDR is een storting
die elke toekomstige sessie sneller maakt.

## Wat maakt een HDR goed in dit project

ARC's sterkste HDR's — Livegang-checklists (HDR-009) en Component-
First Design (HDR-011) — tonen het patroon: een herhaald probleem
dwingt een keuze af, die keuze kost iets nu maar betaalt zich elke
sessie terug, en het besluit landt als werkregel in CLAUDE.md.

Een sterke HDR begint met een **concreet probleem** dat herhaaldelijk
terugkomt. Bij HDR-009: deployment-kennis verdween na de sessie, de
AI kon het werk niet oppakken. Bij HDR-013: de AI tailede drie sessies
lang logbestanden die niet bestaan. Bij HDR-011: lineair ontwerpen
werkte niet voor een AI die iteratief leert. Het probleem dwingt de
keuze af.

De keuze benoemt **waarom juist dit**. HDR-009 beschermt het principe
dat vluchtige omgevingskennis geëxternaliseerd moet worden op het moment
dat ze ontstaat — YAML-checklists zijn het middel, niet het doel.
HDR-013 koos HTTP health checks omdat die altijd werken, ongeacht hoe
het framework logt. De reden maakt de keuze verdedigbaar.

De kracht zit in het **besluit**: de werkregel die in CLAUDE.md landt.
Bij HDR-009: "Bij omgevingswerk: lees register, voer checklist uit."
Bij HDR-013: "Bij dev server: HTTP health check, nooit logfile tail."
Dit is de brug van HDR naar dagelijkse praktijk — net zoals het
besluitenlog de brug is van journaal naar grootboek. Formuleer het
besluit alvast in de HDR.

## Hoe een HDR groeit

Een HDR ontstaat langs vier routes.

Uit het **immuunsysteem**: een incident herhaalt zich, het patroon
wordt herkend (frequentie > 3), en de structurele fix versterkt het
harnas. DFT-006 en DFT-010 (env-var routing drift) leidden tot een
post-checkout hook die de omgeving automatisch wisselt. Het incident
werd een reflex.

Uit een **journaal**: een ontdekkingsproces kristalliseert tot een
werkwijze. JNL-006 (prompt-strategie) produceerde inzichten over
meet-alleen, drift-lagen en CLI-flags die uiteindelijk in HDR-012
(Scan Lab Benchmark Methodologie) landen. Het journaal is de
werkplek; de HDR is de bestendige uitkomst.

Uit **CLAUDE.md-groei**: een werkregel in CLAUDE.md wordt zo
uitgebreid dat het een eigen document verdient. Het IJsbergprincipe
(HDR-006) begon als een eenvoudige 500-regelgrens, groeide door
DFT-013, en verfijnde tot een domein-specifieke discipline.

Uit het **catalogisch denken**: het rekeningschema toont in de
**Harnas-reeks** het harnas-landschap — geheugen, skills, subagents, hooks,
MCP, CLI, permissions, sessie-management. Een HDR kan ontstaan doordat je een
component bewust inricht die voorheen impliciet was. Je herkent dat
een deel van het zintuigstelsel onbeschreven is.

Bij elk van deze routes is het herkenmoment hetzelfde: "dit maakt de
AI zelfstandiger als we het vastleggen." De mens beslist of iets een
HDR waard is. De agent signaleert het moment.

## Sterk voorbeeld

**HDR-009: Livegang-checklists** is **bijgesloten in deze skill**
(`references/voorbeelden/hdr-009-livegang-checklists.md`). Open het: een echt
ARC-document dat toont hoe een HDR van concrete pijn via kernprincipe en
doorsnijding naar werkregel komt — en waarom het leest als een zelfstandig stuk.

> De bronverwijzingen erin wijzen naar ARC-eigen documenten en code; buiten het
> ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe* een HDR het
> harnas aanhaakt, niet een vindbaar pad in jouw project.

## Wat de vorm breekt

Zonder effect op het zintuigstelsel is een HDR documentatie, geen
harnasbeslissing. Als je na het schrijven niet kunt aanwijzen welk
deel van de **Harnas-reeks** — of het harnas als geheel — sterker is
geworden, dan hoort het inzicht misschien in een ADR, een spec, of
een werkregel in CLAUDE.md. De Harnas-reeks in de catalogus
(raadpleegbaar via MCP) toont het harnas-landschap: instructie, skills,
subagents, commands, hooks, MCP-servers, CLI-tooling, permissions en
sessie-management.

Sommige HDR's versterken één component (HDR-013 versterkt één component
van de Harnas-reeks). Andere snijden dwars door het schema en versterken
het harnas als geheel — dat zijn **doorsnijdingen** die consolideren op
reeks-niveau (de Harnas-reeks zelf). Een doorsnijdende HDR kan meerdere
boekingen opleveren: een consolidatie op de reeks én concrete
component-boekingen op bladniveau.
Zie HDR-009 v1.1 en JNL-013 voor het patroon.

Zonder het inzicht achter de tool verliest een HDR zijn waarde bij
de volgende toolwissel. HDR-013 beschermt niet het `curl`-commando —
het beschermt het inzicht dat Next.js niet naar logfiles schrijft en
dat een HTTP poll betrouwbaarder is. HDR-009 beschermt niet het
YAML-formaat — het beschermt het principe dat vluchtige
omgevingskennis geëxternaliseerd moet worden op het moment dat ze
ontstaat. Het inzicht overleeft de tool. Maak het expliciet in een
**Kernprincipe**-sectie bovenaan de HDR.

## Relatie tot het geheel

Wanneer een beslissing zowel het product als de werkwijze raakt,
verdient het beide: een ADR voor wat er verandert aan de architectuur,
een HDR voor wat er verandert aan hoe we werken.

Elke implemented HDR landt als werkregel in CLAUDE.md — net zoals
elke implemented ADR landt in `software-architectuur.md`. De HDR is
de onderbouwing, CLAUDE.md de instructie die elke sessie wordt
geladen.

Het rekeningschema (de Harnas-reeks) toont waar in het harnas de
versterking zit — op één component of, bij een doorsnijding, op het
harnas als geheel.
