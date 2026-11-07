# Mapstructuur Grootboek — de conventie

Dit is de structuur die deze skill bij elk project aanlegt onder
`docs/grootboek/` — **de grootboek-map van jouw project**. Het is een
conventiepad: de afspraak die de skill vestigt, niet een bestaand bestand
dat je ergens opzoekt. De bootstrap-werkstroom van deze skill zet deze
structuur neer; daarna groeit hij met het project mee.

```
docs/grootboek/
├── README.md                  ← Navigatie + leeswijzer (optioneel maar aanbevolen)
│
├── registers/                 ← YAML-registers: de deterministische index
│   ├── adr-register.yml       ← Alle architectuurbeslissingen
│   ├── hdr-register.yml       ← Alle harnasbeslissingen
│   ├── pdr-register.yml       ← Alle productbeslissingen
│   ├── dft-register.yml       ← Alle drift-rapporten
│   ├── jnl-register.yml       ← Alle ontdekkingsjournalen
│   └── ast-register.yml       ← Alle assets (herbruikbare denkproducten)
│
├── adr/                       ← Architectuurbeslissingen (WAT bouwen we)
├── hdr/                       ← Harnasbeslissingen (HOE werken mens en agent)
├── pdr/                       ← Productbeslissingen (WAAROM zo, voor de klant)
├── dft/                       ← Drift-rapporten (KLOPT HET NOG)
├── journaal/                  ← Ontdekkingsjournalen (kwestie-gedreven discovery)
├── specs/                     ← Feature-/bugfix-specs (wegwerp-werkdocumenten)
├── ast/                       ← Assets: herbruikbare denkproducten
│
├── livegang/                  ← Optionele module: promotie-checklists + learnings
│   ├── register.yml           ← Overzicht van alle checklists
│   ├── learnings.md           ← Tijdloze deployment-wijsheid (bewust dun)
│   ├── lg-NNN-<feature>.yml   ← Per-feature checklists
│   └── archief/               ← Afgeronde checklists
│
├── archief/                   ← Verbruikte documenten die hun werk hebben gedaan
│
├── leidende-documenten.md     ← Wat de leidende documenten zijn en hoe ze samenhangen
└── *.md                       ← De balansen en themakaarten zelf
                                 (bv. software-architectuur.md, data-architectuur.md)
```

## De logica achter de indeling

**Registers zijn de goedkope index, documenten de dure inhoud.** Een agent
leest eerst het register (één YAML, deterministisch te parsen) en pas daarna
het document dat hij echt nodig heeft. Houd ze allebei actueel: een document
zonder registerregel is onvindbaar, een registerregel zonder document is een
dode verwijzing.

**Elke beslissingssoort heeft een eigen map én een eigen nummerreeks**
(adr-001, hdr-001, …). Nummers worden nooit hergebruikt; een vervallen
beslissing krijgt een status, geen nieuw leven onder hetzelfde nummer
(zie `status-lifecycle.md`).

**Specs zijn wegwerpproducten.** Ze voeden de bouw en verhuizen daarna naar
`archief/` — de blijvende kennis landt in beslissingen en balansen, niet in
de spec. Het archief bewaart, de actieve mappen blijven schoon.

**Livegang is optioneel.** Niet elk project heeft omgevingswerk dat
promotie-checklists rechtvaardigt. Leg de map pas aan wanneer de eerste
checklist nodig is (zie `livegang-module.md`).

## Wat NIET in docs/grootboek/ hoort

| Soort materiaal | Waarom erbuiten |
|-----------------|-----------------|
| Visie- en richtingsdocumenten | Kompas-materiaal: waarheen, niet wat-is — een eigen plek voorkomt dat de balansen vervuilen met wensen |
| Sessielogs en procesverslagen | Operationeel proces, geen leidende staat |
| Onderzoek en experimenten | Verkennend; pas als er een beslissing uit volgt, landt die in het grootboek |
| Code-documentatie naast de code | De code is het functioneel ontwerp; het grootboek beschrijft beslissingen en de opgetelde staat, niet implementatie-details |

Waar dat andere materiaal dan wél leeft, bepaalt het project zelf. ARC —
het project waaruit deze skill komt — gebruikt bijvoorbeeld `docs/kompas/`
(richting) en `docs/operatie/` (proces) naast `docs/grootboek/`; dat is een
illustratie van de scheiding, geen verplichte naamgeving.

## Navigatiepatronen

- **"Welke beslissingen zijn er?"** → lees het relevante register in `registers/`
- **"Wat is de status van ADR-X?"** → zoek in `registers/adr-register.yml`
- **"Is er drift?"** → check `registers/dft-register.yml` op `open` items
- **"Wat zijn we aan het ontdekken?"** → check `registers/jnl-register.yml` op `discovery` items
- **"Hoe zit de architectuur in elkaar?"** → lees de balans met dat perspectief (bv. `software-architectuur.md`)
- **"Wat moet er nog voor livegang?"** → check `livegang/register.yml` op open checklists (indien aanwezig)
- **"Wat zijn leidende documenten?"** → lees `leidende-documenten.md`
