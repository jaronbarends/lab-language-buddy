---
titel: Cold-start journal — can a newcomer work from the repo alone?
status: afgerond
datum: 2026-10-27
kernvraag: Where does the repo not describe itself well enough for an agent that has nothing but the repo?
doel-records:
  - "HDR-011 (K1, K2)"
---

# JNL-002 — Cold-start journal: can a newcomer work from the repo alone?

**Core question.** REQ-GG-10 (Stroomlijn onboarding tot zelfde-dag-productief) asks that a new
agent or teammate is productive the same day. Where does the repo not describe itself well
enough for someone who has nothing but the repo?

**Main message.** Orientation works; working practice has two gaps. A fresh agent with no
memory and no hints answered four orientation questions from the loaded `CLAUDE.md` files
without inventing anything, and made a correct small change. It missed two things the repo
never says outright: which branch arc work starts from, and that the branch is made before the
first edit.

**How this was made.** A fresh clone in `repo-cold` (no memory, no local settings, pushing
disabled) on `arc/arc-main` at bd508d5, and a new Claude Code session. Two prompts, no hints:
four orientation questions with nothing to change, then "the README says which checks you run:
check that and fix it". Scored from the working tree and from Jaron's transcript. One round,
so it measures the first hour and not the day. One prediction of mine was wrong: the README
listed three checks, not one; I had read a search that misses `npx` lines.

## What the run showed

| Part | Result |
|---|---|
| What is this project | Good. Correct, from the loaded `CLAUDE.md` files; the Next.js warning in `AGENTS.md` included |
| How decisions are recorded | Good. Two layers (`plan.md` before 2026-10-20, the grootboek after), registers first |
| What to do before a change | **Partly.** Own branch, plan, skills: right. The base branch for arc work: missing |
| What not to do alone | Good, and thorough: hooks, override, triage, leading documents, the incident register, the order of the checks, and the conflict between the session's Co-Authored-By request and the project's rule resolved in the project's favour |
| Invented answers | None. It said which documents it had not opened |
| The small change | Correct: the three missing checks, in the order of `CLAUDE.md`, with the iPhone test left out on purpose and said so |
| Questions asked, corrections given | None, none |
| Branch | **None.** It edited `README.md` on `arc/arc-main`, uncommitted, and only said afterwards that it needs a branch |
| Checks run | **No**, and it said so. `docs:check` needs no `npm install` |

Orientation came entirely from the `CLAUDE.md` files that load by themselves: it did not open
the README, `docs/index.yml`, `plan.md` or the registers. The layering works.

## Issues

| # | Issue | Status |
|---|---|---|
| K1 | The base branch for arc work is not in the root `CLAUDE.md` | decided 2026-10-27, booked in HDR-011 |
| K2 | Nothing says the branch comes before the first edit | decided 2026-10-27, booked in HDR-011 |
| K3 | The checks were not run, though they could have been | decided 2026-10-27: not repeated in round two |
| K4 | The README links to a private artifact a newcomer cannot open | decided 2026-10-27: the link stays |
| K5 | What does one run of one hour prove? | decided 2026-10-27 |
| K6 | Does the "no AI-or-self verdict" rule hold? | decided 2026-10-27: holds in two runs |

### K1 — The base branch for arc work is not in the root `CLAUDE.md`

The root says branches are "merged into `main` through a pull request". For arc work that is
not what happens: it branches from `arc/arc-main` and goes back into it. That is written in
`docs/grootboek/CLAUDE.md`, which loads only when working in that folder, and in the CI
workflow. The fresh agent's answer to "what do I do before a change" followed the root exactly:
`stage/N-name`, a descriptive name or `spike-*`, and never commit to `main`. No base branch.

**Decided (Jaron, 2026-10-27):** one sentence in the root `Branches` line, naming
`arc/arc-main` as the base while it is the integration branch, and `main` as production.
**Booked as HDR-011.** The sentence has to change when `arc/arc-main` merges into `main`.

### K2 — Nothing says the branch comes before the first edit

"One branch per piece of work" is true but not when. The agent edited on `arc/arc-main` and
reported correctly that it needs a branch and a PR. Nothing was committed, so no rule was
broken; Jaron expected the branch first.

**Decided (Jaron, 2026-10-27):** the same sentence says the branch is created before the first
edit. **No hook for it.** It is one incident and the rule is not even written yet; if it
recurs after the rule, the pattern escalates (HDR-010 gives the reasoning). Logged as the
pattern `branch-before-edit` in the incident register. **Booked as HDR-011.**

### K3 — The checks were not run, though they could have been

The agent listed the three scripts correctly and checked that they exist in `package.json`, but
did not run any check before saying "I've fixed it", and said so plainly. `docs:check` needs
nothing but Node, so the missing install was no excuse. This is behaviour, not a missing
sentence: the rule is in `CLAUDE.md`. **Decided (2026-10-27):** it did not recur. In round two the
agent ran all six checks, `build` included, plus the dev server, and said what it had not done.
No rule change.

### K4 — The README links to a private artifact

The README's Arc paragraph points at a private artifact, marked "for my own reference only". A
newcomer cannot open it. The run did not test this: the agent never read that paragraph. Whether
the principles should be reachable for a newcomer is Jaron's call. **Decided (Jaron,
2026-10-27):** the link stays. In round two the agent noticed it, left it alone and said that a
newcomer cannot open it.

### K5 — What does one run of one hour prove?

It proves that the knowledge is there and in the right layers. It does not prove "the same day",
and one run is one data point. **Decided (2026-10-27):** the first hour is the measure, a run
counts as productive with at most two corrections the repo already answers (the incident
threshold is three), and REQ-GG-10 counts as almost met until a second round after the fixes
comes out better. That happened on 2026-10-27, see round two below.

### K6 — Does the "no AI-or-self verdict" rule hold?

Weak evidence that it does. Jaron's global instructions say to give a one-line "let AI generate
this / write it yourself" recommendation before any new task, and the second prompt was a new
task. The agent had read those instructions (it cited their Co-Authored-By rule against the
session's request) and gave no verdict. **Decided (2026-10-27):** it held again in round two, on a
different task, so it holds in two runs. An earlier version of this journal wrongly said no
occasion had arisen in round one.

## Round two

A new clone (`repo-cold-2`) at ad88f62, after HDR-011 was merged: no memory, no local settings,
pushing disabled, the same four orientation questions and a new task ("walk the README as a
newcomer, run what can be run, fix what does not match"). Scored from the working tree, the
reflog, and the agent's own report; its claims about the repo were checked against the repo.

| Part | Result |
|---|---|
| Base branch (K1) | Named: "grootboekwerk (`arc/*`) vertrekt vanuit `arc/arc-main` en gaat via een PR terug. `main` is productie" |
| Branch before the first edit (K2) | Stated in the orientation answer and done: the branch was made at 15:23:51 and the README last changed at 15:24:06 |
| Checks run (K3) | All six, `build` included, plus the dev server with the mocks; said what it had not done (a browser, an iPhone, real API keys) |
| Private link (K4) | Noticed, left alone, reported |
| AI-or-self verdict (K6) | Not given |
| Questions asked, corrections given, permission asked for `npm install` or `build` | None, none, none |
| Invented claims | None found; the README claims were checked against `src/lib/tts/`, Next's `engines`, `findings.md` and the tracked files |
| The change | Correct: the TTS row, the checks, the layout, the findings paragraph, the Node version, a pointer to `CLAUDE.md` and `docs/index.yml`. The last two are additions more than corrections |

An automatic safety check refused the agent's first attempt to stop the dev server (`taskkill`
on every node process); it then stopped only its own server. `npm install` reported four
vulnerabilities (one critical, three high); the agent did not look into them and neither was
this journal's scope. By the rule set in K5, the criterion for REQ-GG-10 is met. What that
proves is limited: two runs of the same kind of agent, with Jaron's global instructions loaded,
on the first hour, on a task that points the agent at a document that points at everything else.
A human newcomer, a different model and "the same day" are untested.

The README changes of round two were adopted from the clone's diff on `arc/cold-start-round-2`.

## Decision log

- **2026-10-27 — K1 and K2 decided and booked as HDR-011.** One sentence in the root `Branches`
  line. The incident `branch-before-edit` is logged. K5 decided: a first-hour measure.
- **2026-10-27 — Round two, and K3, K4 and K6 decided.** K3 did not recur, the link in the
  README stays (Jaron), and the AI-or-self rule held a second time. Every issue is decided and
  HDR-011 exists and points back, so the journal is `afgerond`. REQ-GG-10 meets the criterion of
  K5, with the limits above.
