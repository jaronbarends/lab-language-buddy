# Componenten en het design system

- Styling is CSS Modules naast het component, over het design system in
  `src/app/tokens/` (`colors`, `type`, `sizes`, `borders`, `animation`), `reset.css` en
  `elements.css`. Gebruik de tokens; voer geen losse waarden in voor kleur, spacing of radius.
- De tokens, `reset.css` en `elements.css` zijn overgenomen uit de bestaande Language
  Buddy-app en zijn nu van deze app zelf.
- `language-buddy.tsx` bezit de session reducer, rendert per phase en geeft state als props
  door. Alleen de leaf controls (`ComposingControls`, `IdleControls`, `ErrorControls`, de
  dev-only `StateStepper`) sturen acties via `useSessionDispatch()`; schermen en de
  onderdelen eronder krijgen state en callbacks als props en houden zelf geen sessiestate
  bij (zie de balans, § 2 en § 3).
- De Safari/iPhone-regels in `.claude/rules/safari-ios.md` gelden voor alles hier.
- Verschillende keuzes lijken willekeurig en zijn bewust (geen Stop-knop, `editing` als eigen
  state, het live transcript buiten de thread, de key op positie van de AI-bubbel). De redenering staat in het grootboek: PDR-003 (Een set bediening zonder stop), ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`), ADR-031 (De AI-bubbel blijft één element, van wachten tot antwoord) en, voor de rest, `docs/index.yml`.
