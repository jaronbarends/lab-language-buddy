---
paths:
  - "src/app/**"
  - "src/components/**"
  - "next.config.ts"
---

# Next.js 16: twee valkuilen

Deze versie wijkt af van wat je uit eerdere Next-versies kent (zie `AGENTS.md`). Twee dingen die
een verkeerde aanname geruisloos laten slagen:

- **Geen `export const runtime` in een route-bestand.** `'nodejs'` is de standaard en `'edge'` is
  deprecated; de meegeleverde docs (`node_modules/next/dist/docs/`, de pagina `runtime`) zeggen de
  export te verwijderen.
- **Een SVG-import is `any` en geeft met Turbopack een URL-string**, niet het `StaticImageData`-object
  (`{ src }`) dat je bij PNG of JPG krijgt. Niets in de toolchain vangt een verkeerde aanname op: een
  eerdere versie van de vlaggen compileerde zonder fouten en toonde zes lege vakken. Het commentaar
  bij de imports in `src/components/ui/flag-icon.tsx` legt het uit.
