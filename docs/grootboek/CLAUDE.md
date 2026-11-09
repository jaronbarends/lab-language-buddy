# Grootboek — domeincontext

## Start de grootboek-skill

Maak of hervat je een grootboekdocument, start dan de grootboek-skill. De schrijfgids daarvan is een
harde eis — zonder die context schrijf je een formulier om in te vullen in plaats van een levend
document.

## Documenttypen

| Type | Prefix | Vraag |
|------|--------|-------|
| ADR | adr-NNN | WAT bouwen we? |
| HDR | hdr-NNN | HOE werken we? |
| PDR | pdr-NNN | WAAROM zo? |
| DFT | dft-NNN | KLOPT HET NOG? |
| JNL | jnl-NNN | WAT ONTDEKKEN WE? |

Registers staan in `docs/grootboek/registers/` (YAML). Werk het register bij bij elke nieuwe
beslissing of statuswijziging.

## Nummering over parallelle branches

Branches die parallel records boeken, delen hetzelfde volgende nummer uit. De branch die als
tweede merget, hernummert zijn eigen records, in zijn eigen branch, **voordat** `main` erin wordt gemerged: draai `npm run docs:renumber -- --base main` (de ref die je merget, dus ook lokale
commits die nog niet gepusht zijn), review, commit (HDR-005, volgorde
gewijzigd door HDR-007). De hook `guard-merge-renumber` houdt zo'n merge vanuit Claude Code tegen
tot dat is gebeurd, en `npm run docs:check` faalt op een dubbel id. Gemergede records houden hun
nummer.

## Schrijfafspraken

- Documentatie: Nederlands, zoals de templates van de skill zelf; code en commentaar in code
  blijven Engels (HDR-014)
- Bestanden: kebab-case
- Elke feature of bugfix krijgt een spec in `docs/grootboek/specs/`
- Specs zijn wegwerp: na oplevering is de code de waarheid
- Een leidend document dat code beschrijft, een nieuwe balans inbegrepen, declareert zijn
  `werkgebied` (de bestanden en mappen waar het over gaat) in zijn front matter; een `CLAUDE.md`
  onder `src/` heeft zijn eigen map als werkgebied, zonder front matter. `npm run docs:drift` en
  `npm run docs:check` gebruiken dat om drift te signaleren (HDR-008)
- Volg een driftsignaal op met een reconciliatie en boek die als DFT met `documenten` en
  `getoetst-tegen` (de commit waarvan de code is vergeleken). Het signaal meet vanaf de nieuwste
  afgesloten DFT die het document noemt; een aanraking van het document zet het niet stil
  (HDR-022)
- Sluit een pull request die code in een werkgebied raakt af met die reconciliatie, in dezelfde
  pull request, ook als alleen commentaar veranderde (HDR-026)

## Communicatieplicht

Zie de root-`CLAUDE.md`: daar staat de lijst met leidende documenten en de regel.
