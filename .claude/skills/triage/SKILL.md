---
name: triage
description: >
  Determines the verification regime (trivial / normal / risky) before every build task,
  per the staffel: classify by the TYPE of change, not its size. Always load this skill
  before starting a builder agent or delegating a build task — including a "small fix",
  "quick change" or "one-liner": that is exactly when triage decides whether the light
  regime is allowed. Trigger on: build task, starting a builder, determining the regime,
  the staffel, cutting a wave unit, executing a plan, delegating to a builder. NOT for:
  external research, a review request, or chasing an existing bug (debugger) — those roles
  have their own entry point.
---

# Triage — the right amount of proof per change

One uniform, heavy verification regime is both slow and unreliable: in the largest failure
study of multi-agent systems (MAST), *incorrect* verification is a bigger failure category
than *absent* verification. The industry (Meta, Prime Video) classifies the change itself and
staffles the assurance accordingly. This skill does that for our setup: you — the lead agent
— answer four questions about the task and hand the verdict to the builder. Size is
deliberately not one of the questions: the most dangerous changes are often the smallest
(twelve lines in a schema), the safest often the largest (thousands of lines of generated
catalogue).

## The four type questions

Answer them based on the task and the files the change will touch. No configuration needed —
look at what the change *is*.

1. **Data** — does this touch a schema, migration, seed, or a destructive transformation of
   real data?
2. **Machine contract** — does the change force consumers (other code, clients, other
   systems) to adapt? Think: a shared type, the shape of an API, an event format, a field
   being renamed, removed or made required. A UI is not a machine contract: moving a button
   breaks no consumer. Adding something optional breaks no one either.
3. **Reversibility** — is this reverted with one revert or flag, or does it run once against
   real data or outward (email, deploy, payment)?
4. **Coverage and pattern** — is there a mechanical gate on the path (test, lint, snapshot,
   check), and is this a known pattern in this project?

## The hard triggers → always RISKY, regardless of size

- data changes, migrations, seeds against real environments
- machine contracts (definition above)
- authentication and authorization
- secrets and credentials
- irreversible outward actions (sending, publishing, paying)

## The three regimes

| Regime | When | What it means |
|---|---|---|
| **trivial** | all five: localized · reversible · no contract · covered path · known pattern | builder-light (one-line assignment, three-line report), no reviewer — the mechanical gates are the assurance |
| **normal** | real behavior change, no hard trigger | full builder contract + fresh-eyes reviewer, as usual |
| **risky** | one or more hard triggers | full regime plus extra care; flag the approach to Jaron if there's doubt |

**Guardrail:** when in doubt → normal. The staffel saves time on the clear cases; doubtful
cases are by definition not clear.

## The verdict format

Put the verdict literally at the top of the builder's assignment:

```
regime: trivial — descriptive text next to the code, snapshot-covered, no contract
regime: normal — new behavior in a helper, covered path, no trigger
regime: risky — touches the database schema (machine contract)
```

One line: the regime plus the reasoning. The builder reads which contract applies from this
(see `builder.md`'s regime section); the guard-hook refuses a builder-start without this line.

**The guard's limit — be honest about it.** The guard only catches builder-starts from the
lead thread. A builder started by a workflow script or a team-lead agent (a call that itself
comes from an agent) always passes the guard. When orchestrating at a deeper level, you are
the assurance yourself: put the regime verdict in each agent assignment's prompt — the guard
does not check it there.

## Examples (calibration cases)

Deliberately generic — recognize the type, not the path; this works in any stack:

- Updating 84 three-line description files, next to the code, with snapshot tests on the
  folder → **trivial** (large in lines, small in risk: no contract, covered, reversible).
- A new pure helper function with its own test → **normal** (new behavior, covered path, no
  hard trigger).
- Twelve lines in the database schema, including a field becoming required → **risky**
  (machine contract: forces consumers to adapt, regardless of size).
- A functional change in a screen without a test on the path → **normal** (no hard trigger,
  but coverage is missing — so not trivial; the guardrail does its job).
