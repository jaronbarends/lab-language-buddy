# PDR-003: Eén set bediening zonder Stop, het live transcript in de control bar

- **Status:** implemented
- **Date:** 2026-09-24
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Twee keuzes die samen bepalen hoe opnemen, nakijken en bewerken werkt:

1. **Het live transcript staat in de control bar,** niet in de thread. De conceptbubbel is opnieuw
   vormgegeven zodat hij daarmee overeenkomt en er niets springt.
2. **Listening, reviewing en editing delen één set bediening.** Er is geen Stop-knop.

Dat `editing` een eigen beurtstatus is, staat in ADR-006 (`editing` is een eigen beurtstatus met
`draftBeforeEdit`).

## Waarom

- **Transcript in de control bar.** Het is nog geen onderdeel van het gesprek en wordt op dat
  moment het concept. Het in de thread renderen liet het op dat moment over het scherm
  verhuizen.
- **Stop verwijderd.** Send, Edit en Cancel beëindigen de opname allemaal al. End session verliet
  die drie states mee.

## Gevolgen

- Dit zijn keuzes die in de code willekeurig lijken (geen Stop, een transcript buiten de thread,
  en met ADR-006 een aparte `editing`-state). Wie ze wil veranderen, begint hier.
- De bediening zelf staat in de conversation-componenten.
