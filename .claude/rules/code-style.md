---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code style

Read off the existing code; if you find a counter-example, say so.

- TypeScript strict. Function declarations (`export function foo() {}`), not arrow
  functions assigned to a `const`. Arrow functions are for inline callbacks.
- Always braced, multi-line `if` statements, and early returns over nesting.
- Booleans read as a sentence: `microphoneIsLive`, `requestHasTimedOut`,
  `recordingFormatIsStreamable`. Not `isLive`.
- Event handlers are `handleX`. Hooks are `useX`. Components are PascalCase.
- Files and directories are lowercase with dashes (`conversation-screen.tsx`), with the
  CSS Module next to the component (`conversation-screen.module.css`).
- Where the agent decided something that was not specified, say so in a comment, and say
  why. Do not remove a comment that still applies.
- Identity is a `crypto.randomUUID()` per turn, never an array index or `turns.length`.
