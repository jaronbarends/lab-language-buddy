# PDR-006: Antwoord pas na de correctie

- **Status:** implemented
- **Date:** 2026-10-08
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Het antwoord van de AI verschijnt pas nadat de correctie is getoond; de correctie mag eerst
verschijnen. Een correctie-call die na **10 seconden** nog niet heeft geantwoord, wordt
afgebroken en een laat antwoord wordt genegeerd. De TTS-weergave begint pas als het antwoord
op het scherm staat.

De volgorderegel zit in de reducer. `AI_TURN_RECEIVED` houdt het antwoord vast als
`pendingReply` in `aiThinking` zolang de evaluatie van de laatste gebruikersbeurt `pending` is;
`EVALUATION_RECEIVED` en `EVALUATION_FAILED` geven het vrij.

Komt de correctie pas na het chat-antwoord, dan mogen antwoord en correctie in dezelfde render
verschijnen. De regel is dat het antwoord nooit vóór de correctie komt; samen verschijnen
voldoet daaraan.

TTS-audio wordt niet vooraf opgehaald terwijl het antwoord op de evaluatie wacht.
`use-audio-playback.ts` is ongewijzigd en haalt de audio op bij het binnengaan van
`aiSpeaking`, dus nadat het antwoord op het scherm staat.

## Waarom

- De correctie staat in de bubbel van de gebruiker, en die komt vóór het antwoord.
- De time-out zorgt ervoor dat een corrector die blijft hangen het antwoord niet vasthoudt.
- Een pure transitie in de reducer kan los worden uitgevoerd, in plaats van twee hooks die op
  elkaar wachten. De evaluation driver volgt de beurt, niet `aiThinking`: een mislukte chat-call
  laat de evaluatie dus doorlopen, en Try again herhaalt haar niet.
- Samen in dezelfde render verschijnen is goed genoeg; Jaron: de timing kan in een latere fase
  worden bijgesteld.
- Vooraf ophalen van audio vraagt extra state en levert alleen winst op als de corrector
  langzamer is dan de chat-call (zie Voorgeschiedenis).

## Voorgeschiedenis

Dezelfde dag, 10-08, is één punt teruggedraaid:

1. **Ophalen kan eerder beginnen.** De eerste versie van het besluit (10-08) zei dat het ophalen
   van de audio eerder kan starten.
2. **Niet vooraf ophalen.** Een latere rij van dezelfde dag draaide dat terug: terwijl het antwoord op de evaluatie
   wacht, wordt geen TTS-audio opgehaald. Reden: vooraf ophalen vraagt extra state en levert
   alleen winst op als de corrector langzamer is dan de chat-call.

## Gevolgen

- De ordeningsregel staat in `src/lib/session-reducer.ts` (`pendingReply`, de cases
  `AI_TURN_RECEIVED`, `EVALUATION_RECEIVED` en `EVALUATION_FAILED`); de 10 seconden zijn
  `EVALUATION_TIMEOUT_MS` in `src/lib/evaluation-deadline.ts`. De evaluatie die hier wordt
  afgewacht en afgebroken is de eigen call van ADR-007 (Evaluatie per beurt, in een eigen call).
- De correctie die vóór het antwoord moet verschijnen, staat in de bubbel van de gebruiker; hoe
  die eruitziet staat in PDR-005 (Hoe de correctie eruitziet).
- De stand van 10-08, ten tijde van het besluit (het record is inmiddels `implemented`): de 13
  reducer-scenario's waren gedraaid met een wegwerpscript via de type stripping van Node; de
  drivers en de time-out van 10 seconden waren toen nog niet in een browser gedraaid.

## Herkomst

- L127 (10-08) The AI's reply is shown only after the correction has been shown
- L134 (10-08) Stage 4 step 2: the ordering rule is in the reducer
- L141 (10-08) The reply and the correction may appear in the same render
- L142 (10-08) TTS audio is not fetched ahead while the reply waits for the evaluation
