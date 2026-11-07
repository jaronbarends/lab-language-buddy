# Opschoon-workflow — de indik-lus

Een levend document (learnings, een register, een themakaart) groeit. Veel van wat
erin staat is intussen geborgd in het harnas — in een hook, in de grondwet
(CLAUDE.md), in een leidend document, of in de code zelf. Dat is **dubbel
geheugen**: het belast de agent zonder waarde toe te voegen. Deze workflow ruimt
zulke documenten op tot hun kern, zonder de wijsheid te verliezen.

> De workflow is ontstaan in het ARC-project, waar een learnings-document na
> tientallen releases werd ingedikt tot een dunne kern (~95% bleek elders al
> geborgd). Dit is dat proces, herhaalbaar gemaakt voor elk project.

## Wanneer starten

Start de workflow wanneer:
- een grootboek-document groot of rommelig wordt, of als ruis voelt;
- je vermoedt dat veel ervan al elders is geborgd;
- de mens vraagt om "opschonen", "indikken", "opruimen" of "tot de kern brengen".

**Eerst akkoord vragen.** Dit raakt mogelijk balansdocumenten en het schrappen
voelt onomkeerbaar — vraag de mens om de scope te bevestigen vóór je agents inzet.

## Het kernidee: vier verdicts

Elk item krijgt precies één verdict. Dit is de motor van de workflow.

| Verdict | Betekenis | Actie |
|---|---|---|
| **Verzilverd** | Staat al in code / hook / grondwet / leidend document | Schrappen — dubbel geheugen |
| **Dood** | Eenmalige war-story, klaar, geen herhaalwaarde | Schrappen |
| **Tijdloos** | Terugkerende valkuil, nergens geborgd, houdt waarde | Behouden als one-liner (of verhuizen naar zijn leidend document) |
| **Nog open** | Onafgemaakt actiepunt | Behouden — dit is de oogst; naar de backlog |

## De vier stappen

### 1. Kaart
Lees het hele document. Lijst alle items en groepeer ze op onderwerp tot een handvol
clusters (5 is meestal genoeg). Mik op niet-overlappende clusters zodat agents
elkaar niet in de weg zitten.

### 2. Toets parallel
Zet per cluster één **verken-agent** in (parallel, in één bericht). Elke agent:
- krijgt de items van zijn cluster mee, letterlijk;
- toetst elk item tegen het harnas van **jouw project** — geef expliciet de
  plekken waar borging kan leven: de hooks-configuratie, de grondwet (CLAUDE.md
  op root- en domeinniveau), de leidende documenten in de grootboek-map van
  jouw project, de CI-configuratie, de registers, en de relevante productcode;
- levert één compacte tabel terug: `| Item | Verdict | Bewijs/locatie |`.

Jij blijft de orchestrator: je dispatcht, wacht op de verdict-tabellen, en
synthetiseert. Lees niet de volledige agent-transcripts — alleen hun conclusie.

### 3. Indik
- Schrap alle **verzilverd** + **dood**.
- Behoud **tijdloos** als one-liner; overweeg verhuizing naar het leidend document
  waar het thuishoort (dat is zelf een balanswijziging → communicatieplicht).
- Behoud **nog open** en verzamel ze als backlog.
- Vervang de geschrapte massa door een korte wijzer naar het permanente archief
  (bij livegang-learnings: de checklist-bestanden per release; bij een register:
  de bronrecords).

### 4. Borg de oogst
- **Altijd een JNL** als eenmalig verslag: kernvraag, het verslag (cijfers +
  methode), de geoogste tijdloze wijsheid, en de open kwesties als backlog met een
  besluitenlog. Zie `jnl-schrijfgids.md`. Werk het jnl-register bij.
- **Optioneel een spec** als er structurele wijsheid is die in een balans hoort.
  De spec is het vehikel; de balans is de bestemming; daarna verdwijnt de spec.
  Zie `spec-schrijfgids.md`. Balans landen = mens-check (communicatieplicht).

## Drie principes (waarom dit werkt)

1. **Code is de spec.** Een opgeloste bug hoort in de code, niet in een
   wijsheid-lijst. Als de code het gedrag al afdwingt, is de learning dood.
2. **Twee bronnen van waarheid driften altijd.** Borg een feit op één plek (een hook
   of een balans), dupliceer het niet. Daarom geen parallel "is-opgelost"-register
   naast het harnas — de hook ís de validatie-laag.
3. **Een hook verzilvert beter dan een document.** Wat in een hook zit wordt
   afgedwongen; wat in een document staat, wordt hopelijk gelezen. De duurzaamste
   learnings zijn die welke een hook of CI-poort werden.

## Klaar als
- Het document is terug tot zijn kern: open puntjes-wijzer + tijdloze-valkuilen + een
  pointer naar het permanente archief.
- Een JNL legt het verslag, de geoogste wijsheid en de open backlog vast.
- De mens heeft het resultaat gezien en is tevreden.
