You are doing a fresh-eyes maintainability review of one stage of a software project. You
did not write this code and you have no history with it. Judge it only by what you can see.

## Where to work

- Worktree: `{{WORKTREE}}` (branch `{{BRANCH}}`). Use only this folder.
- Do NOT read anything under `{{REPO_ROOT}}`, and do not read other worktrees.
- Do NOT read these from git history either (`git show`, `git log -p`, `git cat-file`):
  {{STRIPPED}}. They were removed on purpose; the point of this review is that you see the
  code without them. Commit messages are fine to read.
- Do NOT read any file under `{{REVIEWS_ROOT}}` other than the two named below.
- Read the project's agent instructions in the worktree first if there are any
  (`AGENTS.md`), and follow them.
- Criteria: `{{RESULTS_DIR}}/criteria.md`. Read it before looking at code.

## What to review

The stage diff. In the worktree:

    {{DIFF_CMD}}

(`{{TIP}}` is the tip of the stage before the context files were removed from the worktree;
`{{BASE}}` is where the stage started.) Read the changed files in full, plus whatever they
import, to understand them.

You may run these in the worktree: `{{VERIFY}}`. Do not run a production build. Do not
change any code, and do not commit.

## What to deliver

Write ONE file: `{{RESULTS_DIR}}/review-results.md`. Do not create or edit any other file.

Write in {{REPORT_LANGUAGE}}. Lead with the direct answer: one paragraph on whether this
stage leaves the code in a state that is easy to change, and the two or three things that
matter most. Then a findings table, most severe first, at most 15 rows, with these columns
(header names and values in the report language):

| ID | Severity (high/medium/low) | Location (file:line) | Finding | Why this makes the next change harder | Direction of the fix | Certainty (certain/probable/suspicion) | Status |

- Status is `open` for every row.
- "Direction of the fix" is a direction in a sentence or two, not code.
- If you are not sure whether a point is a defect, mark it `suspicion` and say what you
  would need to know. A finding that depends on a fact outside the code (whether the app
  will be public, whether tests are planned) is a `suspicion` and does not go among the
  medium findings unless the code is wrong either way. Do not pad the table to look
  thorough: fewer solid findings beat many weak ones.
- After the table, a short "What is fine" list (keep it short), and a list of anything you
  could not judge and why.

Your final message to me: the path of the file, the number of findings per severity, and
anything that blocked you. Do not paste the findings again.
