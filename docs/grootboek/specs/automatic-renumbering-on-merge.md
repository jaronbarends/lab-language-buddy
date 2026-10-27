---
titel: "Automatic renumbering of grootboek records on merge"
type: spec
soort: plan van aanpak
status: concept
datum: 27 oktober 2026
auteurs: Jaron, Mama Claude
---

# Automatic renumbering of grootboek records on merge

**The point.** HDR-005 says the branch that merges second renumbers its own records, before
the merge. Today that rests on someone remembering it. This feature makes it mechanical, in
three parts: a check that makes a duplicate id loud, a script that does the renumbering, and a
hook that stops a merge of `arc/arc-main` or `main` until the script has run.

## The flow

1. Jaron asks Claude Code to merge `arc/arc-main` (or `main`) into a branch.
2. The hook sees the merge, checks the branch's records against that ref, and finds ids that
   collide. It denies the merge and names them.
3. Claude runs `npm run docs:renumber`. The branch's own records get the next free numbers.
   One commit.
4. Claude retries the merge. The registers still conflict where both sides appended, but they
   now hold different ids, so the fix is to keep both sides.
5. In a plain terminal there is no hook. Jaron runs the script before every such merge; with
   nothing to renumber it does nothing. The duplicate check is the net if it is forgotten.

## Part 1: duplicate-id check in `docs:check`

- Each register (adr, hdr, pdr, dft, jnl) holds each id once.
- The file named in `bestand` exists and starts with its id, lowercase (`hdr-007-…`).
- It fails like the other checks in `scripts/check-docs.mjs`, locally and in CI on every PR.

## Part 2: the script, `npm run docs:renumber`

- Compares the branch with a base ref, default `origin/arc/arc-main`; it runs `git fetch`
  first. `--check` reports collisions and changes nothing (the hook uses this).
- **A collision** is an id that is in the base register and in the branch's register with a
  different `bestand`. Same id and same file means the record has already landed: it stays.
- The branch's record takes the next free number: one past the highest id of that type in the
  base and in the branch. Merged records never change number (HDR-005).
- **Scope of the replacement.** Only lines the branch itself added or changed since the
  merge-base (`git diff -U0 <merge-base>`). Inside those lines `HDR-006` becomes `HDR-007`
  and `hdr-006-` becomes `hdr-007-`; the record file is renamed. This is why it is safe:
  before the merge, every mention of the colliding id in those lines means the branch's own
  record.
- **It refuses** when a merge is in progress, or when the branch already holds duplicate ids
  (the references are ambiguous by then). The message says to abort the merge and start over.
- Running it twice does nothing the second time.

## Part 3: the hook

- A PreToolUse hook on `Bash`, lead thread only (like `guard-push-sweep`), for
  `git merge <ref>` where `<ref>` is `arc/arc-main`, `origin/arc/arc-main`, `main` or
  `origin/main`. `main` is included because `arc/arc-main` is expected to merge into `main`
  and become the central branch.
- It runs the script with `--check` against that ref. Collisions: deny, name them, say
  `npm run docs:renumber` then retry. None: pass.
- Not covered: `git pull`, merges made in another tool, a merge written in a script. Same
  blind spot as the other hooks (HDR-004).

## Tests

A first automated test in this repo, with `node:test` (built into Node) on a throwaway git
repo built in a temp folder: a base with an HDR-006 and a branch with its own HDR-006.
Cases: renumbers to HDR-007 and updates the register, `index.yml` and the references; leaves
a record that already landed alone; does nothing on a second run; refuses during a merge;
refuses on existing duplicates; the duplicate check fails and then passes.

The real test is `arc/bubble-animation`: its Modern Web Guidance trial holds HDR-006 and must
become the next free number, which is after the HDR this feature books.

## Done when

- `npm run docs:check` fails on a duplicated id and passes on the current repo.
- The test suite passes, and the real run on `arc/bubble-animation` gives the expected
  result with no hand-editing beyond keeping both sides of the append conflict.
- The hook denies a colliding merge and passes a clean one, for `arc/arc-main` and `main`.
- A new HDR books the decision. It extends HDR-005 (its step 3 is no longer manual), and the
  numbering section of `docs/grootboek/CLAUDE.md` is updated. That file is a leading
  document, so the change is reported and checked.

## Sources

- **The thinking:** this session; HDR-005 (the rule being made mechanical).
- **The pattern:** `.claude/hooks/guard-push-sweep.cjs` and HDR-004 (deny, name the files,
  retry); `.claude/hooks/notify-leading-document.cjs` and HDR-006 (procedure as data).
- **Where it lands:** `scripts/check-docs.mjs`, `package.json`, `.claude/settings.json`,
  `docs/grootboek/CLAUDE.md`.
- **The test case:** branch `arc/bubble-animation`, its HDR-006 (Modern Web Guidance trial).
