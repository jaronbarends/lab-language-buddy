# DFT-005: Reconciliatie na ADR-031 — geen drift

- **Status:** resolved
- **Date:** 2026-11-08
- **Trigger:** het driftsignaal onder HDR-022 (Het driftsignaal meet vanaf de laatste
  reconciliatie, niet vanaf de laatste aanraking). Na fa016bb liepen de software-balans en
  `src/components/CLAUDE.md` elk 1 commit achter op hun werkgebied: drie bestanden in
  `src/components/conversation/`. Een verwacht signaal: de commit die ADR-031 (De AI-bubbel blijft
  één element, van wachten tot antwoord) boekte, zette vier commentaren om van JNL-003 naar dat
  record.

## SOLL vs IST

**SOLL:** `docs/grootboek/software-architectuur.md` en `src/components/CLAUDE.md` zoals ze op
fa016bb staan.
**IST:** de code op fa016bb. Sinds de vorige reconciliatie (DFT-004, op ddab397) veranderde in
beide werkgebieden alleen fa016bb, met vier regels commentaar: `ai-bubble.tsx:34`,
`conversation-thread.tsx:96` en `bubble-reveal.module.css:10` en 61 zeggen nu `(ADR-031)` in plaats
van JNL-003 K2 of K4. Geen code, geen CSS-regel, geen gedrag.

**Bevinding: geen verschil.**

### Wat klopt, met bewijs

Paden zonder map staan in `src/components/conversation/`; regels op fa016bb.

- **De nieuwe rij in § 3 (Thread en AI-bubbel), in dezelfde commit toegevoegd.** Eén array voor
  de beurten en de wachtbubbel: `conversation-thread.tsx:94-97` en 130. De key `ai-<n>`:
  `conversation-thread.tsx:25-32`, gebruikt op regel 117 (antwoord) en 132 (wachtbubbel). Alleen
  `scale` animeert: `bubble-reveal.module.css:20-25` en de keyframes op 86-96. Het scroll-effect
  leest de maat vóór de paint en is niet aangeraakt: `conversation-thread.tsx:64-92`.
- **§ 2 en § 3, de presentationele onderdelen dispatchen niet.** Geen van de drie gewijzigde
  bestanden roept `useSessionDispatch()` aan.
- **§ 3, de rij Dev-previews** verwijst naar JNL-003 K11 met "nog geen record". Dat klopt nog:
  ADR-031 gaat over de structuur van de AI-bubbel, niet over de previews.
- **`src/components/CLAUDE.md`: geen verschil.** Geen bewering in het bestand (tokens, dispatch
  via de leaf controls, de Safari-regels, de lijst van bewuste keuzes) gaat over commentaar in
  deze drie bestanden.
- **Het gat dat DFT-004 noemde, is gedicht.** DFT-004 schreef dat de structuur van de bubbel nog
  geen ADR had (JNL-003, K2), "een gat in de kringloop, geen balansdrift". Dat record is nu
  ADR-031, en § 3 noemt het.

## Patroon

Geen. Het is één verwacht signaal na een geplande wijziging, gereconcilieerd in dezelfde pull
request als de wijziging die het opriep. Dat is het omgekeerde van het patroon
`promised-follow-up-dropped` uit het incidentregister, waarin een vervolgstap bleef liggen tot een
controle van buitenaf hem vond; hier gaf HDR-022 het signaal en is het meteen opgevolgd. Eén keer
is geen bewijs dat dat zo blijft.

## Besluiten

1. **Geen documentwijziging.** De balans en `src/components/CLAUDE.md` kloppen met fa016bb.
2. **Deze DFT is `resolved`**, met beide documenten onder `documenten` en `getoetst-tegen:
   fa016bb`. De commit die deze DFT boekt, raakt alleen `docs/`, buiten elk werkgebied, dus het
   signaal is daarna stil.
3. **Geen drift, wel een open voorstel aan Jarón:** `src/components/CLAUDE.md` noemt een paar
   keuzes die "willekeurig lijken en bewust zijn"; de key op positie van de AI-bubbel is er zo
   een, en staat er niet bij. Dat is geen tegenspraak met de code, dus geen bevinding. Of hij
   erbij komt, is een wijziging van een leidend document en aan Jarón.

## Gevolgen

- REQ-GG-09 (Sluit de kringloop journaal → beslissing → document → code → drift): de stap code →
  drift voor de lus van JNL-003 K2 is hiermee gezet. Journaal (K2, 2026-10-23) → besluit (ADR-031)
  → document (balans § 3) → code (fa016bb) → drift (deze DFT). Anders dan bij de lus van ADR-004
  ging de echte code (750dc49, in main sinds PR #33) hier vóór het record; de codestap ná het
  besluit is alleen het omzetten van de commentaren. Het besluitenlog van JNL-003 zegt dat ook.

Verwant: HDR-022 (Het driftsignaal meet vanaf de laatste reconciliatie, niet vanaf de laatste aanraking)
Verwant: DFT-004 (Eerste reconciliatie op een echt signaal — `src/components/CLAUDE.md` beschrijft een context die nooit heeft bestaan, de balans mist de CI)
Verwant: ADR-031 (De AI-bubbel blijft één element, van wachten tot antwoord)
