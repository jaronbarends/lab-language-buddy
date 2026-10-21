---
titel: Onboarding journal — the software balance
status: discovery
datum: 2026-10-20
kernvraag: What is the technical architecture of language-buddy, and which parts of it are decisions nobody has written down?
doel-records:
  - "software-architectuur.md (v1.0, accepted 2026-10-20)"
  - "ADR-001, ADR-002, ADR-003 (K2, K3, K5)"
  - "HDR-002, HDR-003 (K1, K4)"
---

# JNL-001 — Onboarding journal: the software balance

**Core question.** What is the technical architecture of language-buddy, and which parts of
it are decisions nobody has written down?

**Main message.** The code and `docs/plan.md` already agree on almost everything the balance
says. What the derivation could not establish is mostly about the delivery chain and about
who may call the server routes. Those are the real questions below.

**How this was made.** Two read-only explorers (one for `src/lib` and `src/hooks`, one for
the routes and the delivery chain) plus a targeted search of the git history. Every claim in
the balance cites a file; the questions below are the places where the code did not say why.

## Issues

| # | Issue | Status |
|---|---|---|
| K1 | Balance next to plan.md: what is it for? | decided 2026-10-20 |
| K2 | Environments: which branch deploys where? | decided 2026-10-20 |
| K3 | The routes have no caller authentication or rate limit | decided 2026-10-20 (accepted for now) |
| K4 | No CI in the repo | decided 2026-10-20 |
| K5 | Why `gemini-3.1-flash-lite`? | decided 2026-10-20 |
| K6 | Google TTS key travels as a URL query parameter | open |
| K7 | How to protect the routes (follow-up of K3) | open |
| K8 | CI on pull requests to `main` (follow-up of K4) | open |

### K1 — Balance next to plan.md: what is it for?

`docs/plan.md` already describes the state model, the file layout and the standing decisions
in detail. Most sections of the balance restate that from a technical lens, with files as
evidence instead of rows. **Question for the human:** does the balance add something the plan
does not (one place for the technical view, readable in one sitting), or is it a duplicate
that will drift? This decides whether to keep going or to stop after this trial.

The critique pass showed this concretely: two of the first four "candidate decisions" the
balance listed (evaluation as its own call, the mock routes) turned out to be recorded in
plan.md already. Still without a record anywhere, as far as I found: the reply being held
until the evaluation settles, an unknown provider setting throwing instead of falling back,
and native STT restarting after silence and giving up after three quick endings. I have not
checked each against the plan's Decision log row by row.

**Decision (2026-10-20, the human):** keep the balance and use it to try drift detection
(a DFT report: does the description still match the code?). `docs/plan.md` stays the source
for now; the human intends to move the plan into the grootboek eventually, but wants to try
the grootboek first. Until then the balance is a derived reading path next to the plan, and
the drift risk between the two is accepted for the duration of the experiment. Not yet
booked as a record; HDR-001 already says the plan stays the source until the experiment is
settled. **Booked as HDR-002.**

### K2 — Environments: which branch deploys where?

Vercel is named in README and plan, but there is no configuration file, so the
branch-to-environment mapping, the per-environment env vars and whether `arc/*` branches get
preview deployments are not visible from the repo.

**Decision (2026-10-20, the human):** `main` is the production branch. Nothing has been
configured in Vercel for other branches, so Vercel's defaults apply, which means other
branches (including `arc/*`) deploy as previews, never to production. The human does not
mind `arc/*` previews; the requirement is only that `arc/*` never reaches production, and
that holds until something is merged into `main` (which goes through a pull request).
Nothing to change.

**Env vars per environment (2026-10-20, the human, checked in the Vercel dashboard):** the
public variables (`NEXT_PUBLIC_*`) are enabled for Preview as well; all secret variables
(the API keys) are enabled for Production only. Consequences, from the code:

- A preview of an `arc/*` branch builds, but every route that calls a vendor (chat,
  evaluation, TTS, both token routes) has no key and fails at runtime. Only the native
  speech recognition, which needs no server, works there.
- The mock routes do not help in a preview: they answer 404 outside `next dev`.
- A preview therefore cannot spend any vendor key. That also bounds K3 to production.

Nothing to change; it is a consistent setup for the stated wish (no `arc/*` in production,
no objection to previews). **Booked as ADR-001.**

### K3 — The routes have no caller authentication or rate limit

Nothing in the repo checks who calls `/api/chat`, `/api/evaluation`, `/api/tts` or the token
routes, and each of them spends a paid vendor key. **Question:** is that a conscious choice
for a personal project on an unshared URL (and accepted until the repo is shared), or a gap?
Whether Vercel-side protection exists is not visible from the repo.

**Decision (2026-10-20, the human):** the risk is accepted for now, but the human wants to
solve it soon (see K7). Production deploys on a merge into `main`. No Vercel Deployment
Protection was set up deliberately; the dashboard shows Vercel Authentication ("require
login") active with Standard Protection. Per Vercel's documentation that scope protects
everything except the production domain: previews and generated deployment URLs ask for a
Vercel login, the production domain stays public. So the production routes remain
reachable by anyone who knows the URL, and K3 stands for production. (The sources differ
on some older production URLs; check the dashboard if it matters.) Vendor spend limits exist at some vendors but the
human no longer knows exactly which; getting that overview is the human's own task, outside
the repo, to be picked up soon. It is the only cap on the damage that does not depend on
code. **Booked as ADR-002** (provisional; K7 will supersede it).

### K4 — No CI in the repo

Checks run by hand. README mentions CI when the repo goes public. Related to the plan's "no
test suite" decision. **Question:** deliberate and settled, or something to revisit?

**Decision (2026-10-20, the human):** the absence of CI was not a deliberate choice. The
checks (lint, typecheck, build, `docs:check`) should run on a pull request to `main`. How
that is set up is K8. **Booked as HDR-003.**

### K5 — Why `gemini-3.1-flash-lite`?

The provider (Gemini) was specified up front in plan.md → Fixed constraints. The model
string is the same constant in the chat and the evaluation code; the reason for this model
is not recorded in the code or the plan.

**Decision (2026-10-20, the human):** a deliberate choice, made on price. No extensive
comparison with other models was done; the plan's measurements (10-06 to 10-10) describe
how this model performs, they did not compare it with others. **Booked as ADR-003.**

### K6 — Google TTS key as a URL query parameter

`src/lib/tts/google.ts` sends the key in the URL; the other providers use a header. The
reason is not recorded. **Question:** deliberate, or just how it was first written?

**Answer (2026-10-20, the human):** not a deliberate choice. Still open: whether to change
it. What was found: in the code path read, the URL is not logged on failure (the error
message carries only the status and the response body, and the route logs it server-side);
whether Node's `fetch` adds the URL to a network error was not tested. Google's general
documentation describes sending an API key in the `x-goog-api-key` header for REST calls,
but a search did not confirm that the Text-to-Speech endpoint accepts that; verify before
changing the code.

### K7 — How to protect the routes (follow-up of K3)

Open. The human wants the exposure of the vendor-calling routes in production solved soon.
Needs discovery before a decision: what kind of protection fits a personal app used from
one browser and one iPhone (the options range from platform-level protection on the
deployment to a check inside the routes), and what each costs in complexity and in the
iPhone flow. Not researched yet.

### K8 — CI on pull requests to `main` (follow-up of K4)

Open. Wanted: lint, typecheck (`npx next typegen && npx tsc --noEmit`), build and
`npm run docs:check` on every pull request to `main`. Not researched yet. One thing to look
at first: `docs:check` has a check that reads git history (the plan-staleness warning), so
it may need the full history in a CI checkout. Not built; no workflow file exists.

## Decision log

- **2026-10-20 — balance accepted.** The human accepted `software-architectuur.md` as v1.0
  (leading document), as a whole. Next: the drift trial (a DFT report), in a later session.
- **2026-10-21 — K1, K2, K3, K4, K5 booked.** HDR-002, ADR-001, ADR-002, HDR-003 and ADR-003
  crystallize those five decisions into their own records, per the grootboek's own rule that
  a journal issue lands in a target record rather than staying a journal entry. K6 stays
  unbooked: it is answered but not yet decided whether to act on it.
- **2026-10-21 — balance extended with the frontend layer.** REQ-GG-01's scope gap closed;
  most of what the explorer found was already decided in `plan.md` (09-29, 09-30, 10-02,
  10-03), cited from the balance rather than duplicated.
- **2026-10-21 — DFT-001: first reconciliation, no drift found.** REQ-GG-05 exercised once.
  No code change has happened since the balance was written, so this proved the process
  (a reconciliation can be requested and registered) rather than its ability to catch real
  drift. The loop (journal → decision → document → code → drift) still has not closed
  end-to-end; that needs a real code change to follow a decision, which has not happened
  yet (REQ-GG-09).

This journal closes when K6, K7 and K8 are decided or parked.
