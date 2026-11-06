# ADR-010: Native engine op iPhone: herstart en twee mitigaties

- **Status:** implemented
- **Date:** 2026-10-12
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Als de browser zelf een sessie beëindigt.** Eindigt de browser een native sessie zelf terwijl de
beurt `listening` is (door stilte of een time-out), dan start de engine een nieuwe sessie en houdt
de tot dan toe gehoorde woorden vast; het eindigt niet in `FAILED`. Een nieuwe sessie begint met
een lege resultatenlijst, dus `native.ts` neemt de eerdere tekst over: de finalized woorden en de
interim woorden, die laatste omdat niets ze nog kan finalizen nadat de sessie is beëindigd.

Een sessie die binnen 1,5 s eindigt telt als een snel einde; drie snelle einden achter elkaar
eindigen in `FAILED`. Een `no-speech`- of `aborted`-fout doet dat nooit. Echte fouten
(`not-allowed`, `audio-capture`, `network`, `language-not-supported`, al het andere) eindigen in
`FAILED` met een eigen tekst. `service-not-allowed` heeft een eigen tekst, *Speech recognition
isn't allowed or is switched off on this device.*; `not-allowed` houdt de microfoontekst.

**Twee mitigaties voor de iPhone.**

1. De speech van de AI wordt **0,15 s voor het einde gepauzeerd** (een controle elke 50 ms in
   `use-audio-playback.ts`) en `AI_SPEECH_FINISHED` wordt van daaruit gedispatcht; `onended` blijft
   als fallback.
2. De native engine houdt een **`getUserMedia({ audio: true })`-stream open** (niets leest hem) van
   vóór de eerste sessie tot `stop()`. Mislukt het openen, dan start de engine toch.

Beide staan aan in **elke browser**, zonder platformcheck. De 0,10 tot 0,15 s die de vroege pauze
van het einde van elke speech afsnijdt is geaccepteerd; de drempel blijft 0,15 s.

## Waarom

**Herstart.** De keuze was `FAILED` of herstarten. Herstarten houdt de gebruiker aan het praten na
een pauze. Getest op een iPhone: een herstart na stilte vraagt geen extra tik. Alle zes de talen
zijn daar ook geprobeerd.

**Snelle einden.** Zonder limiet zou een browser die elke sessie meteen beëindigt eindeloos
herstarten. De getallen zijn die van de agent en niet afgestemd.

**`service-not-allowed`.** De code betekent dat de spraakservice van de browser niet is toegestaan,
niet dat de microfoon is geweigerd; de oude tekst stuurde de gebruiker naar een instelling die al
goed stond. Getest op een iPhone met Dictation uit: herkenning werkte nog, dus wat deze code daar
triggert is niet bekend. De tekst rust op wat de code betekent, niet op een waargenomen geval. Het
geval van een geweigerde microfoon (`not-allowed`) is niet geprobeerd.

**Vroege pauze.** Op een iPhone met de native engine nam de tweede gebruikersbeurt niets op als de
speech van de AI vanzelf was geëindigd; met de vroege pauze nam hij wel op en speelde het derde
AI-bericht. De oorzaak is niet begrepen en de fout is intermitterend, dus dit is een mitigatie en
geen fix (beurt 2 nam op in 4 van 4 runs mét en 2 van 13 zonder). Niet beperkt tot iOS omdat een browsercheck een tweede pad zou toevoegen
dat getest moet worden. De kosten zijn maximaal 0,15 s van het einde van elk bericht, vermoedelijk
stilte, niet gemeten. Jarón controleerde op 10-14: desktop Chrome klinkt ongewijzigd, het einde van
een bericht wordt niet hoorbaar afgekapt, en Deepgram als STT-engine werkt op de iPhone (de stem
van de AI is TTS, los van Deepgram).

**Gehouden stream.** Op een iPhone voorkomt hij dat de speech van de AI zachter wordt nadat de
microfoon is gebruikt (gelijk volume in 5 van 5 runs, op het gehoor, tegenover zachter zonder), en
de native engine herkende nog steeds in beide beurten samen met de vroege pauze. Hij lost de
opname van de tweede beurt niet op, dus beide zijn nodig. Waarom het werkt is niet bekend.

**In elke browser.** De problemen werden op de iPhone gezien; op desktop werd de speech ook
zachter en de mitigatie voorkwam dat ook, en dat de herkenning niet startte is op desktop niet
gezien. Jarón koos ervoor geen platformen te onderscheiden, om de code simpel te houden. Is de
mitigatie op de iPhone niet meer nodig, dan is ze op desktop vermoedelijk ook niet nodig.

**Het afgesneden einde.** Jarón luisterde op een iPhone en op desktop Chrome: de audio heeft
genoeg stilte aan het einde, er ging geen gesproken tekst verloren. Welke TTS-providers en zinnen
zijn gecontroleerd is niet vastgelegd.

## Voorgeschiedenis

Op 10-13 gold een open capture als oorzaak van de zachtere speech. De gehouden stream, die dat
juist voorkomt, heeft die redenering omgekeerd. Waarom hij werkt is niet bekend.

## Gevolgen

- De microfoonindicator staat aan zolang de native engine luistert.
- De stream wordt geopend vóór de eerste sessie, dus `onMicrophoneStarted` komt in elke browser
  later, met de duur van de `getUserMedia`-stap (niet gemeten).
- Desktop Chrome met de Bluetooth-headset zakt met de twee mitigaties niet meer in volume (door
  Jarón op 10-14 op het gehoor waargenomen, niet gemeten). Dat verzwakt de hypothese dat een
  headset naar zijn belprofiel schakelt (HFP); die zou met een open stream ook moeten zakken. De
  oorzaak blijft onbekend.
- Dat native de standaard-STT-engine blijft staat in ADR-009 (STT: providerkeuze en
  configuratie); de andere engines staan in ADR-011 (Deepgram-provider) en ADR-012 (ElevenLabs
  Scribe-provider).
- Code: `src/lib/stt/native.ts` (herstart, `QUICK_END_MS`, `MAX_QUICK_ENDS`,
  `openUnusedMicrophoneStream`) en `src/hooks/use-audio-playback.ts` (`EARLY_END_SECONDS`,
  `EARLY_END_CHECK_MS`). Gecontroleerd: beide kloppen met bovenstaande. De runs staan in
  `docs/ios-stt-runs.md`.
