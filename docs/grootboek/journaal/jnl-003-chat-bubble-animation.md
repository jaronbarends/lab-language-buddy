---
titel: Chat bubble animation
status: discovery
datum: 2026-10-23
kernvraag: How does an AI bubble go from thinking dots to its text as one element that grows, without breaking the scroll, the read-along highlight or the screen reader?
doel-records:
  - "ADR for the bubble's structure (K2), to be written once decided"
  - "HDR-013 (K10), booked 2026-10-23"
  - "a spec as the build plan, once the issues are decided"
  - "a PDR only if the human treats the motion behaviour as a product promise"
---

# JNL-003 — Chat bubble animation

**Core question.** How does an AI bubble go from thinking dots to its text as one element that
grows, without breaking the scroll, the read-along highlight or the screen reader?

**Main message.** `docs/plan.md` open question 11 ("One bubble for the AI's thinking dots and
its text") already describes the wanted effect and two ways to get the one surviving element.
What it does not settle is how the bubble grows in *width* as well as height, and how that
meets the scroll effect in the thread. Those two are the real unknowns; the rest are choices
for the human.

**How this was made.** A read of `docs/plan.md` (open question 11 and the Decision log), the
bubble, turn-bubble, thinking-bubble and conversation-thread components and their CSS, and
`.claude/rules/safari-ios.md`. No code has been changed and nothing is decided yet, except the
trial in K10.

**Where the decisions are booked.** This work runs on an `arc/*` branch, so it falls under
HDR-001: its decisions are booked in the grootboek, not in `plan.md`. Open question 11 in the
plan predates 2026-10-20 and carries a pointer here, so the two places do not drift apart.

## Issues

| # | Issue | Status |
|---|---|---|
| K1 | Scope: only open question 11, or an enter animation on every bubble too? | decided 2026-10-23 |
| K2 | The surviving element: key by position (a) or a pending AI turn (b)? | decided 2026-10-23 (a) |
| K3 | Growing in height and width: which technique? (spike on an iPhone) | spike built 2026-10-23, tuning open |
| K4 | The thread's scroll effect against a bubble that is still growing | decided 2026-10-23 (A) |
| K5 | Read-along: may the highlight start while the text is still appearing? | decided 2026-10-23 (only when fully visible) |
| K6 | One element, one role: `status` or `log`? | parked 2026-10-23 |
| K7 | The user's bubble growing when its evaluation arrives | decided 2026-10-23 (AI bubble only for now) |
| K8 | `prefers-reduced-motion` | decided 2026-10-23 |
| K9 | Overlap with the microphone dot pulse and the dots-and-bounce direction | decided 2026-10-23 (out of scope); the mic dot pulse picked up as K13 on 2026-10-27 |
| K10 | Modern Web Guidance: does it give a better answer for K3? | trial agreed, outcome open |
| K11 | The user's bubble when it is sent: what animates | decided and built 2026-10-27, iPhone test open; shrink in the bar and the thinking-bubble delay come after |
| K12 | Speech start against the end of the reveal | parked 2026-10-27 |
| K13 | The listening indicator pulses while the microphone is live | decided 2026-10-27; build open |

### K1 — Scope

Today no bubble has an enter animation; the only animation in the bubbles is the pulse of the
thinking dots. Open question 11 asks for the dots-to-text transition and says it is "to be done
together with the other animation work". **Question for the human:** is this journal only that
transition, or also an enter animation for every new bubble (the user's too)? These are two
separate pieces of work with different risk.

**Decision (2026-10-23, the human):** start with the transition only (option A): the AI bubble
going from thinking dots to its text as one element. An enter animation for every bubble is not
part of this first piece; it is decided after the K3 spike, because what "appearing" means for
the AI bubble depends on K2 (with one surviving element it appears when the dots do, not when
the text does). The user's bubble growing on evaluation stays K7, separate.

### K2 — The surviving element

Today `ThinkingBubble` and `TurnBubble` are two elements, one unmounting as the other mounts,
so nothing exists to animate. The plan weighed two ways on 2026-10-08:

- (a) **Key by position.** The thread renders one AI bubble keyed `ai-<number of AI turns before
  it>` for both the waiting state and the real turn. No change to the reducer, the types or the
  drivers. Recommended in the plan.
- (b) **The waiting is part of the AI turn.** A `pending` AI turn with its own identity. One
  element and one role, but the AI turn becomes a union and everything that reads "the last
  turn" has to skip a pending one; two sources of truth; costs listed in the plan.

**Question for the human:** confirm (a)? (b) pays off only if a failed AI turn is ever shown
inline with a retry, which is not planned. Lands in an ADR.

**Decision (2026-10-23, the human):** (a), key by position. Checked before deciding: the reducer
only appends turns, updates one in place with `map`, or resets `turns` to `[]` (session-reducer.ts
lines 253, 467, 496, 314), so the position key cannot shift mid-session. Line 314 was not opened;
it is assumed to be the reset to a new session. The ADR is not written yet: it waits for K3 to
K6, so that one record covers the structure including the role it settles on. Condition that
would reopen this: any future action that removes a single turn.

### K3 — Growing in height and width

`.bubble` is `width: fit-content` with `max-width: 85%` and `overflow: hidden`
(`bubble.module.css`). The plan names the `0fr` to `1fr` grid trick for an unknown height; that
animates one axis. Going from the width of three dots to the width of a wrapped paragraph is a
different problem. To be settled by a small spike on a real iPhone, not by an estimate.

**Baseline, written 2026-10-23 before consulting any web guidance (see K10).** This is what the
agent would do from its own knowledge (training cutoff June 2026), unverified against current
browser support:

- Height alone: `grid-template-rows: 0fr` to `1fr` on a wrapper. Works in current Safari, to my
  knowledge.
- Height and width together: measure, then transition explicit pixel values. Lay the final text
  out at its final width (off-screen or in a layout effect), read the width and height, set them
  on the bubble from the dots' size, transition to them, and release to `auto` at
  `transitionend`. Reveal the text with an opacity fade once the size is nearly there.
- I would not use `interpolate-size: allow-keywords` or `calc-size()`. To my knowledge they are
  Chromium-only, and Safari on iPhone is a hard requirement.
- Fallback if measuring proves fragile on iOS: no size animation; cross-fade the dots out and the
  text in on a bubble that is already at its final size. Less ambitious, but cheap and robust.
- Risks I expect on iOS: `transitionend` not firing when the tab is backgrounded or the
  transition is interrupted (so release to `auto` needs a timeout fallback), and the interplay
  with K4.

**Spike result (2026-10-23, built on `arc/bubble-animation`, tuned by eye on desktop Chrome and
the human's iPhone; "works more or less as wanted", to be continued).** What was built is not the
baseline and not the first spike either:

- First version: a `clip-path` reveal from the dots' size (K4(A)). It ran on the iPhone.
- Replaced at the human's request by a `scale` 0 to 1 from the top-left corner, 350ms, with the
  overshoot in the easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`, peak about 1.10). Reason: a
  clip-path cannot show an overshoot, and keyframes of 1 to 1.02 were too faint to see. The
  cost, accepted: the bubble no longer starts at the dots' size; it grows out of its corner.
- The text (label and paragraph) is transparent during the growth and fades in over 200ms
  starting when it ends; one CSS variable (`--reveal-duration`) drives both. The dots vanish
  at once. Reduced motion: no scale, no fade (reasoned, not tested).
- Layout is at its final size at once, so K4(A) still holds: the scroll effect is unchanged.

### K4 — The scroll effect against a growing bubble

`conversation-thread.tsx` scrolls in a `useLayoutEffect`, before paint, keyed on the turn count,
the state name and the last user turn's evaluation status. It decides between "scroll to the
bottom" and "align the bubble's top" from the bubble's size at that moment
(`newestItem.offsetTop < bottomScrollTop`). A bubble that grows after that moment can end up
partly out of view, or the top-alignment decision can be made on the wrong size. **Question:**
scroll to the *final* size up front, or follow the growth frame by frame?

A scroll position cannot be set beyond what the content currently occupies, so "scroll to the
final size" only works if the bubble takes its final space in the layout at once. Two options:

- (A) **Layout at final size at once, animation only visual** (for example a `clip-path`
  reveal). The scroll effect stays unchanged. Safe because the animating bubble is always the
  last element in the thread, so nothing else shifts.
- (B) **Follow the growth** with a `ResizeObserver` or `requestAnimationFrame`, re-scrolling
  during the animation. More code, and scrolling during an animation is a known source of jank
  on iOS.

**Decision (2026-10-23, the human):** (A), with (B) as the fallback if the spike shows (A) does
not work on the iPhone. Not tested: how `clip-path` behaves on iOS with a bubble that has
`overflow: hidden` and rounded corners; the spike (K3) is where that is found out.

**Consequence for K3, noted after the K3 baseline was written.** If the layout is at final size
at once, K3 is no longer about animating height and width but about revealing an already-full
bubble. That is a different and easier problem than the baseline assumes (measure, then
transition pixel values). The baseline is left as written, since it is the reference point for
HDR-013; this consequence was not part of it.

### K5 — Read-along

`spokenWordCount` and `HighlightedText` start as soon as the state is `aiSpeaking`. **Question
for the human:** may the highlight start while the text is still appearing, or only once the
text is fully visible? The second is simpler to reason about, but delays the highlight by the
length of the animation.

**Decision (2026-10-23, the human):** the highlight starts only once the text is fully visible.
The cost is a delay of about the length of the reveal; how long that is, is not yet known and
follows from the spike (K3). If the delay turns out to be noticeable, this is the issue to
reopen. How the highlight is held back (the audio start, the `spokenWordCount` or only the
styling) is a build detail, not decided here, and needs a look at the playback hook first.

### K6 — One element, one role

`ThinkingBubble` is `role="status"` with an `aria-label`; `TurnBubble` is a wrapper with a
paragraph in the thread's `role="log"`. A single surviving element has to pick, or switch,
what a screen reader announces. VoiceOver was explicitly out of scope for stage 1 (see the
review notes in the plan), so this may be parked rather than decided.

**Parked (2026-10-23, the human).** There is no existing screen-reader behaviour to preserve
and no test procedure, so deciding now would be deciding blind. Condition on the build: the
roles and the label that exist today keep working as they do, and the builder reports it if one
surviving element makes that impossible. Open risk, not verified: switching the role of an
element that stays mounted is an unusual pattern for screen readers, and it may not be possible
without a change. To be picked up with a real VoiceOver test, as its own piece of work.

### K7 — The user's bubble growing

The user's bubble grows when its evaluation settles (the evaluation section is attached to it).
The plan says the same technique applies. **Question:** same animation as the AI bubble, or
only the AI bubble in the first version?

**Decision (2026-10-23, the human):** only the AI bubble in the first version. The user's bubble
keeps jumping to its larger size when the evaluation settles; that is accepted for now and is the
follow-up if it bothers in use. Note: with K4(A) the scroll effect is untouched for it, so
nothing new breaks.

### K8 — Reduced motion

The dot pulse already honours `prefers-reduced-motion`. The proposal to confirm: with reduced
motion on, the size transition and any enter animation are skipped and the bubble goes straight
to its final state. The human's call.

**Decision (2026-10-23, the human):** confirmed. With `prefers-reduced-motion: reduce` the
reveal is skipped and the bubble goes straight to its final state, as the dot pulse already
does. The read-along delay of K5 then also disappears for those users.

### K9 — Overlap with other animation work

The plan has a pulse planned for the microphone-active dot (Decision log, 09-25) and the human
has mentioned a dots-and-bounce direction after the TTS latency measurements. **Question:** in
or out of this journal? Default: out, to keep this one to the bubbles.

**Decision (2026-10-23, the human):** out. The microphone dot pulse and the dots-and-bounce
direction are separate work and get their own journal or issue when picked up.

### K10 — Modern Web Guidance

Booked as **HDR-013**: a trial of Google's Modern Web Guidance (agent skills with current web
platform guidance), scoped to this feature. The comparison is K3's baseline above against what
the guidance recommends, with the result written as one line here after the iPhone spike. Its
guides include `css/animate-to-intrinsic-sizes`, `ui-behaviors/motion` and
`ui-behaviors/animate-element-entry-exit`, which is why K3 is the test case. The outcome is
open; the exit criterion is in HDR-013.

**Result (to be filled in after the spike):** same / different and better / different and
worse / nothing added; and whether the iPhone confirmed it.

**Facts so far (2026-10-23; the verdict is the human's and is not written yet).** The builder
consulted the guidance before reading the K3 baseline (guides `animate-to-intrinsic-sizes`,
`motion`, `animate-element-entry-exit`):

- It confirms the baseline's refusal of `interpolate-size`: the guide itself says Chromium only
  (Chrome and Edge 129), an instant jump in Safari.
- Its `motion` guide recommends `clip-path` for geometric reveals; that matched K4(A) and the
  first spike, which ran on the iPhone. The final solution (scale with back-easing) is NOT what
  the guidance recommends, and it is not in the baseline either: it came from the human.
- It did not change the approach the agent would have taken once K4(A) was decided, and it
  said nothing on overshoot. A fair reading is "same, with one confirming source", with the
  caveat that the final design is outside what it covered.
- The extra "Modern Web Guidance" section did not disturb the builder's report format.
- `DISABLE_TELEMETRY=1` was present in the builder subagent's shell (see HDR-013).

Process note: the first spike showed no animation at all, because the waiting bubble and the
reply sat in different child slots of the thread, so React remounted instead of reusing the
element. Neither the builder nor the reviewer caught it; the human's screen did. K2(a) therefore
carries a condition the plan did not state: both must be in the SAME array.

### K11 — The user's bubble when it is sent

New scope: K1 left an enter animation for the other bubbles until after the spike, and the
timing of the AI bubble is now settled (350ms, 200ms, as built). The evaluation inside the user's
bubble is NOT part of this (K7 stays: later).

How it works today (read from the code, 2026-10-27): the text being composed sits in the control
bar at the bottom, outside the thread: the live transcript, then `DraftBubble` (or
`DraftEditor`). Send (`composing-controls.tsx`) dispatches `USER_TURN_SENT`; the draft bubble
disappears from the bar and a `TurnBubble` for the user appears at the end of the thread, just
above the bar. So the sent bubble is a new element, not the draft moving.

Design questions put to the human, none answered yet:

1. What moves: the same scale-up as the AI bubble, mirrored (anchored bottom-right, since the
   user's bubble is on the right), or a slide from the draft's position in the bar into the
   thread? Recommendation: the scale. The slide needs measuring the draft and fights a bar
   whose content changes on Send, with Safari as the risk.
2. The text: hidden during the scale and faded in afterwards, as in the AI bubble, or visible
   throughout? Recommendation: as the AI bubble, for consistency.
3. Timing: the same 350ms, 200ms and curve as the AI bubble?
4. To look at on the device, not decided: the AI's dots appear at the same moment as the sent
   bubble, so two things arrive at once.

**Decisions (2026-10-27, the human):**

1. The same scale as the AI bubble, anchored bottom-right (the user's bubble is on the right).
   Later in this feature the human probably wants the draft to shrink to scale 0 in the control
   bar first and then grow in the thread; that will add a delay. Not part of this step.
2. The text is hidden first and then faded in, as in the AI bubble.
3. The same timing: 350ms, 200ms, the same curve.
4. Not in this step, "in a moment": the AI's thinking bubble should appear after a small delay,
   so the user sees the order: first their own text, then the AI seems to start thinking. The
   timing of that is decided next.

The evaluation's own growth when it settles stays out (K7).

**Added by the human after seeing it (2026-10-27):** the text "Evaluating…" must not be visible
while the user's text is still hidden. It stays hidden through the scale and the user's text fade
and then fades in, so an order is visible: scale, then user text, then the evaluation text. The
strip itself (divider and blue background) is visible at once and scales with the bubble. The
agent first read "the strip should fade" as the whole strip and built that; the human corrected it.

**Baseline (the agent's own approach, written 2026-10-27 before any web guidance was consulted;
HDR-013, test 2).** From the agent's own knowledge, unverified against current browser support:

- Reuse the AI bubble's reveal instead of writing it twice: move the `.reveal` and `.text`
  rules and the keyframes out of `ai-bubble.module.css` into one shared CSS module, with the
  anchor as a custom property (`--reveal-origin`: top left for the AI, bottom right for the
  user). The values of the AI animation do not change.
- The user's `TurnBubble` gets the reveal class and the text class when the turn appears after
  the thread has mounted. How to know that: the thread remembers how many turns it had on its
  first render (a ref) and only turns after that animate, so a remount does not replay all.
- The scale keeps `transform-origin: bottom right` and the same curve and duration variable. The
  layout is at its final size at once (K4(A)), so the scroll effect is untouched.
- Anchored at the bottom-right the overshoot grows left and up, away from the right edge, so
  unlike the AI bubble it cannot be cut off at the side. It can overlap the bubble above for a
  moment.
- Reduced motion: no scale and no fade, as for the AI bubble.
- Risks I expect: the draft in the control bar disappears in the same frame the bubble starts at
  scale 0, so the sent text may be seen nowhere for a moment (a gap that the later shrink-in-the-
  bar step would fill); Safari re-rasterising the border while it scales; and the extraction
  touching the AI animation, which the human has just tuned and wants kept.

**Built (2026-10-27), not yet tested on the iPhone.** The sent user turn scales 0 to 1 from the
bottom-right in 350ms with the AI bubble's curve; "You: " and the paragraph fade in over 200ms
from 350ms; the text of the "Evaluating…" strip (its frame is visible at once) fades in over 200ms from 800ms (a pause of 250ms, `--evaluation-pause`, after the user's text: the human found it too quick without one). The two reveals share
`bubble-reveal.module.css` (the anchor is `--reveal-origin`; the durations are
`--reveal-duration` and `--fade-duration`), and the AI bubble's values are unchanged. Only a
turn that appears after the thread mounted animates: the thread keeps its turn count at mount
in lazy state (the baseline said a ref; the lazy state is the same idiom as `startedAsThinking`
in the AI bubble and avoids reading a ref while rendering). A dev-only preview button shows the
sent bubble without a conversation (see `docs/plan.md`, decision log 10-27).

Guidance result for the trial (facts only, the verdict is the human's): the Modern Web Guidance
agreed on every point of substance with the baseline (a shared module, only `scale` and
`opacity`, reduced motion off, the same curve). It added one rule, the identity base `scale: 1`
for an element that animates `scale` (guide `individual-transform-properties`), which was
deliberately NOT applied: it adds a permanent stacking context for a risk that did not show up
here, and the reviewer found no real risk in the CSS. It said nothing on a `transform-origin`
that depends on the side the bubble is on.

Process: this is test 2 of the HDR-013 trial. Order: the human decided, the agent wrote the
baseline above, the builder consults the guidance and reports, a row goes in the trial log.
A builder check: only turns that appear after the thread mounted may animate.

### K12 — Speech start against the end of the reveal

The human wants the AI's speech to start only once the bubble has its final size. Parked
2026-10-27 until it bothers in practice. Reasoning: the TTS request starts when the reply
arrives, together with the animation (`use-audio-playback.ts`), and the measured gap between
reply and speech was about 0.85s for 240 characters and 1.55s for 584 (Azure, the default
provider; desktop Chrome, 2026-10-05, iPhone not measured). The reveal takes 350ms and the fade
ends at 550ms, so with a real provider the speech normally starts after the animation anyway. A
short reply, a fast or cached response, or the mock TTS could start earlier. K5 stays as decided:
the highlight starts when the text is fully visible, after the fade (550ms), not at the end of
the scale (350ms). Nothing is built.

### K13 — The listening indicator pulses while the microphone is live

K9 put the microphone dot pulse out of this journal "until picked up"; the human picked it up
on 2026-10-27, so it is booked here as an issue rather than in a journal of its own. The
dots-and-bounce direction from K9 stays out.

What was read from the reference app, on the human's pointer to the file (plan, "Keeping the
experiment honest"; only the rule and keyframes named below, nothing else of the file):
`.listeningIndicator` in `SpeechResults.module.css` is a dot (`--size-12`, `--color-bg-primary`)
with an `::after` over it (`position: absolute; inset: 0`, the same circle, `background-color:
inherit`) that runs `animation: pulse 1.6s infinite`; `@keyframes pulse` goes from `scale: 1;
opacity: 0.8` to `scale: 2.2; opacity: 0`. A ring that widens and fades while the dot stays. The
original has no `prefers-reduced-motion` rule.

Here today: the dot is `.listeningIndicator` in `live-transcript.module.css`, 8px, rendered
only while `microphoneIsLive` is true (`live-transcript.tsx`), inside a bubble that clips
(`overflow: hidden`).

**Decisions (2026-10-27, the human):**

1. The element is that dot (the one named `listeningIndicator`).
2. It pulses only while the microphone is live, not in "Preparing mic…".
3. Reduced motion: no pulse; only the plain dot that exists now.
4. (After seeing it with an 8px dot, same day.) The dot gets the original's size, 12px, and the
   ring the original's dimension (2.2 x the dot, so 26.4px across). Changing only the size would
   have misaligned the dot, so its `margin-top` follows the line height: see "Built".

Taken over from the original without a decision of its own: the animation itself (1.6s,
infinite, scale 1 to 2.2, opacity 0.8 to 0). Tuning is for the device.

**Baseline (the agent's own approach, written 2026-10-27 after reading the original and before any
web guidance was consulted; HDR-013, test 3).** From the agent's own knowledge, unverified:

- Keep the original's structure: `position: relative` on `.listeningIndicator` and an `::after`
  over it (`position: absolute; inset: 0`, `border-radius: inherit`, `background: inherit`) that
  runs the pulse. The `::after` is the ring; the dot itself never animates, so the reduced-motion
  version is exactly today's dot.
- The keyframes as in the original, animating only `scale` and `opacity` (compositor-friendly),
  with `transform-origin` at the centre (the default), so the ring grows evenly around the dot.
- The original's timing (1.6s, infinite) and its default easing; I would not add `ease-out`
  unless it looks wrong on the device.
- Reduced motion: `animation: none` on the `::after` and hide it (`display: none`), because a
  static ring at `scale: 1; opacity: 0.8` would sit exactly on the dot but change its colour.
- The ring reaches 2.2 x 8px = 17.6px, 4.8px beyond the dot on every side. The dot sits 16px from the
  bubble's left edge and 20px from its top (padding plus the 8px `margin-top`), and 8px from the
  text, so I expect no clipping by the bubble's `overflow: hidden` and no touching the text.
- No `will-change` and no JavaScript; the pulse is as long as the element exists.
- Risks I expect: the ring being too faint or too small at 8px, and Safari re-rasterising the
  circle while it scales.

**Built (2026-10-27), not yet tested on the iPhone.** `.listeningIndicator` in
`live-transcript.module.css` has `position: relative` and a nested `&::after` ring (same circle,
`inset: 0`, `border-radius` and `background` inherited, so the tokens are kept) running
`listening-pulse 1.6s infinite`: `scale` 1 to 2.2 and `opacity` 0.8 to 0, the original's default
easing. Under `prefers-reduced-motion: reduce` the ring is `display: none`, so only today's
plain dot remains. The dot is 12px (`--size`), and its `margin-top` is
`calc((1lh - var(--size)) / 2)`: at 18px text with a line height of 1.25 a line is 22.5px, so
the margin is 5.25px and the dot's centre (11.25px) lands on the first line's centre. `lh` is
supported since Chrome 109 and Safari 16.4, from the agent's own knowledge; the guidance has no
guide on it. From the CSS (not measured): the ring reaches 7.2px beyond the dot, the dot is 16px
from the bubble's clip edge on the left and 17.25px from the top, and the text is 8px away, so
the ring is not clipped and ends 0.8px short of the text, where it is almost transparent; that
may look tight on the device.

Found while checking the alignment (not caused by the pulse, not changed): the text is NOT where
it was when the dot appears and disappears. The dot takes its width plus the 8px gap, so the text
starts 20px from the padding edge while the microphone is live (it was 16px with the 8px dot) and
0px in "Preparing mic…" and in the settled draft, which have no dot. The text moves 20px when the
microphone goes live and 20px back when recording stops, and the text width shrinks by the same
amount while live, so a longer transcript can rewrap at those moments. The comment on `.listening`
("nothing shifts when recording ends — the indicator dot is the only difference") is true for the
frame but not for the text.

**Decision 5 (2026-10-27, the human, after seeing it live):** the shift in width was slightly
disturbing, so the three bubbles the user's words pass through while composing (live transcript,
settled draft, editor) get one shared minimum width, `min-width: 17ch`, sized from the
placeholder "Preparing mic…" (the human tried 17ch himself). It is defined once, in
`bubble.module.css`, and switched on with `Bubble`'s `hasMinimumWidth`. The comment on
`.listening` was corrected. Accepted by the human: for text longer than that the text still moves
20px when the dot goes, since the bubble's colour and outline change at that moment anyway; and a
one-word draft is now a bubble 17ch wide. Rejected: keeping the dot's room free in every state (a
design change, not needed now). The 17ch is an estimate (about 184px border box, 148px of content,
from the agent's knowledge of the font; not measured) and must be re-derived if the placeholder
text, the dot, the gap, the padding or the font changes. It stays below 85% of the thread's
width on a 320px screen, by the same estimate.

Afterwards the editor's own `min-width: 4ch` was removed as redundant: the editor text is a block
inside a bubble that is now at least 17ch wide, and `min-height: 1lh` stays for the height.
**Tested on the iPhone by the human (2026-10-27): all points passed**, the ones listed for this
change (the bubble keeping its width from "Preparing mic…" through live to the draft, the
one-word draft and the editor at 17ch, a long transcript unchanged, the narrow screen).

Guidance result for the trial (facts only, the verdict is the human's): no guide covers a pulsing
or expanding-ring indicator; the searches only found general motion guides (`motion`,
`individual-transform-properties`, `spinner`). It agreed with the baseline on animating only
`scale` and `opacity` (the compositor), on not applying `animation-duration: 0.01ms` globally,
and on handling reduced motion per rule. Differences: (1) it mandates an identity base `scale: 1`
on an element that animates `scale`, which the baseline did not have. The builder applied it on
the `::after` ring (the bubbles in K11 had left it out); the human decided it is not needed here
and had it removed again (2026-10-28). So none of the three animations has it: nothing visible
went wrong on the device without it, the ring is a childless pseudo-element, and the rule would
make each of them a permanent stacking context. (2) It prefers "default to
static, opt in to motion", and its `spinner` guide says to slow a persistent animation down under
reduced motion instead of stopping it, so the user can still tell it is active. That contradicts
decision 3 (no pulse under reduced motion). K13 was followed; the plain dot already says the
microphone is live.

## Decision log

- **2026-10-23 — journal opened.** Issues K1 to K10 from a read of the plan and the code. The
  human confirmed this work stays on `arc/*` for now, so no new HDR on the method's scope.
- **2026-10-23 — K1 decided.** Scope is the dots-to-text transition only; a general enter
  animation waits until after the K3 spike.
- **2026-10-23 — K2 decided.** Key by position; the reducer was checked for turn removal.
- **2026-10-23 — K4 decided.** Layout at final size at once, animation only visual; changes
  what K3 is about (see the note in K4).
- **2026-10-23 — K5 decided.** Highlight starts once the text is fully visible.
- **2026-10-23 — K6 parked.** With the condition that today's roles and label keep working.
- **2026-10-23 — K7, K8, K9 decided.** AI bubble only for now; reduced motion skips the reveal;
  the other animation work is out of scope.
- **2026-10-23 — K10 agreed as a trial, booked as HDR-013 (accepted).** The baseline for K3 was
  written before the guidance was consulted.
- **2026-10-23 — spike built and committed on `arc/bubble-animation`.** `AiBubble` (one element,
  position key, waiting bubble in the same array as the turns), scale 0 to 1 with back-easing,
  delayed text fade. K3 stays open for tuning; K10 has facts but no verdict.
- **2026-10-27 — timing settled, K11 and K12 opened.** The human is satisfied with the timing and
  wants to keep it. A dev-only preview of the AI bubble was added to replay the transition (see
  `docs/plan.md`, decision log 10-27; a first attempt through the reducer was rejected in review).
  K11: animate the user's bubble on Send. K12: speech start after the reveal, parked. K5 unchanged.
- **2026-10-27 — K11 built.** The user's bubble reveals on send, with the "Evaluating…" text
  fading in after the user's text (the human's addition; the strip's frame is visible at once); a dev-only preview of the sent bubble was
  added. The base `scale: 1` of the guidance was not applied. Next: the iPhone test, then the
  thinking bubble's delay and, later, the draft shrinking in the control bar.
- **2026-10-27 — K13 decided and built.** The listening dot pulses while the microphone is live
  (a ring, as in the original app); no pulse under reduced motion. Test 3 of the HDR-013 trial.
  Tested on the iPhone by the human, all points passed. Next: the human's verdict on the trial.
- **2026-10-28 — the guidance's identity `scale: 1` removed from the ring.** The human decided it
  is not needed there. Consistent now across the three animations of the trial: not used.

**Where to pick up (written for the next session):**

- Tune on the phone: the second value of the cubic-bezier (1.56 gives a peak of about 1.10;
  1.3 about 1.03; 1.0 none), the 350ms and 200ms. Check a tall reply near the bottom of the
  thread for a scroll shift (a scaled element extends the scrollable area for a moment).
- K5 is decided but not built: the read-along highlight still starts at once. It needs a look
  at the playback hook first.
- K6 is parked: a VoiceOver test of the role change on the surviving element is still owed.
- Cleanup left behind: the AI branch in `TurnBubble` is dead code and its markup is duplicated
  in `AiBubble`. Done 2026-10-27: `ThinkingBubble` is now `ThinkingIndicator` (the human's
  choice, named after its function rather than its form, so a different animation would not
  force another rename; the agent had proposed `ThinkingDots`).
- Not written yet: the ADR for K2 (after K3 is settled), the spec, the K10 verdict and the
  decision on HDR-013 (keep, switch off or adjust).

This journal closes when K1 to K9 are decided or parked and the ADR (K2) and the spec exist.
