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
- A name says what the function returns or does, not what it is used for, and uses the same
  word as its neighbours: `createChatRequestBody` returns a body, not a request; a status is
  `pending` until something runs, not `running`. Jaron reviews names as part of the work. When
  he points at one, agree, say plainly why it was wrong, propose a better one with the reason
  and let him decide; list the files when a rename passes about five.
- Event handlers are `handleX`. Hooks are `useX`. Components are PascalCase.
- Files and directories are lowercase with dashes (`conversation-screen.tsx`), with the
  CSS Module next to the component (`conversation-screen.module.css`).
- Where the agent decided something that was not specified, say so in a comment, and say
  why. Do not remove a comment that still applies.
- Identity is a `crypto.randomUUID()` per turn, never an array index or `turns.length`.
