# HDR-007: Renumbering is mechanical: a check, a script and a guard hook

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

HDR-005 says the branch that merges second renumbers its own records. That rested on someone
remembering it, and on doing it by hand in the right order. This record makes it mechanical
and changes the order.

- **Order: renumber first, then merge.** HDR-005 had the branch merge `arc/arc-main` first and
  renumber afterwards. After the merge, a mention of `HDR-006` can mean either of two records
  and no tool can tell which. Before the merge only the branch's own record has that id, so a
  find-and-replace is exact. This reverses steps 1 to 3 of HDR-005; the rest of it stands.
- **A script**, `npm run docs:renumber` (`scripts/renumber-records.mjs`). It compares the
  branch's registers with a base ref (default `origin/arc/arc-main`). A record whose id the
  base holds for a different file gets the next free number. The record file is renamed and
  the new id replaces the old one in the lines the branch itself added since the merge-base:
  registers, `docs/index.yml`, the record, journals that mention it. It changes nothing in
  records that have already landed, and does nothing on a second run. It refuses during a
  merge, and when the branch already holds a duplicated id.
- **A check** in `npm run docs:check`: each register holds each id once, the record file
  exists and its name starts with its id in lowercase. It also runs in CI on every PR, so it is
  the net for a merge done in a plain terminal.
- **A guard hook**, `guard-merge-renumber`: when the lead thread runs `git merge` of
  `arc/arc-main`, `origin/arc/arc-main`, `main` or `origin/main`, it runs the script in check
  mode against that ref. Collisions: it denies the merge, names them and says to run the script
  first. `main` is included because `arc/arc-main` is expected to merge into `main` and become
  the central branch.

## Why

**Kernprincipe:** a rule that has to be remembered fails when it matters, and a repair that
needs judgment is better done at the moment when the judgment is still unambiguous. Renumbering
before the merge is that moment. The guard hook turns "remember to" into "the merge does not
start until", the same split as `guard-push-sweep` (HDR-004): the hook denies and names, the
lead thread does the work and retries. The script is plain Node, not an agent, so it does not
meet the objection that stopped the unattended refactor hook.

The replacement only touches lines the branch added. A branch that wrote `HDR-006` after the
base already held a different HDR-006 is the one case this cannot see, which is why the
procedure is "before the merge" and not "whenever".

## Consequences

- **First automated test in this repo.** `scripts/renumber-records.test.mjs`, with `node:test`
  (built into Node, no dependency), run by `npm run test:scripts`. The plan said "no test
  suite" (`docs/plan.md`, Decisions); it now says the app has none and that scripts that
  rewrite documents get a test (decision log 10-27). Open question 2 in the plan, tests for the
  app, is unchanged.
- **Run against the real case** on 2026-10-27 in a throwaway worktree of `arc/bubble-animation`:
  its Modern Web Guidance trial went from HDR-006 to HDR-007, five files changed, no HDR-006
  left. After this branch merges, that trial takes the number after this record.
- **Blind spots, accepted:** the hook sees only merges the lead thread runs through the Bash
  tool, not `git pull`, another tool or a script (the same limit as HDR-004). Outside Claude
  Code the net is the duplicate-id check, and the habit of running the script before the
  merge; with nothing to renumber it does nothing.
- **HDR-005 is not edited.** It is implemented, and a record that has landed does not change.
  Two of its statements no longer hold: the order of its steps, and that `docs:check` does not
  detect duplicate ids. This record is the counter-entry. `docs/grootboek/CLAUDE.md` carries
  the current rule.
- **Memory outside the repo** (Claude's own notes) may mention an id that moves; that is not
  covered by the script.
