# HDR-028: Mutatietests bij het risky-regime zijn geparkeerd tot `src/` een testsuite heeft

- **Status:** implemented
- **Date:** 2026-11-10
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een mutatietest meet de kwaliteit van een testsuite: hij verandert de code en kijkt of een test
faalt. Zonder suite is er niets om te meten. Een regel in de staffel die een controle voorschrijft
die niet kan draaien, is geen borging maar decor. Daarom wacht het besluit op de voorwaarde in
plaats van een regel vooruit te schrijven.

## Besluit

- **Geen mutatietests in het risky-regime, voorlopig.** De triage-skill, `reviewer.md` en
  `builder.md` blijven ongewijzigd.
- **Voorwaarde om het besluit weer open te leggen:** `src/` krijgt een testrunner (een script in
  `package.json` dat tests onder `src/` draait). Pas dan is er een suite om te muteren.
- **Open vragen voor dat moment**, zodat de volgende sessie niet opnieuw begint:
  - Wie draait ze: de reviewer, de builder of de lead? Voorkeur van de aanbeveling: de reviewer,
    omdat die onafhankelijk is van het builderrapport (HDR-024). `reviewer.md` zegt echter
    "strikt read-only"; een mutatietool schrijft naar een tijdelijke map, dus die zin moet dan
    worden aangepast.
  - Alleen `risky`, of ook `normal`? Een Next.js-spraakapp zonder database raakt de harde
    triggers zelden, dus risky-taken zijn zeldzaam; de bestaande suite onder `scripts/` hoort
    bij tooling die documenten herschrijft.
  - Handmatig (de builder muteert drie gedragingen, zoals de Opus-builder in de proef van
    HDR-024 ongevraagd deed) of met een tool (Stryker o.i.d.)? Het tweede is een aparte taak.

## Waarom

**Vraag E1 uit de grootboekronde** (ARC-kennisdocument het-gedirigeerde-grootboek): horen
mutatietests bij het risky-regime, en alleen daar? HDR-024 besliste alleen welk model de builder
krijgt; dit stond nergens vast.

**Feitelijke stand op 2026-11-10** (uit `package.json` en een zoekactie op testbestanden):

- Er is geen script dat `src/` test, geen testrunner en geen mutatietool.
- Testbestanden bestaan alleen onder `scripts/` (vier stuks, `npm run test:scripts`, `node --test`):
  drift, incidenten, recorddatums en hernummeren.
- Onder `src/` staat geen testbestand. De poorten daar zijn lint, `tsc` en `build`.

**Afgewogen** (opties van 2026-11-10, zelf bedacht, de bron noemt er geen):

- **Nee vastleggen.** Sluit de vraag, maar zegt iets onwaars als `src/` later wel tests krijgt.
- **Handmatige mutatiecheck door de builder, herhaald door de reviewer.** Werkt alleen waar tests
  zijn; zonder test moet er eerst een test komen, en dat is een andere taak.
- **De reviewer draait de mutaties alleen.** Onafhankelijk, maar botst met "strikt read-only".
- **Een tool in de lead of CI.** Hoge opzet, en dat is het installeren van een tool, buiten dit
  besluit.
- **Alleen voor `scripts/` invoeren.** Daar is wel een suite, maar Jarón koos dit niet.

**De keuze van Jarón (2026-11-10):** parkeren.

## Grenzen

- Geen meting van de kosten per risky-taak; de schattingen bij de opties waren van de agent. De
  enige datapunt is de proef van HDR-024, waarin de eigen mutatiecheck van de Opus-builder binnen
  een run van 80.896 tokens en ~8 minuten viel en niet apart is gemeten.
- Niets dwingt af dat dit record opnieuw wordt bekeken. Het vangnet is dat wie een testrunner voor
  `src/` toevoegt dit record tegenkomt via de registerregel en `docs/index.yml`.

## Gevolgen

- Geen wijziging aan `triage/SKILL.md`, `reviewer.md`, `builder.md` of een leidend document.
- Triage-vraag 4 ("staat er een mechanische poort op het pad") rust voor `src/` op lint en
  typecheck. Dat is een eigen kwestie en geen onderdeel van dit besluit; HDR-031 (Lint en `tsc`
  tellen bij triage alleen als gedekt pad bij een wijziging zonder gedragseffect) beslist haar.

Verwant: HDR-024 (Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`)
