# HDR-007: Hernummeren is mechanisch: een check, een script en een guard-hook

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

HDR-005 zegt dat de branch die als tweede merget zijn eigen records hernummert. Dat steunde op
iemand die eraan denkt, en op het met de hand in de juiste volgorde doen. Dit record maakt het
mechanisch en verandert de volgorde.

- **Volgorde: eerst hernummeren, dan mergen.** In HDR-005 merget de branch eerst `arc/arc-main` en
  hernummert daarna. Na de merge kan een vermelding van `HDR-006` twee records bedoelen en kan
  geen enkel gereedschap zien welke. Vóór de merge heeft alleen het eigen record van de branch
  dat id, dus zoeken-en-vervangen is exact. Dit draait stap 1 tot en met 3 van HDR-005 om; de
  rest ervan blijft staan.
- **Een script**, `npm run docs:renumber` (`scripts/renumber-records.mjs`). Het vergelijkt de
  registers van de branch met een basis-ref (standaard `origin/arc/arc-main`). Een record waarvan
  het id in de basis bij een ander bestand hoort, krijgt het eerstvolgende vrije nummer. Het
  recordbestand wordt hernoemd en het nieuwe id vervangt het oude in de regels die de branch zelf
  heeft toegevoegd sinds de merge-base: registers, `docs/index.yml`, het record, journaals die
  het noemen. Het verandert niets in records die al zijn binnengekomen en doet bij een tweede run
  niets. Het weigert tijdens een merge, en als de branch al een dubbel id bevat.
- **Een check** in `npm run docs:check`: elk register bevat elk id één keer, het recordbestand
  bestaat en zijn naam begint met zijn id in kleine letters. Hij draait ook in CI bij elke PR,
  dus hij is het vangnet voor een merge die in een gewone terminal is gedaan.
- **Een guard-hook**, `guard-merge-renumber`: als de lead thread `git merge` van `arc/arc-main`,
  `origin/arc/arc-main`, `main` of `origin/main` uitvoert, draait de hook het script in checkmodus
  tegen die ref. Bij botsingen weigert hij de merge, noemt ze en zegt dat het script eerst
  moet draaien. `main` is erbij genomen omdat `arc/arc-main` naar verwachting in `main` wordt
  gemerged en de centrale branch wordt.

## Waarom

**Kernprincipe:** een regel die onthouden moet worden faalt wanneer het erop aankomt, en een
herstel dat oordeelsvermogen vraagt, doe je beter op het moment dat dat oordeel nog eenduidig
is. Hernummeren vóór de merge is dat moment. De guard-hook maakt van "denk eraan" een "de merge
begint pas als": dezelfde verdeling als bij `guard-push-sweep` (HDR-004): de hook weigert en
benoemt, de lead thread doet het werk en probeert opnieuw. Het script is gewoon Node, geen agent,
dus het valt niet onder het bezwaar dat de onbewaakte refactor-hook tegenhield.

De vervanging raakt alleen regels die de branch zelf heeft toegevoegd. Een branch die `HDR-006`
schreef nadat de basis al een ander HDR-006 bevatte, is het ene geval dat dit niet kan zien;
daarom is de procedure "vóór de merge" en niet "wanneer dan ook".

## Gevolgen

- **Eerste geautomatiseerde test in deze repo.** `scripts/renumber-records.test.mjs`, met
  `node:test` (zit in Node, geen dependency), uitgevoerd door `npm run test:scripts`. Het plan
  zei "geen testsuite" (`docs/plan.md`, Decisions); nu staat er dat de app er geen heeft en dat
  scripts die documenten herschrijven een test krijgen (decision log 10-27). Open vraag 2 in het
  plan, tests voor de app, blijft ongewijzigd.
- **Uitgevoerd op het echte geval** op 2026-10-27 in een wegwerp-worktree van
  `arc/bubble-animation`: de Modern Web Guidance-proef ging van HDR-006 naar HDR-007, vijf
  bestanden veranderden, er bleef geen HDR-006 over. Nadat deze branch is gemerged, krijgt die
  proef het nummer na dit record.
- **Blinde vlekken, geaccepteerd:** de hook ziet alleen merges die de lead thread via de
  Bash-tool uitvoert, niet `git pull`, een ander gereedschap of een script (dezelfde grens als
  HDR-004). Buiten Claude Code is het vangnet de check op dubbele id's, plus de gewoonte om het
  script vóór de merge te draaien; als er niets te hernummeren valt, doet het niets.
- **HDR-005 wordt niet aangepast.** Het is geïmplementeerd, en een record dat is binnengekomen
  verandert niet. Twee van zijn uitspraken gelden niet meer: de volgorde van zijn stappen, en dat
  `docs:check` dubbele id's niet detecteert. Dit record is de tegenboeking.
  `docs/grootboek/CLAUDE.md` bevat de huidige regel.
- **Geheugen buiten de repo** (Claudes eigen notities) kan een id noemen dat verschuift; dat
  dekt het script niet.
