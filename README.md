# Language buddy

A web app for practising spoken conversation in a foreign language against an AI
persona. You pick a language and a CEFR level, hold a multi-turn spoken conversation,
and get feedback on how you did.

## Why this repo exists

**The point of this project is to experiment with having AI generate the vast majority
of the code.** The app itself is real and the requirements are genuine, but the reason
for building it here — rather than in the existing Language Buddy codebase — is to see
what comes out when the architecture and implementation are left to an AI agent working
from a written brief, instead of being specified up front.

So a few things are deliberate:

- **This is a from-scratch rebuild.** No code is carried over from the existing Language
  Buddy app. The structure, state model, styling approach and component boundaries are
  the agent's own choices, not a port of decisions already made elsewhere.
- **Advanced patterns aren't held back for teachability.** Learning the stack is
  explicitly not a goal of this repo.
- **The written brief and the review conversation are the real input.** Where a decision
  was made by the agent rather than specified, the code says so in a comment — including
  where it diverges from the visual reference on purpose.

What's being tested is the *workflow*: how well a fairly involved app can be scoped,
staged and reviewed when someone else writes the code. Judge the repo on that as much as
on the app.

## Stack and fixed constraints

These were specified up front and are not open questions:

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Conversation AI | Google Gemini (`@google/genai`) |
| Speech-to-text | Deepgram `nova-2`, **live streaming** — not record-then-transcribe |
| Text-to-speech | Behind a provider abstraction, selected by env var. Azure AI Speech is the default; Google and ElevenLabs are also to be implemented, so the abstraction is actually exercised |
| Live STT architecture | Browser connects to Deepgram's WebSocket **directly**, with a short-lived token minted by one of our own REST routes — no WebSocket server on our side |
| Persistence | None. Session state is in memory |

**Safari on iPhone is a hard requirement, not a nice-to-have.** An earlier spike turned up
several Safari-only failures that never show up in desktop Chrome. Anything touching audio,
recording or layout needs testing on a real device, not just reasoning from the spec.

Everything else — styling approach, state management, component structure — was the
agent's call.

## Repository layout

```
.
├── src/                    the app
│   ├── app/                routes, layout, global CSS
│   ├── components/         screens and UI, CSS Modules alongside
│   ├── hooks/              session context, effect drivers
│   └── lib/                state machine, registries, pure helpers
├── spikes/ai-voice-demo/   reference spike — separate app, excluded from lint/typecheck
└── resources/              reference screenshots
```

`spikes/ai-voice-demo/findings.md` is the most valuable document in the repo. It records
the provider comparison and four non-obvious bugs already paid for: Safari's recording
format, Safari's audio-playback unlock, Deepgram's short-lived tokens needing a different
WebSocket auth scheme than the permanent API key, and a stale-closure bug in turn
tracking. Read it before touching the voice code.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000. If that port is already taken — the spike in
`spikes/ai-voice-demo` is a separate app with its own dev server — Next picks the next
free one and prints it; use that port below too.

### Environment variables

Not needed yet — stage 1 makes no network calls. From stage 2 onward, create `.env.local`
in the repo root:

```
GEMINI_API_KEY=
DEEPGRAM_API_KEY=          # needs a Member-role key; a viewer key gets 403 on /auth/grant
TTS_PROVIDER=azure         # azure | google | elevenlabs
AZURE_SPEECH_API_KEY=
AZURE_SPEECH_REGION=
GOOGLE_CLOUD_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

### Testing on an iPhone

`getUserMedia` refuses to run without HTTPS, so a tunnel is required:

```bash
npx ngrok http 3000
```

Open the HTTPS URL on the phone. `next.config.ts` already allows `*.ngrok-free.app` as a
dev origin; without that, Next blocks the request.

### Checks

```bash
npm run lint
npx next typegen && npx tsc --noEmit    # typegen first — v16 generates route types
npm run build
```

## Build stages

Built in reviewable stages, one branch each, with a check-in between.

- [x] **1 — Static screens, mocked data.** Every screen and turn state reachable with no
      network, API keys or microphone. A mock driver dispatches the same actions the real
      ones will; a dev-only state stepper jumps to any turn state.
- [ ] **2 — Gemini conversation.** `/api/chat`, multi-turn via `previous_interaction_id`.
- [ ] **3 — Deepgram live STT and TTS.** Live interim/final transcript, spoken replies,
      word highlighting synced to playback.
- [ ] **4 — Evaluation.** Design undecided on purpose — see below.

### Out of scope

Continuous / open-microphone mode, with no push-to-talk and the ability to interrupt the
AI mid-sentence. It exists as an unfinished idea in the spike with two unresolved risks
(whether Safari's audio unlock survives a whole session without repeated gestures, and
echo when the mic stays open while AI audio plays through the phone speaker). Not proven,
not in scope.

### Open decision: when evaluation happens

Deliberately not decided. Three options, with real consequences for the chat schema and
the control bar:

1. **After each user turn** — what the spike does.
2. **On demand**, via an Evaluate button — what the reference screenshots show.
3. **Once at the end of a session** — what the current production app does.

Stage 2's chat response is `{ reply }` only, with no per-turn `correction` field,
specifically so this stays open rather than being settled by accident.
