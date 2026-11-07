---
titel: "Automatisch hernummeren van grootboekrecords bij een merge"
type: spec
soort: plan van aanpak
status: concept
datum: 27 oktober 2026
auteurs: Jarón, Mama Claude
---

# Automatisch hernummeren van grootboekrecords bij een merge

**Waar het om gaat.** HDR-005 zegt dat de branch die als tweede merget zijn eigen records
hernummert, vóór de merge. Nu hangt dat ervan af dat iemand eraan denkt. Deze feature maakt het
mechanisch, in drie delen: een check die een dubbel id luid laat klinken, een script dat het
hernummeren doet, en een hook die een merge van `arc/arc-main` of `main` tegenhoudt tot het
script heeft gedraaid.

## De flow

1. Jarón vraagt Claude Code om `arc/arc-main` (of `main`) in een branch te mergen.
2. De hook ziet de merge, controleert de records van de branch tegen die ref en vindt id's die
   botsen. Hij weigert de merge en noemt ze.
3. Claude draait `npm run docs:renumber`. De eigen records van de branch krijgen de eerstvolgende
   vrije nummers. Eén commit.
4. Claude probeert de merge opnieuw. De registers conflicteren nog steeds waar beide kanten iets
   toevoegden, maar ze bevatten nu verschillende id's, dus de oplossing is beide kanten houden.
5. In een gewone terminal is er geen hook. Jarón draait het script vóór elke zulke merge; als er
   niets te hernummeren is, doet het niets. De check op dubbele id's is het vangnet als het
   vergeten wordt.

## Deel 1: check op dubbele id's in `docs:check`

- Elk register (adr, hdr, pdr, dft, jnl) bevat elk id één keer.
- Het bestand dat in `bestand` staat bestaat en begint met zijn id, in kleine letters
  (`hdr-007-…`).
- Het faalt zoals de andere checks in `scripts/check-docs.mjs`, lokaal en in CI bij elke PR.

## Deel 2: het script, `npm run docs:renumber`

- Vergelijkt de branch met een basis-ref, standaard `origin/arc/arc-main`; het draait eerst
  `git fetch`. `--check` meldt botsingen en verandert niets (de hook gebruikt dit).
- **Een botsing** is een id dat in het basisregister staat en in het register van de branch met
  een ander `bestand`. Hetzelfde id en hetzelfde bestand betekent dat het record al is
  geland: het blijft staan.
- Het record van de branch krijgt het eerstvolgende vrije nummer: één na het hoogste id van dat
  type in de basis en in de branch. Gemergede records veranderen nooit van nummer (HDR-005).
- **Reikwijdte van de vervanging.** Alleen regels die de branch zelf heeft toegevoegd of
  gewijzigd sinds de merge-base (`git diff -U0 <merge-base>`). Binnen die regels wordt `HDR-006`
  `HDR-007` en `hdr-006-` wordt `hdr-007-`; het recordbestand krijgt een nieuwe naam. Daarom is
  het veilig: vóór de merge betekent elke vermelding van het botsende id in die regels het eigen
  record van de branch.
- **Het weigert** als er een merge bezig is, of als de branch al dubbele id's bevat (de
  verwijzingen zijn dan dubbelzinnig). De melding zegt dat je de merge moet afbreken en opnieuw
  moet beginnen.
- Twee keer draaien doet de tweede keer niets.

## Deel 3: de hook

- Een PreToolUse-hook op `Bash`, alleen voor de lead thread (zoals `guard-push-sweep`), voor
  `git merge <ref>` waarbij `<ref>` `arc/arc-main`, `origin/arc/arc-main`, `main` of
  `origin/main` is. `main` is erbij genomen omdat `arc/arc-main` naar verwachting in `main`
  gemerged wordt en de centrale branch wordt.
- Hij draait het script met `--check` tegen die ref. Botsingen: weigeren, ze noemen, zeggen dat
  `npm run docs:renumber` moet draaien en dan opnieuw proberen. Geen botsingen: doorlaten.
- Niet gedekt: `git pull`, merges in een andere tool, een merge in een script. Dezelfde blinde
  vlek als de andere hooks (HDR-004).

## Tests

Een eerste geautomatiseerde test in deze repo, met `node:test` (ingebouwd in Node) op een
wegwerp-repo die in een tijdelijke map wordt opgebouwd: een basis met een HDR-006 en een
branch met een eigen HDR-006. Gevallen: hernummert naar HDR-007 en werkt het register,
`index.yml` en de verwijzingen bij; laat een record dat al is geland met rust; doet niets bij een
tweede run; weigert tijdens een merge; weigert bij bestaande duplicaten; de check op duplicaten
faalt en slaagt daarna.

De echte test is `arc/bubble-animation`: de Modern Web Guidance-proef daar bevat HDR-006 en moet
het eerstvolgende vrije nummer worden, dat na de HDR komt die deze feature boekt.

## Klaar wanneer

- `npm run docs:check` faalt op een gedupliceerd id en slaagt op de huidige repo.
- De testsuite slaagt, en de echte run op `arc/bubble-animation` geeft het verwachte resultaat
  zonder handwerk, behalve beide kanten houden bij het append-conflict.
- De hook weigert een botsende merge en laat een schone door, voor `arc/arc-main` en `main`.
- Een nieuwe HDR boekt het besluit. Hij breidt HDR-005 uit (stap 3 is niet langer handmatig) en
  de nummeringssectie van `docs/grootboek/CLAUDE.md` wordt bijgewerkt. Dat bestand is een
  leidend document, dus de wijziging wordt gemeld en gecontroleerd.

## Bronnen

- **Het denkwerk:** deze sessie; HDR-005 (de regel die mechanisch wordt gemaakt).
- **Het patroon:** `.claude/hooks/guard-push-sweep.cjs` en HDR-004 (weigeren, de bestanden
  noemen, opnieuw proberen); `.claude/hooks/notify-leading-document.cjs` en HDR-006 (procedure
  als data).
- **Waar het landt:** `scripts/check-docs.mjs`, `package.json`, `.claude/settings.json`,
  `docs/grootboek/CLAUDE.md`.
- **Het testgeval:** branch `arc/bubble-animation`, zijn HDR-006 (Modern Web Guidance-proef).
