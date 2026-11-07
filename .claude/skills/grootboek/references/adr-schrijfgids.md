# ADR Schrijfgids

Een ADR dwingt af dat er gebouwd wordt onder architectuur. De beslissing
is definitief en je ervaart haar door het hele product heen — in elke
tabel, elke query, elke component die erna komt. In boekhoudkundige
termen: een ADR is een boeking die het saldo van de softwarearchitectuur
verandert. In samengestelde-rente-termen: een ADR is een fundament
waarop elke volgende feature sneller, veiliger of goedkoper gebouwd
wordt.

## Wat maakt een ADR goed in dit project

Architectuurbeslissingen worden vaak gedreven door een samenspel van botsende
krachten: kosten, real-time vereisten, isolatie tussen tenants of componenten,
en onafhankelijkheid van losse processen. (In ARC bijvoorbeeld: scan-tiers en
model-routing, Convex subscriptions, multi-tenancy, scanner-onafhankelijkheid.)

Een sterke ADR begint met **krachten die botsen**. Bij ADR-021 (Convex
Datamodellering): Convex heeft geen JOINs — dat verandert de afwegingen
rond normalisatie fundamenteel. Bij ADR-016 (Scanner Communicatielaag):
de scanner moet minuten draaien, maar Convex actions hebben een
tijdslimiet. Bij ADR-011 (DeepGuard): ARC wil security beoordelen maar
mag niet scannen op klant-infra. De botsing dwingt de keuze af.

Een sterke ADR destilleert **principes uit concrete ervaringen**. ADR-021
formuleert drie principes die elk geworteld zijn in een ARC-leermoment.
"Normaliseer tenzij" komt voort uit de stappen-discussie (eigen tabel vs.
embedded array), niet uit een textbook. ADR-013 (Authenticatie) formuleert
tenant-isolatie als compound index-patroon, niet als abstract
beveiligingsprincipe.

De kracht zit in de **landing**: elke implemented ADR landt als sectie of
verwijzing in een paraplu-document. ADR-021 voedt `data-architectuur.md`.
ADR-016 voedt `software-architectuur.md`. De ADR is de onderbouwing; het
paraplu-document de samenvatting die elke sessie beschikbaar is. Formuleer
bij het schrijven van de ADR alvast welke sectie het raakt — dat dwingt
scherpte af en maakt de landing triviaal.

## Hoe een ADR groeit

Een ADR ontstaat langs vier routes.

Uit een **spec**: een implementatie onthult een architectuurkeuze die
breder reikt dan de feature. ADR-024 (Rekeningschema als Convex-data)
ontstond tijdens de catalogus-spec — het inzicht dat referentiedata als
Convex-tabel moet leven verdiende een eigen beslissing omdat het elke
toekomstige feature raakt die het rekeningschema gebruikt.

Uit een **journaal**: een ontdekkingsproces kristalliseert tot een
architectuurbeslissing. JNL-009 (begrippenkader) produceerde vijf
ADR-voorstellen (033-037) — elk een entiteit of schema-uitbreiding die
uit de discovery volgde. Het journaal is de werkplaats; de ADR is de
bestendige uitkomst.

Uit **drift**: een DFT laat zien dat de bestaande architectuur niet meer
klopt. ADR-020 (Scorecard Datamodel) werd superseded door het V2
informatieontwerp toen drift liet zien dat de drie-metrices-aanpak niet
werkte voor vijf dimensies. Drift is het signaal; de nieuwe ADR is de
correctie-vooruit.

Uit **schaalbehoefte**: wat werkte voor drie repo's werkt niet voor
dertig. ADR-016 evolueert van HTTP-trigger naar Convex subscription
omdat het claim-pattern bij meerdere scanners pas schaalbaar wordt met
bidirectionele communicatie. De groei dwingt de beslissing.

Bij elk van deze routes is het herkenmoment hetzelfde: "dit raakt meer
dan deze feature." De mens beslist of iets een ADR waard is. De agent
signaleert het moment.

## Sterk voorbeeld

**ADR-021: Convex Datamodellering — Leidende Principes** is **bijgesloten in
deze skill** (`references/voorbeelden/adr-021-convex-datamodellering-principes.md`).
Open het: een echt ARC-document dat toont hoe een ADR van botsende krachten via
principes en patronen naar een beslissingsmatrix en escalatieprotocol komt — en
waarom het een leidend document werd dat elke datasessie stuurt.

> De bronverwijzingen erin wijzen naar ARC-eigen documenten en code; buiten het
> ARC-project zijn die paden niet op te zoeken — ze illustreren *hoe* een ADR zijn
> omgeving aanhaakt, niet een vindbaar pad in jouw project.

## Wat de vorm breekt

Zonder architectuursturing is een ADR documentatie, geen beslissing.
Toets: stuurt deze beslissing de volgende tien features? ADR-021 stuurt
elke datasessie. ADR-013 beschermt elke query. Nee → spec of learning.

Zonder het principe achter de keuze overleeft een ADR de toolwissel niet.
ADR-021 beschermt niet "gebruik Convex" — het beschermt "normaliseer
tenzij, aggregeer incrementeel, respecteer cohesie".

Zonder landing in het paraplu-document landt een ADR niet. Formuleer bij
het schrijven welke sectie van `software-architectuur.md` of
`data-architectuur.md` geraakt wordt.


## Relatie tot het geheel

Elke implemented ADR landt in een paraplu-document — de relevante balans,
zoals een `software-architectuur.md` (systeem) of `data-architectuur.md`
(data). De ADR is de onderbouwing met volledige
rationale; het paraplu-document de samenvatting die elke sessie
beschikbaar is. Samen vormen ze de keten: het paraplu-document zegt
*wat we doen*, de ADR zegt *waarom we het zo doen*.

Een ADR met `harnas-impact: hoog` verdient een bijbehorende HDR — de
ADR beschrijft wat er verandert aan de architectuur, de HDR beschrijft
wat er verandert aan hoe we werken. HDR-016 (data-architectuur
documentatiediscipline) is zo'n paar: de beslissing om drie lagen te
scheiden (ADR-achtig inzicht) én de werkwijze om dat vol te houden
(HDR).

Een ADR die voortkomt uit een journaal verwijst naar het JNL als bron.
Een ADR die drift corrigeert verwijst naar de DFT als aanleiding. Een
ADR die via versiebumps evolueert, laat het paraplu-document meebewegen.
