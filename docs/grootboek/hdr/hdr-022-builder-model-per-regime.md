# HDR-022: Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`

- **Status:** implemented
- **Date:** 2026-11-08
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een goedkoper model hoort waar de borging niet op zijn eigen uitleg leunt. Bij `trivial` zijn de
mechanische poorten de borging en bestaat het rapport uit drie regels die de lead kan controleren.
Bij `normal` leunen de lead en de reviewer ook op wat de builder uitlegt: zijn keuzes, zijn open
punten, zijn verklaringen. Precies daar maakte Sonnet in de proef zijn fouten.

Een beslisregel voor een proef ligt vooraf vast, en dat geldt ook voor hoe je hem leest. Wie de
lezing pas kiest als de uitkomst er is, verschuift de doelpalen.

## Besluit

- **`trivial`:** de lead start de builder met `model: "sonnet"` in de aanroep.
- **`normal` en `risky`:** de builder draait op Opus. `.claude/agents/builder.md` pint
  `model: opus` in de frontmatter, zoals `refactor-werkplaats` al deed. Zonder die pin neemt de
  builder het model van de lead over, en dan hangt "Opus bij `normal`" stil af van het model
  waarop de lead draait.
- De triage-skill noemt het model per regime onder zijn tabel; de alinea Staffel in de
  root-`CLAUDE.md` zegt het in één zin.
- De reviewer valt buiten dit besluit.

Geen hook dwingt het model af; `triage-guard` controleert alleen de regime-regel. Vergeet de lead
`model: "sonnet"` bij `trivial`, dan draait de builder op Opus: de fout valt naar de duurdere,
veiligere kant.

## Waarom: de proef van 2026-11-08

**Vraag van Jarón:** kunnen builders op Sonnet draaien in plaats van Opus, bij `trivial` en
`normal`?

**Beslisregel, vooraf afgesproken:** Sonnet wordt de standaard als de run geen serieuze
reviewbevinding oplevert die Opus niet had, en als elke bewering in het builderrapport klopt
wanneer de lead die naloopt.

**Opzet.** De driftopdracht van PR #37 (`drift-signal.mjs` meet vanaf de laatste afgesloten
reconciliatie, regime `normal`) is opnieuw gespeeld in een worktree op `ddab397`, de stand waarop
de Opus-builder begon. Er veranderde één variabele: het model van de builder. De opdrachten aan
builder en reviewer waren letterlijk die van de Opus-run, op de branchnaam na. De reviewer draaide
in beide runs op Opus en hoorde niets over de bevindingen van de eerste run. De opzet staat in
`../resources/trials/sonnet-builder-replay.md`, naast de repo en niet ingecheckt.

| | Opus-builder (2026-11-07) | Sonnet-builder (2026-11-08) |
|---|---|---|
| Status in het rapport | DONE_WITH_CONCERNS | DONE |
| Tests | 45/45, met een eigen mutatiecheck op drie gedragingen | 48/48, geen mutatiecheck |
| Builder | 80.896 tokens, 21 tool-aanroepen, ~8 min | 46.741 tokens, 8 tool-aanroepen, ~2 min |
| Reviewer (Opus) | REQUEST_CHANGES, 102.371 tokens | REQUEST_CHANGES, 91.223 tokens, ~9,5 min |
| Serieuze bevindingen | 2 | 2, dezelfde |
| Kleine bevindingen | 2 | 4 |
| Rapport klopte bij controle | ja | de verificatieclaims wel, twee toelichtingen niet |
| Open punten die hij zelf zag | documenten in elkaars werkgebied, squash of rebase, hernoeming van een document, een afgesloten DFT zonder `getoetst-tegen`, merge commits | documenten in elkaars werkgebied, merge commits, de inspringing die de parser verwacht |

In beide runs vond de reviewer dezelfde twee serieuze bevindingen. Een pad onder `documenten` in
een andere spelling (`./`, `\`, hoofdletters) telt stil niet mee. En de test "de nieuwste commit
wint" laat een implementatie door die de eerste DFT laat winnen.

**Criterium 1 is gehaald:** de Sonnet-run leverde geen serieuze bevinding op die Opus niet had.

**Criterium 2 is, strikt gelezen, niet gehaald.** Alle verificatieclaims klopten: tests, lint,
`docs:check`, de uitvoer van `docs:drift` en de scope. Twee toelichtingen klopten niet:

- De builder verklaarde zijn 16 commits tegenover de 14 uit de opdracht met "het nulpunt is nu de
  toevoeg-commit en niet meer de laatste aanraking". Het oude nulpunt (`608274b`) geeft 0 commits.
  14 is de meting vanaf `8095deb`, zonder de merge commit. Het verschil zijn `8095deb` zelf en de
  merge `32960c7`. De opdracht noemde 14 bovendien als aanleiding, niet als verwachte uitkomst.
- Hij noemde `32960c7` een merge commit "die alleen docs raakt". Die merge brengt codewijzigingen
  van beide kanten samen (`src/lib/prompt.ts` en `src/lib/tts/google.ts`).

Zulke fouten zijn het lastigst te vangen. Ze klinken aannemelijk en staan in het kanaal waar de
lead op vertrouwt. De lead ving ze hier alleen omdat de proef hem elke bewering liet nalopen.

**Oordeel van Jarón (2026-11-08):** Sonnet voor `trivial`, Opus voor `normal`. De redenering
daarachter:

- Bij `trivial` is er geen reviewer, dus is de builder de hele kostenpost.
- De velden waar Sonnet de mist in ging (toelichting, open vragen) bestaan niet in het rapport van
  drie regels.
- Bij `normal` bespaarde Sonnet ongeveer een kwart van de tokens van builder en reviewer samen,
  want de reviewer blijft op Opus.

## Grenzen

- Eén run is één datapunt. Het verschil tussen twee runs van hetzelfde model kan groter zijn dan
  het verschil tussen Sonnet en Opus hier.
- `trivial` is niet getest. Het besluit trekt de uitkomst van een moeilijkere taak door naar
  makkelijkere taken.
- Tokens zijn geen kosten: een prijsverschil per token is niet meegeteld.

## Later opnieuw testen

Jarón wil `normal` later opnieuw testen. Spreek daarvoor twee dingen vooraf af:

- Welke lezing van "elke bewering klopt" telt: elke bewering, of alleen wat de builder over tests,
  checks en uitvoer zegt.
- Dat er één variabele blijft. Een aanpassing aan `builder.md`, bijvoorbeeld "markeer een
  verklaring die je niet hebt nagelopen als vermoeden", test iets anders dan het model.

## Gevolgen

- `builder.md`, de triage-skill en de root-`CLAUDE.md` zijn in dezelfde commit bijgewerkt. De
  root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón getoond en door hem
  gecontroleerd.
- PR #37 boekt ook een HDR-022. De branch die als tweede merget, hernummert zijn records.

Verwant: HDR-013 (Modern Web Guidance proberen op de bubbelanimatie, met eerst de eigen baseline)
Verwant: HDR-018 (Contextlagen en een drift-check voor de documentatie)
Verwant: HDR-005 (De branch die als tweede merget hernummert zijn records)
