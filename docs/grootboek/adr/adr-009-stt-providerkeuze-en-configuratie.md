# ADR-009: STT: providerkeuze en configuratie

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Spraakherkenning (STT) is een providerkeuze, net als TTS. De native Web Speech API is de default;
Deepgram `nova-2` (live streaming) en ElevenLabs Scribe v2 Realtime zijn de alternatieven. Er is
geen automatische fallback.

- De keuze is alleen een env var, niet in de UI: de gebruiker hoeft hem niet te kunnen kiezen.
- De env var heet `NEXT_PUBLIC_STT_PROVIDER`. De waarden zijn `native`, `deepgram` en `elevenlabs`
  (naar de leverancier, zoals `deepgram` en `TTS_PROVIDER=elevenlabs`, niet `scribe`).
- Leeg of niet gezet is `native`. Een onbekende waarde gooit een fout bij het laden van de pagina,
  met de geldige namen erin.
- Geen automatische fallback naar Deepgram als de browser geen spraakherkenning heeft (Firefox):
  voor nu niet gewenst. Zo'n browser kan met de native provider simpelweg niet luisteren.
- Native blijft de default, ook na de iPhone-problemen met de native provider, omdat Jaron de
  Noorse transcriptie ervan beter vindt dan die van Deepgram. ElevenLabs Scribe veranderde de
  default niet.
- In de code heet het begrip "provider", niet "engine": `PROVIDER_START_FUNCTIONS`, `ProviderName`,
  `DEFAULT_PROVIDER` en `isProviderName` in `src/lib/stt/index.ts`. Waar een zin de module bedoelt
  die het werk doet en niet de leverancier, zegt de code "the provider's engine" of "the native
  engine"; dat is bewust.
- De ontwikkelomgeving (`.env.local`) staat weer op `native`, als stand van 10-14.
- Gelijke dingen hebben in beide providers dezelfde naam: `TOKEN_URL` en `TokenResponseSchema` in
  de token-routes, `MessageSchema`, `parseMessage` en `startStreamingAudio` in `deepgram.ts` en
  `elevenlabs.ts`, en `ELEVENLABS_LISTEN_URL` en `ELEVENLABS_MODEL` naar de leverancier, zoals
  `DEEPGRAM_LISTEN_URL`. De Deepgram-tokenroute is verplaatst van `/api/stt/token` naar
  `/api/stt/deepgram-token`.

## Waarom

**Providerkeuze.** De spike van Jaron (`stt-compare`-pagina, resultaten in
`spikes/ai-voice-demo/findings.md`) draaide beide engines tegelijk op dezelfde microfoon van zijn
iPhone: de native engine leek iets beter, zonder wachttijd voor het starten van de microfoon. Zijn
Noorse test in Chrome desktop: Deepgram bleef Noors maar maakte eigen fouten (*språkaktig tekst*,
*bedre sak* voor *språk til tekst*, *bedre sagt*); de native engine had die goed maar dwaalde af
naar het Zweeds (*ska*, *vilken*, *funkar*, *bättre*, *Jag*). Op de iPhone niet gezien. Eén
spreker, één zin: een indruk en geen meting.

Native blijft de default omdat het Jarons oordeel is, niet een meting: het bewijs is die spike. Deepgram
blijft het alternatief en vermijdt de twee iPhone-problemen zonder mitigatie.

ElevenLabs Scribe is door Jaron in de spike beoordeeld (`/stt-compare`, "Scribe v2 Realtime") en
beter bevonden dan Deepgram en de native engine, in Chrome desktop en op een iPhone (iOS 26.6.2).
In de iPhone-beurttest gaf het woorden in beide beurten in 11 van 11 runs, met hetzelfde volume in
elke beurt, waar de native engine in beurt 2 faalde. Dat is een spike met één spreker en een vaste
zin, geen foutpercentage, en de spike heeft geen foutpaden. Streaming kost ~11% meer dan Deepgram
nova-2 ($0,39 tegen $0,35 per uur). Of de default moest veranderen is gevraagd en met nee
beantwoord, voor nu: de default van de eerste keuze rustte op een indruk, deze op één spike, dus
veranderen is een apart besluit.

**Env var.** Er is geen reden om de keuze aan de gebruiker aan te bieden. De keuze wordt in de
browser gemaakt, waar alleen `NEXT_PUBLIC_`-variabelen zichtbaar zijn, anders dan de server-side
`TTS_PROVIDER`; hetzelfde voorvoegsel als `NEXT_PUBLIC_USE_MOCK_CHAT`. De naam was een voorstel van
de agent en is niet besproken. De waarde `elevenlabs` is eveneens een voorstel van de agent, door
Jaron geaccepteerd.

**Fout bij onbekende waarde.** Jaron zei eerst dat een onbekende waarde de native engine kon
gebruiken, en koos daarna de fout. Een typefout zou de app anders op een andere engine laten dan
degene waar om gevraagd is, wat `getTtsProvider` ook voorkomt.

**Geen fallback.** Niet gewenst voor nu; zonder spraakherkenning in de browser kan de native
provider simpelweg niet luisteren.

**"Provider" in plaats van "engine".** De code gebruikte beide woorden voor hetzelfde: de env var is
`NEXT_PUBLIC_STT_PROVIDER` (naar `TTS_PROVIDER`), de code zei "engine". Jaron koos één term boven
het wijzigen van de env var, wat `.env.local`, de documentatie en de foutmelding had geraakt.
"Provider" is niet exact voor `native`, dat de browser is en geen leverancier; geaccepteerd. De
eerdere logrijen en de open vraag over de iPhone-problemen houden het woord "engine": ze leggen vast
wat toen geschreven werd. De eigen rijen van de agent van 10-16 en 10-19 houden het woord "engine"
ook.

**Namen.** Jarons punt: een naam beschrijft wat iets doet of van wie het is, niet een product, en
dezelfde functie van twee providers moet hetzelfde lezen. `/api/stt/token` was de enige
asymmetrische naam, generiek naast `elevenlabs-token` (zie ADR-012, ElevenLabs Scribe-provider). `startRecording` in
`deepgram.ts` (zie ADR-011, Deepgram-provider) werd `startStreamingAudio`, omdat er in het
ElevenLabs-pad geen opname is (een AudioWorklet voedt de socket, zie ADR-012) en de nieuwe naam
voor beide klopt. Alleen hernoemingen, maar ze raken `deepgram.ts` en zijn route, die eerder op de
iPhone waren gecontroleerd. De herhaalde `LIVE_CONNECT_TIMEOUT_MS`, `MIC_STOPPED_MESSAGE` en
`AccessTokenSchema` in beide providers blijven staan voor een latere stap, de gedeelde
levenscyclus-helper uit de review.

## Voorgeschiedenis

1. **Alleen Deepgram, vaste randvoorwaarde "never the Web Speech API".** Deepgram was eerst de enige
   omdat de spike de rest uitsloot: Google Cloud STT brak op Safari-opnames langer dan ~17,5 s,
   Azure STT kan WebM/Opus niet lezen en faalt stil, ElevenLabs Scribe werkte maar waarom het niet is
   overgenomen voor live streaming is niet vastgelegd, en Deepgram was het goedkoopst, hield stand op
   Safari en werd beter geacht dan Google (`findings.md`). Live streaming bond de app daarna aan
   Deepgrams WebSocket.
2. **Native default met Deepgram als alternatief.** De vergelijking in de spike veranderde de
   default: de vaste randvoorwaarde "never the Web Speech API" is ingehaald, STT werd een
   providerkeuze zoals TTS. Dezelfde dag gebouwd. Later kwam ElevenLabs Scribe als derde provider.
3. **Ontwikkelomgeving tijdelijk op Deepgram.** De `.env.local` stond een dag op
   `NEXT_PUBLIC_STT_PROVIDER=deepgram`, zodat desktop Chrome dezelfde engine draaide als de iPhone;
   de default in de code (`native`) bleef ongewijzigd. Reden: op een iPhone maakt de native engine de
   spraak van de AI zachter zodra de microfoon is gebruikt en neemt hij niets op in de tweede
   gebruikersbeurt; Deepgram liet geen volumeverschil zien en de tweede-beurtfout is alleen voor
   native gemeld. Jaron ontwikkelt vooral in Chrome en wil daar dezelfde engine zien.
4. **Terug op native.** Met de vroege pauze en de vastgehouden microfoonstream zijn de twee
   problemen gemitigeerd. Jaron controleerde dit op een iPhone met de opgeschoonde code (geen
   debuglogging, geen vaste testzin): de native engine herkende in beide beurten terwijl de AI
   uitsprak, de AI was in beurt 2 even hard als in beurt 1 en de microfoonprompt kwam één keer, zoals eerder. Eén
   sessie; de mislukte eerste beurten die nu en dan in de runs voorkwamen zijn niet uitgesloten.
   De mitigaties staan in ADR-010 (Native engine op iPhone: herstart en twee mitigaties).

## Gevolgen

- `src/lib/stt/index.ts` bevat `getConfiguredStartFunction()`, dat `NEXT_PUBLIC_STT_PROVIDER` leest
  als letterlijke property zodat Next hem bij de build kan inlinen. Gecontroleerd tegen de code:
  `native` is `DEFAULT_PROVIDER`, een onbekende waarde gooit met de geldige namen.
- Een wijziging van de variabele vraagt een herstart, want `NEXT_PUBLIC_`-waarden worden bij de build
  ingelijnd (uit de code, niet uit het plan).
- De ontwikkelomgeving (`.env.local`) staat weer op `native` (stand van 10-14).
- De providers zelf: ADR-011 (Deepgram-provider) en ADR-012 (ElevenLabs Scribe-provider).
