# HDR-031: Lint en `tsc` tellen bij triage alleen als gedekt pad bij een wijziging zonder gedragseffect

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Bij `trivial` is er geen reviewer: de mechanische poort is de borging. Een poort telt daarom alleen
als dekking waar hij iets kan vangen, of waar er geen gedrag is om fout te doen. Een regel die
"gedekt pad" ongedefinieerd laat, wordt door elke agent anders gelezen.

## Probleem

In ronde drie van JNL-002 (Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?, K9)
kreeg een verse agent de taak zes niveaulabels om te draaien ("Intermediate (B1)" naar "B1
(Intermediate)"). Vraag 4 van de triage-skill vraagt een mechanische poort op het pad, en noemt
lint daarbij, maar zegt niet wat daaronder valt. De agent las het als "er is een test", zag er geen
onder `src/` en koos `normal`. De antwoordsleutel ging uit van lint en `tsc` en dus `trivial`. Het
verschil kostte een Opus-builder en een reviewer voor zes labels.

Er is geen testsuite onder `src/` (HDR-028, Mutatietests bij het risky-regime zijn geparkeerd tot
`src/` een testsuite heeft). Met de lezing "er is een test" kan niets in `src/` ooit `trivial`
worden.

## Besluit

**Lint en typecheck (`tsc`) tellen als gedekt pad bij een wijziging zonder gedragseffect.** Een
test, snapshot of check telt altijd. De regel staat in vraag 4 van `.claude/skills/triage/SKILL.md`.

- **Zonder gedragseffect:** weergavetekst, hernoemen, verplaatsen, imports, types.
- **Gedrag, dus `normal`:** elke wijziging die gedrag verandert, ook bij groene lint en `tsc`.
  Daaronder valt tekst die een model of spraakdienst aanstuurt (een prompt) en tekst die de
  gebruiker iets toezegt over wat de app doet ("je opname wordt niet bewaard"): staat zo'n zin niet
  meer gelijk aan de code, dan zegt de app iets onwaars.
- **Bij tekst is de borging de diff.** Lint en `tsc` zien alleen een fout in de structuur, niet of
  een label goed staat. De lead loopt de diff na, en het rapport van drie regels laat dat toe.
- **Een nieuw ijkgeval** in de skill: de volgorde van twee delen van een weergavelabel omdraaien is
  `trivial`.

## Waarom

De keuze van Jarón (2026-11-13), en de rest is afgewogen in JNL-002 (K9):

- **Lint en `tsc` tellen altijd.** Een gedragswijziging in `src/` zou dan zonder reviewer en op
  Sonnet door kunnen (HDR-024, Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`),
  terwijl `tsc` gedrag niet ziet en de iPhone-faalpaden (audio, opname) helemaal niet. Afgewezen.
- **Ze tellen nooit.** `trivial` is dan leeg voor `src/` tot er een testrunner is, en elke
  labelwijziging kost een Opus-builder en een reviewer. Afgewezen.
- **Open laten.** Het verschil komt dan bij elke tekstwijziging terug. Afgewezen.
- **De gekozen lezing** houdt de vangrail (bij twijfel `normal`) en het bestaande ijkgeval
  "functionele wijziging zonder test is `normal`" intact.

De afbakening van "belofte" is gekozen door Jarón: de grens is scherp (zegt de tekst wat de app
doet?) en een fout daar is een onwaarheid naar de gebruiker.

## Grenzen

- **Een oordeel van de lead.** Of een tekst een belofte doet, beslist de lead bij de triage; niets
  controleert dat. `triage-guard` ziet alleen of de regime-regel er staat.
- **Eén proefgeval.** De regel komt uit één taak (zes labels). Niet gemeten of een volgende koude
  agent nu `trivial` kiest: dat vraagt een volgende koude-startronde met een taak zonder
  gedragseffect.
- **De root-`CLAUDE.md` bleef ongewijzigd.** De alinea Staffel noemt het gedekte pad niet.

## Gevolgen

- `.claude/skills/triage/SKILL.md`: vraag 4 en een ijkgeval zijn bijgewerkt. De skill is geen
  leidend document; de diff is toch aan Jarón getoond.
- HDR-028 noemde deze vraag een eigen kwestie; zijn Gevolgen wijzen nu naar dit record. De
  parkering van mutatietests blijft ongewijzigd.

Verwant: HDR-028 (Mutatietests bij het risky-regime zijn geparkeerd tot `src/` een testsuite heeft)
Verwant: HDR-024 (Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`)
