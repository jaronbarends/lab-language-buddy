# ADR-011: Deepgram-provider

- **Status:** implemented
- **Date:** 2026-10-03
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De Deepgram-provider doet live transcriptie met een eigen set keuzes:

- **Token mint in de route zelf.** `mintLiveToken` staat in de tokenroute en niet in een apart
  bestand; de route hergebruikt `errorResponse` uit `chat-request.ts`.
- **Alleen webm of ogg.** De recorder weigert een opnameformaat dat geen webm of ogg is, met een
  foutmelding, in plaats van het te streamen. Het formaat wordt gecontroleerd, en
  `MICROPHONE_STARTED` verstuurd, bij het `start`-event van de recorder. De `error` van de
  recorder en een onverwachte `stop` eindigen in `FAILED` met "The microphone stopped.". De
  connect-deadline loopt tot dat `start`-event.
- **Geen flush bij het verlaten van `listening`.** Wat Deepgram dan nog niet heeft teruggestuurd,
  valt weg; er is geen `CloseStream`.
- **Eigen module met gedeelde vorm.** De Deepgram-code staat in `src/lib/stt/deepgram.ts`
  (`startDeepgramTranscription(language, callbacks)`), met het callbacks-type in
  `src/lib/stt/types.ts`. De hook zet alleen `onMicrophoneStarted`, `onTranscript` en `onFailed`
  om in reducer-actions.
- **Afbreekbare tokenaanvraag.** `startDeepgramTranscription` heeft een `AbortController` die
  `stop()` afbreekt; `fetchAccessToken(signal)` geeft hem aan de fetch door. De `hasEnded`-check
  na de await blijft.

## Waarom

- **Token mint:** anders dan bij de Gemini-aanroep valt er bij testen niets te vervangen, dus een
  tweede bestand zou alleen omweg zijn. De vorm van de foutbody is voor elke route dezelfde.
- **Alleen webm of ogg:** het plan zegt de echte `mimeType` terug te lezen. Deepgram accepteert
  mp4/aac zonder fout en geeft niets terug, wat eruit zou zien als een stille gebruiker.
- **Geen flush:** de interim-woorden op het scherm gaan al in het concept, en een nette flush zou
  vragen dat de state op de socket wacht, wat Send, Edit en Cancel niet horen te doen.
- **Check bij het `start`-event:** CodeRabbit merkte op de PR op dat `mimeType` zonder gevraagd
  type tot het `start`-event leeg kan zijn, zodat de vroege check een browser kon weigeren waarvan
  het standaardformaat werkt. Een recorder stopt ook zelf als zijn tracks eindigen (een headset
  die eruit gaat, een iOS-onderbreking) en niets merkte dat. De bewoording van de melding is van
  Jaron.
- **Eigen module:** stap 1 van het toevoegen van de native engine: beide engines krijgen dezelfde
  vorm en de hook weet niet meer welke draait. Vóór de bouw is de effect-start op een iPhone
  getest: de native engine, gestart vanuit een `useEffect` na een state-wijziging, werkt daar
  (spike-pagina, "Native via effect"), dus de structuur van de hook kan blijven. Gedrag veranderde
  niet.
- **Abort.** Een geannuleerde of verlopen start liet de tokenaanvraag doorlopen, en de check
  was het enige tussen een late token en een socket. Het advies van de review, en van de agent,
  was alleen een commentaar; Jaron koos de abort. De Deepgram-route moest op een iPhone worden
  nagelopen. Kruisverwijzing, niet uit de rijen van dit record: op 10-19 is dat geprobeerd, zie
  ADR-012 (ElevenLabs Scribe-provider).

## Voorgeschiedenis

De eerste versie (10-03) controleerde het opnameformaat en verstuurde `MICROPHONE_STARTED` direct
na `start()`. Dat is op 10-05 verplaatst naar het `start`-event, om de reden onder Waarom. De
Deepgram-code stond eerst in `use-live-transcription.ts`; die is op 10-12 uit de hook gehaald. De tokenroute heette eerst `api/stt/token` en is op 10-19
hernoemd naar `deepgram-token`, zie ADR-009 (STT: providerkeuze en configuratie).

## Gevolgen

- **De code staat nu in `src/lib/stt/deepgram.ts`.** `src/hooks/use-live-transcription.ts` is
  provider-onafhankelijk en start de geconfigureerde provider via `getConfiguredStartFunction`
  (uit de code, niet uit het plan).
- **De tokenroute heet nu `src/app/api/stt/deepgram-token/route.ts`** (er is ook een
  `elevenlabs-token`-route). `mintLiveToken` staat er nog steeds in, en de route gebruikt
  `errorResponse` uit `src/lib/chat-request.ts`.
- De keuze van provider en model staat in ADR-009 (STT: providerkeuze en configuratie); de
  herstart van de native engine op iPhone in ADR-010 (Native engine op iPhone: herstart en twee
  mitigaties); de tweede provider met dezelfde vorm in ADR-012 (ElevenLabs Scribe-provider).
