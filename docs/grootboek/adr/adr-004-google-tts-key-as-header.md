# ADR-004: Google TTS key moves from the URL to a header

- **Status:** implemented
- **Date:** 2026-10-21
- **Implementation date:** 2026-10-21
- **Type:** Architecture Decision Record (WHAT do we build)

## Decision

`src/lib/tts/google.ts` sends `GOOGLE_CLOUD_API_KEY` as the `x-goog-api-key` header instead
of a `?key=` URL query parameter. The other two TTS providers (Azure, ElevenLabs) already
use a header; Google's `text:synthesize` endpoint was the one exception.

## Why

Sending a secret in a URL is worse than sending it in a header: a logged or thrown fetch
error can carry the request URL, and a header does not end up in such a log the way a query
string does. It was never a deliberate choice (JNL-001, K6) — just how the call was first
written. Before changing it, the human tested both forms directly against the live endpoint
(`Invoke-WebRequest`, one call with `?key=`, one with the header) and got `200` on both,
confirming the endpoint accepts the header even though Google's own REST reference page for
this method documents only OAuth, not an API key, in any form.

## Consequences

- No other code changes: `getApiKey()` and the voice tables are untouched.
- `docs/grootboek/software-architectuur.md` § 6 updated in the same commit.
- `docs/plan.md` line citing `GET .../v1/voices?key=…` is a different endpoint (manual voice
  verification), untouched by this decision.
- This is the first grootboek decision that changed code rather than only documentation —
  closes one instance of REQ-GG-09's journal → decision → document → **code** step. The
  drift trial (REQ-GG-05) can now be repeated meaningfully against an actual change.
- Verified beyond the curl test: `npm run build` passed, and the human ran the app with
  `TTS_PROVIDER=google` end to end — the `/api/tts` route through `google.ts`'s header
  returned real audio, not just a `200` on a bare synthesis call.
- Source: JNL-001, issue K6 (now decided and booked).
