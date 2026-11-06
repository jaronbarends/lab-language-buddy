# ADR-014: Hosting: Vercel

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De app wordt gehost op Vercel.

## Waarom

Het was Jarons keuze: een gratis omgeving die automatisch deployt vanuit GitHub, en hij kende
Vercel al uit eerdere projecten.

Het past ook bij wat de code laat zien:

- Elke serverroute is een gewone stateless Web-`Request`/`Response`-handler. De app heeft dus
  geen langlevend serverproces en geen WebSocket-server nodig; de live STT-leveranciers worden
  rechtstreeks door de browser aangeroepen.
- `NEXT_PUBLIC_USE_MOCK_CHAT` werkt alleen onder `next dev`, dus een gedeployde build antwoordt
  nooit uit de mock.

## Gevolgen

- Hoe omgevingen en deployment zijn ingericht staat in ADR-001 (Environment and deployment
  topology). Dit record draagt alleen de reden voor de keuze van Vercel zelf.
