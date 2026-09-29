# Language buddy — plan and decision record

**This is a living document.** It is updated in the same commit as the code change that
invalidates it, so the plan and the codebase never disagree for longer than one commit.
The decision log at the bottom records everything that changed after the original plan was
approved.

The first version was written and approved on 2026-09-23, before any code existed. It
lived outside the repository until 2026-09-25, which meant changes to it were invisible to
review and to git. That is why it is here now.

---

## Context

Language buddy is a web app for practising spoken conversation in a foreign language
against an AI persona, with structured feedback. This is a **from-scratch rebuild** — no
existing Language Buddy code is reused, and the architecture is the agent's own, not a
port. The wider point of the repo is the experiment described in the README: seeing what
comes out when architecture and implementation are left to an AI agent working from a
written brief.

The only thing predating this build is `spikes/ai-voice-demo`: a merged spike that proved
the risky parts work on Safari/iPhone. It is reference for **the approach**, not code to
copy — a single 413-line `ChatApp.tsx` with inline styles, hardcoded Norwegian/B1 and
Dutch UI strings. Its `findings.md` is the valuable part: four non-obvious bugs already
paid for (Safari recording format, Safari audio-unlock, Deepgram JWTs needing the `Bearer`
subprotocol rather than `token`, and a stale-closure bug in turn tracking).

---

## Fixed constraints

Specified up front, not open questions: Next.js + TypeScript; Google Gemini for the
conversation; Deepgram `nova-2` **live streaming** STT (never Google Cloud STT, never the
Web Speech API); TTS behind a provider abstraction with Azure as default and Google and
ElevenLabs also implemented; the browser connecting to Deepgram **directly** with a
short-lived token from our own REST route, so there is no WebSocket server on our side;
Safari on iPhone as a hard requirement; no persistence.

---

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Styling | CSS Modules + design tokens in `globals.css` | The design is a small bespoke system (pill buttons, two bubble variants, one accent colour). Tailwind's payoff is class reuse across a large surface; here it would mostly add a build step and bury the iOS-specific CSS in arbitrary-value escapes. |
| State | One `useReducer` session machine + a context, side effects in hooks | The whole app is one session. A store library buys nothing, and a reducer makes illegal states unrepresentable. |
| Turn states | A discriminated union carrying per-state data | `listening` carries the transcript, `aiSpeaking` the turn id and word count, `editing` the pre-edit text. "Recording while the AI speaks" is not a bug you can write. |
| Turn identity | `crypto.randomUUID()` per turn, never an array index | This is the stale-closure off-by-one from `findings.md`, made structurally impossible rather than patched. |
| Conversation history | Gemini `previous_interaction_id` chaining | History lives server-side at Google; we send only the new utterance. The client keeps its own array purely for rendering. |
| Chat response shape in stage 2 | `{ reply }` only — no per-turn `correction` | Whether feedback is per-turn is exactly the stage 4 question. Shipping stage 2 without it keeps that open instead of defaulting by accident. |
| TTS providers | All three from the spike: Azure (default), Google, ElevenLabs | Three implementations stress the interface in a way two don't — see the voice-table row. |
| Provider interface | `synthesize(text, language)` | The spike hardcoded `nb-NO`. Language has to cross the boundary, and each provider resolves it differently. |
| Voice tables | Inside each provider module, not in the shared language registry | Azure and Google each need a per-language voice name; ElevenLabs' `eleven_flash_v2_5` is multilingual and takes none. A shared column would put two providers' private config in a table the client imports, with nowhere sensible for the third case. |
| Flags | `flag-icons`, importing only the six SVGs needed | Emoji flags render as bare country letters on Windows. Importing the package stylesheet would pull in all ~260 flags. |
| Errors | Recoverable — back to `awaitingUser` | The spike dead-ended and told the user to reload, throwing away the conversation over what is usually a blip. |
| No test suite | Manual verification only | Nothing in the brief asks for tests, and the risky behaviour is device-specific. See open questions. |

---

## State model

Two nested machines. The outer one is the screen; the inner one is the turn.

```
SessionPhase:   setup ──START──▶ conversation
                  ▲                    │
                  └──── SESSION_ENDED ─┘
```

There is no third phase. Ending a session drops straight back to setup, carrying the
previous `SessionConfig` forward as the new defaults so a repeat session doesn't mean
re-picking the same language. The turns are discarded.

`conversation` carries a `TurnState`:

```
  awaitingUser ──REPLY──▶ listening ──┐
       ▲                      │       │
       │                      │ EDIT  │ CANCEL
       │                      ▼       │
       │                   editing ◀──┼── EDIT ── reviewing
       │                      │       │              │
       │              CANCEL EDIT     │              │
       │                      └──────▶┘              │
       │                                             │
       │        ┌──── SEND (from any of the three) ──┘
       │        ▼
       │   aiThinking ──▶ aiSpeaking ──(audio ended)──┐
       │        │                                     │
       │     (network)                                │
       │        ▼                                     │
       └──── error ──(dismiss)──▶ awaitingUser ◀──────┘
```

- **`awaitingUser`** — one button, enabled. Labelled *Start conversation* when there are
  no turns yet, *Reply* otherwise.
- **`listening`** — mic open, live transcript rendering `{ finalized, interim }`, with a
  dot marking that the microphone is live.
- **`reviewing`** — recording stopped, text settled, not yet sent.
- **`editing`** — the text in a `<textarea>`. Carries `draftBeforeEdit` so *Cancel edit*
  can restore it; that is why it is its own state rather than a flag on `reviewing`.
- **`aiThinking`** — `/api/chat` in flight; typing-dots bubble.
- **`aiSpeaking`** — TTS audio playing, words progressively highlighted in the AI bubble.
- **`error`** — recoverable; returns to `awaitingUser`.

**Listening, reviewing and editing are one continuous act of composing a turn**, so they
share a single set of controls: Send (primary), Edit (secondary), Cancel (secondary). Only
the text above the buttons changes. Consequences:

- **There is no Stop button.** Send, Edit and Cancel each end recording on their way to
  somewhere useful, which left Stop with nothing of its own to do.
- **End session is absent from these three states.** A turn in progress has to be sent or
  cancelled first.
- **Cancel means two different things by position** — back out of the edit, or back out of
  the whole turn — and is labelled *Cancel edit* or *Cancel* accordingly.

**Entry depends on `starter`:** `ai` → `START` lands in `aiThinking`; `user` → lands in
`awaitingUser`. Both are reached from the same "Start chat" click, which is what lets the
Safari audio unlock in that click cover the AI's first spoken reply.

**The reducer is pure.** Audio playback, `getUserMedia`, the WebSocket and the fetches all
live in hooks that dispatch into it. Transitions that don't apply to the current state are
ignored rather than throwing — a late `TRANSCRIPT_UPDATED` after the socket closed is
normal, not a crash.

---

## Config flow

```
SetupScreen  (seeded from lastConfig ?? DEFAULT_SESSION_CONFIG)
   └─▶ SessionConfig { language, level, starter }
          └─▶ dispatch({ type: 'START', config })   — frozen for the session
                 ├─▶ POST /api/chat  { language, level, input, previousInteractionId }
                 ├─▶ POST /api/tts   { text, language }
                 └─▶ POST /api/stt/token  → { accessToken }
                        client opens wss://api.deepgram.com/v1/listen
                          ?model=nova-2&language=<registry code>&interim_results=true
```

`SessionConfig` is never mutated mid-session. On `SESSION_ENDED` it is stored as
`lastConfig` on the setup phase and becomes the next session's defaults — in memory only,
so a page reload starts from the defaults again.

---

## File layout

```
.
├── README.md                     front door
├── docs/plan.md                  this file
├── next.config.ts                allowedDevOrigins for ngrok
├── tsconfig.json                 exclude: ["node_modules", "spikes"]
├── eslint.config.mjs             globalIgnores(["spikes/**"])
├── resources/screenshots-reference/
├── spikes/ai-voice-demo/         reference spike, untouched
└── src/
    ├── app/                      layout.tsx, page.tsx, globals.css
    ├── components/
    │   ├── language-buddy.tsx    owns the reducer, renders by phase
    │   ├── setup-screen/         setup-screen, language-picker, level-select, starter-toggle
    │   ├── conversation/         conversation-screen, conversation-thread, turn-bubble,
    │   │                         highlighted-text, live-transcript, thinking-bubble,
    │   │                         draft-review (DraftBubble + DraftEditor),
    │   │                         conversation-controls, bubble.module.css
    │   ├── dev/state-stepper.tsx development-only turn-state jumper
    │   └── ui/                   button, icons, flag-icon
    ├── hooks/
    │   ├── use-session.ts        context + narrowing helpers
    │   └── use-mock-driver.ts    STAGE 1 ONLY — deleted in stage 3
    └── lib/
        ├── session-reducer.ts    the state machine
        ├── languages.ts          provider-neutral language registry
        ├── cefr.ts               A1–C2 + labels
        ├── word-timing.ts        estimateWordTimings / countSpokenWords
        └── mock-conversation.ts  STAGE 1 ONLY — canned content per language
```

Still to come: `src/app/api/{chat,tts,stt/token}/route.ts`, `src/lib/prompt.ts`,
`src/lib/chat-schema.ts`, `src/lib/tts/{types,index,azure,google,elevenlabs}.ts`,
`src/hooks/{use-audio-playback,use-live-transcription}.ts`, and `.env.local` at the root.

**The language registry holds only provider-neutral data** — `code`, `label`,
`promptName`, `deepgram`. Flags live in `flag-icon.tsx` and voices in each TTS provider,
because a language code is not a country code and not a voice name.

---

## Reused from the spike (adapted, not copied)

- `textHighlight.ts` → `word-timing.ts`. The two pure functions come across largely as-is
  with their explanatory comments.
- `voice/deepgram.ts` `mintLiveToken()` — the `/v1/auth/grant` call plus its comments about
  the Member-role requirement and the `Bearer`-vs-`token` subprotocol.
- `voice/azure.ts` `synthesize()` — SSML construction and XML escaping, with the hardcoded
  `nb-NO` voice replaced by a per-language lookup.
- `voice/google.ts` `synthesize()` — the `text:synthesize` call and its base64 →
  `ArrayBuffer` slice, which is easy to get subtly wrong.
- `voice/elevenlabs.ts` `synthesize()` — as-is apart from the signature; it ignores the
  `language` argument by design.
- `next.config.ts` `allowedDevOrigins: ['*.ngrok-free.app']`.
- The `ChatApp.tsx` Safari comments travel with the code they explain.

Not reused: the component structure, all styling, the Dutch strings, the
hardcoded-Norwegian prompt, the `correction` field.

---

## Safari/iPhone requirements

Built in, not retrofitted.

1. **Never hardcode the recording mimeType.** Request `audio/webm;codecs=opus`, fall back
   to the browser default when `MediaRecorder.isTypeSupported` says no, and read back the
   real `mediaRecorder.mimeType` after `start()`.
2. **Audio unlock inside every gesture.** One reused `HTMLAudioElement`, `src` set to a
   ~2 ms silent WAV data-URI and `.play()`ed **synchronously before any `await`** in each
   click handler that can lead to playback: *Start chat*, *Send*, and any replay control.
   The AI reply plays several awaited fetches later, by which time the gesture has expired.
3. **Layout for iOS chrome.** A flex column at `100dvh` rather than a `position: fixed`
   bar — a fixed element drifts when the keyboard opens and the URL bar collapses — plus
   `viewport-fit=cover` and `env(safe-area-inset-bottom)`.
4. **A 16px floor on every focusable control**, or iOS zooms the viewport on focus.
5. **Device testing is part of each stage, not a final pass.** `next dev` + an ngrok tunnel
   (HTTPS is required for `getUserMedia` at all).

### Recording format: resolved, not a risk

Safari's fragmented-MP4 output was initially flagged as the open unknown, because
`findings.md` documents the mimeType problem only in the *batch* STT context and records
the live-STT verification as done from a Node script with MP3 chunks. That is a
documentation gap, not a testing gap — **the spike's live STT has been run on the actual
iPhone and the transcript rendered progressively.**

- The test device runs **iOS 26**. [Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
  (March 2025) added WebM/Opus to `MediaRecorder`, so `isTypeSupported` returns `true` and
  Safari takes the same WebM branch as Chrome.
- Deepgram's streaming socket accepts Opus-in-WebM as containerized input (omit `encoding`,
  it sniffs the header). Opus-in-Ogg and linear16-in-WAV are the other two.
- The fMP4 path therefore never executes here. MP4/AAC is **not** a documented Deepgram
  streaming container, so on an iPhone below 18.4 it would likely fail silently. Escape
  hatch if that ever matters: Web Audio `AudioWorklet` → 16 kHz `linear16` with
  `&encoding=linear16&sample_rate=16000`, which is container-independent.

---

## Next.js 16 specifics

Read from the version-bundled docs in `node_modules/next/dist/docs/` per `AGENTS.md`,
rather than from memory of Next 14/15. Installed version is **16.3.6**.

- **Turbopack is the default** for `next dev` and `next build` — no `--turbopack` flag.
- **`next lint` is removed** and `next build` no longer lints. The script is
  `"lint": "eslint"`, flat config in `eslint.config.mjs`.
- **`tsconfig.json` needs `"exclude": ["node_modules", "spikes"]`** — the generated
  `include` is repo-wide and would otherwise type-check the spike.
- **Route handlers:** plain Web `Request`/`Response` is the baseline. Returning an
  `ArrayBuffer` body is the supported pattern for `/api/tts`. **Don't `export const
  runtime`** — `'nodejs'` is the default and `'edge'` is deprecated. Handlers are uncached
  by default.
- **Route handlers cannot host WebSockets**, which makes the browser→Deepgram-direct
  architecture the only option without extra infrastructure rather than merely the nicer
  one.
- **`cacheComponents` stays off.** It makes PPR the default and turns uncached data outside
  `<Suspense>` into build errors — no benefit for a fully-client, no-persistence app.
- **`.env.*` must live at the repo root**, not in `src/`.
- **`allowedDevOrigins` matches hostname only**, and one `*` matches exactly one label:
  `*.ngrok-free.app` will not match a bare `ngrok-free.app`.
- **SVG imports are typed `any`** by Next, and **Turbopack returns a URL string**, not the
  `StaticImageData` object you get for PNG/JPG. Nothing in the toolchain catches a wrong
  assumption here — it cost one round of six empty flag boxes.
- **React 19.2**, so `useEffectEvent` is available where a callback needs the latest state
  without re-subscribing.

---

## Build stages

One git branch per stage, off the previous one, with a check-in between.

### Stage 1 — Static screens, mocked data — **done**

Branch `stage/1-static-ui`. No network calls at all; `use-mock-driver.ts` dispatches the
same actions the real Gemini, TTS and Deepgram drivers will, on roughly the same timings,
so the UI and the reducer are exercised for real and only the source of events is fake.

Verified on desktop Chrome and, by the user, on iPhone Safari (iOS 26): layout and the
language grid at phone width; the control bar clears the home indicator; the bar stays put
while the thread scrolls and the URL bar collapses; overscroll is contained; the thread
auto-scrolls to new bubbles; the editor does not trigger focus-zoom and Send stays
reachable with the keyboard open.

### Stage 2 — Gemini conversation

`/api/chat` with `@google/genai` `ai.interactions.create`, `previous_interaction_id`
chaining, a zod-validated JSON response, and a system instruction built from
`{ language, level }`. Text in, text out — Reply temporarily writes into a text input so
the loop is testable before STT lands. Needs `.env.local` with `GEMINI_API_KEY`.

### Stage 3 — Deepgram live STT + TTS + highlighting

1. `/api/stt/token`, `use-live-transcription`, interim/final rendering wired to the real
   transcript.
2. `/api/tts` with the provider registry and all three implementations, voice resolved per
   language inside each provider. Switching `TTS_PROVIDER` is the only change needed; an
   unknown value fails loudly with the valid names listed.
3. Word highlighting synced to `audio.currentTime`.
4. Add a note to `spikes/ai-voice-demo/findings.md` recording that live STT was verified on
   iPhone Safari / iOS 26, and why. As written it reads as though only the Node script ever
   proved it, which cost a wrong risk assessment in this very plan.

Voice names get verified against the authoritative list endpoints rather than from memory:
`GET https://{region}.tts.speech.microsoft.com/cognitiveservices/voices/list` for Azure,
`GET https://texttospeech.googleapis.com/v1/voices?key=…` for Google.

### Stage 4 — Evaluation: **discussion first, no code**

A written comparison comes before any implementation. The question is a **three-way**, not
the two originally posed:

1. **After each user turn** — what the spike does.
2. **On demand**, via an Evaluate button — what the reference screenshots show, rendered
   inline in the thread and covering several earlier utterances at once.
3. **Once at the end of a session** — what the current production app does.

It has knock-on effects on the chat schema, the control bar, and whether feedback
interrupts the conversational illusion.

### Out of scope

Continuous / open-microphone mode, with no push-to-talk and the ability to interrupt the
AI mid-sentence. Two unresolved risks in the spike: whether Safari's audio unlock survives
a whole session without repeated gestures, and echo when the mic stays open while AI audio
plays through the phone speaker. Not proven, not in scope.

---

## Verification

Per stage, in this order:

1. `npm run lint` and `npx next typegen && npx tsc --noEmit` clean. `typegen` is required
   first in v16 — the generated route types live in `.next/dev/types`.
2. `npm run build` clean.
3. `npm run dev` → desktop Chrome, walk the full flow for the stage.
4. **iPhone Safari, every stage.** `ngrok http 3000`, open the HTTPS URL on the phone.
   Stage 3 adds: the mic permission prompt appears, the transcript updates *while*
   speaking, a >20 s utterance transcribes correctly (the length that broke Google STT),
   AI audio plays without a second tap, and the highlight tracks the audio.
5. Deliberate failure paths: deny mic permission, kill the network mid-`/api/chat`, stop
   recording having said nothing. Each must land in a recoverable `error`, not a dead page.
6. A report at the end of every stage: what's done, what decisions came up including ones
   resolved unilaterally, and what's still open.

---

## Open questions

1. **Evaluation design** — stage 4, above. Untouched by design.
2. **Tests.** There are none, so review is currently the only quality gate.
   `word-timing.ts` and the reducer are pure and would suit Vitest.
3. **The AI persona and scenario.** Carrying over the spike's approach: a generic friendly
   acquaintance, freeform topic, 2–4 sentences per turn, at most one question. Named
   personas or scenario cards would be a different feature.
4. **Spain's flag is 81 KB** (full coat of arms) against ~250 bytes for the other five —
   invisible detail at 24 px, and effectively the whole flag payload. Not acted on.
5. **Ending a session is one tap and unrecoverable.** No confirmation, nothing persisted.
   Consistent with the brief, but it sits next to Reply.

---

## Decision log

Changes made after the plan was approved on 2026-09-23. Each line contradicts or extends
the original.

| Date | Change | Why |
|---|---|---|
| 09-23 | App scaffolded at the repo root; UI copy in English | Answered during planning. |
| 09-23 | Scaffolded via the scratchpad; repo's own `.gitignore` kept | The scaffold's version is root-anchored and would have started tracking the spike's `node_modules`. |
| 09-24 | Auto-scroll aligns the **top** of a new bubble too tall to fit | Scrolling to the bottom landed the user on its last line, with the highlight starting off-screen and nothing re-scrolling during playback. |
| 09-24 | `flag-icons` replaces emoji flags | Emoji flags render as bare country letters on Windows. Six SVGs imported, not the stylesheet. |
| 09-24 | Session config line removed from the conversation screen | User's call. `config` dropped from `ConversationScreen`'s props with it. |
| 09-24 | Button variants reduced to `primary` and `secondary`, each with its own disabled look | Grey fill is primary's *disabled* state, not a separate variant, and the label stays at full contrast — a blanket `opacity` was washing it out. |
| 09-24 | Reply is a primary button, so magenta when tappable | Deliberate divergence from the reference, where Reply is grey in every state. Confirmed as intended. |
| 09-24 | The `ended` phase removed; End session returns to setup | User's call. `RESTART` and the ended screen went with it. |
| 09-24 | `lastConfig` carried into setup as the new defaults | Otherwise every repeat session meant re-picking the same language. |
| 09-24 | Live transcript moved from the thread into the control bar | It is not part of the conversation yet, and it becomes the draft in place — rendering it in the thread moved it across the screen at that moment. Draft bubble restyled to match so nothing jumps. |
| 09-24 | One shared set of controls across listening/reviewing/editing; **Stop removed** | Send, Edit and Cancel each end recording anyway. End session left those three states with it. |
| 09-24 | `editing` became its own turn state with `draftBeforeEdit` | *Cancel edit* has to restore the pre-edit text, and only that state has somewhere to keep it. |
| 09-25 | The dot is a microphone-active indicator, not draft decoration | Present exactly while the mic is live. A pulse animation is planned for it. |
| 09-25 | Dashed border dropped from the listening bubble | The dot says the same thing; two signals for one state, and it diverged from the reference. |
| 09-25 | First turn reads "Start conversation" when the user opens | "Reply" is wrong before anything has been said. Keyed on the turn list being empty *and* the button being enabled. |
| 09-25 | This plan moved into the repo as `docs/plan.md` | Outside git it was not reviewable, did not travel with the branch, and its changes left no diff. |
