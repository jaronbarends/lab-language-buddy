# HDR-032: Een feature-worktree zet de skill `feature-worktree` op, vanaf `main` en met een eigen install

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Stappen die bij elke worktree gelijk zijn horen in een script, dat bij elke aanroep hetzelfde doet. Wat
een agent moet weten om het script op het juiste moment te draaien en de uitvoer door te geven, hoort
in een skill. Zo hangt het opzetten van parallel werk niet af van wat een sessie zich herinnert.

## Probleem

Jarón doet administratief werk in `repo` en wil tegelijk in een andere worktree aan features werken,
en wil dat vaker doen. Een worktree maken is één commando, maar dit project voegt stappen toe die je
vergeet: de branch moet vanaf `main` vertrekken ook als `repo` op een andere branch staat (HDR-011 en
HDR-021, Werk vertakt van `main`; `arc/arc-main` vervalt), `.env.local` is ongetrackt en ontbreekt in
een verse checkout, `node_modules` ontbreekt, en poort 3000 is van de dev server in `repo`.

Dit is geen incident dat zich herhaalde (geen regel in het incidentregister). De aanleiding is het
verzoek van Jarón op 2026-11-13, met de wens dat Claude het kan doen.

## Besluit

De skill `feature-worktree` (`.claude/skills/feature-worktree/`) zet een feature-worktree op en ruimt
hem op, met `scripts/feature-worktree.sh setup <naam>` en `teardown <naam> [--force]`.

- **Locatie en naam:** `../<repo>-<naam>`, met branch `<naam>`. Dat volgt de bestaande worktree
  `repo-animation`.
- **Altijd vanaf `main`**, nooit vanaf de branch waarop de hoofdcheckout staat.
- **`.env.local` wordt gekopieerd, `.env.prd` niet.**
- **Een eigen `npm install` in de worktree**, geen junction naar `node_modules` van `repo`.
- **Dev-poort:** de eerste vrije poort vanaf 3001 (tot 3099).
- **Teardown** weigert een worktree met niet-gecommitte wijzigingen tenzij `--force`, en verwijdert de
  branch alleen met `git branch -d`.
- **De skill start geen venster en geen dev server.** Jarón opent zelf `code <pad>` en start daar een
  eigen Claude-sessie; de sessie in `repo` blijft bij haar werk.
- **De skill noemt de testpoort** (versie 1.1, 2026-11-13). Bij het doorgeven van `DEV_COMMAND` zegt
  ze dat het werk op `DEV_PORT` te zien is en niet op 3000, waar de server van `repo` draait. Bij de
  eerste echte feature (PR #58) keek Jarón naar die van `repo` en zag de wijziging niet (HDR-036, Een
  nieuwe app-feature loopt via de skill `feature`).

## Waarom

De keuzes van Jarón (2026-11-13) bij drie vragen, de rest is afgewogen in het gesprek:

- **Eigen `npm install`.** Een junction (zoals `review-worktree.sh` van de skill `stage-review` doet)
  is direct klaar, maar deelt de dependencies: een feature die `package.json` wijzigt raakt dan ook
  `repo`. Een review wijzigt niets, een feature wel. De prijs is ongeveer twee minuten per worktree.
- **Alleen `.env.local`.** `.env.prd` is wat `next dev` niet nodig heeft; het blijft in `repo` zodat
  productiegegevens niet onnodig rondslingeren.
- **Eerste vrije poort.** Een vaste 3001 is eenvoudiger, maar botst zodra er twee feature-worktrees
  tegelijk draaien. Iets meer code, geen botsing.
- **Een eigen script, geen uitbreiding van `review-worktree.sh`.** Dat script is gebouwd voor reviews
  (branch `review/…`, de STRIP-stap, een resultatenmap); dat los je er niet netjes uit.
- **Alleen het commando, zonder skill.** Dat werkt, maar de projectstappen zijn dan van het geheugen
  van de sessie afhankelijk. Jarón wil het vanuit Claude kunnen doen.

## Grenzen

- **Eén proef.** Setup en teardown zijn op 2026-11-13 één keer geprobeerd met een wegwerpnaam
  (`wt-test`): worktree, env-kopie, install en poort 3001 werkten, teardown liet niets achter. Daarna
  gebruikt voor één echte feature, de infomelding (PR #58); dat leverde versie 1.1 op.
- **`git branch -d` toetst tegen `HEAD` van de hoofdcheckout**, niet tegen `main`. Staat `repo` op een
  andere branch, dan kan een branch die daarin is gemerged als gemerged tellen zonder in `main` te
  zitten. Een branch die nergens in zit blijft staan (`BRANCH_KEPT`).
- **Poortcontrole via `netstat`.** Ontbreekt dat, dan telt elke poort als vrij.
- **De root-`CLAUDE.md` bleef ongewijzigd.** De skill wordt door haar beschrijving gevonden; de rij
  Procedures in de tabel noemt haar niet. Een regel in een leidend document hoort onder de
  communicatieplicht en is niet toegevoegd.
- **Een worktree vraagt een eigen sessie van Jarón.** De skill kan dat niet voor hem doen.

## Gevolgen

- `.claude/skills/feature-worktree/SKILL.md` en `scripts/feature-worktree.sh` zijn nieuw.
- Registerregel in `hdr-register.yml` en twee regels in `docs/index.yml` (dit record en de skill).
- Nummering: dit record is als HDR-032 geboekt omdat HDR-031 (Lint en `tsc` tellen bij triage alleen
  als gedekt pad bij een wijziging zonder gedragseffect) toen alleen op de branch
  `triage-gedekt-pad-lint-tsc` stond. Die branch is daarna eerst gemerged (PR #54), dus er is geen
  gat en geen hernummering nodig geweest.

Verwant: HDR-021 (Werk vertakt van `main`; `arc/arc-main` vervalt)
Verwant: HDR-011 (Arc-werk vertakt van `arc/arc-main`, en de branch bestaat vóór de eerste bewerking)
