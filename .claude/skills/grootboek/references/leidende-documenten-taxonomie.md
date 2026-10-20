# Leidende documenten — taxonomie

Leidende documenten beschrijven de **huidige staat** van een project — het
opgetelde effect van alle beslissingen. Ze vormen de meta-structuur die elke
repo met een grootboek nodig heeft: drie soorten documenten, drie
levensduren, één keten van beslissing naar grondwet, en een vaste
rolverdeling tussen mens, agent en systeem.

```
JOURNAAL (ontdekking)  →  GROOTBOEK (beslissingen)  →  LEIDENDE DOCUMENTEN (staat)
kwestie-gedreven          ADR, PDR, HDR, DFT            "wat is de huidige staat?"
```

Lees het relevante leidende document voordat je aan een domein werkt.

## De taxonomie-boom

```
LEIDENDE DOCUMENTEN
├── Balansen — het geheel vanuit één perspectief
│   ├── technisch perspectief        (componenten, omgevingen, protocollen)
│   ├── functioneel perspectief      (wat de klant ervaart)
│   ├── werkwijze-perspectief        (hoe mens en agent samenwerken)
│   └── denkproducten-perspectief    (wat herbruikbaar is)
│
├── Themakaarten — één stof dwars door meerdere componenten
│   └── per stof één kaart (bijv. data, distributie, code-kwaliteit)
│
└── Grondwet — hiërarchisch, on-demand per domein
    ├── CLAUDE.md (root — altijd in context)
    └── domein-CLAUDE.md's (laden mee bij werk in dat domein)
```

**Balans** — beschrijft het geheel vanuit één lens. Meerdere balansen zijn
meerdere lenzen op dezelfde werkelijkheid; een wijziging kan in meerdere
balansen landen. Zie `balans-schrijfgids.md`.

**Themakaart** — een doorsnijding: één stof gevolgd door drie of meer
componenten, met de keten als kern. Geen subset van één balans. Zie
`themakaart-schrijfgids.md`.

**Grondwet** — de operationele samenvatting van alles, gecondenseerd tot
werkregels. De root laadt altijd; domein-grondwetten laden alleen waar
gewerkt wordt. Vuistregel per document: één lens op het geheel → balans;
één stof door de lagen → themakaart; altijd-geldende werkregel → grondwet.

## Drie levensduren

Elk grootboek-document heeft een levensduur — die plaatst leidende
documenten expliciet tegenover specs:

| Levensduur | Waar | Gedrag |
|---|---|---|
| **Evergreen** | balansen, themakaarten, grondwet, leidende principes | leeft mee, wordt onderhouden |
| **Verbruikt** | bouwplan, contract, ontwerpnotitie (specs) | brug naar code; na oplevering afgebroken |
| **Bevroren** | oplevernotitie / as-built, journaal-verslagen | momentopname; nooit onderhouden, blijft als geheugen |

De code is de waarheid, en die dijt continu uit en overschrijft zichzelf —
ze toont het *wat-nu*, niet het *waarom-toen*. Vandaar twee tegenwichten:
evergreen documenten houden de samenvatting bij, bevroren documenten bewaren
het geheugen. Specs zijn bouwsteigers: ze helpen bij de constructie en
worden daarna afgebroken — de winnende spec is het draaiende product.

## De keten: beslissingen → balansen → grondwet

```
ADR/PDR/HDR ──► Balansen + Themakaarten ──► Grondwet (CLAUDE.md)
(beslissingen)       (uitgebreid)            (gecondenseerd)
```

Van uitgebreid naar gecondenseerd: de beslissing draagt de volledige
rationale, het leidende document het overzicht, de grondwet de werkregel.
Wijzigingen stromen één kant op — eerst de beslissing, dan de balans- of
kaart-update, dan (waar nodig) de grondwet. Een leidend document dat wijzigt
zonder beslissing erachter is drift: maak er een drift-melding (DFT) van of
haal de wijziging terug.

> Ter illustratie: in het ARC-project (de referentie-instantie van dit
> stelsel) leven deze documenten in `docs/grootboek/` — bij jouw project is
> dat de grootboek-map die je zelf aanlegt; de conventie, niet een
> opzoekbaar pad.

## Eigenaren

Drie actoren, drie werkwoorden. De mens is eindverantwoordelijk; agent en
systeem opereren onder die verantwoordelijkheid.

| Actor | Werkwoord | Verantwoordelijkheid |
|---|---|---|
| **Mens** | voedt en valideert | geeft richting, beoordeelt het draaiende product, valideert leidende documenten op juistheid |
| **Agent** | bouwt en signaleert | schrijft code en documenten, houdt de staat actueel, meldt elke wijziging aan een leidend document (communicatieplicht) |
| **Systeem** (het grootboek) | borgt discipline | dwingt kwaliteit af via schrijfgidsen, registers en conventies |

De mens schrijft niet — de mens voedt. De agent vertaalt voeding naar
documenten en code, en meldt bij elke wijziging aan een leidend document:
wat wijzigt, waarom, en een vraag om check.
