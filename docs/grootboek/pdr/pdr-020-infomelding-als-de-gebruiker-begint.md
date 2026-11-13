# PDR-020: Een infomelding als de gebruiker het gesprek begint

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Kiest de gebruiker op het setup-scherm "Me" als wie begint, dan opent de thread met een
infomelding: *Ask a question or name a topic you want to discuss*.

- Het is het eerste item in de thread, vanaf het moment dat het gesprekscherm opent. Het blijft de
  hele sessie staan en scrollt mee uit beeld als het gesprek groeit. Er is geen sluitknop en geen
  animatie bij het verschijnen.
- De tekst is vast en Engels. De melding legt niet uit dat je met een AI praat.
- De melding lijkt op de foutbox: achtergrond, rand, tekstkleur en een icoon (`FaCircleInfo`), in de
  infokleuren. Hij ziet er duidelijk anders uit dan een bubbel.
- Foutbox en infomelding hebben dezelfde tekstgrootte: de gewone, geërfd van het document. De
  foutmelding onder de vette titel is daarom niet meer kleiner (`--font-size-minor`).
- Kiest de gebruiker "AI", dan is er geen melding.

## Waarom

- **Wie zelf begint, ziet een leeg scherm.** Het enige teken dat jij aan de beurt bent, is het label
  "Start conversation" op de knop (PDR-010, Sessieflow en schermen).
- **En weet niet altijd waarover hij moet beginnen.** De melding geeft twee ingangen: een vraag
  stellen of een onderwerp noemen.
- **Geen uitleg over de AI.** Jarón: "We gaan niet uitleggen dat je met AI praat." Dat was de derde
  mogelijke reden voor een melding, en die viel af.
- **De melding blijft staan.** Jarón koos dat hij zichtbaar blijft en vanzelf uit beeld scrollt.
  Overwogen waren een melding die na de eerste beurt verdwijnt en een die je wegklikt.
- **Een box en geen bubbel.** De melding hoort niet bij het gesprek, dus hij mag er niet op lijken.
  Hij hoort wel bij de foutbox: de hoeken, de padding, de borderdikte en de plek van icoon en tekst
  moeten samen veranderen. Daarom delen ze één component (`docs/code-architectuur.md` § 2.5, de
  uitzondering voor een gedeeld visueel recept).
- **Dezelfde tekstgrootte.** Jarón wil de tekstgrootte voor deze meldingen gelijk houden, en dan
  liever de foutmelding op de gewone grootte dan de infomelding kleiner.

## Gevolgen

- Er komt een gedeeld component `Feedback` in `src/components/ui/feedback.tsx`, met de varianten
  `ErrorFeedback` en `InfoFeedback`; de foutbox wordt erop omgebouwd.
- PDR-016 (Typografie en iconen) krijgt versie 1.1: de regelhoogte van de foutmelding die het Waarom
  noemt, gaat van 21px naar 27px.
- `ConversationScreen` krijgt `starter` als prop. PDR-010 haalde `config` eruit omdat de config-regel
  verdween; dit voegt alleen het ene veld toe dat de thread nodig heeft.
- **Een risico om te controleren.** De infokleuren zijn blauw, net als de gebruikersbubbel die
  direct onder de melding komt, en `--color-bg-info` is dezelfde blue-50 als de evaluatiesectie in
  die bubbel. Het onderscheid moet uit de vorm en het icoon komen. Op 2026-11-13 bekeek Jarón het
  in de browser en op de iPhone: goed.
- De foutbox houdt `role="alert"`; de infomelding krijgt geen role en staat in de `role="log"` van
  de thread. Dat wordt niet met een screenreader getest (PDR-019, Screenreaders zijn geen doel).
- **Landing.** De thread van het gesprekscherm (`conversation-thread.tsx`) en de foutbox in de
  control bar (`error-controls.tsx`). Het bouwplan staat in
  `docs/grootboek/specs/infomelding-als-de-gebruiker-begint.md`.
