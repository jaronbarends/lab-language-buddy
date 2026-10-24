# HDR-006: A hook reminds the agent of the duty to communicate

- **Status:** implemented
- **Date:** 2026-10-24
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

The duty to communicate (REQ-GG-04, Implementeer de communicatieplicht bij documentwijzigingen)
is a working rule in the root `CLAUDE.md`: when a leading document changes, say what changes
and why, show the concrete change, and ask for a check. A rule that lives only in the context
depends on the agent remembering it at the moment it edits. This record adds the reminder at
that moment.

What is built:

- **The list of leading documents** is defined once, in the root `CLAUDE.md`: every
  `CLAUDE.md` in the repo, `docs/grootboek/software-architectuur.md` (the only balance so far)
  and `docs/code-architectuur.md`. Records, `docs/plan.md` and the README are outside the duty.
  `docs/grootboek/CLAUDE.md` points to the root instead of repeating it.
- **A PostToolUse hook** (`.claude/hooks/notify-leading-document.cjs`) runs after every `Edit`
  and `Write`. If the file is a leading document it returns the reminder as context; otherwise
  it stays silent. It never blocks: the change is made, and Jaron's check comes before the
  commit.
- **The list and the wording live in `.claude/hooks/leading-documents.json`** next to the
  script. A new balance, or a different sentence, is a change to that file, not to the code.
- **Subagents get their own wording.** A subagent cannot ask Jaron, so it is told to list the
  change under open points in its report; the lead thread passes it on and asks for the check.

## Why

**Kernprincipe:** a rule that depends on being remembered fails exactly when the agent is busy,
which is when documents drift. The reminder belongs at the point of the edit, injected by the
harness, not in a list the agent has to consult. This is the same split the working agreements
already use: the procedure is data, the hook is delivery.

The hook fires after the edit and does not deny it, unlike the other hooks in this harness
(`guard-kenniswerker`, `triage-guard`). Before the edit it cannot know what changed, and the
change is cheap to undo until it is committed. Blocking would also turn a small correction into
a stop-and-wait for a check that Jaron makes on the whole change anyway.

It also fires for subagents. First idea was to leave them out, as the other hooks do. That would
make a silent edit possible exactly where the duty is hardest to keep: a builder whose file
boundary includes a `CLAUDE.md`. The builder cannot ask, but it can report.

## Consequences

- Tested live on 2026-10-24 after a session restart: the hook fired on the lead thread and on
  a builder subagent, the builder quoted the subagent wording and listed the change under open
  points. Both throwaway edits were reverted; the file was clean afterwards.
- **No de-duplication.** Every edit gives one reminder, so an edit and its revert give two. The
  wording tells the agent to say nothing more if it already reported the change. If this turns
  noisy in real work, add de-duplication per document, not a weaker rule.
- **Blind spots, accepted:** the hook only sees `Edit` and `Write`. A change made through a
  shell command (`sed`, `git checkout`, a script) does not trigger it, and neither does an edit
  outside Claude Code. The same limit applies to the other hooks (HDR-004).
- **The list exists in two places:** the sentence in the root `CLAUDE.md` and
  `leading-documents.json`. A new balance has to be added to both. Nothing checks that they
  agree; a check in `npm run docs:check` is a possible later step, not part of this record.
- **Related, not decided here:** DFT-002 (the subagent-tenzij guard blocks `CLAUDE.md` files
  under `src/` for the lead thread). The hook does not depend on who edits those files.
