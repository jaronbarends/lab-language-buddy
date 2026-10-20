# PDR Schrijfgids

Een PDR borgt de productbelofte. Elke PDR maakt expliciet wat het product
levert, voor wie, en waarom juist zo — en het besluit stuurt elke
feature, elk scherm en elke klantinteractie die erna komt.

In samengestelde-rente-termen: een PDR is de koersbepaling die elke
volgende bouwsessie richting geeft.

## Wat maakt een PDR goed in dit project

PDR-001 (Scorecard — Vijf Dimensies) verschoof ARC van een lineair
fasemodel naar een multidimensionale scorecard. PDR-009 (Onboarding &
Progressieve Onthulling) legde vast dat de catalogus gefilterd wordt
door rol × template × repo-werkelijkheid. Beide tonen het patroon.

Een sterke PDR begint met een **spanning die de klant raakt**. Bij
PDR-001 v1.0: klanten voelden zich "teruggezet" als ze niet lineair
vorderden. Bij PDR-009: de volledige catalogus (107 rekeningen)
overweldigt nieuwe gebruikers. Bij PDR-004: een scanner per repo mist
het portfoliopatroon. De spanning is de reden dat er iets moet
veranderen.

De keuze maakt de **belofte concreet en toetsbaar**. PDR-001 belooft
vijf onafhankelijke dimensies elk 0-100%. PDR-005 belooft drie
coaching-lagen met vaste vocabulaire. PDR-007 belooft een blend-formule
die transparant maakt hoeveel het LLM-oordeel bijdraagt. Vaag ("betere
onboarding") is geen belofte — meetbaar ("drie rollen met plafond") wel.

De kracht zit in het **besluit**: concreet genoeg dat Claude Code er
in plan mode direct mee aan de slag kan. PDR-009: "drielagen-filtermodel:
rol × template × repo-werkelijkheid." PDR-007: "score = (1 - L3gewicht)
× L1L2score + L3gewicht × L3score." Als het besluit niet zonder verdere
uitleg opgepakt kan worden, is de PDR nog niet scherp genoeg.

Het besluit benoemt zijn **landing**: welk productoppervlak verandert
en welke sectie van `product-architectuur.md` geraakt wordt. PDR-008
landt als nieuwe route `/dashboard/catalogus` én als sectie in de
product-architectuur (stroom WETEN). PDR-003 landt in het design system
én als sectie Design Language. De landing is de brug van PDR naar
dagelijkse praktijk.

## Hoe een PDR groeit

Een PDR ontstaat langs vier routes.

Uit een **journaal**: een ontdekkingsproces kristalliseert tot een
productbeslissing. JNL-009 (begrippenkader) produceerde PDR-015
(backoffice) en PDR-016 (catalogus-presentatie). JNL-001 (MCP Server
Janton) werkt toe naar PDR-011. Het journaal is de werkplaats; de PDR
is de bestendige uitkomst.

Uit **productervaring**: het product wordt gebruikt en de belofte klopt
niet. PDR-001 verschoof van v1.0 (lineaire fasen) naar v2.0
(dimensie-scorecard) nadat stresstesten lieten zien dat lineaire
progressie niet werkte voor projecten die op verschillende vlakken
sterk zijn. De ervaring dwingt de koerscorrectie.

Uit **schaalbehoefte**: wat werkte voor één repo werkt niet voor een
portfolio. PDR-004 (Compounding Manager) ontstond toen het duidelijk
werd dat per-repo scannen geen cross-repo patronen vangt. PDR-009
(onboarding) ontstond toen de catalogus te groot werd voor nieuwe
gebruikers. De schaal dwingt de structuur.

Uit **drift**: een DFT laat zien dat het product niet doet wat het
belooft. PDR-010 (deterministische versienummering) ontstond doordat
de dashboard-header een oud versienummer toonde na changelog-updates.
Het gat tussen belofte en werkelijkheid is het signaal.

Bij elk van deze routes is het herkenmoment hetzelfde: "dit verandert
wat we de klant beloven." De mens beslist of iets een PDR waard is.
De agent signaleert het moment.

## Sterk voorbeeld

**PDR-009: Onboarding & Progressieve Onthulling** is **bijgesloten in deze skill**
(`references/voorbeelden/pdr-009-onboarding-progressieve-onthulling.md`). Open het:
een echt ARC-document dat toont hoe een PDR van klantspanning (overweldiging) via
een concreet filtermodel (rol × template × werkelijkheid) naar een besluit komt dat
het hele product stuurt — progressieve onthulling als spelmechanisme, niet als
implementatiedetail.

> De bronverwijzingen erin wijzen naar ARC-eigen documenten en code; buiten het
> ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe* een PDR zijn
> landing benoemt, niet een vindbaar pad in jouw project.

## Wat de vorm breekt

Zonder klantimpact is een PDR een architectuurbeslissing. PDR-010
(versienummering) raakt de grens: de kernbeslissing is een werkproces
(Convex als source of truth) — als de klant het verschil niet merkt,
overweeg een ADR of spec.

Zonder concreet besluit is een PDR een visiedocument — "betere
onboarding" is geen besluit, "drielagen-filtermodel: rol × template ×
repo-werkelijkheid" (PDR-009) wel. Toets: kan Claude Code dit
oppakken in plan mode?

Zonder landing hangt het besluit in de lucht. PDR-008 landt als
route `/dashboard/catalogus` én als sectie WETEN in de
product-architectuur — wie niet kan aanwijzen waar het besluit
zichtbaar wordt, is nog niet af.

## Relatie tot het geheel

Een PDR voedt `product-architectuur.md` (het conceptuele kader) en
specs (de harde requirements die naar code vertaald worden). Wanneer
het besluit geland is in een kader-sectie of een productoppervlak, is
de PDR af. Specs verwijzen terug naar de PDR als rationale; de
product-architectuur noemt de PDR als bron. Een PDR maakt geen
systeemkeuze (dat is een ADR) en geen werkwijze (dat is een HDR) —
wanneer een beslissing beide raakt, verdient het een PDR én een ADR.
