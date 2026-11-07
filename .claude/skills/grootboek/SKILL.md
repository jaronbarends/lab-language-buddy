---
name: grootboek
description: >
  Beheert het projectgrootboek: documentatiestructuur, registers, beslissingen,
  drift en learnings. Gebruik deze skill bij elke feature-implementatie,
  architectuurbeslissing, productbeslissing, of wanneer je drift detecteert.
  Ook bij het hervatten of doorontwikkelen van bestaande documenten
  (ADR, HDR, PDR, DFT, JNL, AST, spec). En bij commits, merges, en wanneer
  er omgevingswerk (env vars, externe diensten) aan de orde is.
  De skill houdt het grootboek automatisch bij.
  Trigger bij woorden als: feature, ADR, HDR, PDR, DFT, JNL, spec, drift,
  livegang, merge naar main, architectuur, beslissing, register, grootboek,
  journaal, discovery, kwestie, ontdekking,
  rekeningschema, catalogus, paraplu-document, doorsnijding, balans, balansdocument,
  actoren, framework-blok, asset, communicatieplicht, Dirigent, grondwet, wetboek,
  leidend document, opschonen, indikken, opruimen, tot de kern brengen.
---

# Grootboek-skill

Het projectgrootboek is de boekhoudkundige ruggengraat van jouw project. Elke architectuur-,
harnas-, product- en driftbeslissing krijgt een rekeningnummer. Dit systeem maakt
beslissingen traceerbaar, afdwingbaar en navolgbaar — ook voor wie later instapt.

Jij als AI agent bent de boekhouder. Je houdt het grootboek bij, maar de mens beslist.

**Conventiepad.** Alle paden die beginnen met `docs/grootboek/` verwijzen naar de
grootboek-map van jouw project — de conventie die deze skill aanlegt en onderhoudt;
geen extern bestand om op te zoeken. Bestaat de map nog niet, dan helpt de
zusterskill **grootboek-opzetten** je op weg.

## De werkwijze: van ontdekking naar staat

Het grootboek kent één grondbeweging — kennis stroomt van links naar rechts:

```
JOURNAAL          ──►   GROOTBOEK         ──►   LEIDENDE DOCUMENTEN
ontdekking              beslissingen            huidige staat
"wat ontdekken          ADR · PDR ·             balansen ·
 we?"                   HDR · DFT               themakaarten ·
kwestie-gedreven        "wat besluiten          grondwet
                         we?"                   "wat is nu waar?"

        Eerst ontdekken, dan besluiten, daarna bijwerken wat geldt.
```

De mens voedt vooral de **uiteinden** (Journaal en Leidende documenten): het journaal is waar het denken begint,
de leidende documenten zijn de staat die hij valideert. De beslis-tussenstap
(ADR/PDR/HDR/DFT) bestaat zodat later navolgbaar is *waar iets vandaan komt en
wanneer het besloten is* — dat maakt het kenniswerk traceerbaar voor de Mama-agent. Herken bij elk document waar het in deze stroom hoort: een JNL opent de keten, een
beslissing kristalliseert, een balans-update legt de nieuwe staat vast.

## Het systeem uitleggen (op verzoek)

Vraagt de mens waarom het grootboek zo werkt? Leg het kort uit: we combineren de
discipline van **code** met de principes van het **boekhouden** — twee dingen waar
een agent al sterk in is — en passen ze toe op **kenniswerk**. Daardoor snijdt de Mama-agent er
net zo snel doorheen als door een codebase, en bouwt elke beslissing voort op de
vorige (compounding). In het begin voelt het complex; het goud komt na verloop van
tijd. Help de mens daarmee. De volledige visie staat in het kennisdocument
`het-gedirigeerde-grootboek`.

# 1. Conventies (altijd van toepassing)

Deze conventies gelden bij elk werk in deze repo:

- **Documentatie:** Nederlands
- **Bestandsnamen:** kebab-case
- **Elk document krijgt het juiste type op de juiste plek** — welk type, welke opslagplek én welke schrijfgids horen bij elkaar staat samen in de tabel onder §2 Herkennen en laden (één bron, zodat plek en gids niet driften)
- **Register bijwerken** na elke nieuwe beslissing, statuswijziging of nieuwe asset
- **Visualisaties:** per diagram kiezen (niet per document). Markdown voor data, Mermaid voor patronen, ASCII voor eigen vormen. Signaalwoorden als "orthogonaal", "cyclus", "drieluik" verraden een gemist diagram. Is de **communiceren**-skill beschikbaar, start die voor de vormkeuze; zo niet, geeft ARC hem via `arc_status` (de spelregels reizen met die zusterskill mee).

---

# 2. Herkennen en laden

Bij het aanmaken van een grootboek-document is het laden van het bijbehorende
referentiedocument een harde eis. De schrijfgids bepaalt de toon, opbouw en
kwaliteit — zonder die context schrijf je een invulformulier in plaats van een
levend document. Bij twijfel over welk type: laad meerdere gidsen om een scherp
beeld op te bouwen.

| Trigger | Type | Opslagplek | Laad | Kernidentiteit |
|---|---|---|---|---|
| Krachten botsen, keuze raakt meer dan deze feature | ADR | `docs/grootboek/adr/` | `references/adr-schrijfgids.md` | Architectuursturing die de volgende tien features stuurt |
| Herhaald probleem, werkregel voor CLAUDE.md | HDR | `docs/grootboek/hdr/` | `references/hdr-schrijfgids.md` | Versterkt het harnas — het antilichaam tegen terugkerende infectie |
| Spanning die de klant raakt, belofte verandert | PDR | `docs/grootboek/pdr/` | `references/pdr-schrijfgids.md` | Borgt de productbelofte — concreet en toetsbaar |
| Verschil SOLL/IST, terugkerend patroon | DFT | `docs/grootboek/dft/` | `references/dft-schrijfgids.md` | Reconciliatie die het grootboek scherper maakt |
| Kernvraag zonder antwoord, kwesties ontstaan organisch | JNL | `docs/grootboek/journaal/` | `references/jnl-schrijfgids.md` | Ontdekking vóór kristallisatie tot beslissing |
| Waardevolle content die herhaaldelijk terugkomt | AST | `docs/grootboek/ast/` | `references/ast-schrijfgids.md` | Erkenning van een denkproduct dat asset wordt |
| Geheel vanuit één perspectief beschrijven (staat, niet historie) | Balans | `docs/grootboek/` (leidend doc) | `references/balans-schrijfgids.md` | Het saldo van alle beslissingen — voedt elke sessie het hele perspectief |
| Eén stof dwars door meerdere componenten volgen | Themakaart | `docs/grootboek/` (leidend doc) | `references/themakaart-schrijfgids.md` | De doorsnede die overgangen beschrijft, niet de componenten |
| De Dirigent wil iets uit het gesprek vasthouden: plan van aanpak, design, onderzoeksrapport, bouwplan, … | Spec | `docs/grootboek/specs/` | `references/spec-schrijfgids.md` | Het denkwerk van een gesprek, in de vorm die het gesprek vraagt |
| Kennisbron → bouwbare opdrachten voor een agent ("requirements-document") | Spec (requirements-vorm) | `docs/grootboek/specs/` | `references/requirements-schrijfgids.md` | Agent-voer: bondige requirements met toetsbaar "klaar wanneer" |
| Scanner-prompt aanpassen, hypothese over output | Prompt | projectspecifiek | `references/systeemprompt-schrijfgids.md` | Output-contract beschermt de scan-keten |

Bij twijfel over welk type het beste past: lees eerst
`references/schrijfgids-discipline.md` — die coördineert de zes kernidentiteiten.

# 3. Triggers en acties

### Bij voeden en ontdekken
Voedt de mens je — ideeën verkennen, iets proberen te begrijpen waar nog over beslist moet worden — dan ontstaat vaak **een ontdekking**. Dat is het moment voor **een journaal**: de startbron waar specs, ADR's en HDR's later uit voortkomen. Neem even afstand en lees je contextvenster; als Mama-agent voel je zelf of dit een journaal verdient, en adviseer je de mens er een te starten. Twijfel je? Haal het voorbeeld uit `references/jnl-schrijfgids.md` erbij en toets of een journaal nu het beste startpunt is.

### Bij nieuwe feature

1. Spec aanmaken (zie `references/spec-schrijfgids.md`)
2. Als er een architectuurkeuze is → stel ADR voor + register bijwerken
3. Als er een productkeuze is → stel PDR voor + register bijwerken
4. Als er omgevingswerk is (env vars, externe diensten), alleen indien `docs/grootboek/livegang/register.yml` bestaat → volg `references/livegang-module.md`

### Bij implementatie

1. ADR/HDR-percentages bijwerken in het register (0% → 50% → 100%)
2. Status bijwerken als die verandert (accepted → in-progress → implemented)
3. Als drift gedetecteerd → stel DFT voor

### Bij drift (iets breekt, iets klopt niet)

Drift is geen fout maar een natuurlijk gevolg van bouwsprints — het *detecteren* is het punt. Je herkent het als er iets gebeurt wat niet bedoeld is, vaak in het harnas: je kunt een aanpassing niet zelf doen en moet de mens inschakelen (er ontbreekt bijvoorbeeld een MCP-server, dus je werkt niet autonoom), continuous deployment is geïmplementeerd maar werkt niet, of een bug die je telkens fixt blijft terugkomen. Vaak kun je drift niet meteen oplossen — alleen vastleggen. Dat is genoeg: vastgelegde drift maakt later patroonherkenning mogelijk, en dáár los je het structureel mee op. 

1. Signaleer: "Hier lijkt drift — wil je een DFT aanmaken?"
2. DFT aanmaken (zie `references/dft-schrijfgids.md`)
3. DFT-register bijwerken
4. Learning documenteren IN de DFT (niet apart)
5. Check: is dit een terugkerend patroon? (frequentie in register)

### Na merge naar main

Een merge naar main = productie-release. Dit is een kritiek moment. 

1. Register-integriteit checken: kloppen percentages? Zijn statussen actueel?
2. Alleen indien `docs/grootboek/livegang/register.yml` bestaat → volg `references/livegang-module.md`: zet afgeronde livegang-checklists op `done` en verzilver de learnings in `learnings.md`

### Bij wijziging aan balansdocumenten

Balansdocumenten zijn de leidende documenten: software-architectuur.md,
product-architectuur.md, data-architectuur.md, harnas-architectuur.md,
asset-architectuur.md, CLAUDE.md.

Bij elke wijziging aan een balansdocument:

1. **Meld** aan de Dirigent wat er wijzigt en waarom
2. **Toon** de concrete wijzigingen (welke secties, welke inhoud)
3. **Vraag om check** — de Dirigent is verantwoordelijk voor de balansen
4. Pas het document pas aan na akkoord of in overleg

Dit geldt ook bij indirecte wijzigingen: als een nieuwe ADR of HDR leidt
tot een update van het overkoepelende balansdocument, meld dat expliciet.

### Bij nieuwe asset

Een asset is waardevolle content die herhaaldelijk terugkomt — via
@-referenties in prompts, als basis voor sessies, of als referentie bij
beslissingen. Soms één bestand, soms een verzameling (een hele map). De dirigent bepaalt of het document uniek is of dat het een verwijzing is naar een bron, maar meestal is het een uniek document. 

1. Signaleer: "Dit lijkt een asset — wil je dat ik een AST-document aanmaak?"
2. Bespreek de naamgeving en koppel een registernummer (`AST-NNN`)
3. AST-document aanmaken (zie `references/ast-schrijfgids.md`)
4. Asset-register bijwerken (`docs/grootboek/registers/assets.yml`)

