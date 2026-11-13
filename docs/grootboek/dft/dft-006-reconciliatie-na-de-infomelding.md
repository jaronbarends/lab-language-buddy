# DFT-006: Reconciliatie na de infomelding en het Feedback-component — geen drift

- **Status:** resolved
- **Date:** 2026-11-13
- **Trigger:** de reconciliatie per pull request (HDR-026, Een pull request die code in een
  werkgebied raakt, sluit met een reconciliatie) voor de branch `add-info-box`. De code-commit
  `ebb12b5` raakt `src/components`, het werkgebied van de software-balans en van
  `src/components/CLAUDE.md`. Net als bij DFT-005 (Reconciliatie na ADR-031 — geen drift) toetst
  deze DFT tegen de code-commit in dezelfde pull request.

Kosten: 2% sessielimiet, 2 min van Jarón

## SOLL vs IST

**SOLL:** `docs/grootboek/software-architectuur.md` en `src/components/CLAUDE.md` zoals ze op
`ebb12b5` staan.
**IST:** de code op `ebb12b5`. Sinds de vorige reconciliatie (DFT-005, op 7f47692)
veranderden in het werkgebied acht bestanden, allemaal in die ene commit, voor PDR-020 (Een
infomelding als de gebruiker het gesprek begint):

- `src/components/ui/feedback.tsx` en `feedback.module.css`, nieuw: `Feedback` (niet
  geëxporteerd) met de varianten `ErrorFeedback` en `InfoFeedback`.
- `src/components/ui/icons.tsx`: `InfoIcon` erbij, `IconProps` geëxporteerd.
- `src/components/conversation/error-controls.tsx` en `.module.css`: de foutbox staat op
  `ErrorFeedback`; de melding heeft de gewone tekstgrootte.
- `src/components/conversation/conversation-thread.tsx`: `InfoFeedback` als eerste kind bij
  starter `user`, buiten de array met beurten.
- `src/components/conversation/conversation-screen.tsx` en `src/components/language-buddy.tsx`: een
  prop `starter`.

**Bevinding: geen verschil.**

### Wat klopt, met bewijs

- **§ 2 en `src/components/CLAUDE.md`: alleen de leaf controls dispatchen.** Nog steeds roepen alleen
  `composing-controls.tsx`, `error-controls.tsx`, `idle-controls.tsx` en `dev/state-stepper.tsx`
  `useSessionDispatch()` aan. `feedback.tsx` dispatcht niet.
- **§ 3, de rij Schermen: state komt als props.** `starter` gaat van `LanguageBuddy`
  (`language-buddy.tsx:55`) via `ConversationScreen` (`conversation-screen.tsx:30`) naar de thread
  (`conversation-thread.tsx:19`). Geen van de drie houdt zelf sessiestate bij.
- **§ 3, de rij Thread en AI-bubbel: "Rendert de beurten en de wachtbubbel in één array."** Dat
  klopt nog: `items` op `conversation-thread.tsx:164`. De infomelding staat erbuiten (159-163),
  juist om de keys op positie van ADR-031 (De AI-bubbel blijft één element, van wachten tot
  antwoord) niet te raken. Het scroll-effect is niet aangeraakt.
- **§ 3, de rij Leaf controls.** `ErrorControls` dispatcht nog en `ConversationControls` is niet
  veranderd.
- **`src/components/CLAUDE.md`, styling.** `feedback.module.css` staat naast zijn component en
  gebruikt alleen tokens; er staat geen losse kleur- of maatwaarde in.
- **Het perspectief van de balans.** De balans laat tekst, layout en het design system bewust
  buiten beschouwing (de inleiding). `Feedback` is een stuk design system; dat de balans het niet
  noemt, is geen gat.

## Patroon

Geen. Het is de tweede reconciliatie op rij zonder drift, net als DFT-005 gedaan in dezelfde pull
request als de wijziging. Het driftsignaal (HDR-022, Het driftsignaal meet vanaf de laatste
reconciliatie, niet vanaf de laatste aanraking) kon hier nog niet aanslaan, omdat het alleen
gecommitte wijzigingen meet; de toets loopt daarom tegen de code-commit, zoals DFT-005 dat ook
deed.

## Besluiten

1. **Geen documentwijziging uit drift.** De balans en `src/components/CLAUDE.md` kloppen met
   `ebb12b5`.
2. **Geen aanvulling in `src/components/CLAUDE.md`.** Overwogen: `Feedback` noemen bij de keuzes
   die willekeurig lijken en bewust zijn, want een gedeeld component bij twee aanroepers lijkt een
   te vroege extractie. Afgewezen: de reden staat waar de regel wordt toegepast, in
   `docs/code-architectuur.md` § 2.5 met `Feedback` als praktijkvoorbeeld, en in het commentaar
   bovenaan `feedback.tsx`.
3. **Deze DFT is `resolved`**, met beide documenten onder `documenten` en `getoetst-tegen:
   ebb12b5`. De commit die deze DFT boekt, raakt alleen `docs/`, buiten elk werkgebied, dus
   het signaal is daarna stil.

Verwant: PDR-020 (Een infomelding als de gebruiker het gesprek begint)
Verwant: DFT-005 (Reconciliatie na ADR-031 — geen drift)
Verwant: HDR-026 (Een pull request die code in een werkgebied raakt, sluit met een reconciliatie)
