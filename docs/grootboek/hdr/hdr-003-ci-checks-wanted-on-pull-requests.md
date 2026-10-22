# HDR-003: Run the repo's checks on pull requests to `main` and `arc/arc-main`

- **Status:** implemented
- **Date:** 2026-10-20
- **Implemented:** 2026-10-22
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Decision

The absence of CI in this repo was not a deliberate choice. The checks already named in
`CLAUDE.md` (lint, typecheck, build, `npm run docs:check`) run automatically on every pull
request to `main` or `arc/arc-main`, in `.github/workflows/checks.yml`. The register drift
check of REQ-AH-12 (mechanism 2) runs in the same workflow on purpose: one piece of CI
infrastructure, not two.

## Why

Checks exist and are documented, but nothing enforces that they were actually run before a
merge that goes straight to production (see ADR-001). That gap surfaced during the grootboek
onboarding and was not a considered trade-off.

## Consequences

- **Triggers.** `pull_request` with `branches: [main, arc/arc-main]`. A branch that no
  longer exists is never matched, so deleting `arc/arc-main` later needs no change.
- **Full history.** `docs:check` reads git history for its plan-staleness warning, so the
  checkout uses `fetch-depth: 0`.
- **Drift check verifies, never repairs.** `npm run register:check` runs
  `sync-code-architectuur-register.mjs --check`: no write, no `git add`, exit 1 on drift.
  With the Husky hook (mechanism 1) this completes REQ-AH-12.
- **Lockfile.** `npm ci` rejected the lockfile on Linux (missing `@emnapi/core` and
  `@emnapi/runtime`, optional wasm dependencies). Both are now pinned as devDependencies.
- **Lint scope.** `.claude/hooks/**` is excluded from ESLint: the CommonJS hooks already
  failed `npm run lint`.
- Not (yet) a required status check: whether a red run blocks the merge button is a GitHub
  branch-protection setting, outside the repo.
- Source: JNL-001, issues K4 and K8.
