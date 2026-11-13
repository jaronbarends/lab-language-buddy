---
name: triage
description: >
  Bepaalt het verificatieregime (trivial / normal / risky) vóór elke build-taak, volgens de
  staffel: classificeer op het TYPE wijziging, niet op de omvang. Laad deze skill altijd
  voordat je een builder-agent start of een build-taak delegeert, ook bij een "kleine fix",
  "snelle aanpassing" of "one-liner": juist dan beslist triage of het lichte regime mag.
  Trigger op: build-taak, een builder starten, het regime bepalen, de staffel, een
  wave-eenheid afsnijden, een plan uitvoeren, delegeren aan een builder. NIET voor: extern
  onderzoek, een reviewverzoek of het najagen van een bestaande bug (debugger): die rollen
  hebben een eigen ingang.
---

# Triage — de juiste hoeveelheid bewijs per wijziging

Eén uniform, zwaar verificatieregime is zowel traag als onbetrouwbaar: in de grootste
faalstudie van multi-agent-systemen (MAST) is *onjuiste* verificatie een grotere faalcategorie
dan *afwezige* verificatie. De industrie (Meta, Prime Video) classificeert de wijziging zelf en
staffelt de borging daarnaar. Deze skill doet dat voor onze opzet: jij, de lead agent,
beantwoordt vier vragen over de taak en geeft het oordeel mee aan de builder. Omvang is
bewust geen van de vragen: de gevaarlijkste wijzigingen zijn vaak de kleinste (twaalf regels
in een schema), de veiligste vaak de grootste (duizenden regels gegenereerde catalogus).

## De vier typevragen

Beantwoord ze op basis van de taak en de bestanden die de wijziging raakt. Geen configuratie
nodig: kijk naar wat de wijziging *is*.

1. **Data** — raakt dit een schema, migratie, seed, of een destructieve transformatie van
   echte data?
2. **Machinecontract** — dwingt de wijziging afnemers (andere code, clients, andere systemen)
   zich aan te passen? Denk aan: een gedeeld type, de vorm van een API, een eventformaat, een
   veld dat hernoemd, verwijderd of verplicht wordt. Een UI is geen machinecontract: een knop
   verplaatsen breekt geen afnemer. Iets optioneels toevoegen breekt ook niemand.
3. **Omkeerbaarheid** — wordt dit teruggedraaid met één revert of flag, of loopt het één keer
   tegen echte data of naar buiten (e-mail, deploy, betaling)?
4. **Dekking en patroon** — staat er een mechanische poort op het pad, en is dit een bekend
   patroon in dit project? Een test, snapshot of check telt altijd. Lint en typecheck (`tsc`)
   tellen alleen bij een wijziging zonder gedragseffect (weergavetekst, hernoemen, verplaatsen,
   imports, types); bij tekst is de borging de diff die de lead naloopt, want lint en `tsc`
   zien alleen een fout in de structuur. Een wijziging die gedrag verandert is `normal`, ook
   bij groene lint en `tsc`. Tekst die een model of spraakdienst aanstuurt (een prompt) is
   gedrag, en tekst die de gebruiker iets toezegt over wat de app doet ("je opname wordt niet
   bewaard") ook: staat zo'n zin niet meer gelijk aan de code, dan zegt de app iets onwaars.

## De harde triggers → altijd RISKY, ongeacht de omvang

- datawijzigingen, migraties, seeds tegen echte omgevingen
- machinecontracten (definitie hierboven)
- authenticatie en autorisatie
- secrets en credentials
- onomkeerbare acties naar buiten (versturen, publiceren, betalen)

## De drie regimes

| Regime | Wanneer | Wat het betekent |
|---|---|---|
| **trivial** | alle vijf: lokaal · omkeerbaar · geen contract · gedekt pad · bekend patroon | builder-light (opdracht van één regel, rapport van drie regels), geen reviewer: de mechanische poorten zijn de borging |
| **normal** | echte gedragswijziging, geen harde trigger | volledig builder-contract + reviewer met frisse ogen, zoals gebruikelijk |
| **risky** | een of meer harde triggers | volledig regime plus extra zorg; leg de aanpak bij twijfel voor aan Jarón |

**Model van de builder** (HDR-024): bij `trivial` start je de builder met `model: "sonnet"` in de
aanroep. Bij `normal` en `risky` laat je het weg: `builder.md` pint Opus.

**Vangrail:** bij twijfel → normal. De staffel bespaart tijd bij de duidelijke gevallen;
twijfelgevallen zijn per definitie niet duidelijk.

## Het oordeelformaat

Zet het oordeel letterlijk bovenaan de opdracht van de builder:

```
regime: trivial — descriptive text next to the code, snapshot-covered, no contract
regime: normal — new behavior in a helper, covered path, no trigger
regime: risky — touches the database schema (machine contract)
```

Eén regel: het regime plus de redenering. De builder leest hieruit welk contract geldt (zie
de regime-sectie in `builder.md`); de guard-hook weigert een builder-start zonder deze regel.

**De grens van de guard — wees daar eerlijk over.** De guard vangt alleen builder-starts vanuit
de lead thread. Een builder die door een workflowscript of een team-lead-agent wordt gestart
(een aanroep die zelf van een agent komt) passeert de guard altijd. Orkestreer je op een
dieper niveau, dan ben jij zelf de borging: zet het regime-oordeel in de prompt van elke
agent-opdracht; de guard controleert het daar niet.

## Voorbeelden (ijkgevallen)

Bewust generiek: herken het type, niet het pad; dit werkt in elke stack:

- 84 beschrijvingsbestanden van drie regels bijwerken, naast de code, met snapshot-tests op de
  map → **trivial** (groot in regels, klein in risico: geen contract, gedekt, omkeerbaar).
- Een nieuwe pure helperfunctie met een eigen test → **normal** (nieuw gedrag, gedekt pad,
  geen harde trigger).
- Twaalf regels in het databaseschema, waaronder een veld dat verplicht wordt → **risky**
  (machinecontract: dwingt afnemers zich aan te passen, ongeacht de omvang).
- Een functionele wijziging in een scherm zonder test op het pad → **normal** (geen harde
  trigger, maar de dekking ontbreekt, dus niet trivial; de vangrail doet zijn werk).
- In een scherm de volgorde van twee delen van een weergavelabel omdraaien, lint en typecheck
  groen, geen logica geraakt → **trivial** (geen gedragseffect, omkeerbaar, bekend patroon; de
  lead loopt de diff na).
