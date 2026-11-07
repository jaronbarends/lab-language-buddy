# ADR-027: `cacheComponents` blijft uit

- **Status:** implemented
- **Date:** 2026-09-25
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De Next.js-optie `cacheComponents` blijft uitgeschakeld.

## Waarom

De optie maakt PPR (partial prerendering) de standaard en maakt van niet-gecachete data buiten
`<Suspense>` een buildfout. Voor een app die volledig client-side draait en niets persisteert, levert
dat geen voordeel op.

## Gevolgen

- `next.config` zet `cacheComponents` niet aan (uit de code, niet uit het plan: er staat geen
  `cacheComponents` in `next.config.*`).
