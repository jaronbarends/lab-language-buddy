# ADR-021: Fouten en herstel

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Fouten zijn herstelbaar, en de weg terug hangt af van waar het misging: een mislukte AI-call
wordt opnieuw geprobeerd, een mislukte opname brengt de gebruiker terug naar zichzelf.

### De fout-state en het herstelpad

- `FAILED` werkt alleen vanuit `aiThinking` en `listening`. De fout-state draagt `from` en een
  optioneel `detail`.
- *Try again* na een mislukte AI-call probeert die call opnieuw. Alleen de chat-call wordt
  herhaald: een correctie die al is binnengekomen blijft bewaard, en een mislukte correctie
  wordt niet opnieuw geprobeerd.
- *Try again* roept `unlockAudio()` aan. Opnieuw proberen na een mislukte AI-call eindigt in
  de AI die spreekt, en deze klik is het gebaar.
- Een TTS-fout (fetch, afspelen, of audio die nooit is ontgrendeld) wordt in de browser gelogd
  en degradeert naar alleen tekst via `AI_SPEECH_FAILED`, zonder foutscherm.

### Wat een falen is, en fouten op de server

- Een lege of uit alleen witruimte bestaande reply is een falen, en een Gemini-antwoord zonder
  `output_text` is een fout.
- De `request.signal` van de route gaat door naar de Gemini-call. De server heeft zelf geen
  deadline.
- Een ontbrekende API-sleutel wordt server-side gelogd; de client krijgt de generieke melding
  "The chat request failed". De Zod-tekst bij 400 en de statuscodes blijven ongewijzigd.
- Een request die de browser afbreekt, blijft in de serverlog staan als "Chat request failed".
  Afbreken krijgt geen speciaal geval.
- De TTS-server logt de fout van de provider en antwoordt met een generieke 500; een foute
  `TTS_PROVIDER` staat in die log met de geldige namen.

### Fouten in de browser en time-outs

- `LIVE_CONNECT_TIMEOUT_MS` (10 s) beëindigt een connect die geen live microfoon heeft
  opgeleverd met `FAILED` en de bestaande verbindingsmelding. De klok start nadat
  `getUserMedia` is opgelost. Op de TTS-fetch staat geen deadline.
- Een exception bij het starten van de recorder eindigt in `FAILED`, zoals elke andere fout
  van de hook.
- Het construeren van de Deepgram-WebSocket staat in een `try` die in `FAILED` eindigt, net
  als de start van de recorder.
- De evaluatie-deadline is `EVALUATION_TIMEOUT_MS` in `src/lib/evaluation-deadline.ts`. Die
  wordt geïmporteerd door de evaluatie-driver en de mock-route
  (`MOCK_SLOW_LATENCY_MS = EVALUATION_TIMEOUT_MS + 5_000`). De commentaartekst van de reducer
  bij `pendingReply` noemt hem en zegt dat de driver altijd moet afronden.

## Waarom

- De spike liep dood en zei de gebruiker te herladen, waarmee het gesprek werd weggegooid voor
  iets dat meestal een hapering is. De fout-state draagt `from`, omdat *Try again* na een
  mislukte AI-call die call moet herhalen: de beurt van de gebruiker is al verstuurd.
- Een lege bubbel kon als antwoord doorgaan: `?? "{}"` en een kale `z.string()` vingen dat niet
  op.
- Een afbreking door de client moet de betaalde call stoppen. De 30 seconden deadline van de
  client beëindigt al elke request waarop iemand wacht.
- De client wint niets bij te weten dat de sleutel ontbreekt. Of een falen herhaalbaar is, blijft
  open tot de client er iets mee kan.
- Door `request.signal` door te geven gooit elke afbreking in `askGemini`: het verlaten van
  `aiThinking`, de client-deadline, en in dev de dubbele effect van Strict Mode. De server kan
  die niet uit elkaar houden, noch weten waarom de client wegging. De log overslaan voor
  `request.signal.aborted` is voorgesteld en nu niet de moeite waard.
- Gevonden in de review van stage 3: het ophalen van het token en het openen van de socket
  konden blijven hangen zonder teken. De permissiedialoog telt niet mee in de connect-klok,
  want de gebruiker kan erop blijven zitten. De TTS-fetch blijft zonder deadline omdat de tekst
  al op het scherm staat en *Reply* werkt. Jaron koos de 10 s en het weglaten van de
  TTS-deadline.
- Gevonden in de review van stage 3: het starten van de recorder gooide binnen de
  `onopen`-handler van de socket, buiten elke `try`, en liet `listening` open zonder melding.
  Opgemerkt door CodeRabbit op de pull request: de commentaartekst bij `void connect()` zei
  dat `connect` zijn eigen fouten afhandelt, wat voor de WebSocket-constructie onwaar was.
- Gevonden in de review van stage 3: retry na een mislukte AI-call eindigt in de AI die
  spreekt, en deze klik is het gebaar. Of iOS het element blijft ontgrendeld houden, is nog
  onbekend; `unlockAudio()` aanroepen is in elk geval onschadelijk.
- Alleen de chat-call herhalen voorkomt dat een retry twee keer betaalt en dat de tekst onder de
  gebruiker kan veranderen. Het voorstel kwam van de agent en is geaccepteerd.
- Het antwoord wordt vastgehouden tot de evaluatie is afgerond, en dat garandeert alleen de
  deadline in een ander bestand. De `15_000` in de mock was een niet-gekoppeld getal dat groter
  moest zijn dan die deadline. Twee beweringen van de reviewer klopten niet: *End session*
  bestaat in `aiThinking`, en de chat-timer stopt wanneer het antwoord binnenkomt.

## Voorgeschiedenis

Tot de herziening van de foutflow op 09-29 ging het wegklikken van de fout altijd naar
`awaitingUser`. Een mislukte Gemini-call werd daardoor nooit opnieuw geprobeerd, een mislukte eerste AI-beurt
toonde "Start conversation", en een late `FAILED` kon een concept overschrijven. Een TTS-fout
toont sindsdien geen fout meer maar degradeert naar alleen tekst.

## Gevolgen

- De fout-state en `FAILED` staan in `src/lib/session-reducer.ts`; de chat-deadline is
  `CHAT_TIMEOUT_MS` (30 s) in `src/hooks/use-chat-driver.ts`. (uit de code, niet uit het plan)

Verwant: ADR-007 (Evaluatie per beurt, in een eigen call)

Verwant: PDR-006 (Antwoord pas na de correctie)

Verwant: ADR-011 (Deepgram-provider)

Verwant: ADR-018 (Sessiestate: één reducer, beurtstatus als discriminated union)

## Herkomst

- D15 (Decisions) Errors — Recoverable, and the way back depends on where it failed: a failed AI call is retried, a failed recording returns to the user
- L25 (09-29) Error flow reworked: `FAILED` only from `aiThinking`/`listening`, error state carries `from` and optional `detail`, dismiss retries a failed AI call; new `AI_SPEECH_FAILED`
- L79 (10-03) An empty or whitespace-only reply is a failure, and a Gemini response without `output_text` is an error
- L80 (10-03) The route's `request.signal` is passed to the Gemini call; the server has no deadline of its own
- L82 (10-03) A missing API key is logged server side and the client gets the generic "The chat request failed"; Zod text at 400 and the status codes are unchanged
- L86 (10-03) A request the browser aborts stays in the server log as "Chat request failed"; aborts get no special case
- L97 (10-03) A TTS failure (fetch, playback, or audio never unlocked) is logged in the browser and degrades to text-only via `AI_SPEECH_FAILED`
- L103 (10-05) `LIVE_CONNECT_TIMEOUT_MS` (10 s) ends a connect that has not produced a live microphone with `FAILED` and the existing connection message; the clock starts after `getUserMedia` has resolved. No deadline on the TTS fetch
- L104 (10-05) An exception when the recorder starts now ends in `FAILED` like every other failure of the hook
- L105 (10-05) Try again calls `unlockAudio()`
- L110 (10-05) Constructing the Deepgram WebSocket is inside a `try` that ends in `FAILED`, like the recorder start
- L130 (10-08) Try again after a failed chat call repeats the chat call only; a correction that has arrived is kept, and a failed correction is not retried
- L149 (10-10) The evaluation deadline is `EVALUATION_TIMEOUT_MS` in `src/lib/evaluation-deadline.ts`, imported by the evaluation driver and the mock route (`MOCK_SLOW_LATENCY_MS = EVALUATION_TIMEOUT_MS + 5_000`); the reducer's comment for `pendingReply` names it and says the driver must always settle
