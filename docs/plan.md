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
| Conversation history | Gemini `previous_interaction_id` chaining | History lives server-side at Google; we send only the new utterance, plus the model, system instruction and response format, which go with every call. The client keeps its own array for rendering, and the chain id is read from it: each AI turn carries its `interactionId`. |
| Chat response shape in stage 2 | `{ interactionId, reply }` — no per-turn `correction` | Whether feedback is per-turn is exactly the stage 4 question. Shipping stage 2 without it keeps that open instead of defaulting by accident. |
| TTS providers | All three from the spike: Azure (default), Google, ElevenLabs | Three implementations stress the interface in a way two don't — see the voice-table row. |
| Provider interface | `synthesize({ text, language, gender }, signal)` | The spike hardcoded `nb-NO`. Language has to cross the boundary, and each provider resolves it differently. Gender joined it on 10-03, see the log. |
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
       │        │            │                        │
       │        │            └─ REPLY ─▶ listening    │
       │     (network)                                │
       │        ▼                                     │
       └──── error ──(dismiss)──▶ awaitingUser ◀──────┘
```

- **`awaitingUser`** — one button, enabled. Labelled *Start conversation* when there are
  no turns yet, *Reply* otherwise.
- **`listening`** — live transcript rendering `{ finalized, interim }`. Carries
  `microphoneIsLive`, false on entry and set by `MICROPHONE_STARTED` once the recorder is
  running and audio goes to Deepgram; until then the bubble says "Preparing mic…" and has
  no dot, because anything said before that is not heard. The dot marks that the
  microphone is live. If it is not live within `LIVE_CONNECT_TIMEOUT_MS` (10 s, counted
  from the moment the permission is granted) the turn ends in `error`.
- **`reviewing`** — recording stopped, text settled, not yet sent.
- **`editing`** — the text in a `<textarea>`. Carries `draftBeforeEdit` so *Cancel edit*
  can restore it; that is why it is its own state rather than a flag on `reviewing`.
- **`aiThinking`** — `/api/chat` in flight; typing-dots bubble. May carry a
  `pendingReply`: the chat answer is in, but the evaluation of the user turn it answers
  is still pending, so the reply is held and released (into `aiSpeaking`) the moment the
  evaluation settles. See **Evaluation of a user turn** below.
- **`aiSpeaking`** — TTS audio playing, words progressively highlighted in the AI bubble.
  Reply is enabled here: `LISTENING_STARTED` is accepted from `aiSpeaking` as well as
  `awaitingUser`, which cuts the speech off and moves to `listening`. The bubble then
  shows its full text without highlight, as after the audio ends.
- **`error`** — recoverable. Carries `message` (fixed generic text chosen by the caller),
  an optional `detail` (the raw error, truncated to `MAX_ERROR_DETAIL_LENGTH`) and `from`
  (the turn state it came from). `FAILED` is only accepted from `aiThinking` and
  `listening`; anywhere else it is a late arrival and is ignored, so it can't overwrite a
  draft. Dismissing goes back to `aiThinking` when `from` is `aiThinking` (the driver
  effect re-runs on entering it, which is the retry), otherwise to `awaitingUser`; a
  transcript in progress when listening failed is discarded. The diagram above shows the
  `awaitingUser` route only.
- **Evaluation of a user turn** (stage 4) is not a turn state but a field of the turn: a
  user turn carries `evaluation`, `pending` from `USER_TURN_SENT`, then `ready` (with a
  `correction` that may be `null`) or `failed`. `EVALUATION_RECEIVED` and
  `EVALUATION_FAILED` match on the turn id, like the speech actions, and are ignored for a
  turn that is not `pending`. It runs in its own driver, `use-evaluation-driver.ts`, which
  follows the turn and not `aiThinking`: a failed chat call does not cancel it, and Try
  again does not request it a second time. The ordering rule, the reply never before the
  correction has settled, lives in the reducer (`AI_TURN_RECEIVED` holds the reply as
  `pendingReply`), so it is a pure function and not async coordination between hooks. A
  correction that does not answer within 10 s becomes `failed`.
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
├── spikes/ai-voice-demo/         reference spike, untouched apart from one added note in findings.md
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
    │   ├── use-chat-driver.ts    the Gemini round trip in `aiThinking`; picks the real or
    │   │                         the mock route via `NEXT_PUBLIC_USE_MOCK_CHAT`
    │   ├── use-evaluation-driver.ts  the evaluation of a user turn, with its 10 s timeout;
    │   │                         the same mock switch
    │   ├── use-live-transcription.ts  mic + Deepgram socket while `listening`
    │   ├── use-audio-playback.ts  `/api/tts` + the shared `<audio>` element in `aiSpeaking`,
    │   │                         and `unlockAudio()` for the click handlers
    │   └── use-mock-tts.ts       fakes TTS playback; on when `NEXT_PUBLIC_USE_MOCK_TTS=true`
    └── lib/
        ├── session-reducer.ts    the state machine
        ├── languages.ts          provider-neutral language registry
        ├── cefr.ts               A1–C2 + labels
        ├── word-timing.ts        estimateWordTimings / countSpokenWords
        ├── chat-schema.ts        zod: the chat request (a union on `kind`) and response, the
        │                         evaluation request and response (correction segments), the error body
        ├── post-json.ts          `postJson`: the fetch both drivers use, throwing the route's own
        │                         error text
        ├── chat-request.ts       `readChatRequestBody`, `readEvaluationRequestBody` and `errorResponse`,
        │                         shared by the real and the mock routes
        ├── prompt.ts             `buildChatSystemInstruction` and `buildEvaluationSystemInstruction`,
        │                         assembled from shared and per-persona named sections
        └── mock-conversation.ts  canned AI lines and corrections (mock routes) and sample user
                                  lines (the dev state stepper)
```

`src/app/api/chat/route.ts` and `src/app/api/mock/chat/route.ts` exist since stage 2;
`src/app/api/chat/gemini-chat.ts` beside the first holds the Gemini call (`askGemini`),
the model name and Gemini's `{ reply }` schema, and is server only. `.env.example`
documents the variables; `.env.local` (not committed) holds the values.

Stage 4, step 1 adds `src/app/api/evaluation/route.ts` and `src/app/api/mock/evaluation/route.ts`,
with `src/app/api/evaluation/gemini-evaluation.ts` beside the first (`askGeminiForEvaluation`,
its own model constant, and Gemini's `{ correction }` schema). The route is stateless: no
`previous_interaction_id`. Nothing in the client calls it yet.

`src/app/api/stt/token/route.ts` and `src/hooks/use-live-transcription.ts` exist since
stage 3, step 1; the token mint (`mintLiveToken`) sits in the route file.

Stage 3, step 2 adds `src/app/api/tts/route.ts`, `src/lib/tts/{types,index,azure,google,elevenlabs}.ts`
(`index.ts` holds `getTtsProvider()` and `VOICE_GENDER`, the one switch between female and
male voices) and `src/hooks/use-audio-playback.ts` (the playback effect plus `unlockAudio()`,
called from the Start chat, Send and Reply clicks).

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
`FaGraduationCap` (its Evaluate button — not used: stage 4 chose per-turn correction), `FaVolumeXmark` (a no-voice
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
   Enter makes the browser fire a click on the default button too. Verified on an iPhone in
   stage 3: the AI's audio plays without a second tap.
3. **Layout for iOS chrome.** A flex column at `100dvh` rather than a `position: fixed`
   bar — a fixed element is expected to drift when the keyboard opens and the URL bar
   collapses (the intent; not verified) — plus `viewport-fit=cover` and
   `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. The column does not keep the controls above the keyboard in
   home-screen mode: see the 10-02 row and open question 8.
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

Branch `stage/1-static-ui`. No network calls at all; `use-mock-driver.ts` (since renamed `use-mock-tts.ts`) dispatches the
same actions the real Gemini, TTS and Deepgram drivers will, on roughly the same timings,
so the UI and the reducer are exercised for real and only the source of events is fake.

Verified on desktop Chrome and, by the user, on iPhone Safari (iOS 26): layout and the
language grid at phone width; the control bar clears the home indicator; the bar stays put
while the thread scrolls and the URL bar collapses; overscroll is contained; the thread
auto-scrolls to new bubbles; the editor does not trigger focus-zoom and Send stays
reachable with the keyboard open. **That last claim does not hold in `editing`:** as a
home-screen app Edit, Cancel edit and Send end up under or partly under the keyboard, and in
a Safari tab Send is partly covered. See the 10-02 row and open question 8.

### Stage 2 — Gemini conversation — **done**

Branch `stage/2-chat-api`. `/api/chat` with `@google/genai` `ai.interactions.create`, `previous_interaction_id`
chaining, a zod-validated JSON response, and a system instruction built from
`{ language, level }`. Needs `.env.local` with `GEMINI_API_KEY`.

A request is one of two kinds, derived from `turns`. `aiStarts` (no turns yet, the AI
speaks first) carries `{ language, level }` and neither input nor id. `userTurn` carries
`{ language, level, input, previousInteractionId? }`: `input` is the user's last turn, 1 to
5000 characters, and `previousInteractionId` the `interactionId` of the last AI turn, at
most 200 characters, absent only when the user spoke first. The route validates
`language` and `level` against the registries, builds the system instruction on every
call (the model, system instruction and response format are sent each time; only the
history is chained), and answers `{ interactionId, reply }`. An empty or whitespace-only
reply is a failure, not an answer.

**Mock or real, per concern.** `NEXT_PUBLIC_USE_MOCK_CHAT=true` makes `use-chat-driver.ts`
(and, since stage 4, `use-evaluation-driver.ts`, calling `/api/mock/evaluation`)
call `/api/mock/chat` instead: same contract, canned lines, 404 outside `next dev`. The
mock keeps no state; its interaction ids are `mock-<n>`, so the next request's
`previousInteractionId` tells it which line comes next. A `NEXT_PUBLIC_` value is inlined
at build time, so changing it needs a restart. TTS gets the same treatment in stage 3
(`NEXT_PUBLIC_USE_MOCK_TTS`), and its mock must stay client-side because it has no audio.
Mock STT is not kept: Edit covers typed input.

Verified: `npm run lint` and `tsc --noEmit` clean; both routes called directly (the mock
chain `mock-0` → `mock-1`, a retry getting the same line, a bad `level` giving 400); and,
by the user in the desktop browser, a full conversation with `NEXT_PUBLIC_USE_MOCK_CHAT=true`
and with the real Gemini call; and, with a deliberately wrong `GEMINI_API_KEY`, the `error`
state with its Try again button. **Not verified:** iPhone Safari (this stage adds nothing
device-specific), and that Try again succeeds once the key is right again.

### Stage 3 — Deepgram live STT + TTS + highlighting

Branch `stage/3-voice`, built in three steps with a check-in after each: (1) live STT,
(2) TTS, (3) highlighting and the `findings.md` note. Step 1 is the first item below.

Verified by the user, on desktop and on an iPhone: step 1, and step 2 with all three TTS
providers and with both voice genders; on the iPhone the audio plays without a second tap.
With a deliberately wrong `AZURE_SPEECH_API_KEY` the AI's text stays on screen, nothing is
spoken, and the error shows only in the console: the text-only fallback works. Step 3: the
highlight follows the audio on desktop and on an iPhone, and stops when Reply cuts the AI
off. A live transcription of more than 20 seconds comes out right. Denying the microphone
lands in the recoverable error with its message, on desktop and on an iPhone (tried in a
private Safari tab, since the denial is remembered per origin and would otherwise have to
be undone in the settings). **Not tried on a device:** the microphone stopping during a
recording (a call or another interruption that ends its track). Disconnecting a headset
does not do it: iOS then switches to the phone's own microphone and the track continues.

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

### Stage 4 — Evaluation: per-turn correction, in its own call (design decided 2026-10-08, not built)

A written comparison came before any implementation. The question was a **three-way**:

1. **After each user turn** — what the spike does.
2. **On demand**, via an Evaluate button — what the reference screenshots show, rendered
   inline in the thread and covering several earlier utterances at once.
3. **Once at the end of a session** — what the current production app does.

Decided: **option 1, per turn.** Short feedback on every turn is preferred over several
comments about a whole conversation. **Not chosen:** the Evaluate button (`FaGraduationCap`
stays unused) and the end-of-session summary.

**Two calls, not one.** The first design put `correction` in the chat response. It was
built (step 1 of the first plan) and then replaced, after measuring, by a separate call
to a separate prompt, as in the production app. Both calls start when the user sends, in
parallel:

- `/api/chat`, as in stage 2: `{ interactionId, reply }`, chained with
  `previous_interaction_id`. No `correction` in it; the persona prompt loses its
  *Correction* section.
- `/api/evaluation`: `{ language, level, input }` in, `{ correction }` out, where
  `correction` is `Segment[] | null`. **Stateless**: no `previous_interaction_id`, so the
  corrections never enter the conversation chain, and the corrector sees only the
  user's latest message. The AI's opening turn has no user message and makes no call.

Why two calls: the corrector assigned the segment types wrongly in 0 of 30 corrections
(against 4 to 7 of 30 for one call, with or without an explicit second role in the
prompt), handled the speech-to-text hint better, and the chat call
returns to `{ reply }` only, with no added latency before TTS (the one-call version cost
about +255 ms). The price is two Gemini calls per turn, a second route, and the pending
and failure states below. The measurement is in the decision log; it is small (5 runs
per input, 8 inputs) and its heuristics were crude, so read it as a direction.

**Segments.** `correction` is a list of `{ type: "text" | "userInput" | "suggestion",
text }`; joined in order, the texts read as one short explanation. `text` is the
explanation, in English at B2/C1. `userInput` quotes only the part of the user's message
the explanation needs, never the whole message. `suggestion` is the more natural
alternative. Both of those are in the target language. The segments carry their own
spaces and the model adds no quotation marks: the type marks the phrase. A delimiter in
a string cannot carry three kinds without parsing, and quotes cannot be parsed (French
and Italian apostrophes), so the schema enforces a typed list. `null` means no mistake
worth naming.

**Prompts: shared part, then one part per persona**, as in the production app. In
`prompt.ts`:

- *Shared*, in both system instructions: the user's language and CEFR level, their
  English level (B2/C1, one constant), the note that the input comes from speech-to-text
  and illogical words may be transcription errors (new for the chat persona), and that
  the input is spoken, never written.
- *Chat persona*: as in stage 2, without the *Correction* section.
- *Corrector persona*: a native speaker and teacher of the target language, informal and
  warm (and terse, with no praise: both stand, as in the original). **The rules and the
  segment explanation are in its `system_instruction`; `input` is only the user's
  message.** One mistake per turn, the most instructive: grammar, vocabulary that could
  be more natural, or nuance, calibrated to the user's CEFR level. If a mistake may be a
  transcription error, say so instead of explaining it as a language mistake. No
  feedback on spelling, spaces, punctuation, capitalization or diacritics. Do not point
  out what is correct. And: *the message may not contain anything worth correcting; do
  not go looking for a mistake, and never fall back on spelling, spaces, punctuation,
  capitalization or diacritics just to have something to say.*

The measurement used the rules in `input`, not in `system_instruction`: re-measure once the
real prompts exist.

**No code guard for spelling-only corrections.** Turning a correction into `null` when
`userInput` and `suggestion` differ only in case, diacritics or spaces was considered and
rejected: `null` shows "No corrections. Great!", which is wrong when the message had other
mistakes and only the spelling one was returned. The prompt is the only defence.

**Display.** The correction is not a bubble of its own: it is a section attached to the
bottom of the user's bubble (`resources/screenshots-reference/evaluation-attached-to-bubble.png`).
The bubble keeps its outline, and a divider separates the user's text from the correction
below it. The section's background is `--color-blue-50`; the user's text keeps the normal
user-bubble background. `text` segments are plain. `userInput` and `suggestion` are italic,
and only `suggestion` gets a background, the user-bubble background
(`--color-bg-secondary-subtle`). No new tokens. **The correction is never spoken**: TTS
reads `reply` only. The section shows one of four things, each as small as possible
(one line for the two fixed texts):

- while the call runs: "Evaluating…" (a placeholder, so the bubble does not jump);
- the segments;
- "No corrections. Great!" when the answer is `null`;
- "Evaluation failed" when the call fails, returns something that does not fit the
  schema, or does not answer within **10 seconds**.

**Order.** The correction may appear before the AI's reply, but the reply must not appear
before the correction has been shown (as segments, "No corrections. Great!" or
"Evaluation failed"). So the reply waits for the correction call to settle, and the 10 s
timeout is what stops a hanging corrector from holding the reply. At the timeout the
request is aborted and a late answer is ignored, so what is on screen is final. **TTS
playback starts only once the reply is on screen**; fetching the audio may start as soon
as the reply arrives.

**Try again.** The error state retries the chat call only. A correction that has already
arrived is kept and not requested again; a failed correction is not retried.

**History.** The corrections are not in the conversation chain, because the corrector is
stateless and branches off nothing. Whether giving it context (a branch off the chain
with `previous_interaction_id`, as the original app did) would improve the corrections is
untested.

**Measured on 2026-10-06 and 2026-10-07** (`gemini-3.1-flash-lite`, Norwegian B1, 5 runs
per input over 8 inputs: clear mistakes, correct sentences, a long sentence with a small
mistake, a speech-to-text-like error, a lower-case sentence and one without diacritics).
Three variants, 40 calls each: A the one-call prompt, C one call with an explicit second
role for `correction`, D a separate corrector call with the original app's wording.

| | A | C | D |
|---|---|---|---|
| Segment types wrong | 7 | 4 | 0 |
| Correction given on a correct sentence | 0 | 0 | 0 |
| Correction given where only spelling or diacritics were off (10 calls) | 10 | 10 | 10 |
| ...of which spelling-only | 6 | 3 | 4 |
| `eld` (a likely transcription error) null or flagged as one, of 5 | 1 | 0 | 3 |
| Quotation marks in the text, of 30 | 4 | 3 | 7 |

Known weak spots, not solved: the spelling ban does not hold when spelling is the only
visible defect, the transcription hint works for three of five, and the separate call
produces more quotation marks. Moving the segment rules into the schema's `description`
fields was tried and was worse than keeping them in the prompt (more wrong types, and
the explanation in the wrong language).

**Measured again with the real prompts** (step 1: rules in `system_instruction`, through
`/api/evaluation` on the dev server, 40 calls over the same 8 inputs): wrong types 1 of 30;
a correction on the two correct sentences 0 of 10; a correction on the lower-case and
no-diacritics sentences 10 of 10, 5 of them spelling-only; `eld` null or flagged as a
transcription error 2 of 5; quotation marks in the text 8 of 30. The added line about not
looking for a mistake changed nothing on the spelling-only inputs. Latency of the call,
median 2550 ms (1897 to 3241), four requests at a time, dev server included, so well under
the 10 s timeout and about as long as the chat call.

**Build steps (proposed; check-in after each).**

1. **Done.** Prompts and routes: split `prompt.ts` into shared, chat and corrector parts; take
   `correction` back out of `ChatResponse` and the chat Gemini call; the new
   `/api/evaluation` route with its Gemini call and a mock route; both mocks. Measure again
   with the real prompts.
2. **Done.** State and driver: the correction on the user turn (pending, ready, failed), the two
   calls in parallel, the 10 s timeout and abort, the reply held until the correction has
   settled, TTS playback gated on the reply being on screen, the Try again rule.
   Until step 3 the user's bubble shows the evaluation as plain text ("Evaluating…", the
   segments as `[type: text]`, "No corrections. Great!", "Evaluation failed"), a
   temporary rendering in `turn-bubble.tsx` so the order and timing can be seen.
3. Display: the attached section with its four contents, italics and the one background.
4. Verify on desktop and on an iPhone, including a wrong key for `/api/evaluation` only
   (reply still arrives, "Evaluation failed"), a corrector that does not answer in 10 s,
   and Try again after a failed chat call.

### Out of scope

Continuous / open-microphone mode, with no push-to-talk and the ability to interrupt the
AI mid-sentence by speaking over it. (Tapping Reply while the AI speaks is in scope: see
the 10-03 row in the decision log.) Two unresolved risks in the spike: whether Safari's audio unlock survives
a whole session without repeated gestures, and echo when the mic stays open while AI audio
plays through the phone speaker. Not proven, not in scope.

Landscape phones: no minimum height is set for the capped text in the control bar, so on a
short viewport it can shrink to nothing. See the 10-01 row in the decision log.

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

1. **Evaluation design** — decided 2026-10-08: per-turn correction in its own call, see
   stage 4. Still open inside it: whether the corrector would do better with the
   conversation as context, and the weak spots listed there (spelling ban, transcription
   hint, quotation marks).
2. **Tests.** There are none, so review is currently the only quality gate.
   `word-timing.ts` and the reducer are pure and would suit Vitest. The Gemini call now
   lives in `askGemini`, so the route's failure paths can be tested with it replaced.
3. **The AI persona and scenario — decided for stage 2.** Carried over from the spike,
   written in English: a generic friendly acquaintance, freeform topic, 2–4 sentences per
   turn, at most one question. Named personas or scenario cards would be a different
   feature. Later personas (at least one that evaluates a conversation) may share parts
   such as the tone of voice, which is why the prompt is assembled from named sections in
   `prompt.ts`; nothing shared is built yet.
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

   Non-text contrast of control borders is a separate matter, also knowingly accepted: the
   border of the language cards, the level select and the starter toggle is
   `--color-border-input` on white, about 1.48:1 (about 1.36:1 against the page colour),
   under the 3:1 WCAG 1.4.11 asks for. Computed from the token values, not measured on a
   screen; see the 10-02 row in the decision log.
6. **Ending a session is one tap and unrecoverable.** No confirmation, nothing persisted.
   Consistent with the brief, but it sits next to Reply.
7. **"Cancel edit" still wraps at a 320px viewport**, by 2.2px, and so do the other buttons in
   its row. 320px is the original iPhone SE and iPhones in Display Zoom; iOS 26 devices are
   375px or wider otherwise. Not fixed: closing 2.2px means changing a gap, a font size or
   the screen's side padding, and none of those was asked for.
8. **Edit, Cancel edit and Send are partly or fully covered by the keyboard while editing.**
   Observed by the user on an iPhone with a long draft, with the app added to the home
   screen: with the keyboard open in the `editing` state, Edit and Cancel edit end up under
   the keyboard and Send is partly covered by the keyboard's accessory bar (the chevrons and
   the checkmark). With very short drafts a smaller part is covered; that was reported, not
   measured. In a Safari tab the buttons sit above the keyboard but are covered by Safari's
   address bar and the accessory bar. The checkmark on the accessory bar closes the
   keyboard and frees the buttons. The cause is the `100dvh` column, which the keyboard does
   not shrink; the 40vh text cap makes it worse but is not the whole cause. **Accepted for
   now and to be reconsidered at a later stage**, see the 10-02 row in the decision log. It
   relaxes the brief's requirement that Send, Edit and Cancel stay usable with the keyboard
   open. Directions, all unverified ideas and not decisions: the screen height following
   `window.visualViewport`, as a spike first; the controls moving above the editor while
   editing; and the `interactive-widget` viewport setting, whose behaviour in iOS Safari
   has not been checked.
9. **Public deployment.** A `previousInteractionId` is trusted as a secret held by the
   conversation's owner: nothing binds it to a caller or session, and all calls share one
   API key, so conversation isolation is an unverified assumption. There is no
   authentication or rate limit; the only bounds are 5000 characters of input and 200 of
   id. Since stage 3 the same holds for two more endpoints, each spending on a paid
   account: `/api/stt/token` hands anyone a Deepgram token (short-lived, but a new one on
   every call, and it opens a live-transcription socket on our account), and `/api/tts`
   synthesises up to 1500 characters per call with whichever provider `TTS_PROVIDER`
   names. Decide the protection before the first public deployment.
10. **Buffering the audio while the Deepgram socket opens.** Raised in the stage 3 review
    (the "Preparing mic…" point). The recorder starts only once the socket is open, so
    nothing said before then is recorded, and the screen shows "Preparing mic…" until it
    does. The alternative is to start `MediaRecorder` right after `getUserMedia`, keep the
    chunks in order (the first one carries the WebM header) and send them as soon as the
    socket opens: no words lost and no wait before speaking. It costs code for the
    ordering and for flushing faster than real time, and the first transcript arrives in
    a burst. Not built yet. Measured on an iPhone after the stage 3 review: setting up the
    microphone connection takes about 1.5 seconds, which Jaron finds too long, so this is
    to be built at a later moment.
11. **One bubble for the AI's thinking dots and its text.** Wanted later: an animation in
    which the dots disappear, the bubble grows to the size of the text, and the text
    becomes visible. Not possible with the current structure, which is not part of stage
    4. Today they are two elements: `ThinkingBubble` (a `div role="status"`, rendered
    after the turns while the state is `aiThinking`) and, once the reply is accepted, a
    `TurnBubble` (a `p`, `key={turn.id}`). They share the `Bubble` frame and so look the
    same, but one unmounts and the other mounts at the transition, so nothing exists to
    animate: the bubble jumps from the size of the dots to the size of the text. What it
    needs: (1) one element that survives the transition, so a key that is the same
    before and after. The turn id is only created when the reply arrives (the chat driver
    calls `crypto.randomUUID()` then), so it cannot be that key; either key on the
    position ("the Nth AI turn") or have the reducer create the id when it enters
    `aiThinking`; (2) a size transition that works for content of unknown size, since
    height and width cannot be animated to `auto` directly (the `0fr` to `1fr` grid
    trick, or measuring the content); (3) one role: the thinking bubble is a `status`
    and the turn bubble a paragraph in the thread's `role="log"`, so what a screen reader
    announces has to be decided for the shared element. Since stage 4 a held reply
    (`pendingReply`) keeps the dots on screen until the evaluation has settled, which
    fits either structure. The same applies to the user's bubble, which grows when its
    evaluation arrives. Not built; to be done together with the other animation work.
    Two ways to get the surviving element, weighed on 2026-10-08:
    (a) **Key by position, no change to the data.** The thread renders one `AiTurnBubble`
    with a key such as `ai-<number of AI turns before it>`, both for the waiting bubble
    (state `aiThinking`) and for the real turn, so React reuses the element. A few lines
    in `conversation-thread.tsx`; nothing changes in the reducer, the types or the
    drivers. It works because turns are only appended within a session. Recommended.
    (b) **Jaron's alternative: the waiting is part of the AI turn.** The AI turn exists from
    the start with a status (`pending`, `ready`, as `Evaluation` has), and the
    `TurnBubble` shows the dots while it is pending. It gives one element with its own
    identity and one role, and fits the `Evaluation` pattern. It costs: the AI turn
    becomes a union, a pending one having no `text` or `interactionId`, so everything that
    reads "the last turn" has to skip it (`createChatRequestBody`, `lastUserTurnIsBeingEvaluated`,
    the `previous_interaction_id` derivation, the stepper's `lastAiTurn`, what the
    playback hook reads); two sources of truth, `turnState: aiThinking` and a pending turn,
    which every transition (`START`, `USER_TURN_SENT`, `FAILED`, retry) must keep equal,
    and which the dev stepper forcing `aiThinking` would break; the error state, which
    shows no dots today, must remove the pending turn or give it a status; and the
    reducer is pure, so the id has to come in with the action or be positional. It pays
    off if a failed AI turn is ever shown inline with a retry on that spot. Not planned.

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
| 09-30 | agent | `composedTextOf` takes a `ComposingTurnState` and has no `default` branch | On the reviewer's suggestion. It took any `TurnState` and returned `""` for the rest, so a fourth composing state would have silently given empty text and a permanently disabled Send. With the narrowed parameter, a state added to `ComposingTurnState` without a case fails `tsc` (the function no longer returns on every path). Verified by deleting a case. |
| 10-01 | agent | The text of the live transcript, the settled draft and the editor is capped at `max-height: 40vh` and scrolls inside its bubble; the control bar itself has no cap | Found in review: a long transcript, draft or edit grew the bar until the buttons and the thread were pushed off the screen. The cap itself was the agent's proposal, first as a cap on the whole control bar; **Jaron changed that to a cap on the text only and chose the 40vh.** The cap sits on the text, not the bar, so the frame (padding, corner, focus ring) is never inside the scrolling region and the buttons stay in view; the bar grows with the capped text plus the buttons. All three share the cap because they swap places without the text being allowed to jump. `vh`, not `dvh`, deliberately: the cap does not follow the keyboard or the collapsing URL bar. Built as one `BubbleText` span (made block by CSS) in `bubble.tsx`. Measured in desktop Chrome at a 911px viewport, with a long draft inserted programmatically: text 364px, bar 575px, thread 336px. Not tested on an iPhone. |
| 10-01 | agent | While `listening`, the live transcript follows its newest words, for as long as the user has not scrolled away from the bottom; scrolling back to the bottom resumes following | Proposed in review and approved by Jaron. With the text capped, the newest words would otherwise fall below the edge. "At the bottom" is within 4px of it, an agent's reading of the decision, as scroll positions are fractional on high-density screens. The flag changes only on scroll events and the scroll runs in a layout effect keyed on the transcript's words, so a re-render without new words does not scroll. **Logic only, not exercised:** the dev stepper's transcript never grows, so neither following, stopping nor resuming has been seen to work. Not tested on an iPhone. |
| 10-01 | agent | The settled draft and the editor start scrolled to the end of their text | Proposed in review and approved by Jaron. The draft replaces a live transcript the user was reading at the end of, and must not jump when recording stops; the editor puts the caret at the end, which for a long draft is below the fold of the capped text. Both are set in a layout effect on mount, so neither is seen at the top for a frame, and neither follows anything afterwards. Caret-while-typing in a long editor was tested with real typing by Jaron in desktop Chrome, where it works. The scroll-on-entry itself has not been seen with a long draft, as the dev stepper's draft is one line. Not tested on an iPhone. |
| 10-01 | you | Landscape phones are not supported, so the capped text has no minimum height | At 40vh the text region can shrink to nothing on a short viewport: the composing bar's other parts (padding, Send, the Edit/Cancel row, gaps) come to roughly 180–215px, so below about 450–540px of viewport height little or no room is left for text. Estimated from the layout, not measured on a device. Decided as not worth handling rather than left open. |
| 10-02 | you | With the keyboard open in `editing`, Edit, Cancel edit and Send being covered on an iPhone is accepted for now, to be reconsidered at a later stage | Observed by the user on an iPhone with a long draft, as a home-screen app and in a Safari tab. As a home-screen app, Edit and Cancel edit end up under the keyboard and Send is partly covered by the keyboard's accessory bar; with very short drafts a smaller part is covered (reported, not measured). In a Safari tab the buttons are above the keyboard but covered by Safari's address bar and the accessory bar. The cause is the `100dvh` column, which the keyboard does not shrink, not only the 40vh text cap; the checkmark on the accessory bar closes the keyboard and frees the buttons. Options put to the user in review: a `visualViewport`-based height as a spike, the buttons above the editor while editing, or accepting it. The user chose to accept. This **relaxes the brief's requirement** that Send, Edit and Cancel stay usable with the keyboard open, and contradicts the Stage 1 line saying Send stays reachable with the keyboard open. Open question 8 lists the directions to revisit. |
| 10-02 | you | The whitespace between two spoken words gets the read-along highlight too, so the band is continuous; a `HIGHLIGHT_SPACES` constant in `highlighted-text.tsx` stays as the switch | Found in review: the highlight left a gap between spoken words, which had never been a deliberate choice, since only word tokens were marked. Jaron asked for a version with the spaces highlighted, compared both by flipping `HIGHLIGHT_SPACES`, and chose `true`. The constant stays on purpose so this can be reconsidered; `false` gives the earlier behaviour, words only. A whitespace token is marked when the words before and after it are both spoken, so the whitespace after the last spoken word stays unmarked until the next word is spoken. The existing `spokenWord` style is reused. Verified in desktop Chrome by element geometry, not screenshots: 4 spoken words give 7 highlighted spans, and a space at a line end has zero width, so it leaves no stub. **Not checked:** a whitespace token containing a newline, and iOS. |
| 10-02 | agent | The top safe-area inset is handled: `--safe-top` (`env(safe-area-inset-top, 0px)`) in `globals.css`, applied as top padding of the setup screen and of the conversation screen | Found in review: `viewport-fit=cover` is set but only the bottom inset existed, so in the home-screen app on an iPhone the page runs under the status bar (the user's screenshot shows thread text passing under it, and the setup header, 24px from the top, would very likely sit under a notch or Dynamic Island; an estimate, not seen). Proposed in review and approved by Jaron. The setup screen's top padding is `calc(var(--size-24) + var(--safe-top))`. The conversation screen gets `padding-top: var(--safe-top)` on `.screen` itself, not in the thread, so the thread's scroll area starts below the status bar and scrolled text never passes under it; it counts inside the 100dvh. The thread's own padding and its auto-scroll are untouched. Landscape is not supported, so there are no side insets. Checked in desktop Chrome, where the inset is 0 and nothing moved; with a temporary `--safe-top: 47px` set in the console, the setup header moved from 24px to 71px and the conversation thread started 47px lower, with the control bar unchanged. **Checked by Jaron on an iPhone with a low status bar (not a notched one), no problem reported; not tested on a notched iPhone or a Dynamic Island device.** It is not known whether that was the home-screen app or a Safari tab. |
| 10-02 | you | The contrast of control borders is knowingly accepted: language cards, level select and starter toggle use `--color-border-input` at about 1.48:1 on white | Found in review: WCAG 1.4.11 asks 3:1 for the boundary of a control, and `--color-border-input` (`--color-gray-100`) on white is about 1.48:1, or about 1.36:1 against the page colour `--color-gray-50`. Computed from the oklch token values with the standard sRGB conversion, not measured on a screen. The values come from the existing Language Buddy design system (decision 09-28), the same way the 4.05:1 and 3.16:1 text pairs in open question 5 do. The selected states pass: the pink border at 4.05:1 and the blue pill at 3.16:1. Open question 5, which covers text pairs, now mentions this. |
| 10-03 | you | Reply is enabled in `aiSpeaking`; tapping it stops the speech and goes to `listening` | Waiting for a long reply to finish was too slow. `LISTENING_STARTED` is now valid from `aiSpeaking` as well as `awaitingUser`; leaving `aiSpeaking` is the interruption, so the bubble drops its highlight and shows the full text as after a normal finish. Reply stays disabled in `aiThinking`. Not the open-mic mode: it needs an explicit tap, so the echo and Safari-unlock risks listed under "Out of scope" do not apply, except that stage 3 must stop the `<audio>` in the playback effect's cleanup and start the mic from the same tap. The mock driver already stops its ticker on leaving the state. **Checked with `tsc` and eslint only; not exercised in the browser.** |
| 10-03 | you | The AI turn carries Gemini's `interactionId`, and `previous_interaction_id` is read from the last AI turn instead of being kept as a separate field | `Turn` becomes a union on `author`; `AI_TURN_RECEIVED` takes `interactionId`. One source of truth, ending a session resets the chain with the turns, and a retry after an error resends the same request because a failure adds no turn. |
| 10-03 | you | Chat can be mocked via `NEXT_PUBLIC_USE_MOCK_CHAT`, which selects the route (`/api/mock/chat` or `/api/chat`), as in the earlier app; the mock route 404s outside development | Keeps development possible without a key or quota while the real fetch path stays in use. The flag is client-side because the client picks the URL; a server-side `if` inside one route was the alternative. TTS gets its own flag in stage 3. |
| 10-03 | agent | The mock route encodes its script position in the interaction id (`mock-<n>`) | Proposed to avoid a turn-count field in the request; approved by Jaron. Deterministic and ordered, and a retry gets the same line. |
| 10-03 | you | The system instruction is built on the server from `{ language, level }` on every call; the client sends only those two validated values | A client-supplied instruction would let any caller write the prompt on a public endpoint holding the API key. The build is a template string, so caching it saves nothing. The persona is the spike's, in English, without its Correction section (see stage 4). |
| 10-03 | you | The temporary text input for stage 2 is dropped | The mock recognition provides text and Edit lets the user type. |
| 10-03 | you | `.env.example` is committed, with `!.env.example` added to `.gitignore` | Documents `GEMINI_API_KEY` and the mock flag. The `.env*` pattern would otherwise have ignored it. |
| 10-03 | agent | The chat request is a discriminated union on `kind` (`aiStarts`, `userTurn`); `input` must be non-empty and the id is capped at 200 characters | A request with no input but an id sent the starting prompt in the middle of a chain, and the dev stepper could produce one. |
| 10-03 | agent | An empty or whitespace-only reply is a failure, and a Gemini response without `output_text` is an error | Neither used to be caught: `?? "{}"` and a bare `z.string()` let an empty bubble through as an answer. |
| 10-03 | agent | The route's `request.signal` is passed to the Gemini call; the server has no deadline of its own | A client abort should stop the paid call. The client's 30 second deadline already ends every request someone is waiting on. |
| 10-03 | agent | The error body has a schema (`ChatErrorSchema`), and reading the request is shared by both routes in `chat-request.ts` | The client's hand-written check of `{ error }` and the two copies of the JSON and validation steps could drift apart. |
| 10-03 | agent | A missing API key is logged server side and the client gets the generic "The chat request failed"; Zod text at 400 and the status codes are unchanged | The client gains nothing from knowing the key is missing. Whether a failure is retryable is left until the client has a use for it. |
| 10-03 | agent | The Gemini schema and call moved to `api/chat/gemini-chat.ts` (`askGemini`) | The route is left with request, response and errors, and the call can be replaced when testing the failure paths. |
| 10-03 | agent | The mock route says why it answers 404, and `.env.example` notes that the flag only works under `next dev` | An empty 404 gave no hint that the mock was switched off by the mode, not by a missing route. |
| 10-03 | agent | The dev stepper forcing `aiThinking` on an AI turn now ends in `FAILED` instead of sending a request | There is no user turn to answer, and the request that used to be sent had no input. |
| 10-03 | you | A request the browser aborts stays in the server log as "Chat request failed"; aborts get no special case | Passing `request.signal` to the Gemini call (see that row) makes every abort throw in `askGemini`: leaving `aiThinking`, the client deadline, and in dev Strict Mode's double effect. The server cannot tell these apart or why the client left. Skipping the log for `request.signal.aborted` was offered and is not worth doing now. |
| 10-03 | you | Stage 3 is built in three steps, each with its own commit and check-in: live STT, then TTS, then highlighting plus the `findings.md` note | STT is the riskiest on a phone and replaces the mock recognition, so it shows the iPhone problems first. |
| 10-03 | agent | `mintLiveToken` lives in `api/stt/token/route.ts` itself, and the route reuses `errorResponse` from `chat-request.ts` | Unlike the Gemini call there is nothing to replace when testing, so a second file would only be indirection. The error body shape is the same for every route. |
| 10-03 | agent | `use-live-transcription` refuses a recording format that is not webm or ogg, with an error, instead of streaming it | The plan says to read back the real `mimeType`. Deepgram accepts mp4/aac without an error and returns nothing, which would look like a silent user. |
| 10-03 | agent | Leaving `listening` drops whatever Deepgram has not flushed; no `CloseStream` | The interim words on screen already go into the draft, and a clean flush would need the state to wait for the socket, which Send, Edit and Cancel should not do. |
| 10-03 | agent | `mockUserLine` and `mockTranscriptAt` stay in `mock-conversation.ts` as sample text for the dev stepper; `wordCountOf` goes | The plan said the user lines went with the mock recognition, but the stepper still uses them. |
| 10-03 | you | Every provider takes a `gender` and the app has one switch, `VOICE_GENDER` in `lib/tts/index.ts`, set to `"female"` | Jaron wants one gender across all languages and to test both. The route passes it on, so a per-user option later is a field in the request, not a change in the providers. |
| 10-03 | agent | `synthesize` takes one object `{ text, language, gender }` plus the request's `AbortSignal`, instead of positional arguments | ElevenLabs ignores `language`, which would have left an unused parameter. The signal stops a paid call when the client leaves, as in the chat route. |
| 10-03 | you | Voices: one per language and gender, GA Neural for Azure, Chirp3-HD `Aoede` (female) and `Charon` (male) for Google | Names checked against both providers' list endpoints on 10-03, not from memory. Azure's Dragon HD voices don't exist for every language and its MAI voices are in preview. Norwegian is `nb-NO` at both providers. |
| 10-03 | you | The ElevenLabs voices are constants in `elevenlabs.ts` (`VOICE_IDS`, one per gender), not an environment variable | A voice ID is not a secret, and the voice belongs with the other voice tables. Female is Bella and male is Chris, both default voices that the free plan can use. |
| 10-03 | agent | `NEXT_PUBLIC_USE_MOCK_TTS` is read once in `LanguageBuddy` and passed as `enabled` to both `useAudioPlayback` and `useMockDriver` | Exactly one of the two plays the AI's turn, and the two flags can't disagree. It is not dev-only like the chat mock, since it needs no route. |
| 10-03 | agent | A TTS failure (fetch, playback, or audio never unlocked) is logged in the browser and degrades to text-only via `AI_SPEECH_FAILED` | As the state model already said. The server logs the provider's error and answers with a generic 500, and a bad `TTS_PROVIDER` is in that log with the valid names. |
| 10-05 | agent | The word timings are made on the first `timeupdate` with a finite `audio.duration`, not on `loadedmetadata` as in the spike | Safari can report `Infinity` until later and `estimateWordTimings` throws on it. Until the duration is known there is no highlight, instead of an error. |
| 10-05 | you | `spikes/ai-voice-demo/findings.md` gets one added note saying live STT was verified on iPhone Safari / iOS 26, and why; nothing else in the spike changes | Planned in stage 3 item 4. As written it read as though only the Node script ever proved it, which cost a wrong risk assessment in this plan. |
| 10-05 | you | `use-mock-driver.ts` and `useMockDriver` renamed to `use-mock-tts.ts` and `useMockTts` | The hook only fakes TTS playback since stage 3; recognition and chat have their own real drivers. |
| 10-05 | agent | `listening` carries `microphoneIsLive`; `MICROPHONE_STARTED` sets it once the recorder has started, and until then the bubble shows "Preparing mic…" without the dot | Found in the stage 3 review. The recorder starts only in the socket's `onopen`, so words said while the token and the socket were still being set up were lost, while the screen already said "Listening…" with a live dot, against the 09-25 definition of the dot. The wording is Jaron's; the flag and the action were proposed by the agent. |
| 10-05 | you | Buffering the audio while the socket opens is not built; it is open question 10 | The alternative to the flag. Look at how long the gap is on a device first. |
| 10-05 | agent | `LIVE_CONNECT_TIMEOUT_MS` (10 s) ends a connect that has not produced a live microphone with `FAILED` and the existing connection message; the clock starts after `getUserMedia` has resolved. No deadline on the TTS fetch | Found in the stage 3 review: token fetch and socket open could hang with no sign. The permission dialog must not count, since the user may sit on it. TTS is left alone because the text is already on screen and Reply works. Jaron chose the 10 s and the TTS omission. |
| 10-05 | agent | An exception when the recorder starts now ends in `FAILED` like every other failure of the hook | Found in the stage 3 review: it threw inside the socket's `onopen` handler, outside every `try`, and left `listening` open without a message. |
| 10-05 | agent | Try again calls `unlockAudio()` | Found in the stage 3 review. Retrying a failed AI call ends in the AI speaking, and this click is the gesture. Whether iOS keeps the element unlocked for good is still unknown; harmless either way. |
| 10-05 | agent | `TTS_PROVIDER` is checked with a type guard on `Object.hasOwn`; Google's response is validated with zod; `TTS_CONTENT_TYPE` is the one definition of the audio type and ElevenLabs asks for `output_format=mp3_44100_128` explicitly; the client types its `/api/tts` body with `TtsRequest` | Found in the stage 3 review. `in` also accepts names like `constructor`, the cast hid that, and the audio type used to live in a comment. The ElevenLabs value is also its documented default, so nothing changes in behaviour. |
| 10-05 | agent | The dev state stepper gets a "listening (mic not live)" entry and a "speech fails" entry that dispatches `AI_SPEECH_FAILED` | The text-only fallback could only be seen with a real, failing provider. Jaron asked for the first entry. |
| 10-05 | agent | Comments that named stages or an outside file were rewritten to describe the code as it is | Found in the stage 3 review: they would mislead someone without the plan, the worst being `loadedmetadata` where the code waits for `timeupdate`. |
| 10-05 | agent | The text of a `/api/tts` request is capped at 1500 characters, down from 2000 | Raised by CodeRabbit on the PR. Google limits a request to 5,000 bytes (its quota page; no separate limit for Chirp 3 HD), and a typographic mark is three bytes in UTF-8, so 2000 characters could exceed it. 1500 stays under it for every provider. A real AI turn is far shorter. |
| 10-05 | agent | Constructing the Deepgram WebSocket is inside a `try` that ends in `FAILED`, like the recorder start | Raised by CodeRabbit on the PR. The comment on `void connect()` said `connect` handles its own errors, which was untrue for this step. |
| 10-05 | agent | The recording format is checked, and `MICROPHONE_STARTED` sent, at the recorder's `start` event instead of right after `start()`; the recorder's `error` and an unexpected `stop` end in `FAILED` with "The microphone stopped." | Raised by CodeRabbit on the PR. Without a requested type `mimeType` can be empty until the `start` event, so the early check could reject a browser whose default format works. A recorder also stops by itself when its tracks end (a headset unplugged, an iOS interruption), and nothing noticed. The connect deadline now runs until the `start` event. The wording of the message is Jaron's. |
| 10-06 | you | Stage 4 evaluation is **per turn**: the chat response becomes `{ interactionId, reply, correction }` with `correction: string \| null`. The Evaluate button and an end-of-session summary are not built | Short feedback on every turn is preferred over several comments about a whole conversation. The three options were weighed in a written comparison first, as the stage was set up to do. |
| 10-06 | you | `null` means no mistake and the client shows the fixed text "No corrections. Great!"; the model does not generate it | Saves tokens and keeps the sentence out of the conversation chain, where it would act as an example the model repeats. |
| 10-06 | you | The correction is a separate bubble under the user's turn, same left margin as the user's bubbles, with its own CSS class and new light-yellow background and border tokens. It is not spoken | It gets its own styling. TTS reads `reply` only. The token values are chosen at build time. |
| 10-06 | you | The corrections stay in the Gemini conversation chain (one call); a separate stateless evaluation call is the fallback | A chain cannot omit fields, so keeping them out needs a second call, a second route and a pending and failure state in the UI. Start simple, measure latency and drift first. Jaron would have preferred them outside the chain; this is the price of the simple start. |
| 10-06 | agent | The `correction` field costs about 265 ms on the chat round trip (median 2273 → 2538 ms, 10 runs each), so streaming and the parallel call stay fallbacks | The extra output tokens delay the whole chat response, and with it TTS. Noisy at n=10: the ranges overlap. |
| 10-06 | you | **Supersedes the separate yellow bubble above:** the correction is attached to the bottom of the user's bubble, as in `evaluation-attached-to-bubble.png`, with a `--color-blue-50` background. Target-language phrases in it are highlighted with the user-bubble background. No new tokens | The reference screenshot shows it that way, and it ties the correction to the turn it is about. The yellow tokens and the separate class are not built. |
| 10-06 | you | The correction's explanation is in English, but the user's words and the more natural alternative stay in the target language; the user's words are only the part the explanation needs, never the whole message | Learning material is the target-language phrase; only the explanation is for the learner's own language. The prompt says so explicitly. |
| 10-06 | you | `correction` is a list of segments typed `text`, `userInput` or `suggestion`, with no quotation marks in the text. **Supersedes** the plain-string correction and the `“…”` quotes in the logged examples above | Three kinds of text have to look different, and a delimiter inside one string cannot carry that. Jaron first said "A" (delimiter) but described this shape; the three-way distinction decided it. |
| 10-06 | you | The Correction prompt forbids any spelling correction, not just spaces, punctuation and diacritics; capitalization is added to the list | The input is speech-to-text, so the user is not responsible for how words are spelled. The spike's rule only covered spaces, punctuation and diacritics. |
| 10-06 | agent | Segments cost about +255 ms on the chat round trip (median 2947 → 3202 ms, 10 runs each), the same as the plain-string version | The extra JSON structure did not add measurable latency. Over 8 sampled corrections the types were assigned correctly and `userInput` was always a fragment, never the whole message. One had stray quotation marks inside a `text` segment. The grammar explanations in those samples were sometimes muddled: a model-quality matter, not the structure. |
| 10-06 | agent | The mock chat route returns a per-language correction (a mistake as segments quoting part of that language's mock user line, then `null`), none on the opening turn | The opening AI turn answers nothing, so it has nothing to correct. The first mock version quoted English phrases, which is what the line above rules out. |
| 10-08 | you | **Supersedes "one call":** the correction comes from its own call to a separate prompt. `/api/chat` goes back to `{ interactionId, reply }`; a new, stateless `/api/evaluation` returns `{ correction }`. The `correction` field added to the chat response in 63d5da86 is taken out again | A separate corrector assigned the segment types wrongly 0 of 30 times, against 4 to 7 of 30 in one call, even with an explicit second role in the prompt; it also kept corrections out of the conversation chain, as Jaron preferred, and no longer delays TTS. The price is two Gemini calls per turn, a second route, and pending and failure states. |
| 10-08 | you | The prompts get a shared part (language and level, English level B2/C1, speech-to-text note, "spoken, never written") and one part per persona, as in the production app. The speech-to-text note is new for the chat persona. The corrector's rules and segment explanation go in its `system_instruction`; its `input` is only the user's message | Jaron's structure from the original app. The measurement put the rules in `input`, so it has to be repeated with the real prompts. |
| 10-08 | you | The corrector's null rule reads: the message may not contain anything worth correcting; do not go looking for a mistake, and never fall back on spelling, spaces, punctuation, capitalization or diacritics just to have something to say | Jaron's experience is that most sentences do need a correction, so the rule is about not inventing one. The wording was reshaped from "Don't look for one that violates this instruction", which could be read two ways. |
| 10-08 | you | **No code guard** that turns a spelling-only correction into `null` | `null` shows "No corrections. Great!", which would be false when the message had other mistakes and only the spelling one was returned. Proposed by the agent, rejected by Jaron. |
| 10-08 | you | The AI's reply is shown only after the correction has been shown; the correction may appear first. A correction call that has not answered after **10 seconds** is aborted and a late answer is ignored. TTS playback starts only once the reply is on screen | The correction sits in the user's bubble, which comes before the reply. The timeout is what keeps a hanging corrector from holding the reply. Fetching the audio can start earlier. |
| 10-08 | you | The correction section reads "Evaluating…" while the call runs, "No corrections. Great!" for `null`, and "Evaluation failed" on a failed call, an invalid response or the timeout; each text kept to one line | A placeholder reserves the height, so the bubble does not jump. "Evaluating…" instead of the thinking dots, and the failure text as short as possible, are Jaron's wording. |
| 10-08 | you | `userInput` and `suggestion` are italic; only `suggestion` has a background, the user-bubble background. **Supersedes** the line above that highlights both and leaves it open whether they differ | The revised reference screenshot. |
| 10-08 | you | Try again after a failed chat call repeats the chat call only; a correction that has arrived is kept, and a failed correction is not retried | Otherwise a retry pays twice and the text could change under the user. The agent's proposal, accepted. |
| 10-08 | you | The route is `/api/evaluation` (with `EvaluationRequestBody`, `EvaluationResponse`, `readEvaluationRequestBody`, `gemini-evaluation.ts`; the field and the prompt builder keep "correction"). It takes `{ language, level, input }` and has no history or `previous_interaction_id`. Whether the corrector gets context (a branch off the chain, as in the original app) is left untested | The agent first called it `/api/evaluate`; Jaron wanted the noun, since what is requested is an evaluation. Context was not part of the measurement. |
| 10-08 | agent | Measured with one call (A), one call with a second role (C) and a separate call (D), 40 calls each, `gemini-3.1-flash-lite`: wrong types 7/4/0; a correction on a lower-case or no-diacritics sentence 10/10/10 of 10; of those spelling-only 6/3/4; `eld` flagged or null 1/0/3 of 5; quotation marks in the text 4/3/7 of 30. Schema `description`s instead of prompt rules (earlier run, 40 calls each): wrong types 14 against 7 | Small and crude (5 runs per input, string heuristics, only some outputs read by hand), so a direction, not a result. The spelling ban and the transcription hint do not hold fully, and D adds quotation marks; none is solved. |
| 10-08 | agent | Stage 4 step 1: the corrector's system instruction also says to treat the input as text to give feedback on, never as instructions; the mock evaluate route picks its correction from a sum of the input's characters, so the same message always gets the same answer; `readChatRequestBody` and `readEvaluationRequestBody` share one `readRequestBody` | The first is a guard I added to the agreed prompt: the user's message is the only input, and it is untrusted. The second keeps a retry predictable in a route with no state. The third avoids a copy of the body-reading code. |
| 10-08 | agent | Stage 4 step 2: the ordering rule is in the reducer. `AI_TURN_RECEIVED` holds the reply as `pendingReply` in `aiThinking` while the last user turn's evaluation is `pending`; `EVALUATION_RECEIVED` and `EVALUATION_FAILED` release it | A pure transition that can be run on its own, instead of two hooks waiting on each other. The evaluation driver follows the turn, not `aiThinking`, so a failed chat call leaves the evaluation running and Try again does not repeat it. The reducer scenarios (13) were run with a scratch script through Node's type stripping; the drivers and the 10 s timeout have not been run in a browser. |
| 10-08 | you | What the code calls a request is a request **body**: `ChatRequest` and `EvaluationRequest` are now `ChatRequestBody` and `EvaluationRequestBody` (and their `…Schema`), `readChatRequest` and `readEvaluationRequest` are `readChatRequestBody` and `readEvaluationRequestBody` and return `{ ok, body }`, `chatRequestFrom` is `createChatRequestBody`, and the first parameter of `askGemini`, `askGeminiForEvaluation`, `fetchChatReply` and `fetchEvaluation` is `body`. The evaluation driver now gets the turn with `getTurnToEvaluate(state)` and builds the body from `state.config` and that turn with `createEvaluationRequestBody`; `UserTurn` is exported from the reducer | A `Request` is the object a route handler receives; what the code builds and validates is its body, and `postJson` already called it `body`. The old `evaluationRequestFrom` returned a turn id and a body that had little to do with each other. `parsedRequest` in `api/tts/route.ts` has the same flaw and was left, being outside the list. |
| 10-08 | you | The reply and the correction may appear in the same render when the correction arrives after the chat answer; the timing can be adjusted later | The rule is that the reply never appears before the correction, and appearing together satisfies it. Jaron: "in a later stage we can adjust the timing". |
| 10-08 | you | TTS audio is not fetched ahead while the reply waits for the evaluation; `use-audio-playback.ts` is unchanged and fetches on entering `aiSpeaking`, which is after the reply is on screen | Prefetching needs extra state and only gains when the corrector is slower than the chat call. |
| 10-08 | agent | `post-json.ts` takes `errorTextOf` out of `use-chat-driver.ts`, so both drivers share one fetch and one way of reading the route's error | Two copies of the same twelve lines. Asked for by Jaron as part of step 2. |
| 10-08 | agent | `turn-bubble.tsx` renders the evaluation as plain text, marked temporary | Without a rendering nothing of step 2 is visible in the browser. Replaced in step 3. |

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
