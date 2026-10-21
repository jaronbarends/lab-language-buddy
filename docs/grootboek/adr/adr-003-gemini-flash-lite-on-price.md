# ADR-003: Gemini `flash-lite` as the model, chosen on price

- **Status:** implemented
- **Date:** 2026-10-20
- **Implementation date:** 2026-10-20
- **Type:** Architecture Decision Record (WHAT do we build)

## Decision

Both the chat route and the evaluation route use the model constant `gemini-3.1-flash-lite`.
The model was a deliberate choice, made on price. No extensive comparison with other Gemini
models was carried out.

## Why

Gemini as the provider was specified up front (`docs/plan.md` → Fixed constraints); the
specific model was not. `flash-lite` is the cheap end of the family, which fits a personal
project used daily by its own builder. The plan's measurements (10-06 to 10-10) describe how
well this model performs at its task; they do not compare it against a different model.

## Consequences

- If `flash-lite`'s quality ever becomes the limiting factor, that comparison still has to be
  done — this record does not claim it was.
- The two routes share the constant by duplication, not by import; a future model change has
  to touch both `src/app/api/chat/gemini-chat.ts` and
  `src/app/api/evaluation/gemini-evaluation.ts`, and this record does not change that.
- Recorded in `docs/grootboek/software-architectuur.md` § 8 (Technology choices).
- Source: JNL-001, issue K5.
