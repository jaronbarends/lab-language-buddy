# HDR-003: Run the repo's checks on pull requests to `main`

- **Status:** accepted
- **Date:** 2026-10-20
- **Implementation:** 0
- **Type:** Harness Decision Record (HOW do we work)

## Decision

The absence of CI in this repo was not a deliberate choice. The checks already named in
`CLAUDE.md` (lint, typecheck, build, `npm run docs:check`) should run automatically on every
pull request to `main`. How that is built is still open (JNL-001, issue K8); this record
only settles that it is wanted.

## Why

Checks exist and are documented, but nothing enforces that they were actually run before a
merge that goes straight to production (see ADR-001). That gap surfaced during the grootboek
onboarding and was not a considered trade-off.

## Consequences

- No workflow exists yet; this is intent, not implementation. `implementatie: 0` in the
  register reflects that.
- One known wrinkle for the build: `docs:check` reads git history for its plan-staleness
  warning, so a CI checkout may need more than a shallow clone. To be confirmed when K8 is
  picked up.
- Source: JNL-001, issues K4 and K8.
