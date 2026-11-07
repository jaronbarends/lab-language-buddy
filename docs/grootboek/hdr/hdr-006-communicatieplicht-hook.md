# HDR-006: Een hook herinnert de agent aan de communicatieplicht

- **Status:** implemented
- **Date:** 2026-10-24
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

De communicatieplicht (REQ-GG-04, Implementeer de communicatieplicht bij documentwijzigingen) is
een werkregel in de root-`CLAUDE.md`: als een leidend document verandert, zeg je wat er verandert
en waarom, toon je de concrete wijziging en vraag je om een check. Een regel die alleen in de
context staat, hangt ervan af dat de agent eraan denkt op het moment dat hij bewerkt. Dit record
voegt de herinnering toe op dat moment.

Wat is gebouwd:

- **De lijst met leidende documenten** is één keer gedefinieerd, in de root-`CLAUDE.md`: elke
  `CLAUDE.md` in de repo, `docs/grootboek/software-architectuur.md` (tot nu toe de enige balans)
  en `docs/code-architectuur.md`. Records, `docs/plan.md` en de README vallen buiten de plicht.
  `docs/grootboek/CLAUDE.md` verwijst naar de root in plaats van de lijst te herhalen.
- **Een PostToolUse-hook** (`.claude/hooks/notify-leading-document.cjs`) draait na elke `Edit` en
  `Write`. Is het bestand een leidend document, dan geeft hij de herinnering als context terug;
  anders blijft hij stil. Hij blokkeert nooit: de wijziging is gemaakt, en Jaróns check komt vóór
  de commit.
- **De lijst en de formulering staan in `.claude/hooks/leading-documents.json`**, naast het
  script. Een nieuwe balans, of een andere zin, is een wijziging in dat bestand, niet in de code.
- **Subagents krijgen een eigen formulering.** Een subagent kan Jarón niets vragen, dus in zijn
  instructie staat dat hij de wijziging in zijn rapport onder open punten zet; de lead thread geeft
  haar door en vraagt om de check.

## Waarom

**Kernprincipe:** een regel die ervan afhangt dat eraan wordt gedacht, faalt precies wanneer de
agent bezig is, en dat is wanneer documenten driften. De herinnering hoort op het punt van de
bewerking, ingespoten door het harnas, niet in een lijst die de agent moet raadplegen. Dit is
dezelfde splitsing die de werkafspraken al gebruiken: de procedure is data, de hook is bezorging.

De hook draait na de bewerking en weigert die niet, anders dan de andere hooks in dit harnas
(`guard-kenniswerker`, `triage-guard`). Voor de bewerking kan hij niet weten wat er verandert, en
de wijziging is goedkoop terug te draaien totdat ze is gecommit. Blokkeren zou ook van een kleine
correctie een stop-en-wacht maken op een check die Jarón toch al op de hele wijziging doet.

Hij draait ook voor subagents. Het eerste idee was hen erbuiten te laten, zoals de andere hooks
doen. Dat zou een stille bewerking mogelijk maken precies waar de plicht het moeilijkst na te
leven is: een builder wiens bestandsgrens een `CLAUDE.md` omvat. De builder kan niet vragen, maar
wel rapporteren.

## Gevolgen

- Live getest op 2026-10-24 na een herstart van de sessie: de hook vuurde op de lead thread en op
  een builder-subagent, de builder citeerde de subagent-formulering en zette de wijziging onder
  open punten. Beide wegwerpbewerkingen zijn teruggedraaid; het bestand was daarna schoon.
- **Geen ontdubbeling.** Elke bewerking geeft één herinnering, dus een bewerking en haar revert
  geven er twee. De formulering vertelt de agent niets meer te zeggen als hij de wijziging al heeft
  gemeld. Wordt dit in echt werk storend, voeg dan ontdubbeling per document toe, geen zwakkere
  regel.
- **Blinde vlekken, geaccepteerd:** de hook ziet alleen `Edit` en `Write`. Een wijziging via een
  shell-commando (`sed`, `git checkout`, een script) triggert hem niet, en een bewerking buiten
  Claude Code ook niet. Dezelfde beperking geldt voor de andere hooks (HDR-004).
- **De lijst staat op twee plekken:** de zin in de root-`CLAUDE.md` en `leading-documents.json`.
  Een nieuwe balans moet aan beide worden toegevoegd. Niets controleert of ze overeenkomen; een
  check in `npm run docs:check` is een mogelijke latere stap, geen onderdeel van dit record.
- **Verwant, hier niet besloten:** DFT-002 (de subagent-tenzij-guard blokkeert `CLAUDE.md`-bestanden
  onder `src/` voor de lead thread). De hook hangt er niet van af wie die bestanden bewerkt.
