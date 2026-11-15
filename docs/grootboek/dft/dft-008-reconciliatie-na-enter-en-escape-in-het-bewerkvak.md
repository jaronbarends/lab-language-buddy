# DFT-008: Reconciliatie na Enter en Escape in het bewerkvak — geen drift

- **Status:** resolved
- **Date:** 2026-11-15
- **Trigger:** de reconciliatie per pull request (HDR-026, Een pull request die code in een
  werkgebied raakt, sluit met een reconciliatie) voor de branch `enable-enter-for-edit`. De
  code-commit `b66a147` raakt `src/components`. Dat is het werkgebied van de software-balans en
  van `src/components/CLAUDE.md`. Deze DFT toetst tegen de code-commit in dezelfde pull request,
  net als DFT-005 (Reconciliatie na ADR-031 — geen drift), DFT-006 (Reconciliatie na de
  infomelding en het Feedback-component — geen drift) en DFT-007 (Reconciliatie na de
  zelfcorrectieregel van de corrector — geen drift).

Kosten: niet gemeten. Tijdens de reconciliatie liep tegelijk een andere sessie van Jarón. Die telt
mee in dezelfde sessielimiet, dus het verschil in `/usage` zegt hier niets.

## SOLL vs IST

**SOLL:** `docs/grootboek/software-architectuur.md` en `src/components/CLAUDE.md`, beide helemaal
gelezen.

**IST:** de code voor PDR-021 (Het bewerkvak als chatvenster: Enter verstuurt, Escape annuleert),
in de working tree getoetst en daarna gecommit als `b66a147`. Sinds de vorige reconciliaties
veranderde in geen van beide werkgebieden iets in een commit. De balans werd het laatst
gereconcilieerd in DFT-007, op `f0369c9`, en `src/components/CLAUDE.md` in DFT-006, op `ebb12b5`.
`npm run docs:drift` meldt beide als up to date. Er veranderden drie bestanden:

- `src/components/conversation/draft-review.tsx`: `DraftEditor` krijgt een `onKeyDown` en twee
  callback-props, `onSend` en `onCancelEdit`. Hij dispatcht zelf niets.
- `src/components/conversation/composing-controls.tsx`: `onSend` krijgt de bestaande
  `handleSend`. `onCancelEdit` dispatcht `DRAFT_EDIT_CANCELLED` binnen `flushSync` en zet daarna de
  focus op de Edit-knop, via een ref.
- `src/components/ui/button.tsx`: een optionele `ref`-prop, als React 19 ref-als-prop.

**Bevinding: geen verschil.**

### Wat klopt, met bewijs

- **§ 2, "Slechts vier componenten roepen `useSessionDispatch()` rechtstreeks aan".** Grep op
  `useSessionDispatch()` in `src` geeft nog steeds `ComposingControls`, `IdleControls`,
  `ErrorControls` en `StateStepper`, plus de hook zelf en de vermelding in
  `src/components/CLAUDE.md`. `DraftEditor` krijgt callbacks als props, zoals § 2 dat voor de
  presentationele onderdelen beschrijft.
- **§ 3, de rijen voor de leaf controls en voor de schermen met hun presentationele onderdelen.**
  Die kloppen nog. `ConversationControls` is niet geraakt, en `ComposingControls` blijft de plek
  waar gedispatcht wordt.
- **§ 4, "'verstuurt de beurt' is `ComposingControls` die `USER_TURN_SENT` dispatcht".** Dat klopt
  nog. Enter gaat via `onSend` naar dezelfde `handleSend` als de Send-knop. Er zijn nu twee
  triggers, maar de dispatch staat nog op één plek.
- **§ 7.** Geen contract geraakt. De reducer is ongewijzigd, want `DRAFT_EDIT_CANCELLED` en
  `USER_TURN_SENT` bestonden al. De optionele `ref` op `Button` dwingt geen afnemer tot een
  aanpassing.
- **§ 1, § 5, § 6, § 8 en § 9.** Geen route, env var, key of provider geraakt.
- **`src/components/CLAUDE.md`.** De regel over de leaf controls klopt nog (dezelfde grep). De
  verwijzing naar `.claude/rules/safari-ios.md` klopt ook nog. Die regel kreeg in dezelfde pull
  request "elke handler van een gesture (klik of toets)" in plaats van "elke click handler", net als
  ADR-026 (Safari/iPhone-eisen), versie 1.1. Het design system is niet geraakt, want er is geen
  CSS gewijzigd.

## Patroon

Geen. Dit is de vierde reconciliatie op rij zonder drift, telkens in dezelfde pull request als de
wijziging. De wijziging volgt een bestaand patroon: callbacks naar een presentationeel component,
en de dispatch in de leaf control. Zo'n wijziging verandert geen structuur die de balans
beschrijft.

## Besluiten

1. **Geen documentwijziging uit drift.** De balans en `src/components/CLAUDE.md` kloppen met
   `b66a147`.
2. **PDR-021 komt niet in de lijst van bewuste keuzes in `src/components/CLAUDE.md`.** Overwogen:
   Enter verstuurt alleen bij `(pointer: fine)`, en de focus gaat alleen na Escape naar Edit. Dat
   kan willekeurig lijken. Afgewezen: de reden staat in commentaar op de plek waar iemand het zou
   veranderen, in `draft-review.tsx` en `composing-controls.tsx`. Bovendien vindt wie het
   bewerkvak aanraakt PDR-021 via de `read_when` in `docs/index.yml`.
3. **`docs/code-architectuur.md` valt buiten deze DFT.** Het heeft geen werkgebied in de front
   matter (front matter gelezen), net als bij DFT-006. De wijziging splitst of laat geen bestand
   voorbij de drempels groeien: alle drie de bestanden blijven ruim onder de 300 regels.
4. **Deze DFT is `resolved`**, met beide documenten onder `documenten` en `getoetst-tegen:
   b66a147`. De commit die deze DFT boekt, raakt alleen `docs/` en valt buiten elk werkgebied,
   dus het signaal blijft daarna stil.

Verwant: PDR-021 (Het bewerkvak als chatvenster: Enter verstuurt, Escape annuleert)
Verwant: DFT-007 (Reconciliatie na de zelfcorrectieregel van de corrector — geen drift)
Verwant: HDR-026 (Een pull request die code in een werkgebied raakt, sluit met een reconciliatie)
