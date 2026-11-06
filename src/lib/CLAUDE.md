# State machine en providers

- **Eén session reducer** (`session-reducer.ts`). Beurtstatussen zijn een discriminated union
  die per state data meedraagt. Voeg een state toe door de union uit te breiden, niet door een
  vlag toe te voegen.
- **Providers vallen onder een registry in `index.ts`** (`tts/`, `stt/`). Een provider is één
  module; wisselen is een env var en verder niets. Een onbekende waarde gooit en noemt de
  geldige namen; er is nooit een fallback, zodat een typefout niet stilletjes een andere
  provider kiest.
- **TTS** (`TTS_PROVIDER`, server-side): elke provider geeft MP3-bytes terug. Stemtabellen
  staan in elke providermodule zelf, niet in de gedeelde taalregistry.
- **STT** (`NEXT_PUBLIC_STT_PROVIDER`, in de browser gelezen, dus het moet een `NEXT_PUBLIC_`-literal
  zijn, gelezen als `process.env.NEXT_PUBLIC_...`). Alleen live streaming. Deepgram en
  ElevenLabs worden door de browser rechtstreeks aangeroepen met een kortlevend token uit onze
  eigen route; aan onze kant is er geen WebSocket-server. Een kortlevend Deepgram-token gebruikt
  het WebSocket-subprotocol `Bearer`, niet `token`.
- **API-sleutels zijn alleen voor de server.** Zet er nooit een in een `NEXT_PUBLIC_`-variabele.
- Een nieuwe provider is pas af als hij in `.env.example`, de README-tabel en
  een record in het grootboek staat.
