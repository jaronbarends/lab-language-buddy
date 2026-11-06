# PDR-014: Logo en favicons

- **Status:** implemented
- **Date:** 2026-10-12
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Twee keuzes over de merkbeelden van de app:

1. **Favicons en manifest komen uit de bestaande app.** De favicon-set (`favicon.ico`,
   `favicon.svg`, `favicon-96x96.png`, `apple-icon.png`), de twee web-app-manifest-PNG's en
   `manifest.ts` zijn overgenomen. De naam in het manifest is "Language buddy", gelijk aan de
   paginatitel. Kleuren blijven literals (`#eff6fd`), zoals `themeColor` in `layout.tsx`.
2. **`Logo` is de SVG van de oorspronkelijke app, inline als component.** Het vervangt het
   `ChatIcon`-vierkant op het setup-scherm. Er is geen SVGR.

## Waarom

- **Favicons en manifest.** Het zijn merkbeelden, geen engineering. Jaron wees deze bestanden aan.
- **Geen SVGR.** Eén SVG rechtvaardigt geen loader-dependency plus bundler-configuratie. De loader
  van de oorspronkelijke app werkt alleen met webpack, en Next 16 bouwt met Turbopack. Heroverweeg
  dit als de app veel SVG's krijgt.
