# Criteria: maintainability review of one stage

Project-specific part of the stage-review skill. The script copies this file next to the
review results, because the reviewer's worktree has `.claude/` stripped.

Scope: what this stage changed (the stage diff, see the review prompt). Read surrounding
code to understand it, but report only findings that sit in, or are caused by, the stage
diff. Code from earlier stages that this diff did not touch is out of scope.

The question behind every finding: **what would make the next change here slower or
riskier than it needs to be?** A finding that cannot answer that is taste, not a finding.

## What to check

1. **Boundaries.** Is it clear what runs on the server and what on the client? Does
   anything cross that line that should not (secrets, provider error text, server-only
   imports in client code)? Does logic live where a reader would look for it?
   Also check **ownership**: for every value the client chooses and the server forwards
   under its own credential (an id, a session or conversation handle, a URL), who is
   allowed to use it? Does the server bind it to a caller or session, or does it trust that
   only the rightful owner can know it? Name the assumption. If nothing in the code
   enforces it, report it. Mark such a finding `observed` when the code visibly lacks the
   check, and `inferred` when it depends on how the provider or deployment behaves, and say
   which fact you would need.
2. **Duplication and drift.** Where the stage has parallel paths (a real and a mock
   implementation, client and server copies of a shape), where do they repeat each other,
   and where could they silently diverge (request, response and error shapes)? Is there a
   single source of truth for each contract between client and server?
3. **Types at the edges.** Is data from outside (request body, model output, env) validated
   before it is trusted? Look for `any`, `as` casts, non-null assertions, and optional
   fields that are really required. Can a type express a combination that means nothing?
4. **Failure and state.** Are failure paths handled the same way everywhere (timeout, bad
   input, provider error, empty result)? Can the session state machine reach a state the UI
   does not handle? Are limits and deadlines defined once, or scattered as magic numbers?
5. **Legibility without context.** Could someone who has not seen the plan or the chat
   history understand why the code is shaped this way? Missing "why" comments on
   non-obvious choices count. Comments that restate the code do not. A comment that claims
   something that is not true (a flag that does not exist) is a finding.
6. **Dead and leftover code.** Scaffolding that this stage made obsolete, unused exports,
   unused dependencies in package.json.
7. **Testability.** Can the core logic be exercised without calling the external service?
   Where are the seams, and are they in the right place? (The project has decided not to
   have a test suite for now; judge only whether the seam is cheap to add later.)
8. **House conventions** (checkable, report as low severity unless it hides a bug):
   function declarations rather than `const f = () =>`; every `if` braced and multi-line;
   early returns over nesting; boolean names that read as a sentence (`xIsValid`,
   `yHasValue`, not `isXValid`); event handlers `handleX`; hooks `useX`; kebab-case
   directories.

## Next.js

This repo runs a Next.js version with breaking changes. Before judging any route handler,
caching, or routing detail, read the relevant guide in `node_modules/next/dist/docs/`. If
you are unsure whether something is wrong or just new, say so rather than guessing.

## Out of scope

- Visual design and layout.
- New features or "while you are here" additions. If something is missing, say so as a
  finding; do not propose scope.
- Style preferences that are not in the conventions above.
- Speculative scale concerns. Judge for this app at its current size, and say when a point
  only matters at a larger scale.
- Facts outside the code (whether the app will be public, whether tests are planned). When
  a finding depends on one, mark it `suspicion` and say which fact you would need. It does
  not belong among the medium findings unless the code is wrong either way.

## Do not assume intent

Do not assume something is deliberate because it is there. If a choice looks arbitrary,
report it and say what would have to be true for it to be right.
