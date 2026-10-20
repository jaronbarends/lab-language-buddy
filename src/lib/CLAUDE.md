# State machine and providers

- **One session reducer** (`session-reducer.ts`). Turn states are a discriminated union
  that carries per-state data. Add a state by extending the union, not by adding a flag.
- **Providers sit behind a registry in `index.ts`** (`tts/`, `stt/`). A provider is one
  module; switching is an env var and nothing else. An unknown value throws and lists the
  valid names; it never falls back, so a typo cannot quietly select another provider.
- **TTS** (`TTS_PROVIDER`, server-side): every provider returns MP3 bytes. Voice tables
  live inside each provider module, not in the shared language registry.
- **STT** (`NEXT_PUBLIC_STT_PROVIDER`, read in the browser, so it must be a `NEXT_PUBLIC_`
  literal read as `process.env.NEXT_PUBLIC_...`). Live streaming only. Deepgram and
  ElevenLabs are called by the browser directly with a short-lived token from our own
  route; there is no WebSocket server on our side. A short-lived Deepgram token uses the
  `Bearer` WebSocket subprotocol, not `token`.
- **API keys are server-only.** Never put one in a `NEXT_PUBLIC_` variable.
- A new provider is not done until it is in `.env.example`, the README table and
  `docs/plan.md`.
