# Themakaart-skelet — de vorm van een doorsnijding

> Dit is een **skelet**, geen echt ARC-document: de vorm van een themakaart
> uitgeschreven met fictieve inhoud (een denkbeeldige stof "notificaties").
> De namen, componenten en beslissingsnummers zijn illustratief — gebruik dit
> als gevoel voor de opbouw, niet als sjabloon om in te vullen. Niet elke
> sectie hieronder hoort in elke kaart: elke vorm bestaat alleen áls de stof
> erom vraagt. De volledige rationale van het type staat in
> `references/themakaart-schrijfgids.md`.

---

```markdown
---
titel: "Notificatie-architectuur — één stof door alle lagen"
type: leidend-document
soort: themakaart
datum: <datum>
status: v1
auteurs: <mens>, <agent>
---

# Notificatie-architectuur

## Doel

Dit document volgt één stof — notificaties — dwars door alle componenten:
waar een notificatie ontstaat, hoe hij door de keten reist, en waar hij de
gebruiker bereikt. Open dit document bij elke vraag over notificaties; de
balansen beschrijven de componenten zelf, deze kaart de doorsnijding.

Wat hier bewust níet staat: voortgang en standen. De code is de waarheid
en het meetlog is het geheugen; deze kaart draagt wat langer meegaat —
het waarom, de naden en het waarheids-register.

## Waarom notificaties zo werken

Notificaties bestaan hier om één reden: de gebruiker hoeft de app niet
open te hebben om niets te missen. Daaruit volgt alles: bezorging mag
laat zijn maar nooit verloren gaan, en storen is duurder dan zwijgen —
bij twijfel valt een notificatie stil (PDR-0zz).

## De doorsnede

        backend          queue            client
      ┌──────────┐    ┌──────────┐    ┌──────────┐
      │ ontstaan │───▶│ bezorging│───▶│  tonen   │
      └──────────┘    └──────────┘    └──────────┘
           │               │               │
           ▼               ▼               ▼
        ADR-0xx         ADR-0yy         PDR-0zz
      (triggers)      (at-least-once) (stille uren)

## Het waarheids-register

| Waarheid | Waar | Wint bij tegenspraak |
|---|---|---|
| Notificatietypen + teksten | `notificatie-model/types.ts` | **de bron** — gelezen door backend én client |
| Bezorggaranties | queue-configuratie | afgeleide van ADR-0yy |
| Stille-urenvenster | gebruikersinstelling in de database | de gebruiker, altijd |

De levende kern is `notificatie-model/types.ts`: de enige plek waar een
notificatietype bestaat. Backend en client lezen hem beide; een type dat
alleen in één van de twee voorkomt is per definitie drift.

## Bezorging

Notificaties reizen via een queue met at-least-once-garantie; de client
dedupliceert op `notificationId` (ADR-0yy). De keuze voor at-least-once
boven exactly-once is bewust: de deduplicatie aan clientzijde is goedkoop,
een exactly-once-queue niet.

## De terugkerende workflow: een notificatietype wijzigen

Wijzigen reist door de keten: `types.ts` (de bron) → de trigger in de
backend → de weergave in de client → één controle-bezorging in de
testomgeving. De prijs hangt af van de trede:

| Trede | Wat schuift | Prijs |
|---|---|---|
| taal | alleen de tekst van het type | gratis — wijzig en kijk |
| betekenis | wanneer het type vuurt | een meting (controle-bezorging) |
| structuur | type erbij, eraf of gesplitst | een release mét meting |

## Voorkeuren

Geen beslissing aangetroffen. Gebruikersvoorkeuren (stille uren, kanalen)
zijn in de code zichtbaar als een hardcoded standaard, maar er ligt geen
PDR onder. Kandidaat voor een beslissing zodra dit gedrag ter discussie komt.
```

---

Vier kenmerken dragen dit skelet — steeds een denkrichting, geen verplichte
sectie:

- **Het waarom vóór de keten.** Een kaart die met de keten opent, leert de
  lezer naspreken; een kaart die met het waarom opent, leert hem de
  volgende zet doen.
- **De stof-doorsnede als ASCII** — één stof, meerdere componenten,
  beslissingen eronder — en de **eerlijkheid van "geen beslissing
  aangetroffen"**: een sectie zonder stof blijft een benoemd gat, geen
  vulsel.
- **Een levende kern verdient een register.** Benoem de bron en de
  afgeleiden; drift wordt pas vindbaar als de kaart zegt wie er gelijk
  hoort te hebben. Heeft jouw stof geen levende kern, dan bestaat deze
  sectie niet.
- **Standen horen niet in de kaart.** Voortgang veroudert per dag; de
  workflow en de wijzigingsladder juist niet — die vertellen de lezer wat
  een wijziging kost vóór hij snijdt.
