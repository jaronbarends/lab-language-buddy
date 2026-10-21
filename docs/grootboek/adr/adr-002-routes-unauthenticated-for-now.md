# ADR-002: The server routes have no caller authentication, accepted for now

- **Status:** accepted
- **Date:** 2026-10-20
- **Type:** Architecture Decision Record (WHAT do we build)

## Decision

None of the server routes (`/api/chat`, `/api/evaluation`, `/api/tts`, the two token routes)
check who is calling them, and none is rate-limited. This is an accepted, provisional state,
not a settled one: the human wants it fixed soon (tracked as the open follow-up, JNL-001
issue K7). Vercel Authentication is active on the project with Standard Protection, which
gates previews and generated deployment URLs but leaves the production domain public — so
the production routes remain reachable by anyone who knows the URL.

## Why

The app is a personal project on an unshared URL; the risk was knowingly accepted rather
than discovered as a gap. It was not a considered trade-off at the time the routes were
built — it surfaced during the grootboek onboarding (JNL-001) and was then accepted as the
status quo, with the intent to close it.

## Consequences

- Each unauthenticated call can spend a paid vendor key (Gemini, Azure, Google, ElevenLabs,
  Deepgram). The only backstop outside the code is per-vendor spend limits, which the human
  does not currently have a clear overview of (also tracked under K3/K7).
- This record is provisional by design: when K7 lands a protection mechanism, a new ADR
  supersedes this one rather than editing it in place.
- Recorded in `docs/grootboek/software-architectuur.md` § 6 (Security principles) and § 9.
- Source: JNL-001, issues K3 and K7.
