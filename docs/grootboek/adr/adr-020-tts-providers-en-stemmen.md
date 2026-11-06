# ADR-020: TTS-providers en stemmen

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Providers.** Alle drie de providers uit de spike zijn aangesloten: Azure (de default), Google
en ElevenLabs. `TTS_PROVIDER` wordt gecontroleerd met een type
guard op `Object.hasOwn`.

**Interface.** `synthesize` neemt één object `{ text, language, gender }` en daarnaast de
`AbortSignal` van het verzoek. Elke provider neemt een `gender`. De app heeft één schakelaar,
`VOICE_GENDER` in `lib/tts/index.ts`, ingesteld op `"female"`. De route geeft die door, dus een
instelling per gebruiker wordt later een veld in het verzoek en geen wijziging in de providers.

**Stemmen.** Een stem per taal en geslacht. De stemtabellen staan binnen elke providermodule,
niet in het gedeelde taalregister.

- Azure: GA Neural-stemmen.
- Google: Chirp3-HD `Aoede` (vrouw) en `Charon` (man).
- ElevenLabs: constanten in `elevenlabs.ts` (`VOICE_IDS`, een per geslacht), geen
  omgevingsvariabele. Vrouw is Bella en man is Chris, allebei default-stemmen die het gratis
  plan kan gebruiken.

Noors is bij Azure en Google `nb-NO`.

**Validatie.** Het Google-antwoord wordt gevalideerd met zod. `TTS_CONTENT_TYPE` is de ene
definitie van het audiotype, en ElevenLabs vraagt expliciet om `output_format=mp3_44100_128`. De
client typt zijn `/api/tts`-body met `TtsRequestBody` (voor de hernoeming `TtsRequest`). De
tekst van een `/api/tts`-verzoek is begrensd op 1500 tekens.

## Waarom

**Drie providers.** Drie implementaties zetten de interface onder druk op een manier die twee
niet doen; zie de stemtabellen hieronder.

**Interface.** De spike had `nb-NO` hardgecodeerd. De taal moet de grens over, en elke provider
lost hem anders op. Het geslacht kwam er op 10-03 bij, omdat Jaron één geslacht voor alle talen
wil en beide wil kunnen testen.

**Stemtabellen binnen de provider.** Azure en Google hebben elk een stemnaam per taal nodig.
ElevenLabs' `eleven_flash_v2_5` is meertalig en neemt er geen. Een gedeelde kolom zou de private
configuratie van twee providers zetten in een tabel die de client importeert, zonder een
zinnige plek voor het derde geval.

**Stemkeuze.** De namen zijn op 10-03 gecontroleerd tegen de lijst-endpoints van beide
providers, niet uit het hoofd. Azures Dragon HD-stemmen bestaan niet voor elke taal en de
MAI-stemmen zijn in preview. Een stem-ID van ElevenLabs is geen geheim en hoort bij de andere
stemtabellen; vandaar constanten in plaats van een omgevingsvariabele.

**Type guard.** Gevonden in de review van fase 3: `in` accepteert ook namen als `constructor`,
de cast verborg dat, en het audiotype stond in een comment. De ElevenLabs-waarde is ook zijn
gedocumenteerde default, dus het gedrag verandert niet.

**Limiet van 1500 tekens.** Google begrenst een verzoek op 5.000 bytes (zijn quota-pagina; geen
aparte limiet voor Chirp 3 HD), en een typografisch teken is drie bytes in UTF-8. 2000 tekens
konden daar dus overheen. 1500 blijft onder de limiet voor elke provider; een echte AI-beurt is
veel korter.

## Voorgeschiedenis

- **Positionele argumenten.** `synthesize` kreeg op 10-03 één object plus de `AbortSignal`, in
  plaats van positionele argumenten. ElevenLabs negeert `language`, wat een ongebruikte
  parameter zou hebben opgeleverd. De signal stopt een betaalde call als de client weggaat, net
  als in de chatroute.
- **2000 tekens.** De tekstlimiet was 2000 tekens en is op 10-05 verlaagd naar 1500. Dit werd
  aangekaart door CodeRabbit op de PR.
- **Namen van de body.** Op 10-14 volgde de TTS-body de naamgeving van 10-08: `TtsRequest` werd
  `TtsRequestBody` en `TtsRequestSchema` werd `TtsRequestBodySchema`; in de `/api/tts`-route
  werd het `safeParse`-resultaat `parsedRequest` hernoemd naar `bodyParseResult`. Jaron: het is
  een request body, geen request, zoals bij `ChatRequestBody`; de routevariabele hield een
  parse-resultaat en is daarnaar genoemd. De reviewrij van fase 3 noemt nog `TtsRequest`.

Verwant: ADR-004 (Google TTS key moves from the URL to a header)
Verwant: ADR-009 (STT: providerkeuze en configuratie)

## Herkomst

- D10 (Decisions) TTS providers — All three from the spike: Azure (default), Google, ElevenLabs
- D12 (Decisions) Provider interface — `synthesize({ text, language, gender }, signal)`
- D13 (Decisions) Voice tables — Inside each provider module, not in the shared language registry
- L92 (10-03) Every provider takes a `gender` and the app has one switch, `VOICE_GENDER` in `lib/tts/index.ts`, set to `"female"`
- L93 (10-03) `synthesize` takes one object `{ text, language, gender }` plus the request's `AbortSignal`, instead of positional arguments
- L94 (10-03) Voices: one per language and gender, GA Neural for Azure, Chirp3-HD `Aoede` (female) and `Charon` (male) for Google
- L95 (10-03) The ElevenLabs voices are constants in `elevenlabs.ts` (`VOICE_IDS`, one per gender), not an environment variable
- L106 (10-05) `TTS_PROVIDER` is checked with a type guard on `Object.hasOwn`; Google's response is validated with zod
- L109 (10-05) The text of a `/api/tts` request is capped at 1500 characters, down from 2000
- L180 (10-14) The TTS body follows the 10-08 naming: `TtsRequest` is `TtsRequestBody`
