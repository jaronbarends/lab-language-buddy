# HDR-021: Werk vertakt van `main`; `arc/arc-main` vervalt

- **Status:** implemented
- **Date:** 2026-11-07
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

`arc/arc-main` vervalt als integratiebranch. Elke branch vertrekt van `main` en gaat via een
pull request terug naar `main`; `main` is zowel de basis als productie. Dit vervangt het eerste
deel van HDR-011. Het tweede deel blijft gelden: de branch bestaat vóór de eerste bewerking.

Wat daaruit volgt voor de repo:

- De root-`CLAUDE.md` en `docs/grootboek/CLAUDE.md` noemen alleen nog `main`.
- Het hernummerscript (`scripts/renumber-records.mjs`) neemt `origin/main` als standaardbasis.
- De hook `guard-merge-renumber` bewaakt alleen nog merges van `main`.
- De CI-workflow draait alleen nog op pull requests naar `main`.
- De branch `arc/arc-main` wordt verwijderd, lokaal en op de remote.

## Waarom

De grootboekexperimenten zijn op 2026-11-07 in `main` gemerged (PR #35), dus er loopt niets meer
naast `main`. HDR-011 zei zelf dat de zin over `arc/arc-main` als integratiebranch in dezelfde
stap moest worden bijgewerkt als die branch in `main` zou opgaan. Jarón heeft dat besluit
genomen.

## Voorgeschiedenis

HDR-011 (2026-10-27) legde vast dat het werk van het grootboekexperiment vertakte van
`arc/arc-main`, dat de integratiebranch was, en dat `main` productie was. HDR-003 had de CI-trigger
bewust op beide branches gezet, zodat het verwijderen van `arc/arc-main` geen aanpassing zou
vragen; die verwijzing is nu toch opgeruimd om de lijst kort te houden.

## Gevolgen

- **Oudere records blijven staan als geschiedenis.** HDR-001, HDR-003, HDR-005, HDR-007,
  HDR-011, ADR-001, de journalen en de driftrapporten noemen `arc/arc-main` of `arc/*` als de
  stand van toen. Ze worden niet herschreven.
- De root-`CLAUDE.md` en `docs/grootboek/CLAUDE.md` zijn leidende documenten: de wijziging is aan
  Jarón getoond en gecontroleerd.

Verwant: HDR-011 (Arc-werk vertakt van `arc/arc-main`, en de branch bestaat vóór de eerste bewerking)
Verwant: HDR-005 (De branch die als tweede merget hernummert zijn records)
Verwant: HDR-003 (De checks van de repo draaien op pull requests naar `main` en `arc/arc-main`)
