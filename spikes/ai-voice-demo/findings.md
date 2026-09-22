# Findings: AI voice spike

Doel van de spike: browser-based speech-to-text (STT) en text-to-speech (TTS) voor een
Noors (B1) oefengesprek, met als harde eis dat het werkt in **Safari op iPhone**, niet
alleen desktop Chrome.

Huidige config (`.env.local`): `STT_PROVIDER=deepgram`, `TTS_PROVIDER=azure`.
Providers zitten als losse modules in `src/lib/voice/`, elk met dezelfde vorm
(`transcribe(audio: Blob): Promise<string>` en/of `synthesize(text: string): Promise<ArrayBuffer>`),
gekozen via `STT_PROVIDER`/`TTS_PROVIDER` in de routes (`src/app/api/stt`, `src/app/api/tts`).

## Provider-geschiktheid

### Speech-to-text

| Provider | Geschikt? | Reden |
|---|---|---|
| **Deepgram** (nova-2) | ✅ Ja — huidige keuze | Werkt correct met Safari's opname, ongeacht lengte (getest tot 30,8s). Rapporteert de juiste duur. Subjectief door de gebruiker beter beoordeeld dan Google. Goedkoopste optie gevonden (~$0,0043/min, pre-recorded). Let op: Noors zit alleen op het **legacy nova-2/base/enhanced-model**, niet op nova-3/flux. |
| **ElevenLabs** (Scribe) | ✅ Ja | Werkte al vóór de Deepgram-toevoeging, geen probleem met Safari's opname. Duurder dan Deepgram maar goedkoper dan gedacht ($0,22/uur) — zie kostenpunt hieronder. |
| **Google Cloud STT v1** | ❌ Nee, voor deze usecase | Werkt op Chrome, maar breekt op Safari-opnames langer dan ~17,5s reële duur — ruim onder de gedocumenteerde limiet van 60s. Zie "Google STT-bug" hieronder. |
| **Azure AI Speech** | ❌ Nee (nog niet) | STT-REST-endpoint accepteert alleen WAV/PCM of OGG/Opus, niet de WebM/Opus-container die Safari (en onze recorder) produceert. Faalt **stil**: HTTP 200, `RecognitionStatus: Success`, maar lege `DisplayText` en een onjuiste gerapporteerde duur — geen foutmelding. Zie "Azure STT: stille misser" hieronder. |

### Text-to-speech

| Provider | Geschikt? | Reden |
|---|---|---|
| **Google Cloud TTS** (Chirp3-HD) | ✅ Ja | Werkt, nb-NO-Chirp3-HD-Aoede. Goede prijs (~$30/1M tekens). |
| **Azure AI Speech** | ✅ Ja — huidige keuze | Werkt, nb-NO-FinnNeural (mannelijk; nb-NO-IselinNeural/PernilleNeural als vrouwelijke alternatieven, zie comment in `azure.ts`). Los van het STT-probleem — TTS uploadt geen audio, dus dat format-issue speelt hier niet. |
| **ElevenLabs** | ⚠️ Werkt, maar duur | 1,7–3,3× duurder per teken dan Google Chirp3-HD ($50–100/1M vs $30/1M). Dit was vermoedelijk de echte reden dat de oorspronkelijke pure-ElevenLabs-setup duur aanvoelde — niet de STT-kant, die is juist relatief goedkoop. |
| **Deepgram** (Aura) | ❌ Nee | Geen Noorse stem beschikbaar. |
| **OpenAI** | ❓ Niet geïmplementeerd | Goedkoopste TTS op papier (tts-1: $15/1M tekens), maar generieke multitalige stemmen, geen toegewijde nb-NO-stem zoals Google/Azure. Kwaliteit voor Noors ongetest. |

## Twee concrete, verrassende bugs (het bewaren waard)

### Google STT: bytegrootte-heuristiek in plaats van echte duur
Google's sync `speech:recognize` gaf `"Sync input too long"` bij Safari-opnames van ±30s,
terwijl de limiet 60s zou moeten zijn. Uitgezocht via binaire zoektocht op audiobestanden
(rechtstreeks tegen Google's API, zonder de app aan te raken): de omslag lag steeds rond
**~480.000 bytes gecomprimeerde grootte**, niet bij een vaste tijdsduur. Dat komt griezelig
precies overeen met 60s × 64kbps ÷ 8 = 480.000 bytes — sterke aanwijzing dat Google intern
een duur *schat* als bytegrootte ÷ aangenomen bitrate (~64kbps), in plaats van de
container-timestamps te lezen.

Safari's `MediaRecorder` codeert Opus in pakketjes van 2,5ms (in plaats van de gebruikelijke
20ms), wat de effectieve bitrate naar ~197kbps opstuwt puur door overhead. Daardoor raakt
een Safari-opname die 500-heuristiek al bij ~17,5s werkelijke spraak, terwijl Chrome's
efficiëntere framing dat probleem vermoedelijk pas veel later raakt (dit laatste is niet
apart getest op Chrome).

`LongRunningRecognize` met inline content bleek **dezelfde check** te hebben (ook getest,
faalde identiek) — geen gratis oplossing. Een echte fix vereist een GCS-bucket + `uri`-referentie,
wat voor deze spike bewust niet is gebouwd.

### Azure STT: stille misser, geen foutmelding
Azure's STT-endpoint retourneert **HTTP 200** en `RecognitionStatus: "Success"` voor een
WebM/Opus-opname die het niet kan lezen — met een lege `DisplayText` en een duidelijk
onjuiste `Duration` in de respons. Zonder die duur-check te vergelijken met de echte
opnameduur, zou dit makkelijk doorgaan voor "het werkt, maar hoort niks" in plaats van
een format-probleem. Zie `src/lib/voice/azure.ts` voor de comment hierover.

## Andere Safari-specifieke fixes (nu in de code)

- **`next.config.ts`**: `allowedDevOrigins: ['*.ngrok-free.app']` — nodig om de dev-server
  via een ngrok-tunnel op de iPhone te testen; Next.js blokkeert dat anders standaard.
- **Audio afspelen (`ChatApp.tsx`)**: Safari staat `audio.play()` alleen toe binnen een
  user-gesture. Omdat het AI-antwoord pas na meerdere `await fetch`-calls afspeelt, is de
  gesture dan al verlopen. Fix: één hergebruikt `<audio>`-element dat binnen elke klik
  wordt "ontgrendeld" met een stille WAV, en daarna van `src` wisselt.
- **Opnameformaat (`ChatApp.tsx`, `google.ts`)**: Chrome neemt standaard op als
  `audio/webm;codecs=opus`, Safari als `audio/mp4` (AAC). De code labelde alles hardcoded
  als webm, wat Safari-opnames naar Google STT corrupt maakte. Fix: expliciet
  `audio/webm;codecs=opus` aanvragen waar mogelijk, en het echte `mimeType` doorgeven
  i.p.v. hardcoden.

## Kosten (voorzichtig — grotendeels via derde partijen geverifieerd, niet primaire bron)

| Service | STT | TTS |
|---|---|---|
| Google Cloud | $0,016–0,024/min | Chirp3-HD: $30/1M tekens |
| ElevenLabs | $0,22/uur (~$0,0037/min) | $50–100/1M tekens |
| Azure | onbekend (calculator dynamisch, geen vast cijfer gevonden) | $22/1M tekens (Neural HD) |
| Deepgram | $0,0043/min (nova-2, pre-recorded) | geen Noors |
| OpenAI | ~$0,006/min (gpt-4o-transcribe) | $15/1M (tts-1) / $30/1M (tts-1-hd) |

Cijfers komen grotendeels van aggregators (costbench, diyai, texttolab) omdat de officiële
pricing-pagina's van Google/Azure dynamische calculators zijn die niet goed te scrapen zijn.
Behandel dit als eerste inschatting, niet als leverancierscontract — controleer bij een
definitieve keuze de actuele officiële pricing.

## Niet onderzocht / open voor een vervolg-spike

- **Live/streaming transcriptie** (tekst tonen terwijl je nog spreekt) is niet gebouwd,
  wel uitgezocht: kan met zowel Deepgram (WebSocket naar `/v1/listen`, kortlevend token via
  `/auth/grant`) als Azure (Speech SDK, `recognizing`/`recognized`-events, kortlevend token
  via `issueToken`). Bij Deepgram bouw je de WebSocket zelf; bij Azure delegeer je aan hun
  (forse) SDK. Dit is een aparte, substantiële klus — raakt de kern van de opname-flow in
  `ChatApp.tsx`.
- **Azure STT alsnog bruikbaar maken** zou vereisen: opnemen als WAV/PCM via Web Audio API
  (universelere fix, werkt voor elke provider die PCM verkiest) óf WebM naar Ogg remuxen
  (alleen container herverpakken, geen kant-en-klare browser-API hiervoor). Geen van beide
  is gebouwd.
- **OpenAI** (Whisper/gpt-4o-transcribe + tts-1) is alleen op prijs vergeleken, niet
  geïmplementeerd of getest — met name de TTS-stemkwaliteit voor Noors is een onbekende,
  omdat OpenAI geen toegewijde nb-NO-stem heeft zoals Google/Azure.
- **Amazon** (Polly/Transcribe) is niet meegenomen in de vergelijking.
- Chrome is nooit tegen dezelfde randgevallen getest als Safari (bijv. of Chrome's
  Opus-framing de Google-bytegrootte-limiet ooit wél raakt bij lange opnames).
