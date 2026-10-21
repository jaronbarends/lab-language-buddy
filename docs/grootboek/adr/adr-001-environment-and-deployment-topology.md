# ADR-001: Environment and deployment topology

- **Status:** accepted
- **Date:** 2026-10-20
- **Type:** Architecture Decision Record (WHAT do we build)

## Decision

`main` is the production branch. No other branch is configured in Vercel, so Vercel's
defaults apply: every other branch (including `arc/*`) deploys as a preview, and nothing
reaches production except through a merge into `main` (which goes through a pull request).

Environment variables split the same way: the public `NEXT_PUBLIC_*` variables are enabled
for Preview as well as Production; every secret (the vendor API keys) is Production-only.

## Why

The requirement was narrow: `arc/*` branches must never reach production, previews are
fine. Vercel's own defaults already satisfy that without any configuration, so nothing
needed to change. The env-var split was already in place (checked in the dashboard, not
decided here) and happens to fit the same requirement: a preview cannot spend a vendor key
even if someone finds its URL.

## Consequences

- A preview of an `arc/*` branch builds, but every route that calls a vendor (chat,
  evaluation, TTS, both token routes) has no key and fails at runtime. Only native speech
  recognition, which needs no server, works there.
- The mock routes do not help in a preview either: they answer 404 outside `next dev`.
- This decision lives in the Vercel dashboard, not in the repo; nothing here enforces it in
  code (no `vercel.json`). A dashboard change can silently invalidate this record — there is
  no drift check for Vercel settings.
- Recorded in `docs/grootboek/software-architectuur.md` § 5 (Environments).
- Source: JNL-001, issue K2.
