# ADR-005: De taalkiezer is overgenomen uit de bestaande app

- **Status:** implemented
- **Date:** 2026-09-28
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De taalkiezer is in zijn geheel overgenomen uit de bestaande Language Buddy-app: een native
radio in een label, `fieldset` met `legend`, kolomaantallen met `:has()`, en een style
container query voor de richting van het label.

## Waarom

Echte radio-semantiek en toetsenbordgedrag komen gratis, en de layoutlogica leeft in CSS in
plaats van in props.

Het vervangt de `role="radio"`-knoppen die de agent eerst had gemaakt. Het was de enige plek in
die ronde waar een *structurele* keuze werd overschreven in plaats van een visuele: het hele
onderdeel overnemen gooide een antwoord weg dat de agent al had gegeven. Daarom stond de rij in
het plan als `ported`.

## Gevolgen

- Het is een eenmalige overname. Er is geen synchronisatie met de bestaande app en geen lijst
  met afwijkingen (PDR-001, een app voor dagelijks gebruik en een experiment in werkwijze).
- De regel dat de agent de bestaande repo niet als bron gebruikt (HDR-016) laat dit onverlet:
  het onderdeel kwam erin doordat Jaron naar dat bestand wees.
