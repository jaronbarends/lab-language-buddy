# Componenten en het design system

- Styling is CSS Modules naast het component, over het design system in
  `src/app/tokens/` (`colors`, `type`, `sizes`, `borders`, `animation`), `reset.css` en
  `elements.css`. Gebruik de tokens; voer geen losse waarden in voor kleur, spacing of radius.
- De tokens, `reset.css` en `elements.css` zijn overgenomen uit de bestaande Language
  Buddy-app en zijn nu van deze app zelf.
- `language-buddy.tsx` bezit de session reducer en rendert per phase. Schermen lezen state
  via de sessiecontext en sturen acties via de dispatch hook; ze houden zelf geen
  sessiestate bij.
- De Safari/iPhone-regels in `.claude/rules/safari-ios.md` gelden voor alles hier.
- Verschillende keuzes lijken willekeurig en zijn bewust (geen Stop-knop, `editing` als eigen
  state, het live transcript buiten de thread). De redenering staat in het grootboek: PDR-003 (Een set bediening zonder stop), ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`) en, voor de rest, `docs/index.yml`.
