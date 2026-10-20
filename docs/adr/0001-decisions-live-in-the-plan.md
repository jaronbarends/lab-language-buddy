# ADR 0001 — Decisions live in `docs/plan.md`, not in separate files

Status: accepted (2026-09-25)

## Context

The plan was first written outside the repository, so changes to it were invisible to
review and to git. In this repo it matters which choices were the agent's and which were
Jaron's, and why a choice was made, because several look arbitrary in the code (no Stop
button, `editing` as its own state, the live transcript living outside the thread).

A separate file per decision would spread the reasoning across many places, and the plan is
already where a reader goes first.

## Decision

Decisions are recorded in `docs/plan.md`: the "Decisions" table for the standing choices
(with a Why column) and the dated "Decision log" for anything that changed after the plan
was approved (with a Source column: `agent`, `you` or `ported`). The plan is updated in the
same commit as the code that invalidates it. This directory, `docs/adr/`, holds only the
decisions about how decisions are kept, like this one.

## Consequences

- One place to read, and `git blame` on a row shows when and with which code it changed.
- `plan.md` is long (over 1,200 lines). A reader needs the headings or a search, and the
  agent should read the relevant section, not the whole file.
- A decision without a row in the plan does not exist as far as the next reader knows.
  The commit rule in `CLAUDE.md` is what keeps this honest.
