# Findings: AI voice spike

Doel van de spike: browser-based speech-to-text (STT) en text-to-speech (TTS) voor een
Noors (B1) oefengesprek, met als harde eis dat het werkt in **Safari op iPhone**, niet
alleen desktop Chrome.

Huidige config (`.env.local`): `TTS_PROVIDER=azure`. `STT_PROVIDER` staat er nog in maar
heeft geen effect meer — zie "Live/interactieve variant" hieronder, STT loopt sinds de
live-variant altijd via Deepgram, hardcoded.

Providers zitten als losse modules in `src/lib/voice/`, elk met dezelfde vorm
(`synthesize(text: string): Promise<ArrayBuffer>` voor TTS, gekozen via `TTS_PROVIDER` in
`src/app/api/tts`). De vergelijkbare STT-abstractie (`transcribe(audio: Blob): Promise<string>`
per provider, gekozen via `STT_PROVIDER` in `src/app/api/stt`) is verwijderd toen STT op live
streaming overstapte — de providervergelijkingstabel hieronder blijft staan als historisch
overzicht van de batch-aanpak, maar is niet meer om te zetten via een env-var.

**Branch-structuur:** dit document leeft op `spike-ai-voice-live-stt`. De highlighting
("AI-tekst meelopend met TTS") zit ook op de onderliggende `spike-ai-voice-live`; live STT
en de opruiming van de batch-STT-code zitten alleen op `spike-ai-voice-live-stt` erbovenop.

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

## Live/interactieve variant

Uitgangspunt was: de app is strikt stapsgewijs (AI spreekt volledige tekst uit, dan klik je
op "Spreek", dan wordt je hele opname in één keer getranscribeerd). Fase 1 hieronder is
inmiddels **gebouwd**; fase 2 (continue microfoon) nog niet.

### UX-mogelijkheden, twee aparte richtingen
1. **Live weergave** (tekst tonen terwijl er nog gesproken/geluisterd wordt), met knoppen
   die blijven bestaan zoals nu — **gebouwd**:
   - AI-tekst die meeloopt met de voorlezing: gekozen voor **highlight** (geel, alle
     al-uitgesproken woorden blijven gemarkeerd — niet alleen het huidige woord), i.p.v.
     woord-voor-woord onthulling. De volledige tekst blijft dus meteen zichtbaar. Timing is
     een schatting, geen exacte data (zie "TTS-highlighting" hieronder).
   - Live, doorlopend bijgewerkte transcriptie tijdens het inspreken: grijze tekst voor
     voorlopige woorden (Deepgram's `is_final: false`), normale kleur zodra een stuk
     definitief is (`is_final: true`).
2. **Continue open microfoon** (geen "Spreek"/"Stop"-knoppen meer, mogelijk de AI kunnen
   onderbreken) — een fundamenteel ander interactiemodel, bouwt voort op (1). **Nog niet
   gebouwd**, risico's hieronder nog open.

**Voorgestelde knip, gevolgd:** (1) is gebouwd met de knoppen intact, wat de twee
onbeproefde risico's van (2) hieronder vermeed — elke beurt werd nog steeds door een klik
voorafgegaan. Een spike naar (2) zou een uitbreiding zijn van dezelfde WebSocket-
infrastructuur (andere trigger: VAD-events i.p.v. een stopknop), geen nieuwe opzet — dus
geen weggegooid werk.

### Architectuur voor live STT: browser praat rechtstreeks met de provider
Twee opties onderzocht voor hoe de browser authenticeert zonder de vaste API-key bloot te
geven:
- **A. Browser ↔ provider direct** (aanbevolen): onze server mint een kortlevend token via
  een gewone REST-call (Deepgram: `/auth/grant`; Azure: `issueToken`, 10 min geldig), de
  browser opent daarmee zelf de WebSocket. Bij Deepgram: `new WebSocket(url, ['token', <token>])`
  (browsers kunnen geen `Authorization`-header op een WebSocket zetten, vandaar het
  subprotocol-trucje). Vereist aan onze kant alleen één extra, gewone API-route
  (token minten) — geen WebSocket-server nodig, lokaal niet en op Vercel niet.
- **B. Server als tussenpersoon** (browser → eigen server → provider): vereist dat onze
  server zelf een WebSocket host. **Niet gekozen.**

**Hosting-implicatie (Vercel):** met optie A is er geen enkele wijziging nodig in hoe we
hosten — de token-route is een gewone serverless function, en de daadwerkelijke streaming
loopt buiten Vercel om, rechtstreeks tussen browser en provider. Optie B zou wél
infrastructuur hebben gekost: Vercel heeft pas sinds juni 2026 native WebSocket-ondersteuning
(beta), met reële beperkingen (connecties "vastgepind" aan één functie-instantie, geen
ingebouwde fan-out tussen instanties, Redis aanbevolen voor gedeelde state). Dat is precies
waarom optie A de juiste keuze is voor deze schaal.

Voor Deepgram specifiek geldt: STT via streaming werkt op **hetzelfde nova-2-model** met
dezelfde taalondersteuning als de pre-recorded variant die nu al werkt — geen verrassing
daar te verwachten.

**Getest (los scriptje, buiten de app om):** MP3-audio in 5 willekeurige brokjes over de
WebSocket gestreamd naar `wss://api.deepgram.com/v1/listen?model=nova-2&language=no&interim_results=true`,
zonder `encoding`/`sample_rate` mee te geven — Deepgram detecteert het containerformat zelf,
precies zoals de batch-endpoint al doet, en levert correcte interim- (`is_final: false`) en
finale (`is_final: true`) transcripten. Sterke aanwijzing dat WebM/Opus (het daadwerkelijke
`MediaRecorder`-format) hetzelfde zal doen, maar dat is hier niet letterlijk getest — dit
scriptje kon geen echte WebM/Opus-audio genereren zonder browser of ffmpeg (geen van beide
beschikbaar in deze omgeving). Bij de browserintegratie alsnog met echte MediaRecorder-output
verifiëren.

**Blocker gevonden en opgelost: `DEEPGRAM_API_KEY` had geen "Member"-rechten.** Een
`POST /v1/auth/grant` gaf `403 FORBIDDEN: Insufficient permissions` met de oorspronkelijke
key — Deepgram vereist minimaal "Member"-rechten op de key voor deze endpoint. Opgelost door
een nieuwe key met Member-rol aan te maken (nu in `.env.local`).

**Tweede valkuil, stil-falend zoals eerdere bugs in deze spike: JWT-tokens hebben `Bearer` nodig, niet `Token`.**
Met een geldig gemint token gaf `wss://api.deepgram.com/v1/listen` via
`Sec-WebSocket-Protocol: ['token', <jwt>]` (het schema dat wél werkt voor de permanente
API-key) een lege, contentloze `401 INVALID_AUTH` — en met het token als `access_token`
query-param (Deepgram's eigen docs suggereren dit als alternatief) ook gewoon `401
INVALID_AUTH`. De juiste vorm, bevestigd door Deepgram-staff op GitHub (discussion #1470) en
hier getest: `Sec-WebSocket-Protocol: ['Bearer', <jwt>]`. Permanente API-key → `token`-schema,
kortlevend JWT-token → `Bearer`-schema — twee verschillende schema's voor twee soorten
credentials op dezelfde header.

**Volledige flow end-to-end bevestigd** (los scriptje, `ws`-package, geen UI): nieuwe
Member-key → `/v1/auth/grant` → WebSocket met `Bearer`-subprotocol → MP3-audio in brokjes
zonder `encoding`/`sample_rate` → correcte interim- én finale transcripten terug.

### TTS-highlighting: provider bepaalt of dit via een simpele REST-call kan
Om AI-tekst te laten meelopen met de voorlezing, moet je weten op welk audio-tijdstip elk
woord valt. Per huidige/overwogen TTS-provider:

| Provider | Woord-timing via REST? | Bevinding |
|---|---|---|
| **ElevenLabs** | ✅ Bevestigd | `/v1/text-to-speech/{voice_id}/with-timestamps` geeft per-karakter start/eind-tijden terug in dezelfde call — door ElevenLabs zelf genoemd als use-case ("word-highlighting, reading trainers"). |
| **Google Chirp3-HD** | ❌ Bevestigd: nee | Getest: `nb-NO-Chirp3-HD-Achernar` met `<mark>` + `enableTimePointing: ["SSML_MARK"]` geeft **HTTP 200, audio, maar een lege `timepoints`-array** — geen foutmelding, de tag wordt stil genegeerd. Klopt met de docs (Chirp3-HD ondersteunt SSML voor synchrone requests, maar alleen `<speak>`, `<say-as>`, `<p>`, `<s>`, `<phoneme>`, `<sub>`, `<break>`, `<audio>`, `<prosody>`, `<voice>` — `<mark>` zit er niet bij). |
| **Google WaveNet** | ✅ Bevestigd | Getest: `nb-NO-Wavenet-E` met dezelfde SSML/`<mark>`-call geeft wél gevulde `timepoints` terug (4 marks, tijden tussen 0,20s–1,32s). Standard/WaveNet/Neural2-tiers ondersteunen `<mark>`, Chirp3-HD niet — dat is de knip. Stemkwaliteit is wel duidelijk ouder/minder natuurlijk dan Chirp3-HD. |
| **Azure (huidige TTS-keuze)** | ❌ Nee | Word-boundary timing bestaat alleen als event in de Speech SDK, niet in de REST-call die we nu gebruiken. Zou de hele SDK erbij vereisen. |
| **Deepgram** | n.v.t. | Geen Noorse TTS-stem, ongeacht streaming vs. batch — de taalbeperking zit aan het stemmodel (Aura) vast, niet aan de bezorgmethode. Bevestigd: streaming- en pre-recorded-TTS-endpoints gebruiken dezelfde modelnamen/taalondersteuning. |

**Beslissing gemaakt: benaderde/geschatte highlighting**, niet WaveNet of ElevenLabs. Reden:
de huidige TTS-provider blijft ongemoeid — geen providerwissel puur voor deze feature.
Geïmplementeerd in `src/lib/textHighlight.ts`: audioduur proportioneel verdeeld over de
tekens per woord (`estimateWordTimings`), dan tijdens afspelen `audio.currentTime`
vergeleken met die geschatte starttijden (`countSpokenWords`) om bij te houden hoeveel
woorden "gehad" zijn. Geaccepteerde beperking: geen rekening met pauzes na leestekens of met
de echte uitspraaklengte per woord — bij korte functiewoorden loopt de highlight merkbaar
voor of achter op wat je hoort. Voor nu goed genoeg bevonden na handmatig testen; WaveNet/
ElevenLabs blijven de opties mocht er ooit wél exacte timing nodig zijn.

### Gevonden tijdens het bouwen: stale-closure bug bij turn-tracking
Eerste versie van de highlighting trackte welke beurt sprak via een array-index
(`turns.length` op het moment van aanroepen). Bij een AI-antwoord ná een user-beurt gaf dat
een off-by-one: de highlight verscheen op de zojuist toegevoegde user-tekst in plaats van de
nieuwe AI-tekst. Oorzaak: `turns` in de closure van `requestAiTurn` was nog de state van vóór
de `setTurns`-call die de user-beurt toevoegde — React batcht die update, de closure zag hem
nog niet. Fix: elke beurt een eigen `id` geven (`crypto.randomUUID()`) en daarop matchen
i.p.v. op index — verwijdert de race volledig, ongeacht state-batching-timing.

### Continue microfoon: twee onbeproefde risico's, eerst apart te testen
- **Audio-unlock over de hele sessie.** De huidige Safari-fix ontgrendelt het gedeelde
  `<audio>`-element bij *elke klik* vlak vóór het afspelen. Zonder knoppen tussen de beurten
  is er nog maar één gesture in de hele sessie (de allereerste tik). Of die ene ontgrendeling
  blijft gelden voor alle volgende AI-antwoorden, zonder nieuwe klik: **niet getest** —
  direct het risico dat de net opgeloste Safari-bug terugkomt.
- **Echo bij onderbreken (barge-in).** Als de microfoon openblijft terwijl `<audio>` de
  AI-stem afspeelt (via de telefoonspeaker, niet een koptelefoon), kan de microfoon de eigen
  AI-stem oppikken en transcriberen alsof de gebruiker het zei. `getUserMedia`'s
  `echoCancellation: true` is ontworpen voor WebRTC-gesprekken tussen twee partijen, niet
  expliciet voor "eigen `<audio>`-element speelt af terwijl eigen microfoon luistert" op
  dezelfde pagina. Werkt dit op Safari/iPhone goed genoeg: **niet getest, niet aannemen**
  gezien de eerdere Safari-verrassingen in deze spike. Veiligere eerste stap zonder dit
  risico: microfoon uit zolang de AI spreekt (geen echte barge-in), knoppen wel weg.
- Voice activity detection zelf kan **provider-side** (Deepgram's eigen
  `speech_final`/`UtteranceEnd`-events, hergebruikt dezelfde WebSocket) of **client-side**
  (zelf geluidsniveau meten via Web Audio API) — provider-side is minder eigen code.

## Niet onderzocht / open voor een vervolg-spike

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
