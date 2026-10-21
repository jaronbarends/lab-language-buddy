# Code architecture

This document describes how this codebase should be organized so that an AI agent can work
with it effectively. It is the doctrine side of the agentic harness (ARC's
"het-agentic-harnas", onderdeel D): principles only, no thresholds and no per-file register.
Those live in `docs/code-architectuur-register.json` and are read, not re-decided, by whoever
builds.

`docs/plan.md` stays the single source for *what* this app is and *why* it is shaped the way
it is. This document is the complementary *how*: how code should be organized so the agents
building it stay effective.

## 1. The thesis: code quality IS agent productivity

This codebase is built and maintained almost entirely by Claude Code. Jaron reviews and
decides; he does not write most of it. That makes code quality a question of
**productivity**, not aesthetics: how well can an agent read, understand and safely change
the code?

Three findings back this up:

- **Agents need healthier code than humans do.** CodeScene measured that human developers
  understand code at a code-health score of 9.0/10; AI agents need at least 9.4/10. Below
  that, defect risk rises by 60% or more — the agent cannot ask "what do you mean here?", so
  it guesses, and guesses more often wrong in unhealthy code.
- **84% of an agent's tokens go to observation.** JetBrains Research (NeurIPS 2025) found
  that reading files, error messages and tool output — not generation — dominates an average
  agent turn. Less irrelevant context in a file saves tokens and improves what gets
  generated.
- **AI-written code produces more issues than human-written code.** CodeRabbit measured 10.83
  issues per AI-authored change versus 6.45 for human-authored ones — mainly logic/
  correctness issues and over-abstraction. That is not an argument against AI code; it is an
  argument for an architecture that compensates for those specific weaknesses.

Investing in how the code is organized is not overhead here — it is the lever that decides
how effective the agent building it can be.

## 2. Qualitative rules

Each rule describes a **when**, not a **how much**. Line count is a signal, never a trigger
on its own — the threshold that turns it into a signal lives in the register (REQ-AH-11), not
here.

### 2.1 Split at the seam of independent change

The test: "if I change concern A, do I also need to understand concern B in the same file?"
Yes → keep together. No → split.

A file that mixes two concerns that change for unrelated reasons forces an agent to load
context it does not need for either change. That costs tokens and raises the odds of an
accidental edit.

### 2.2 Cohesion over compactness

A large file that is one cohesive domain is better than several small files that must be
read together to make sense. Splitting cohesive code forces an agent to open multiple files
and reconstruct the connection between them — more context consumed, not less.

The question is never "is this file too big?" but "does everything in it belong together for
the same reason?" If yes, it is allowed to be large.

*Lived example:* `session-reducer.ts` (577 lines, the largest file in `src/`) is one state
machine with one reducer. `src/lib/CLAUDE.md` already says why: a new state extends the
discriminated union, it does not get bolted on as a separate flag elsewhere. Splitting the
reducer by turn state would scatter one decision across files that all have to be read
together to understand a single transition.

### 2.3 A family of swappable implementations lives behind one registry

When several implementations of the same role exist (a TTS provider, an STT provider),
they sit behind one registry module that picks between them by configuration — never by
scattered `if (provider === ...)` checks at every call site. Switching is a single env var
change, nothing else. An unknown value throws, naming the valid ones; it never silently
falls back, so a typo cannot quietly leave the app on the wrong provider.

*Lived example:* `src/lib/stt/index.ts`'s `getConfiguredStartFunction` — one typed map, one
explicit throw on an unrecognized `NEXT_PUBLIC_STT_PROVIDER`. `src/lib/tts/` follows the same
shape.

### 2.4 Thin route handlers, logic lives beside them

A route handler (`src/app/api/**/route.ts`) is a thin wrapper: parse the request, call the
logic, shape the response. It stays small by construction, not by rule — the moment a
handler starts accumulating branching business logic instead of delegating to it, that is
the seam (2.1) to split on.

*Current state:* every route handler in `src/app/api/` is under 35 lines. Keep it that way by
moving logic out, not by trimming the handler's own clarity.

### 2.5 Rule of three for extraction

Shared code moves to a shared location only at the third independent caller. Two callers →
duplication is fine.

Extracting early creates a coupling that is harder to undo than the duplication it removed.
An agent that sees two identical blocks can extract them on its own once a third caller
appears; an agent that wants to change an existing abstraction first has to find out who
depends on it — that is the more expensive mistake.

### 2.6 No barrel files

No `index.ts` that only re-exports everything from a folder. Import directly from the module
that defines what you need.

A registry module (2.3) is not a barrel: it makes one decision (which implementation) and
exports the result of that decision, not everything underneath it. There are currently no
barrel files in `src/` — keep it that way as the codebase grows.

## 3. How this document evolves

- A new structural pattern worth generalizing → add a numbered rule under section 2, with the
  lived example that justified it.
- A file growing past the register's threshold → the decision (exclude it, give it a ceiling,
  or split it) goes in `docs/code-architectuur-register.json`, not here. This document stays
  principles; the register stays decisions.
- If a rule stops matching how the codebase actually works, say so and change the rule — this
  document describes what is true, not what was once intended.
