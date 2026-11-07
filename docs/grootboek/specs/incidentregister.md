---
titel: "Een incidentregister: terugkerende fouten worden geteld en bij drie vastgelegd"
type: spec
soort: plan van aanpak
status: concept
datum: 27 oktober 2026
auteurs: Jarón, Mama Claude
---

# Een incidentregister: terugkerende fouten worden geteld en bij drie vastgelegd

**Waar het om gaat.** REQ-GG-06 (Bouw het immuunsysteem) wil dat terugkerende fouten een regel,
hook of skill in de harness worden: één keer is een incident, twee keer toeval, drie keer een
zwakte van de harness. Nu telt niets. De correcties die Jarón geeft leven in Claudes privégeheugen, buiten de repo, en geen builder of andere clone ziet ze. Deze feature voegt de
voorste helft van het immuunsysteem toe: een plek waar incidenten per patroon worden gelogd, een
teller die bij drie alarm slaat, en een regel voor wat er dan gebeurt.

## Deel 1: het register

`docs/grootboek/registers/incident-register.yml`, gegroepeerd per patroon:

```yaml
patronen:
  - patroon: naming-precision
    titel: "A name promises more or less than the code does"
    maatregel: HDR-010          # empty until the pattern is codified
    incidenten:
      - datum: 2026-10-10
        aantal: 7               # optional, default 1
        wat: "Seven names corrected in one review, each right"
        bron: "stage 4 review"
```

- **Geen id's en geen genummerde documenten.** Een incident is een regel, geen besluit (HDR-001
  boekt besluiten). Zonder id's kan het register niet botsen tussen parallelle branches zoals
  recordnummers dat kunnen (HDR-007). Twee branches die allebei loggen conflicteren nog steeds op
  dezelfde regels: houd beide.
- Een patroon is een slug. Als een nieuwe fout op een bestaand patroon lijkt, sluit hij daarbij
  aan; het oordeel of het "dezelfde fout" is, is aan de agent, gecontroleerd door Jarón.
- **`maatregel`** noemt de HDR die het patroon heeft vastgelegd. De HDR noemt de plek: een regel,
  een hook, een skill, een regel in `CLAUDE.md`.

## Deel 2: de teller, `npm run docs:incidents`

- Leest het register en toont elk patroon met zijn aantal en of het is vastgelegd.
- **Drempel drie**, een constante in het script (de requirement zegt drie; de HDR-gids van de
  grootboek-skill zegt "meer dan drie", wat strenger is en hier niet wordt gevolgd).
- Het verandert nooit iets en eindigt met exitcode 0, tenzij het register misvormd is.

## Deel 3: in `docs:check`

- Een patroon met drie of meer incidenten en geen `maatregel` is een **waarschuwing**: "leg het
  vast en boek een HDR". Geen fout: de zwakte is echt, maar de dag dat hij wordt gevonden mag
  CI niet rood kleuren.
- **Fouten:** een `maatregel` die een HDR noemt die niet in het HDR-register staat; een dubbele
  patroon-slug; een incident zonder `datum` of `wat`.

## Deel 4: de logplicht

Een regel in de `CLAUDE.md` in de root: als Jarón de agent corrigeert, of een tool faalt op een
manier die al eerder is voorgekomen, voeg dan één regel toe aan het incidentregister en zeg dat in
één zin. Geen hook kan een correctie door een mens zien, dus **het loggen hangt af van de
agent**. Het register maakt herhaling zichtbaar en telbaar zodra die is gelogd; het zorgt er niet
voor dat de agent logt. Die beperking komt in de HDR. `CLAUDE.md` is een leidend document: de
wijziging wordt gemeld en gecontroleerd.

## Deel 5: zaaien en het eerste gebruik

De zes feedbacknotities in Claudes geheugen zijn de eerste incidenten, geteld naar wat de
notities zelf zeggen, niet naar een volledige geschiedenis:

| Patroon | Aantal | Vastgelegd? |
|---|---|---|
| naming-precision | 7 (één review, 2026-10-10) | Nee: de regels dekken hoe namen worden geschreven, niet wat ze beloven |
| answer-first | 2 (2026-09-23) | Nee |
| act-on-question | 2 (2026-09-23) | Nee |
| review-point-context | 1 (2026-10-03) | Nee |
| id-with-title | 1 (2026-10-21) | Nee |
| ai-vs-self-advice | 1 (2026-10-03) | Bijzonder geval, zie hieronder |

**Het eerste gebruik van het mechanisme:** `naming-precision` staat op zeven, dus het register
waarschuwt op dag één. Het vastleggen ervan is het bewijs dat de keten werkt: een HDR plus een
regel in `.claude/rules/code-style.md` (een naam zegt wat de functie teruggeeft of doet, gebruikt
het woord van zijn buren, en een correctie wordt zonder verdediging geaccepteerd). Het
regelbestand is geen leidend document, dus geen communicatieplicht; het wordt toch getoond vóór
het wordt gecommit.

**`ai-vs-self-advice` is een andere soort fout.** Het is geen herhaalde vergissing maar een
conflict: Jaróns globale instructies vragen om een oordeel, dit project zegt het over te slaan,
en het project zegt dat alleen in Claudes privégeheugen. Een sessie zonder dat geheugen geeft
het oordeel opnieuw. Eén incident is genoeg om dat te herstellen, want de oplossing is een regel
in de `CLAUDE.md` van het project. Apart besloten, niet door de teller.

## Tests

`node:test` op een wegwerp-repo, zoals voor de andere scripts: een patroon met twee incidenten is
stil; drie, niet vastgelegd, waarschuwt; `aantal` telt als zijn waarde; een vastgelegd patroon
met een bestaande HDR is stil; een `maatregel` die een ontbrekende HDR noemt is een fout; een
dubbele slug is een fout; een incident zonder `datum` of `wat` is een fout.

## Klaar wanneer

- Het register bestaat, gezaaid zoals hierboven, en `docs:check` waarschuwt op `naming-precision`
  en op niets anders.
- Het vastleggen van `naming-precision` (HDR en regel) zet die waarschuwing uit.
- De tests slagen en draaien in CI.
- Een nieuwe HDR boekt het besluit, de drempel en de beperking van het loggen.
- Niet beweerd: dat de agent betrouwbaar logt. Dat is pas bekend na weken gebruik.

## Bronnen

- **Het denkwerk:** deze sessie; het kennisdocument het-gedirigeerde-grootboek, immuunsysteem
  ("één keer is een incident, twee keer toeval, drie keer een harnas-zwakte"); REQ-GG-06.
- **Het patroon:** `scripts/drift-signal.mjs` en HDR-008 (een signaal in `docs:check`);
  `.claude/skills/grootboek/references/hdr-schrijfgids.md` ("Uit het immuunsysteem").
- **De incidenten:** de zes `feedback-*`-notities in Claudes geheugen voor dit project.
- **Waar het landt:** `docs/grootboek/registers/incident-register.yml`,
  `scripts/incidents.mjs`, `scripts/check-docs.mjs`, `package.json`, `CLAUDE.md` in de root,
  `.claude/rules/code-style.md`.
