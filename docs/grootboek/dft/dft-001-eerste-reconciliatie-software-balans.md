# DFT-001: First reconciliation of the software balance — no drift found

- **Status:** resolved
- **Date:** 2026-10-21
- **Trigger:** a deliberate trial of the grootboek's drift mechanism (HDR-002, REQ-GG-05),
  not an incident or a recurring pattern — the fifth, exceptional route into a DFT: trying
  the mechanism itself before it has ever run.

## SOLL vs IST

**SOLL:** `docs/grootboek/software-architectuur.md` v1.0, as it stands after the K1-K5
booking (`94497a4`) and the frontend-layer extension (`663a528`).

**IST:** the current code (`src/lib`, `src/hooks`, `src/app`, `next.config.ts`,
`package.json`, `.env.example`) and the `docs/plan.md` rows the balance cites.

**Finding: no gap.** Nothing in `src/` has changed since the balance was first written — a
`git log` on `src/` since commit `94497a4` returns no commits. A fresh-context pass checked
every section (component map, the two diagrams, the authentication matrix, the shared
contracts, the technology choices, the security principles) against the current code and
every `plan.md`/`ADR`/`HDR` citation against its source, and reported zero mismatches. I
independently re-checked two of its claims (the TTS and STT default providers) against
`src/lib/tts/index.ts` and `src/lib/stt/index.ts`; both held.

## Pattern

None. This is a single, deliberate check with nothing to compare it against yet — there is
no second occurrence to escalate from toy to structural weakness. A pattern can only emerge
once this DFT has run at least twice, ideally once after a real code change.

## Decisions

1. **No document change needed.** The balance stands as accepted; this reconciliation is
   itself the evidence, not a reason to edit it.
2. **The mechanism works, but was not stress-tested.** This run proves the DFT *process*
   (a reconciliation can be requested, performed, and registered), not that it *catches*
   drift — there was none to catch. The first DFT that runs after a real change to `src/lib`,
   `src/hooks` or `src/app/api` is the one that actually tests detection, not just process.
3. **Process note, not a decision:** the reconciliation agent's own report gave less
   per-claim evidence (file paths, line numbers) than asked for in its brief, despite
   claiming to have checked everything. A future reconciliation should either demand that
   evidence more strictly, or budget for a second pass that spot-checks a sample of its
   "verified OK" claims, as this one did for two.

## Consequences

- `docs/grootboek/registers/dft-register.yml` gets its first entry, with `bevindingen: 0`.
- JNL-001's decision log gets a line: REQ-GG-05 has now been exercised once, with a clean
  result; the loop (journal → decision → document → code → drift) still has not been
  closed end-to-end, because no code change has yet triggered a drift report. That is
  REQ-GG-09's remaining gap, not this one's.
