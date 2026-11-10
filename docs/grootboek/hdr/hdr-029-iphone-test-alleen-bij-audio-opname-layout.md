# HDR-029: De iPhone-test alleen bij audio, opname of layout, en geen vaste ronde langs de faalpaden

- **Status:** implemented
- **Date:** 2026-11-10
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een handmatige controle kost bij elke wijziging tijd van Jarón. Ze hoort alleen vast in de
werkwijze waar de kans op een fout die geen andere controle vangt, die prijs waard is.

## Besluit

Dit vervangt HDR-019 (Elke stage verifiëren op de iPhone) en HDR-020 (Faalpaden bewust proberen).
Beide kwamen uit de sectie Verification van `plan.md` en golden voor de bouwstages.

- **De iPhone-test geldt voor een wijziging die audio, opname of layout raakt.** Zo'n wijziging gaat
  op een echte iPhone in Safari; een andere wijziging niet. Zo staat het al in de root-`CLAUDE.md`
  ("Controles voordat je iets af noemt"), en `builder.md` en `reviewer.md` melden een iPhone-test
  die nog moet gebeuren als open.
- **Geen vaste ronde langs de faalpaden.** De microfoonrechten weigeren, het netwerk midden in een
  `/api/chat`-aanroep afknippen en de opname stoppen zonder iets te zeggen, horen niet meer bij elke
  verificatie.
- **De vijf extra controles van stage 3** uit HDR-019, waaronder een uiting van meer dan 20
  seconden, zijn voorgeschiedenis.

## Waarom

**Gevonden in de proef "besluiten toetsen"** (2026-11-10), uit C3 van de grootboekronde met de
ARC-skill grootboek-onderhoud. Een read-only verkenner legde tien records naast de code en het
harnas. HDR-019 en HDR-020 stonden op `implemented` met 100%, maar het harnas droeg ze niet meer
zoals ze luidden:

- HDR-019 zei "elke bouwstap"; `CLAUDE.md` beperkt de iPhone-test tot audio, opname en layout. De
  20-secondencontrole kwam van Google STT, dat al in de spike afviel (ADR-009, Voorgeschiedenis).
- Naar HDR-020 vroeg volgens de verkenner niets in het harnas meer sinds `plan.md` op 2026-11-06
  verdween (HDR-015).

**De keuze van Jarón (2026-11-10):**

- iPhone: "hoeft alleen bij wijziging die audio, opname of layout raakt".
- Faalpaden: vervallen. "Dit is veel werk om elke keer te doen, en de kans dat hier iets fout gaat
  vind ik daarvoor te klein."

**Afgewogen:** de faalpaden opnemen in de controles van `CLAUDE.md` of `builder.md`. Niet gekozen,
om de reden hierboven.

## Gevolgen

- Geen wijziging aan `CLAUDE.md`, `builder.md` of `reviewer.md`: die zeggen al wat dit record
  besluit.
- Wat de faalpaden toetsten, staat in de code: de herstelbare `error`-state in
  `src/lib/session-reducer.ts` en de afhandeling van een geweigerde microfoon in
  `src/lib/stt/deepgram.ts` en `src/lib/stt/elevenlabs.ts`. Een wijziging op die paden wordt niet
  meer standaard met de hand geprobeerd; een fout daar kan dan pas bij gebruik bovenkomen.
- **Grens:** of een wijziging audio, opname of layout raakt, is een oordeel van de builder en de
  reviewer. Niets controleert dat mechanisch.

Verwant: HDR-019 (Elke stage verifiëren op de iPhone), HDR-020 (Faalpaden bewust proberen),
HDR-015 (plan.md vervalt als bron; beslissingen leven in het grootboek)
