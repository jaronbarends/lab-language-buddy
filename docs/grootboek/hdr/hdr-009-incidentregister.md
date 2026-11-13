# HDR-009: Terugkerende fouten worden per patroon gelogd en bij drie vastgelegd als regel

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

REQ-GG-06 (Bouw het immuunsysteem) wil dat een fout die blijft terugkomen een regel, hook of
skill in de harness wordt. Tot nu toe telde niets: de correcties die Jarón gaf leefden in Claudes
privégeheugen, buiten de repo, waar geen builder of andere clone ze kon zien en niemand kon
zeggen of een fout twee keer was gebeurd of zeven keer. Dit record voegt de voorste helft van het
immuunsysteem toe.

- **Een register**, `docs/grootboek/registers/incident-register.yml`, gegroepeerd per patroon. Een
  incident is een regel (`datum`, optioneel `aantal`, `wat`, `bron`), geen document en geen
  genummerd record: het boekt geen besluit (HDR-001), en zonder id's kunnen twee parallelle
  branches niet op een nummer botsen zoals records dat doen (HDR-007).
- **Een teller**, `npm run docs:incidents` (`scripts/incidents.mjs`), en een check in
  `docs:check`. **Drempel drie**: een patroon met drie of meer incidenten en geen `maatregel` is
  een waarschuwing; een `maatregel` die een HDR noemt die niet bestaat, een dubbel patroon, of een
  incident zonder `datum` of `wat` is een fout.
- **Wat er bij drie gebeurt:** het patroon wordt vastgelegd (een regel, een hook of een skill),
  een HDR boekt het besluit (de bron ervan is het immuunsysteem, zoals de HDR-gids beschrijft), en
  het id van die HDR komt in de `maatregel` van het patroon. De waarschuwing stopt dan.
- **Een logplicht** in de root-`CLAUDE.md`: als Jarón de agent corrigeert, of een tool faalt op
  een manier die eerder is gebeurd, voeg dan één regel toe en zeg dat in één zin.

## Waarom

**Kernprincipe:** één keer is een incident, twee keer is toeval, drie keer is een zwakte van de
harness (kennisdocument het-gedirigeerde-grootboek). Een zwakte kan pas worden hersteld als ze
als zwakte is gezien, en dat vraagt een telling die niemand bijhield. De telling is goedkoop als
het alleen een regel is; ze zou niet worden bijgehouden als elke fout een document vroeg, daarom
is een fout geen DFT.

De drempel is drie, zoals de requirement zegt. De HDR-gids van de grootboek-skill zegt
"frequentie > 3", wat strenger is en wat deze repo niet volgt.

## Gevolgen

- **Gezaaid** op 2026-10-27 uit de zes feedbacknotities in Claudes geheugen, geteld op wat de
  notities zelf zeggen en niet op een volledige geschiedenis: `naming-precision` 7, `answer-first`
  2, `act-on-question` 2, `review-point-context` 1, `id-with-title` 1, `ai-vs-self-advice` 1.
- **Eerste vastlegging:** `naming-precision` stond op dag één op zeven, dus het register
  waarschuwde meteen. Het is vastgelegd in HDR-010, wat het bewijs is dat de keten van incident
  via telling naar regel werkt.
- **`ai-vs-self-advice` is geen herhaalde fout maar een conflict** tussen de globale
  instructies van Jarón en dit project, dat alleen in privégeheugen was beslecht. Het is eenmalig opgelost,
  met een regel in de `CLAUDE.md` van het project, zonder op een telling te wachten.
- **Loggen hangt af van de agent.** Geen hook kan een menselijke correctie zien. Het register
  maakt herhaling telbaar zodra ze is gelogd; het zorgt er niet voor dat de agent logt. Of hij
  dat doet, is pas na weken gebruik bekend, en dit record beweert dat niet.
- **Oordeel blijft menselijk.** Of een nieuwe fout "dezelfde" is als een bestaand patroon, is de
  keuze van de agent, gecontroleerd door Jarón. Een verkeerde koppeling scheeftrekt een telling.
- **Parallelle branches** die allebei loggen botsen nog steeds op dezelfde regels van het
  register; de oplossing is beide kanten te houden.
- **Sinds 2026-11-13 telt elke gevonden fout, en vraagt een incident na de maatregel een oordeel**
  (HDR-036, Het incidentregister telt elke gevonden fout, en een incident na de maatregel vraagt
  een oordeel). De logplicht hierboven noemde twee aanleidingen, terwijl het register al breder
  telde. En "de waarschuwing stopt dan" geldt tot het volgende incident: daarna waarschuwt
  `docs:check` tot iemand heeft geoordeeld of de maatregel hield.
- De geheugennotities worden niet verwijderd. Ze blijven de bron van de eerste incidenten; het
  register is waar ze worden geteld.
- **Nummering.** Deze branch boekt HDR-009 en HDR-010. `arc/bubble-animation` bevat een eigen
  HDR-008 en hernummert die met `npm run docs:renumber` als hij weer `arc/arc-main` merget
  (HDR-007).
