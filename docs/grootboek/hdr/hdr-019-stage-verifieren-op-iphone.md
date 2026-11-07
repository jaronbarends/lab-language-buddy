# HDR-019: Elke stage verifiëren op de iPhone

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Elke bouwstap wordt op iPhone Safari geverifieerd: `ngrok http 3000` draaien en de HTTPS-URL op de
telefoon openen. Stage 3 voegt daar vijf controles aan toe:

- de microfoon-toestemmingsvraag verschijnt;
- het transcript wordt bijgewerkt terwijl je spreekt;
- een uiting van meer dan 20 seconden wordt goed getranscribeerd;
- AI-audio speelt zonder tweede tik;
- de markering volgt de audio.

## Waarom

De uiting van meer dan 20 seconden is de lengte waarop Google STT brak.

## Gevolgen

- De iPhone-controle hoort bij de verificatie per stap, naast lint, typecheck, build en een doorloop
  op desktop Chrome.
