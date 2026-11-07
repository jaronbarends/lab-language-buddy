# ADR-012: ElevenLabs Scribe-provider

- **Status:** implemented
- **Date:** 2026-10-16
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

ElevenLabs Scribe is de derde STT-provider (de keuze en configuratie staan in ADR-009: STT:
providerkeuze en configuratie).

- **Audio.** De engine haalt zijn audio uit een `AudioWorklet` die de microfoon middelt naar
  16 kHz 16-bit PCM en dat als base64-JSON verstuurt. De bron van de worklet is een string in
  `pcm-worklet.ts`, geladen via een Blob URL. De `AudioContext` wordt aangemaakt in de effect
  die de klik op Reply triggert, en niet doorgegeven vanuit die klik.
- **Tokenroute.** Een tweede tokenroute, `/api/stt/elevenlabs-token`, geeft `{ accessToken }`
  terug en gebruikt `ELEVENLABS_API_KEY`, de TTS-key; er is dus geen nieuwe variabele.
- **Fatale Scribe-berichttypes.** De set in `elevenlabs.ts` volgt de event reference van
  ElevenLabs (https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/event-reference.md,
  2026-10-19) en is aangevuld met `invalid_request`, `unaccepted_terms`, `queue_overflow`,
  `resource_exhausted` en `chunk_size_exceeded`. `commit_throttled` en
  `insufficient_audio_activity` zijn niet fataal.
  Een berichttype dat de code niet afhandelt, wordt één keer per verbinding gelogd met
  `console.warn`.
- **`startStreamingAudio`** wordt bewaakt door de vlag `streamingAudioHasStarted`, gezet vóór de
  eerste await.
- **De gedeelde lifecycle-helper** voor de engines (een eerder reviewpunt, te bouwen zodra er
  een derde engine is) is nog niet gebouwd; `elevenlabs.ts` herhaalt de bookkeeping van `hasEnded`, `stop`
  en `fail` voor de derde keer.

## Waarom

- **PCM via een worklet.** Scribe accepteert alleen PCM of u-law, niet het webm/opus van
  `MediaRecorder`, dus het Deepgram-pad is niet te hergebruiken. De Blob URL laadt op Safari
  (op de iPhone geprobeerd in de spike); een bestand onder `public/` voegt een tweede pad toe
  dat gelijk moet blijven. Al het andere volgt `deepgram.ts`: de connect-timeout, de
  afbreekbare tokenfetch en de handlers die losgekoppeld worden voordat de socket sluit.
- **Een route per vendor** houdt elke key en elke grant-call in een eigen bestand, en de
  vorm van het antwoord komt overeen met de Deepgram-route, zodat de clientcode gelijk leest. De
  route vergroot de open vraag over publieke deployment (geen authenticatie of rate limit op de
  serverroutes) met één endpoint; zie ADR-002 (De serverroutes hebben geen authenticatie van de aanroeper, voorlopig geaccepteerd).
- **Lifecycle-helper uitgesteld.** De helper zou `deepgram.ts` en `native.ts` wijzigen, allebei
  op de iPhone gecontroleerd, in dezelfde wijziging als een nieuwe engine. Bij een regressie
  zou niet te zien zijn welke wijziging de oorzaak was. De agent stelde voor het als aparte
  stap erna te doen; Jarón ging akkoord.
- **Fatale types.** De lijst had geen bron en een type buiten de lijst werd zonder spoor
  genegeerd. De docs zeggen niet per type dat de socket na een fout sluit, en ook niet wat
  `insufficient_audio_activity` betekent; de eigenaar koos deze indeling ("akkoord"). Voorgesteld
  door de cold review, gekozen door Jarón.
- **De vlag.** Een tweede `session_started` zou een tweede audiograaf bouwen, waarna de eerste
  niet meer door `stop()` te ontkoppelen is. De docs zeggen niet of het bericht kan
  herhalen; de vlag bewaakt een geval dat nog niet is gezien. Dit kwam uit de cold review.

## Voorgeschiedenis

De eerste versie van de rij over de worklet (10-16) zei dat de `AudioContext` in de tap werd
aangemaakt, vóór iets werd afgewacht, zoals de spike deed. Op 10-19 is dat gecorrigeerd: een
cold review en CodeRabbit wezen erop dat de context in een effect na de klik wordt gemaakt, zodat
iOS hem mogelijk suspended laat. De comment in `elevenlabs.ts` ("inside the tap") was fout en is
op 10-19 gecorrigeerd; de code is niet gewijzigd. Jarón probeerde het op een iPhone en koos ervoor alleen de comment te wijzigen; het
aantal runs en of de tweede beurt is geprobeerd, zijn niet vastgelegd. Toont een latere test een
hang of een suspended context, dan is de oplossing de context in de Reply-handler te maken en aan
de provider door te geven. Dat raakt `types.ts`, `index.ts`, de hook, `elevenlabs.ts` en drie
controls-componenten.

## Gevolgen

- **Wat is gecontroleerd.** Op desktop Chrome en op een iPhone werkten de ElevenLabs-provider en
  de Deepgram-provider (ADR-011: Deepgram-provider), na de renames van die dag, in de app
  "zoals eerder" (Jaróns woorden). Niet vastgelegd: het aantal runs, de iOS-versie, of de tweede
  beurt na een AI-antwoord is geprobeerd, het volume van de AI-spraak en andere talen dan de
  gebruikte. Dit stelt vast dat de nieuwe provider en de hernoemde Deepgram-route draaien; het
  breidt het spike-resultaat van 11 van 11 beurten niet uit naar de app. De open vraag over de
  iPhone-problemen van de native engine blijft ongewijzigd; zie ADR-010 (Native engine op iPhone:
  herstart en twee mitigaties).
- **De drie openstaande punten van de review zijn door Jarón geprobeerd.** `console.warn`: met de
  check op `committed_transcript` tijdelijk hernoemd verscheen de waarschuwing één keer per
  beurt, hoeveel zinnen er ook in werden gesproken, en opnieuw in elke nieuwe beurt (één set per
  verbinding), zoals gebouwd; in een normale beurt wordt niets gelogd. Vlag: met
  `startStreamingAudio` twee keer aangeroepen en de vlag verwijderd verschenen meer berichten in
  het netwerkpaneel dan met de vlag, dus de vlag voorkomt een tweede audiopijplijn; de aantallen
  zijn niet vastgelegd en Scribe is nog niet gezien met twee `session_started`-berichten.
  `AudioContext`: op Safari op een iPhone geprobeerd zoals de review beschrijft (koude start,
  tweede beurt na een AI-antwoord, herhaalde beurten, scherm vergrendelen en naar een andere app
  wisselen), zonder fouten; de iOS-versie en het aantal beurten zijn niet vastgelegd. De fatale
  berichttypes zijn nog nooit uitgelokt tegen de echte API.
- **Waar het staat.** `src/lib/stt/elevenlabs.ts` (de engine, `ERROR_MESSAGE_TYPES`,
  `streamingAudioHasStarted`), `src/lib/stt/pcm-worklet.ts` (de worklet-bron) en
  `src/app/api/stt/elevenlabs-token/route.ts` (de tokenroute).
- **Nog open.** De gedeelde lifecycle-helper is nog niet gebouwd. Het wisselen en configureren
  van de provider staat in ADR-009; de herstart en mitigaties van de native engine staan in
  ADR-010 (Native engine op iPhone: herstart en twee mitigaties).
