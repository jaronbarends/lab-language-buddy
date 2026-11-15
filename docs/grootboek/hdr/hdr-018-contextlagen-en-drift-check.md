# HDR-018: Contextlagen en een drift-check voor de documentatie

- **Status:** implemented
- **Date:** 2026-10-20
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

De context van het project is gelaagd, zodat een sessie laadt wat ze nodig heeft, en een script
controleert of de documentatie nog klopt. De lagen zijn: `.claude/rules/` (code style en Safari),
`CLAUDE.md` in `src/components` en `src/lib`, `docs/index.yml` als register, `docs/adr/` (sinds
het grootboek `docs/grootboek/adr/`), `.claude/agents/` (builder en reviewer) en `npm run docs:check`
(`scripts/check-docs.mjs`). Dat is de stand van 2026-10-20; de actuele lagen staan in de tabel
"Waar de rest van de context staat" in de root-`CLAUDE.md`. De opzet komt uit de ARC-requirements
van `projectidentiteit`.

## Waarom

- `CLAUDE.md` was een verwijzing naar het plan zonder werkafspraken; die stonden alleen in het
  globale bestand van Jarón.
- De gelaagdheid laat een sessie laden wat nodig is, en het register is de goedkope index vóór het
  plan van 1.300 regels (dat plan is inmiddels vervangen).
- De check maakt van drift een falend commando. De eerste run vond verouderde env-documentatie in
  de README: de mock-vlaggen ontbraken, en `ELEVENLABS_VOICE_ID` stond erin terwijl geen code hem
  leest.

## Gevolgen

- Destijds gold ook dat parallelle builders `plan.md` niet mochten bewerken (het ene gedeelde
  bestand) en dat de lead hun logrijen schreef. Die regel is vervallen met HDR-015 (plan.md vervalt
  als bron).
- **Versie 1.1 (2026-11-15):** de map `docs/adr/` bestaat niet meer en er zijn lagen bijgekomen
  (het grootboek, de skills, code-architectuur, een derde rule en een derde agent). Het besluit zelf
  staat: gelaagde context, en `docs:check` maakt van drift een falend commando. Gevonden in de tweede
  ronde van de proef besluiten toetsen.

Verwant: HDR-015 (plan.md vervalt als bron; beslissingen leven in het grootboek)
