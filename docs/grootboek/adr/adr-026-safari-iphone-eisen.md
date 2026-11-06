# ADR-026: Safari/iPhone-eisen

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Safari op iPhone wordt ingebouwd, niet achteraf toegevoegd. Zes eisen:

1. **Het opname-mimeType staat nooit vast.** Vraag `audio/webm;codecs=opus`, val terug op de
   standaard van de browser als `MediaRecorder.isTypeSupported` nee zegt, en lees na `start()` het
   echte `mediaRecorder.mimeType` terug.
2. **Audio unlock binnen elke gesture.** Eén hergebruikt `HTMLAudioElement`, met als `src` een
   stille WAV-data-URI van ongeveer 2 ms, dat **synchroon vóór elke `await`** wordt `.play()`ed in
   elke klik-handler die tot afspelen kan leiden: *Start chat*, *Send* en elke replay-knop. Het
   AI-antwoord speelt pas na meerdere `await`ed fetches, en dan is de gesture verlopen. *Start chat*
   is de submitknop van een formulier, dus de unlock hoort in de `onClick` van die knop en niet in
   de `onSubmit` van het formulier: de klik vuurt altijd eerst, en bij Enter laat de browser ook een
   klik op de standaardknop afgaan. Op een iPhone geverifieerd in fase 3: de audio van de AI speelt
   zonder tweede tik.
3. **Layout voor iOS chrome.** Een flex-kolom op `100dvh` in plaats van een `position: fixed`-balk
   (van een fixed element wordt verwacht dat het gaat schuiven als het toetsenbord opent en de
   URL-balk inklapt; dit is de verwachting, niet geverifieerd), plus `viewport-fit=cover`,
   `env(safe-area-inset-top)` en `env(safe-area-inset-bottom)`. In home-screen-modus houdt de
   kolom de knoppen niet boven het toetsenbord; zie ADR-023.
4. **Een vloer van 16px op elke focusbare control**, anders zoomt iOS de viewport in bij focus.
   Zie Voorgeschiedenis voor de basislettergrootte van 18px.
5. **Device testing is onderdeel van elke fase**, geen eindronde: `next dev` met een ngrok-tunnel
   (HTTPS is hoe dan ook nodig voor `getUserMedia`).
6. **Een bewerkbare bubbel is een `contenteditable="plaintext-only"`-div, geen textarea.** Zie
   `DraftEditor` in `draft-review.tsx`.

### Opnameformaat: opgelost, geen risico

Het fragmented-MP4 van Safari werd eerst als openstaande onbekende aangemerkt, omdat `findings.md`
het mimeType-probleem alleen in de *batch*-STT-context documenteert en de live-STT-verificatie
vastlegt als gedaan met een Node-script met MP3-chunks. Dat is een documentatiegat, geen testgat:
de live STT van de spike is op de echte iPhone gedraaid en het transcript verscheen progressief.

- Het testtoestel draait **iOS 26**. Safari 18.4 (maart 2025) voegde WebM/Opus toe aan
  `MediaRecorder`, dus `isTypeSupported` geeft `true` en Safari neemt dezelfde WebM-tak als Chrome.
- De streaming-socket van Deepgram accepteert Opus-in-WebM als containerized input (laat
  `encoding` weg, de header wordt herkend). Opus-in-Ogg en linear16-in-WAV zijn de andere twee.
- Het fMP4-pad wordt hier dus nooit uitgevoerd. MP4/AAC is **geen** gedocumenteerde
  streaming-container van Deepgram, dus op een iPhone onder 18.4 zou het waarschijnlijk stilletjes
  falen.

## Waarom

- **Zonder unlock** speelt het AI-antwoord niet af: het komt na meerdere `await`ed fetches, als de
  gesture verlopen is.
- **Zonder 16px-vloer** zoomt iOS de viewport in bij focus.
- **Geen textarea:** die krijgt zijn afmeting van `cols` en `rows`, niet van zijn inhoud.
  `field-sizing: content` lost dat op, maar bestaat pas in Safari en iOS 26.2. Een verborgen kopie
  van de tekst achter de textarea is gebouwd en faalde op een iPhone: volle breedte en een andere
  regelhoogte. `plaintext-only` zit al jaren in iOS Safari, en in Firefox sinds 136.
- **HTTPS** is nodig omdat `getUserMedia` er helemaal niet zonder werkt.

## Voorgeschiedenis

Op 09-28 is de basislettergrootte 18px geworden en zijn de 16px-controles vervallen (zie PDR-016):
met 18px voldoet elke control vanzelf aan de vloer. Jaron (2026-11-06): de eis blijft gelden voor de
iPhone, ook als de basislettergrootte ooit anders wordt.

## Gevolgen

- **Uitwijkroute** als het opnameformaat ooit toch uitmaakt: Web Audio `AudioWorklet` naar 16 kHz
  `linear16`, met `&encoding=linear16&sample_rate=16000`; dat is onafhankelijk van de container.
- (Uit de code, niet uit het plan.) De unlock-audio staat in `src/hooks/use-audio-playback.ts` (een stille WAV-data-URI), de
  `isTypeSupported`-controle in `src/lib/stt/deepgram.ts`, `viewport-fit=cover` en de
  safe-area-variabelen in `src/app/layout.tsx` en `src/app/globals.css`, en `DraftEditor` in
  `src/components/conversation/draft-review.tsx` (`contentEditable="plaintext-only"`).
- De safe area en de geaccepteerde beperkingen van de `100dvh`-kolom (toetsenbord in
  home-screen-modus) staan in ADR-023.

Verwant: ADR-011 (Deepgram-provider)
Verwant: ADR-017 (De bubbel en het bewerkvak)
Verwant: ADR-023 (Safari/iPhone: safe area en geaccepteerde beperkingen)
Verwant: PDR-016 (Typografie en iconen)
