# ADR-013: Next.js 16 met TypeScript strict

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Het framework is Next.js 16 (App Router) met TypeScript strict en React 19.

## Waarom

De brief schrijft dit voor. Het past ook bij de vorm van de app: de browser heeft een paar kleine
serverroutes nodig (`/api/chat`, `/api/tts` en de STT-tokenroutes) die API-keys van de client
houden, en verder niets op de server. Next 16 verschilt van eerdere versies.

## Gevolgen

- (Uit de code, niet uit het plan.) De routes uit de rij staan onder `src/app/api/`; daar staan ook
  een route voor evaluation en mock-routes (`/api/evaluation`, `/api/mock/chat`,
  `/api/mock/evaluation`).
