# HDR-004: Session-scoped refactor loop instead of an unattended push-hook

- **Status:** implemented
- **Date:** 2026-10-21
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

Building REQ-AH-13 (the agentic-harnas refactor loop) on `arc/agentic-harnas`, ARC's own
convention wires a git-level push-hook that spawns the `refactor-werkplaats` agent
unattended, in the background, on every `git push` — including pushes made outside Claude
Code entirely. Building that exact mechanism here was refused by Claude Code's own safety
classifier, with the reason "Create Unsafe Agents": an unattended, code-editing agent
triggered automatically by a routine git operation.

What is built instead is session-scoped: a `guard-push-sweep` PreToolUse hook
(`.claude/hooks/guard-push-sweep.cjs`) that, when the lead thread (not a subagent) runs
`git push`, sweeps `src/` for files past the doorbell/hard-limit without a register decision
(`scripts/sweep-code-architectuur.mjs`). If it finds files newly flagged — not already
pending — it denies the push and names them. The lead thread then spawns the
`refactor-werkplaats` agent for those files itself, in the same human-supervised session,
before retrying the push. A pending marker (`docs/.refactor-pending.json`, 24h TTL) stops a
later push from re-flagging a file that already has a proposal awaiting review.

## Why

**Kernprincipe:** the harness's own safety boundary on unattended, code-editing automation
takes precedence over matching an external convention literally, even one as considered as
ARC's own. An agent that can edit files and is triggered by something as routine and
frequent as `git push`, without a human present at the moment it fires, is exactly the risk
class this classifier exists to catch — regardless of how carefully the agent itself is
scoped (worktree isolation, a guard against its own push/merge, human sign-off on the
result). The safer mechanism keeps the trigger inside an active, supervised session: the
hook denies instead of spawning, and the human-in-session lead thread makes the actual call
to delegate.

This also means the refactor loop only catches pushes made through Claude Code — a push from
a plain terminal bypasses it entirely. That is an accepted, named blind spot, consistent with
the same limitation already accepted for `guard-no-subagent-commit` and `triage-guard`
elsewhere in this harness.

## Consequences

- `.claude/hooks/guard-push-sweep.cjs`, `scripts/sweep-code-architectuur.mjs` and
  `.claude/agents/refactor-werkplaats.md` implement this; `docs/code-architectuur.md` §4 and
  the "Refactor loop" line in `CLAUDE.md`'s working agreements document it for every session.
- Any future harness work that wants to port another ARC convention verbatim should check it
  against this same boundary first, rather than discovering the refusal mid-build.
- If this safety classifier's boundary ever changes, or a differently-scoped unattended
  mechanism is proposed, this decision is the one to revisit — not a reason to quietly route
  around the refusal.
