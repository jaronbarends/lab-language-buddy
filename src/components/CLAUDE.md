# Components and the design system

- Styling is CSS Modules next to the component, over the design system in
  `src/app/tokens/` (`colors`, `type`, `sizes`, `borders`, `animation`), `reset.css` and
  `elements.css`. Use the tokens; do not introduce literals for colour, spacing or radius.
- The tokens, `reset.css` and `elements.css` were carried over from the existing Language
  Buddy app and are now this app's own.
- `language-buddy.tsx` owns the session reducer and renders by phase. Screens read state
  through the session context and send actions through the dispatch hook; they do not hold
  session state of their own.
- The Safari/iPhone rules in `.claude/rules/safari-ios.md` apply to everything here.
- Several choices look arbitrary and are deliberate (no Stop button, `editing` as its own
  state, the live transcript living outside the thread). The reasoning is in the grootboek: PDR-003 (Een set bediening zonder stop), ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`) and, for the rest, `docs/index.yml`.
