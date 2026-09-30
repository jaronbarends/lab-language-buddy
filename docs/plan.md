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
| Styling | CSS Modules, over the design system ported from the existing app | Tailwind's payoff is class reuse across a large surface; here it would mostly add a build step and bury the iOS-specific CSS in arbitrary-value escapes. |
| State | One `useReducer` session machine + a dispatch context, side effects in hooks | The whole app is one session. A store library buys nothing, and a reducer makes illegal states unrepresentable. State reaches screens as props from `LanguageBuddy`, which narrows on `phase`; only `dispatch` travels by context. |
| Turn states | A discriminated union carrying per-state data | `listening` carries the transcript, `aiSpeaking` the turn id and word count, `editing` the pre-edit text. "Recording while the AI speaks" is not a bug you can write. |
| Turn identity | `crypto.randomUUID()` per turn, never an array index | This is the stale-closure off-by-one from `findings.md`, made structurally impossible rather than patched. |
| Conversation history | Gemini `previous_interaction_id` chaining | History lives server-side at Google; we send only the new utterance. The client keeps its own array purely for rendering. |
| Chat response shape in stage 2 | `{ reply }` only — no per-turn `correction` | Whether feedback is per-turn is exactly the stage 4 question. Shipping stage 2 without it keeps that open instead of defaulting by accident. |
| TTS providers | All three from the spike: Azure (default), Google, ElevenLabs | Three implementations stress the interface in a way two don't — see the voice-table row. |
| Provider interface | `synthesize(text, language)` | The spike hardcoded `nb-NO`. Language has to cross the boundary, and each provider resolves it differently. |
| Voice tables | Inside each provider module, not in the shared language registry | Azure and Google each need a per-language voice name; ElevenLabs' `eleven_flash_v2_5` is multilingual and takes none. A shared column would put two providers' private config in a table the client imports, with nowhere sensible for the third case. |
| Flags | `flag-icons`, importing only the six SVGs needed | Emoji flags render as bare country letters on Windows. Importing the package stylesheet would pull in all ~260 flags. |
| Errors | Recoverable, and the way back depends on where it failed: a failed AI call is retried, a failed recording returns to the user | The spike dead-ended and told the user to reload, throwing away the conversation over what is usually a blip. The error state carries `from`, because "Try again" after a failed AI call must retry it — the user's turn is already sent. |
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
- **`error`** — recoverable. Carries `message` (fixed generic text chosen by the caller),
  an optional `detail` (the raw error, truncated to `MAX_ERROR_DETAIL_LENGTH`) and `from`
  (the turn state it came from). `FAILED` is only accepted from `aiThinking` and
  `listening`; anywhere else it is a late arrival and is ignored, so it can't overwrite a
  draft. Dismissing goes back to `aiThinking` when `from` is `aiThinking` (the driver
  effect re-runs on entering it, which is the retry), otherwise to `awaitingUser`; a
  transcript in progress when listening failed is discarded. The diagram above shows the
  `awaitingUser` route only.
- **TTS failure is not an error state.** `AI_SPEECH_FAILED` (only valid in `aiSpeaking`)
  goes to `awaitingUser` silently: the AI's text is already on screen, so it degrades to
  text-only. The stage 3 caller does the `console.error`. Like the other two speech
  actions it carries the `turnId` and is ignored when that is not the turn being spoken.

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
    │   ├── reset.css             carried over from the existing app — see below
    │   ├── elements.css          carried over from the existing app — see below
    │   └── tokens/               the design system — see below
    ├── components/
    │   ├── language-buddy.tsx    owns the reducer, renders by phase
    │   ├── setup-screen/         setup-screen, language-picker, level-select, starter-toggle
    │   ├── conversation/         conversation-screen, conversation-thread, turn-bubble,
    │   │                         highlighted-text, live-transcript, thinking-bubble,
    │   │                         draft-review (DraftBubble + DraftEditor),
    │   │                         conversation-controls (a switch over composing-controls,
    │   │                         error-controls and idle-controls, which dispatch for
    │   │                         themselves); bubble (the shared frame) and
    │   │                         a module css beside each component for its own styles
    │   ├── dev/state-stepper.tsx development-only turn-state jumper
    │   └── ui/                   button, icons, flag-icon
    ├── hooks/
    │   ├── use-session-dispatch.ts dispatch context + `useSessionDispatch`
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
`promptName`, `deepgram`, `htmlLang` (the BCP 47 tag for the `lang` attribute). Flags live in `flag-icon.tsx` and voices in each TTS provider,
because a language code is not a country code and not a voice name.

---

## Design system

`src/app/tokens/` holds five files carried over from the existing Language Buddy app:
`colors`, `type`, `sizes`, `borders`, `animation`.

**Source:** <https://github.com/jaronbarends/language-buddy>, `src/styles/settings/`, as of
commit `663188fc` (2026-09-28, "reverse color scales"). That repo is the live system and
stays the place to look; no copy of the originals is kept here, because a second copy
would only drift from both it and from our working files. Compare against the source
before assuming a token still matches.

**Three layers**, all carried over from the existing app and kept as close to verbatim as
possible so they can be re-synced:

- `tokens/` — the values
- `reset.css` — what browsers get wrong by default (`src/styles/reset.css`, as of commit
  `4afc5d07`, 2026-08-18)
- `elements.css` — how plain elements look, defined once at element level instead of per
  component (`src/styles/elements.css`, as of commit `77ed5aff`, 2026-08-26)

`globals.css` imports them in that order — element rules and reset rules have equal
specificity, so the later one wins — and is otherwise only what this app needs *beyond*
them: `--layout-max-width`, `--safe-bottom`, the `html`/`body` layout and iOS handling,
and `.u-hidden-form-control`.

Deliberate deltas, each commented where it sits:

- **`--color-yellow-subtle`** added, plus semantic `--color-bg-highlight`. The system had
  no yellow and the read-along highlight needs one. Same lightness as
  `--color-red-subtle` so the two tints sit level; no strong `--color-yellow`, since
  nothing needs one.
- **`--radius-button`** moved from `sizes.css` to `borders.css`, with the other radii.
- **`--font-baloo` / `--font-worksans` removed from `type.css`.** next/font defines them
  instead. Declaring them in both places would leave the winner down to stylesheet
  injection order, since a class on `<html>` and `:root` have equal specificity.
  `fonts.css` — which held only `@font-face` — is dropped entirely.
- **Body line-height, heading line-height and `:focus-visible` live in `elements.css`,
  not `reset.css`.** They define how things should look, which is not a reset. The
  heading line-height was already in `elements.css` for `h1`–`h4`, so moving it only
  removes a duplicate.
- **`legend { padding: 0 }` added to the reset.** Measured on a bare legend: 2px of inline
  padding each side. The original reset zeroes fieldsets, headings and `p` but not
  `legend`, so captions would sit 2px inside the edge of the controls beneath them.
- **`main { padding-bottom }` from `elements.css` not taken over.** It ignores the iOS
  safe area, and the screens pad themselves.
- **`legend` uses the label tokens** (`--color-text-label`, `--font-weight-label`) rather
  than the primitives behind them (`--color-text-neutral-subtle`,
  `--font-weight-semibold`). Same values today, but those tokens exist for this role, so a
  change to them now reaches the captions.

Deliberately *not* added: a `min-inline-size: 0` for `fieldset`, which defaults to
`min-content`. Tested by constraining the container to 288, 304 and 328px, the inner
widths of 320, 336 (21rem) and 360px viewports: no overflow at any of them. The picker's
21rem breakpoint is exactly where three 6rem columns fit.

That test was first done by constraining a container, because the browser window would
not resize. It has since been repeated in genuine narrow viewports by loading the app in
iframes of 320 to 700px, which works because an iframe's width is the viewport its media
queries see. Result: the picker goes from two to three columns between 335 and 336px, no
fieldset is ever wider than its form, and the page never scrolls sideways at any width
tried. That is Chrome, not Safari — iOS is still for a real device.

**Captions are on the element-level `legend` rule.** The component classes that used to
override it (`.fieldLabel`, the picker's `.legend`) are gone, so the setup screen's
captions are now the original's 14px semibold without tracking, where the agent's own
were 12px bold with 0.06em. The only caption class left is `.legend` in
`setup-screen.module.css`, which sets the gap to the control and nothing else.

**Fonts** are Baloo 2 (buttons, language picker, headings) and Work Sans (everything
else, including the AI/Me toggle), loaded through `next/font/google` with the `latin`
subset only. Latin-1 covers Norwegian æ ø å and Spanish ñ, so nothing is lost.

**A weight restriction was lost in the swap to next/font.** The original app's
`@font-face` blocks declared Baloo at 600 and 700 only. Anything that inherited the
default 400 while using Baloo was therefore never rendered at 400: the browser picked the
nearest weight it had, 600. next/font loads the whole variable range, so the same CSS
renders a true 400. The language picker's labels were the one place that relied on this,
and came out lighter than the original. Wherever Baloo is used the weight is now stated:
buttons and headings already had tokens, and the picker labels now use
`--font-weight-label`. Any future Baloo text without an explicit weight will have the
same problem.

**The bevel** is the system's signature: a thicker bottom border that collapses to the
normal width on press while the element slides down by exactly that difference, so the
bottom edge holds and the top drops. Buttons use `--bevel-large`, picker cards
`--bevel-small`. A disabled button keeps the extra bottom width but makes the border
transparent — flat and plainly not pressable, at an unchanged height.

**Type scale** is 18px body. Buttons are 18px bold, except "Start chat" at 20px.

**Icons** are Font Awesome 6 Free, through `react-icons/fa6`. `ui/icons.tsx` is the only
place they are imported; screens use the app's own names, so a different set is an edit to
that one file. All are decorative (`aria-hidden`, beside a text label) and fill with
`currentColor`. Tree-shaking holds: `fa6` exports about 2,000 icons and adding the first eight
used grew the client bundle by 5.8 KB.

| app name | Font Awesome | used for |
|---|---|---|
| `MicIcon` | `FaMicrophone` | Reply, Start conversation |
| `SendIcon` | `FaRegPaperPlane` | Send |
| `PencilIcon` | `FaPencil` | Edit |
| `CrossIcon` | `FaXmark` | Cancel |
| `FinishIcon` | `FaFlagCheckered` | End session |
| `ChatIcon` | `FaComment` | Start chat, logo |
| `RobotIcon` | `FaRobot` | AI in the starter toggle |
| `PersonIcon` | `FaCircleUser` | Me in the starter toggle |
| `WarningIcon` | `FaTriangleExclamation` | The error box |

The original app's list also named five icons this app has no place for yet:
`FaGraduationCap` (its Evaluate button — stage 4, undecided), `FaVolumeXmark` (a no-voice
warning, not built), `FaCircleInfo` and `FaRegCircleQuestion` (info and tooltip, not built),
and `FaCircleXmark` (a harder failure; the error box uses the triangle instead).

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
   *Start chat* is now a form's submit button, so the unlock belongs in that button's
   `onClick`, not in the form's `onSubmit`: the click always fires first, and pressing
   Enter makes the browser fire a click on the default button too. **Not yet verified on an
   iPhone**; it comes up with the audio in stage 3.
3. **Layout for iOS chrome.** A flex column at `100dvh` rather than a `position: fixed`
   bar — a fixed element drifts when the keyboard opens and the URL bar collapses — plus
   `viewport-fit=cover` and `env(safe-area-inset-bottom)`.
4. **A 16px floor on every focusable control**, or iOS zooms the viewport on focus.
5. **Device testing is part of each stage, not a final pass.** `next dev` + an ngrok tunnel
   (HTTPS is required for `getUserMedia` at all).
6. **An editable bubble is a `contenteditable="plaintext-only"` div, not a textarea.** A
   textarea sizes from `cols` and `rows`, not from its content. `field-sizing: content` fixes
   that but arrives only in Safari and iOS 26.2. A hidden copy of the text behind the
   textarea was built and failed on an iPhone: full width and a different line height.
   `plaintext-only` has been in iOS Safari for years, and in Firefox since 136. See
   `DraftEditor` in `draft-review.tsx`.

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
5. **Two text/background pairs fall below 4.5:1**, the bar WCAG sets for text under 24px,
   or under 18.66px bold ("large text" is 24px, or 18.66px *bold* — 700, so semibold
   does not qualify):
   - **White on `--color-bg-primary`: 4.05:1**, the primary button at 18px bold. Knowingly
     accepted: it is the brand colour, and 20px "Start chat" clears the 3:1 bar that
     applies to large text.
   - **White on `--color-bg-secondary`: 3.16:1**, the selected AI/Me option at 18px
     semibold. **Found 2026-09-30, knowingly accepted the same day.** It is the existing
     app's own pair of tokens, and unlike the button it has no large-text exemption to
     lean on. Alternatives were measured first: a darker fill (4.37:1 at blue-600, 6.15:1
     at blue-700), dark text on the current blue (5.33:1), or 18.66px bold, which would
     bring the 3:1 bar into play and pass it narrowly.

   An earlier version of this entry said every other pair passed. That had been
   asserted, not measured; the blue pair had never been computed. Measured since: the
   selected language card (8.00:1), the secondary button (7.75:1), body text on the user
   bubble (12.27:1), errors (5.33:1) and the captions (6.22:1) all pass.
6. **Ending a session is one tap and unrecoverable.** No confirmation, nothing persisted.
   Consistent with the brief, but it sits next to Reply.
7. **"Cancel edit" still wraps at a 320px viewport**, by 2.2px, and so do the other buttons in
   its row. 320px is the original iPhone SE and iPhones in Display Zoom; iOS 26 devices are
   375px or wider otherwise. Not fixed: closing 2.2px means changing a gap, a font size or
   the screen's side padding, and none of those was asked for.

---

## Decision log

Changes made after the plan was approved on 2026-09-23. Each line contradicts or extends
the original.

**Source** records who *originated* the decision, which is the point of the column:
this repo exists partly to see what an AI agent produces, and that question is only
answerable if it is visible which choices were the agent's own. Approving a proposal does
not change its origin, and neither does rejecting one — a row marked `agent` may well
have been argued over first.

- `agent` — the agent proposed it, from the brief or from the code
- `you` — Jaron decided it, whether unprompted or by picking from options offered
- `ported` — taken from the existing app at <https://github.com/jaronbarends/language-buddy>

| Date | Source | Change | Why |
|---|---|---|---|
| 09-23 | you | App scaffolded at the repo root; UI copy in English | Answered during planning. |
| 09-23 | agent | Scaffolded via the scratchpad; repo's own `.gitignore` kept | The scaffold's version is root-anchored and would have started tracking the spike's `node_modules`. |
| 09-24 | you | Auto-scroll aligns the **top** of a new bubble too tall to fit | Scrolling to the bottom landed the user on its last line, with the highlight starting off-screen and nothing re-scrolling during playback. Chosen over following the highlight during playback, which stays available. |
| 09-24 | you | `flag-icons` replaces emoji flags | Emoji flags render as bare country letters on Windows. Six SVGs imported, not the stylesheet. |
| 09-24 | you | Session config line removed from the conversation screen | `config` dropped from `ConversationScreen`'s props with it. |
| 09-24 | you | Button variants reduced to `primary` and `secondary`, each with its own disabled look | Grey fill is primary's *disabled* state, not a separate variant. Corrected an agent misreading that had invented two extra variants and dimmed the label with `opacity`. |
| 09-24 | agent | Reply is a primary button, so magenta when tappable | Deliberate divergence from the reference, where Reply is grey in every state. Confirmed as intended. |
| 09-24 | you | The `ended` phase removed; End session returns to setup | `RESTART` and the ended screen went with it. |
| 09-24 | you | `lastConfig` carried into setup as the new defaults | Otherwise every repeat session meant re-picking the same language. |
| 09-24 | you | Live transcript moved from the thread into the control bar | It is not part of the conversation yet, and it becomes the draft in place — rendering it in the thread moved it across the screen at that moment. Draft bubble restyled to match so nothing jumps. |
| 09-24 | you | One shared set of controls across listening/reviewing/editing; **Stop removed** | Send, Edit and Cancel each end recording anyway. End session left those three states with it. |
| 09-24 | agent | `editing` became its own turn state with `draftBeforeEdit` | *Cancel edit* has to restore the pre-edit text, and only that state has somewhere to keep it. |
| 09-25 | agent | This plan moved into the repo as `docs/plan.md` | Outside git it was not reviewable, did not travel with the branch, and its changes left no diff. |
| 09-25 | you | The dot is a microphone-active indicator, not draft decoration | Present exactly while the mic is live. A pulse animation is planned for it. |
| 09-25 | agent | Dashed border dropped from the listening bubble | The dot says the same thing; two signals for one state, and it diverged from the reference. |
| 09-25 | you | First turn reads "Start conversation" when the user opens | "Reply" is wrong before anything has been said. Keyed on the turn list being empty *and* the button being enabled. |
| 09-28 | you | Design system adopted from the existing app: five token files under `src/app/tokens/`, kept near-verbatim | The rebuild's own palette was flat next to the real thing, and a re-skin is cheapest now — before stage 3 adds highlight rendering and stage 4 a whole new content type. |
| 09-28 | ported | Bevels replace `--shadow-raised` | The system marks depth with a thick bottom border that collapses on press, not with soft shadows. Keeping one shadow would have left an alien element. |
| 09-28 | ported | Language picker ported whole: native radio in a label, `fieldset`/`legend`, `:has()` column counts, style container query for label orientation | Real radio semantics and keyboard behaviour come free, and the layout logic lives in CSS rather than in props. Replaces the agent's `role="radio"` buttons — the one place in this round where a *structural* choice was overwritten rather than a visual one. |
| 09-28 | you | White on the primary button stays at 4.05:1 | See open question 5. Brand colour over the audit threshold, decided deliberately. |
| 09-28 | you | Base font size 18px | Also retires the 16px floor that existed to stop iOS focus-zoom — we are now well clear of it, so those guards are gone. |
| 09-28 | agent | `resources/css-reference/` dropped; provenance recorded instead | A third copy of files the source repo and `src/app/tokens/` both already hold would drift from both. |
| 09-28 | you | This Source column added, filled retroactively | Makes "what did the agent actually decide" answerable by reading one table rather than re-reading the history. |
| 09-29 | agent | State context, `useSession` and `useConversation` removed; state stays props, only dispatch is context | They were never used: `LanguageBuddy` already narrows on `phase` and passes `turns`/`turnState` down. **Open option:** re-add a state context plus a narrowing `useConversation()` (throws outside the `conversation` phase) if a deeper component or a stage 2/3 hook would otherwise need state prop-drilled — do it when that is practical, not before. |
| 09-29 | agent | Error flow reworked: `FAILED` only from `aiThinking`/`listening`, error state carries `from` and optional `detail`, dismiss retries a failed AI call; new `AI_SPEECH_FAILED` | Dismissing always went to `awaitingUser`, so a failed Gemini call was never retried, a failed first AI turn showed "Start conversation", and a late `FAILED` could overwrite a draft. TTS failure now degrades to text-only instead of showing an error. |
| 09-29 | agent | `AI_SPEECH_PROGRESSED`, `AI_SPEECH_FINISHED` and `AI_SPEECH_FAILED` carry a `turnId`; the reducer ignores them when it is not the turn being spoken | With one `<audio>` element reused across turns, a late `timeupdate` or `ended` from the previous turn's audio could otherwise land on the current one — contradicting the rule that anything pointing at a turn matches on its id. |
| 09-29 | agent | Reducer contract for the async drivers, stated in its doc comment | The reducer cannot tell a stale `AI_TURN_RECEIVED` or `TRANSCRIPT_UPDATED` from a current one; both only check the state name. Every async source must therefore cancel when the state that started it is left: abort fetches, detach handlers from and close sockets. A note for stages 2 and 3, nothing built yet. |
| 09-29 | agent | `USER_TURN_SENT` and `AI_TURN_RECEIVED` take `{ id, text }`, not a whole `Turn`; the reducer sets `author` | The caller no longer picks the author, and the "no empty user turn" rule (trimmed text) lives in the reducer instead of only in the component. |
| 09-29 | agent | The reducer's `default` branch is a compile-time exhaustiveness check (`action satisfies never`) | An action added to the union but not handled now fails `tsc` instead of being silently ignored. Verified with a temporary dummy action. |
| 09-30 | ported | `reset.css` and `elements.css` adopted between the tokens and `globals.css` | Replaces the agent's blanket `*{margin:0;padding:0}` and the element rules that lived in `globals.css` with the existing app's, so both apps share one definition of a plain element. Captions will become 14px semibold without tracking — the agent's 12px bold with 0.06em was estimated from a screenshot — once the component classes overriding them are removed. |
| 09-30 | you | Body line-height, heading line-height and `:focus-visible` moved from `reset.css` to `elements.css` | They define how things should look, which is not a reset. |
| 09-30 | agent | `legend { padding: 0 }` added to the reset | Measured at 2px each side on a bare legend; the original reset lacks it. One line, flagged in place, easy to drop. |
| 09-30 | agent | `main { padding-bottom }` not taken over; no `fieldset` `min-inline-size` reset | The first ignores the iOS safe area. The second proved unnecessary when tested at 288, 304 and 328px container widths. |
| 09-30 | you | `legend` in `elements.css` uses `--color-text-label` and `--font-weight-label` | In line with the tiered tokens: the label tokens exist for this role, and the original reached past them to the primitives. Identical values today. |
| 09-30 | ported | The setup screen is one `<form>`; each field is a `fieldset` with a `legend` owned by the screen, and the controls render no caption of their own | The three fields used three mechanisms — a fieldset, a label, a bare span — and the picker owned its legend while the others did not. Replaces the agent's per-field wrappers and caption classes, and makes Enter submit. |
| 09-30 | agent | The level select gets `aria-labelledby` pointing at its legend | A legend names the fieldset, not the control inside it, so the select had no accessible name of its own. Chosen over using a `label` for this one field, because the element-level legend style would not have reached a label. |
| 09-30 | ported | The starter toggle is native radios with a sliding indicator (CSS anchor positioning) and a hover state on the unselected option | It was the last `role="radio"` control, leftover from before the picker changed. The hover state is a small addition that came with the component and was not separately requested. |
| 09-30 | agent | The indicator is feature-tested and falls back to painting the selected option itself | Safari 26 ships anchor positioning only in part, and without a fallback a browser lacking it would show white label text on a white background. Verified by rule structure, not on such a browser. |
| 09-30 | ported | The select's arrow is a `mask` filled with `currentcolor`, replacing a background image with a hardcoded stroke colour | It follows the text colour instead of repeating a hex. The hardcoded one also contradicted an earlier claim that no hex remained outside the tokens; the check had skipped that line. |
| 09-30 | agent | Found: white on `--color-bg-secondary` is 3.16:1 | See open question 5. A correction of an unmeasured claim made earlier, not a design change. |
| 09-30 | you | White on `--color-bg-secondary` stays at 3.16:1 | Decided with the options in front of it (see open question 5): the pair comes from the existing app's tokens and is left as it is, the same way the primary button's 4.05:1 was. |
| 09-30 | ported | "Start chat" is half the form wide, four fifths below 30rem, centred — one `--flex-basis` variable that the breakpoint changes | It had been full width: the port left the original's `.actions` rule out. Measured in iframes from 320 to 700px; the switch falls exactly between 479 and 480px, the complement of the picker's own `min-width: 30rem`, written as `(width < 30rem)` rather than the original's `29.99rem`. The original centres with `space-around`; with a single item `center` is identical and says what it means. |
| 09-30 | you | Icons are Font Awesome 6 Free via `react-icons/fa6`, replacing the hand-drawn SVGs | The originals were disliked. Jaron named the icons by their `Fa…` names; the agent inferred `react-icons` from that naming, since `@fortawesome` uses `faCircleInfo`-style names, and checked that all 14 names exist in `fa6`. Eight are used; six have no place yet. The mapping and the attribution (CC BY 4.0) are in `ui/icons.tsx`. |
| 09-30 | you | Speech bubbles use `--line-height-body-tight` and `--font-weight-medium` | Applies to every bubble: turns, the live transcript and the thinking bubble through `.bubble`, and the draft bubble through `.draft`, which has to match the live transcript or the text changes the moment recording stops. The two rules carried the values separately until the shared Bubble (below) made the frame one rule. The error box is not a bubble and is unchanged; the editing textarea was not one then, and is now (below). A side effect on the highlight bands was settled straight after, in the next two rows. |
| 09-30 | you | `--line-height-body-tight` changed from 1.25 to 1.3, in the token itself | Raised after seeing the bubbles at 1.25, where the highlight bands touched. Being a token it also moves the buttons, by under 1px; both consequences are in the design system deltas. A delta from the original app's tokens. |
| 09-30 | you | The spoken-word highlight loses its `padding: 1px 0` | The agent's own addition: it made the bands 23px tall, which at 1.25 overlapped neighbouring lines by 0.5px. Measured now at 1.3 without it: 21px bands, 23.4px line step, 2.4px clear between lines. The comment that explained the padding was also wrong, as it only added height. |
| 09-30 | you | `--line-height-body-tight` back to 1.25, the original's value | The bubbles did not look right at 1.3. Buttons return to their earlier heights (Reply and End session 62.5px, "Start chat" 65px, measured), and the token is verbatim again, so the delta recorded two rows up is gone. |
| 09-30 | you | The spoken-word highlight is a `linear-gradient` background-image with a 1px transparent strip at top and bottom, replacing both the plain background and the padding | Keeps bands on neighbouring lines apart at 1.25 without touching the line height. Measured: 21px element, 19px visible band, 22.5px line step, 3.5px clear between bands. The edges are hard because each colour stop's second position is 0, which the browser raises to the previous stop. The forced-colours caveat was settled in the next row. |
| 09-30 | you | A `@media (forced-colors: active)` rule drops the highlight gradient | Forced-colours mode replaces `background-color` but, as far as is known, leaves `background-image` alone, so the yellow would stay behind recoloured text and could be unreadable. A plain background used to vanish there instead. The highlight is now simply not drawn in that mode. **Then tested by Jaron in forced-colours mode: no highlight is drawn there, which he judged acceptable.** Before that, only the existence of the rule and normal mode being untouched had been verified, as the browser could not be put in that mode from the tooling. Whether anything else leans on background colour alone in that mode — the selected language card, the AI/Me pill — was not reported on. Replaces open question 8. |
| 09-30 | you | The error box gets `FaTriangleExclamation` (`WarningIcon`) to the left of the whole text block, top-aligned, 12px from the text, and the 8px gap between its lines is gone | Answers the open question about an error icon after the box was looked at in the dev panel. The icon sits beside the title, message and detail together, not beside the title alone; it is 24px with `align-items: start`, so it sits at the top of the block. The lines have no gap of their own now, so they sit at the text's line height: 27px for the title, 21px for the others. Verified with a very long message: it wraps, the icon keeps its size and the box stays inside its container. First built centred vertically with 8px to the text; changed to top-aligned and 12px on looking at it. |
| 09-30 | you | One shared `Bubble` component holds the frame of every speech bubble, and each leaf keeps its own styles | There were two components with identical styling, kept in step only by a comment. `Bubble` (author, `as` = `p` or `div`, className, passthrough attributes) now holds size, padding, border, colour, line height and weight, so the live transcript and the draft cannot drift apart. The thinking dots, the live-transcript dot, the highlight and the screen-reader speaker label moved into modules beside their own components. The thinking bubble kept its 68×44px by putting the old 4px of extra padding on its dots wrapper. Measured before and after: listening, draft and thinking bubbles have identical sizes. |
| 09-30 | you | The editor is an uncontrolled `contenteditable="plaintext-only"` div inside a `Bubble`, replacing the full-width bordered textarea | The old editor jumped to 648px wide on Edit. The bubble now grows with the text until its 85% maximum, then wraps and grows down, and clicking Edit gives a bubble exactly the size of the draft it replaces (550.8×73px in the test). **Built twice.** First as a textarea stacked on a hidden copy of its own text, chosen over `field-sizing: content` (Safari 26.2 only); on an iPhone that textarea took the full width and laid its lines out differently from the copy, which is what a construction needing two elements to lay text out identically invites. Jaron proposed `contenteditable`: one ordinary block whose width and line height come from the bubble like every other bubble's, with no copy to keep in step. The text is written in once, before first paint, and read back on input; it is never rendered from state, since that would throw the caret to the start, which is safe because the editor exists only in the editing state. Tested in Chrome with real typing: Enter gives `\n` in a text node with no `<br>` or `<div>`, pasted formatting arrives as plain text, Send sends exactly what was typed, Cancel edit restores the pre-edit text, and an emptied editor keeps a visible bubble with Send disabled. **Then checked on an iPhone, where the first attempt had failed, and it behaves.** That covers Enter, the keyboard and autocorrect, which were the open risks. The accessibility attributes a textarea supplies (`role`, `aria-multiline`, `aria-label`) are now set by hand. |
| 09-30 | you | A bubble containing an editable region goes white, with the focus ring on the bubble | The white-on-edit idea is Jaron's. The condition `:has([contenteditable])`, not focus, is the agent's refinement, which he accepted: the editor only exists in the editing state, whereas clicking elsewhere drops focus while still editing. Tested: after clicking away the editor is unfocused, the bubble stays white with no ring, "Cancel edit" is still shown and Edit is still disabled. The ring needs real window focus; with only programmatic focus in an automated tab `:focus-visible` does not match, which looked like a bug and was not. |
| 09-30 | you | Bubbles use `white-space: pre-line` | A line break typed in the editor was kept in the sent text as `\n` but shown as a space, because `.bubble` used the default. Tested before changing it: a three-line message showed as one line, 50.5px tall. `pre-line` keeps line breaks and still collapses runs of spaces, which `pre-wrap` would keep. It applies to every bubble, so an AI reply with line breaks is shown with them too. The editor stays `pre-wrap`, since typed spaces must survive while typing. Closes the open question about line breaks showing as spaces in the thread, which was removed from the list with this change. |
| 09-30 | you | Buttons' horizontal padding is 16px, down from 32px (`padding: var(--size-16)`) | On an iPhone, "Cancel edit" did not fit its half-width button: the label wrapped onto two lines and, since the two buttons in a row are always the same height, both grew from 62.5px to 85px. The same happened to Edit, and to Try again and End session in the error row. Reproduced before changing anything, by loading the app in iframes of iPhone widths: 85px at 320, 375 and 390px, 62.5px only at 430px. After: 62.5px at 360, 375, 390 and 430px. The room left in "Cancel edit" is 14.3px at 375px and 6.8px at 360px, 21.8px at 390px. The buttons' width comes from the layout, not from their content, so the tap area is unchanged. **Still wraps at 320px**, short by 2.2px; see open question 7. |
| 09-30 | you | Picker labels and the level select are semibold (`--font-weight-label`), the open option list regular | Reported as wrong. Cause: the original's Baloo was only ever available at 600 and 700, so its inherited 400 rendered as 600, while next/font gives a true 400. The select follows the original's `SelectBox`, which is semibold closed and regular in the list. The original's `:checked` colouring of that list was left out: weights were the question, and it would be a second white-on-`--color-bg-secondary`. |
| 09-30 | agent | In forced-colours mode the selected AI/Me option and the selected language card are `Highlight`/`HighlightText` | Found in review, answering the question the forced-colours row above left open. The forced-colours mode swaps the blue fill, tint and border for Canvas and CanvasText, so a selected option looked like the others once focus left the group. System colours are not swapped, so both use them; on the AI/Me toggle the sliding pill is `Highlight` too, and the option paints itself only in the baseline without anchor positioning. **First version was wrong, seen in Jaron's screenshot:** the fill was right but the label sat in a white box, white text on white. The browser paints a Canvas backplate behind text in forced-colours mode; `forced-color-adjust: none` on the two selected elements removes it. **Then checked again by Jaron in forced-colours mode: white text on the dark purple fill, on both controls.** The mode cannot be entered from the tooling, so that check was his. |
| 09-30 | you | Conversation text carries `lang` from `LANGUAGES[…].htmlLang` (Norwegian is `nb`), resolved once in `LanguageBuddy` and passed down as `conversationLang` | Screen readers pick the voice from `lang`, and `<html lang="en">` made a Norwegian bubble read with an English voice. It sits on the text itself, not on the thread, so the speaker label and the "Listening…" placeholder (`lang="en"`) stay English. Passed as a prop, not context, since the state context was removed on purpose. The `lang="en"` on the placeholder is Jaron's refinement of the agent's proposal. |
| 09-30 | you | The draft editor turns off `spellCheck`, `autoCorrect` and `autoCapitalize` | The text is in the practice language, not the keyboard's, so iOS corrections and red underlines work against the user. Not checked on a device yet. |
| 09-30 | you | `ConversationControls` split into `ComposingControls`, `ErrorControls` and `IdleControls`, each using `useSessionDispatch()`; it stays as a switch that takes no callbacks | Nine callback props made one component of three, and every new concern had to be threaded through all of them. `ConversationScreen` no longer touches dispatch. The `Extract` types for the three groups live in `session-reducer.ts` (Jaron's choice over local types, so the list of composing states is defined next to the union). The `.error*` styles moved to `error-controls.module.css`. |
| 09-30 | agent | `composedTextOf(turnState)` in the reducer file is the one definition of "the text being composed" | It was worked out twice, in `ConversationScreen` for Send and in the controls for the button's `disabled`. The reducer's own blank check on `USER_TURN_SENT` stays; so does the one in `ComposingControls`. |

## Keeping the experiment honest

The existing app at <https://github.com/jaronbarends/language-buddy> is a reference, and
this repo exists partly to see what an AI agent produces on its own. Those pull against
each other, so the rule is deliberately blunt.

### The agent does not read the reference repo unless pointed at a specific file

No browsing ahead, no listing the tree, no "just checking" — and this holds for parts of
the app that already exist here, not only for unbuilt stages.

The reason is not only contamination. In a correction round **Jaron leads**: he says what
should change. An agent that goes and reads the reference implementation of something
nobody asked about stops being corrected and starts overwriting, and the diff turns from
"what was asked for" into "what the agent decided the other app did better". That is the
control the rule protects.

In practice: the change gets described, the agent implements it its own way, and what
comes out wrong gets corrected. If the agent believes reading a particular file would
genuinely save time, it asks first, and the answer may be no. Anything it does read gets
named out loud as it happens.

The agent cannot unsee something. So if it hits out-of-scope material by accident — an
import leading somewhere, a file holding more than expected — it says so rather than
using it quietly.

*Already leaked, on the agent's own initiative before this rule existed:* two full
repository tree listings, so the paths and filenames of ~35 stylesheets are known,
including `Evaluation.module.css`. Names and existence only, no contents.

*Read because Jaron pointed at it:* `src/styles/settings/` (the tokens),
`components/button/Button.*`, `chatSetup/components/` (`LanguagePicker`, `SetupForm`,
`SegmentedControl`, `SelectBox`), `styles/elements.css` and `styles/reset.css`.

*Seen incidentally in `SetupForm.tsx`, not used:* a browser speech-recognition support
check that disables Start, per-language voice-support props, and a scenario concept
(`freeformScenarios`). Jaron judged the speech part not a concern, since it concerns native
browser functionality this version does not use. The scenario concept touches the open
persona question for stage 2.

### What the reference is legitimately for

When a file *is* pointed at, what it settles still matters:

- **Colour, typography, spacing, the bevel.** Taste and brand — never the agent's to
  invent, any more than the brief was.
- **Architecture, state modelling, component boundaries, error handling.** Resembling the
  existing app here measures nothing except past decisions reflected back.
- **Component implementations are the grey zone.** `LanguagePicker` was both at once: its
  layout logic is design, its markup choice is engineering. Porting it whole discarded an
  answer the agent had already given, and that row is marked `ported` above for exactly
  that reason.

Two mechanisms keep this measurable rather than a matter of impression: the Source column
above, and keeping correction rounds on their own branches, so `git diff` between them is
literally "what changed once the reference was consulted".
