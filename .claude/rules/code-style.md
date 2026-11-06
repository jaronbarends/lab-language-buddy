---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code style

Lees het af van de bestaande code; als je een tegenvoorbeeld vindt, zeg dat.

- TypeScript strict. Function declarations (`export function foo() {}`), geen arrow functions
  die aan een `const` worden toegewezen. Arrow functions zijn voor inline callbacks.
- Altijd `if`-statements met accolades over meerdere regels, en early returns in plaats van nesting.
- Booleans lezen als een zin: `microphoneIsLive`, `requestHasTimedOut`,
  `recordingFormatIsStreamable`. Niet `isLive`.
- Een naam zegt wat de functie teruggeeft of doet, niet waarvoor hij wordt gebruikt, en gebruikt
  hetzelfde woord als zijn buren: `createChatRequestBody` geeft een body terug, geen request; een
  status is `pending` totdat er iets draait, niet `running`. Jarón beoordeelt namen als deel van
  het werk. Wijst hij er een aan, geef hem dan gelijk, zeg helder waarom die fout was, stel een
  betere voor met de reden en laat hem beslissen; noem de bestanden als een rename meer dan ongeveer
  vijf bestanden raakt.
- Event handlers heten `handleX`. Hooks heten `useX`. Components zijn PascalCase.
- Bestanden en directory's zijn lowercase met streepjes (`conversation-screen.tsx`), met de
  CSS Module naast de component (`conversation-screen.module.css`).
- Als de agent iets heeft besloten wat niet gespecificeerd was, zeg dat in een comment en zeg
  waarom. Verwijder geen comment die nog van toepassing is.
- Identiteit is een `crypto.randomUUID()` per turn, nooit een array-index of `turns.length`.
