# Executor prompt template

Claude fills the {{PLACEHOLDERS}} per group of fixes and passes the result to a
general-purpose subagent. Everything under "Changes" is a decision the owner already took;
the executor must not have to invent anything. Delete this heading and this paragraph from
the prompt that is sent.

---

## Task
{{ONE_LINE_SUMMARY}} in the repo at {{REPO_ROOT}} (branch {{CURRENT_BRANCH}}). Read the
project's agent instructions first (AGENTS.md, then CLAUDE.md) and follow them, including
the Next.js docs they point to before touching framework code.

DO NOT commit, stash, switch branches or change git state in any way. The owner commits
afterwards. Edit only the files named under "Changes".

Follow the owner's house conventions: the list "House conventions" in
{{CRITERIA_FILE}}. Keep existing comments that still apply.

{{OTHER_AGENTS_NOTE}}
(When another agent edits other files in the same working tree: name those files, say not
to touch them, and say to ignore lint or type errors that come from them after one re-run.)

Everything below was decided by the owner. If something does not fit, STOP and report
rather than inventing. Do not add features, tests, dependencies or UI changes that are not
listed.

## Changes
{{CHANGES}}
(Per file: what changes and the exact design where it is a choice: names, shapes, limits,
messages, where new files go. Include documentation updates the project rules require, such
as the plan and its decision log, with the Source column filled as the project rule says.)

## Out of scope
{{OUT_OF_SCOPE}}
Anything not listed under Changes.

## Processes
- Never stop processes you did not start. Do not use `taskkill`, `pkill` or `killall` by
  image or process name. The owner may have a dev server running; leave it alone.
- If a port is busy, use another one. For a dev server use port {{DEV_PORT}}.
- Stop a server you started by its PID, and only that one.
- Do not call paid or external services (real API routes, real keys). Exercise mock paths
  or pure functions only.

## Verify
From the repo root: {{VERIFY_STEPS}}. Then `git status --short` and report anything
outside the files listed here.

## Report back
Files changed with a line each; every decision you made yourself; verify results including
any command output you relied on; anything that did not fit the spec.
