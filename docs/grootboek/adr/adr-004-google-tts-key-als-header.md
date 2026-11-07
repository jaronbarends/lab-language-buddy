# ADR-004: De Google TTS-key verhuist van de URL naar een header

- **Status:** implemented
- **Date:** 2026-10-21
- **Implementation date:** 2026-10-21
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

`src/lib/tts/google.ts` stuurt `GOOGLE_CLOUD_API_KEY` mee als de header `x-goog-api-key` in
plaats van als `?key=`-queryparameter in de URL. De andere twee TTS-providers (Azure,
ElevenLabs) gebruiken al een header; het `text:synthesize`-endpoint van Google was de enige
uitzondering.

## Waarom

Een geheim in een URL versturen is slechter dan in een header: een gelogde of opgeworpen
fetch-fout kan de request-URL bevatten, en een header komt niet zo in zo'n log terecht als een
querystring. Het was nooit een bewuste keuze (JNL-001, K6), alleen de manier waarop de aanroep
oorspronkelijk was geschreven. Voordat hij dit veranderde, testte de mens beide vormen
rechtstreeks tegen het live endpoint (`Invoke-WebRequest`, één aanroep met `?key=`, één met de
header) en kreeg op beide `200`. Daarmee is bevestigd dat het endpoint de header accepteert,
ook al documenteert de eigen REST-referentiepagina van Google voor deze methode alleen OAuth,
en in geen enkele vorm een API-key.

## Gevolgen

- Geen andere codewijzigingen: `getApiKey()` en de stemtabellen blijven onaangeroerd.
- `docs/grootboek/software-architectuur.md` § 6 is in dezelfde commit bijgewerkt.
- De regel in `docs/plan.md` die `GET .../v1/voices?key=…` noemt, betreft een ander endpoint
  (handmatige controle van stemmen) en blijft door dit besluit onaangeroerd.
- Dit is het eerste grootboekbesluit dat code veranderde en niet alleen documentatie: het sluit
  één keer de stap journaal → besluit → document → **code** van REQ-GG-09 af. De driftproef
  (REQ-GG-05) kan nu zinvol worden herhaald tegen een daadwerkelijke wijziging.
- Gecontroleerd buiten de curl-test: `npm run build` slaagde, en de mens draaide de app met
  `TTS_PROVIDER=google` van begin tot eind: de route `/api/tts` gaf via de header in
  `google.ts` echte audio terug, niet alleen een `200` op een kale synthese-aanroep.
- Bron: JNL-001, kwestie K6 (nu besloten en geboekt).
