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
| K9 | Overlap with the microphone dot pulse and the dots-and-bounce direction | decided 2026-10-23 (out of scope) |
| K10 | Modern Web Guidance: does it give a better answer for K3? | trial agreed, outcome open |

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
