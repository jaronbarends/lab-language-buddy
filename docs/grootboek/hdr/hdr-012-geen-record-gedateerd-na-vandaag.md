# HDR-012: Geen record mag na vandaag gedateerd zijn

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

`npm run docs:check` faalt als een grootboekregister of -record een datum na vandaag draagt.
Hij leest alleen de gestructureerde velden: de registervelden (`datum`, `implementatie-datum`,
`laatste-sessie`), de front matter van een document, de regels `- **Date:**` en
`- **Implemented:**` van een record, en de Nederlandse `datum: 27 oktober 2026` van een spec.
Registers worden helemaal gelezen; een document wordt gelezen in zijn eerste twintig regels. Een
datum in lopende tekst wordt niet bekeken.

"Vandaag" is de datum in `Europe/Amsterdam`, niet in UTC. CI draait in UTC, en een record dat
kort na middernacht hier is geschreven zou anders lijken uit morgen te komen.

## Waarom

**Kernprincipe:** een datum is een feit, en een feit dat iedereen van de klok kan aflezen hoort
niet te worden aangenomen. Op 2026-10-27 waren 22 data in acht bestanden geschreven als
2026-10-28, een dag vóór de klok en vóór elke commit die ze droeg, omdat werd aangenomen dat de
dag was omgeslagen zonder te kijken. Het werd bij toeval gevonden, in de reflog van een
cold-start-clone. Een check had het bij de eerste `docs:check` gevangen.

Dit is de mechanische helft van het patroon `date-assumed` in het incidentregister (HDR-009),
waarvan dit de `maatregel` is.

## Gevolgen

- Hij vangt alleen een datum na vandaag. Een datum die fout is maar in het verleden ligt, of een
  datum in lopende tekst, komt erdoor. Een fout van één dag te laat is er onzichtbaar voor.
- De tijdzone is een constante in `scripts/records.mjs`. Wie vanuit een andere tijdzone werkt, op
  het verkeerde uur, kan hem laten afgaan; de oplossing is de constante, geen losser gemaakte
  check.
- Gedekt door `scripts/record-dates.test.mjs`, inclusief de precieze fout die is gemaakt: een
  register dat een dag vooruit is gedateerd.
- De andere, niet-mechanische helft van hetzelfde incident is een bewering gedaan zonder de bron
  te lezen. Dat is het patroon `document-not-fully-read`, op twee incidenten en nog niet op de
  drempel, en het heeft geen maatregel.
