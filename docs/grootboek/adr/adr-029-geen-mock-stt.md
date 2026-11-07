# ADR-029: Geen mock-STT

- **Status:** implemented
- **Date:** 2026-10-03
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Er blijft geen mock voor speech-to-text (STT). Chat en evaluatie hebben wel een mock-route en TTS
een client-side mock; voor spraakherkenning is die er niet.

## Waarom

De Edit-bediening dekt getypte invoer: wie zonder echte spraakherkenning een beurt nodig heeft,
typt die.

## Gevolgen

- De mock-keuze is per onderdeel: `NEXT_PUBLIC_USE_MOCK_CHAT` laat `use-chat-driver.ts` (en sinds
  stage 4 `use-evaluation-driver.ts`) de mock-routes aanroepen, en TTS krijgt een eigen vlag,
  `NEXT_PUBLIC_USE_MOCK_TTS`. Een vlag voor STT bestaat niet.
- Gecontroleerd: in `src/` komt geen mock-STT-vlag of -route voor (uit de code, niet uit het plan).
