---
name: feature-worktree
description: Zet een worktree klaar om parallel aan een feature of fix te werken terwijl de hoofdcheckout (`repo`) bezig blijft met ander werk, en ruimt hem daarna op. Gebruik dit wanneer Jarón vraagt om "een worktree voor X", "tegelijk aan iets anders werken", "een aparte checkout voor een feature" of een worktree wil opruimen. NIET voor de koude review van een stage: daarvoor is `/stage-review`.
---

# feature-worktree

Een worktree is een tweede checkout van dezelfde repo in een eigen map, op een eigen branch.
Jarón werkt er in een eigen VS Code-venster en een eigen Claude-sessie, terwijl deze sessie in
`repo` blijft. De stappen zitten in `scripts/feature-worktree.sh`; deze skill beschrijft wanneer je
het script draait en wat je met de uitvoer doet.

## Opzetten

Eerst de naam. Vraag er Jarón naar als hij niets noemde: een korte beschrijvende branchnaam in
kleine letters met streepjes (de conventie uit "Branches" in de projectinstructies). Draai dan:

```bash
bash .claude/skills/feature-worktree/scripts/feature-worktree.sh setup <naam>
```

Het script doet vier dingen:
- Maakt `../<repo>-<naam>` met branch `<naam>`, **altijd vanaf `main`**, ook als `repo` zelf op een
  andere branch staat (HDR-011, HDR-021).
- Kopieert `.env.local` mee (niet `.env.prd`; dat blijft bewust in `repo`).
- Draait `npm install` in de worktree. Dat duurt even en is bewust geen junction naar `repo`: een
  feature die `package.json` wijzigt raakt dan `repo` niet.
- Zoekt de eerste vrije poort vanaf 3001, omdat Jaróns dev server op 3000 draait.

Geef Jarón na afloop de waarden `WORKTREE`, `DEV_COMMAND` en `OPEN_COMMAND` uit de uitvoer. Zeg er
bij dat hij zelf een nieuw venster opent (`code <pad>`) en daar een nieuwe sessie start: dat kun jij
niet voor hem doen, en deze sessie blijft in `repo`.

Zeg er ook bij dat hij het werk in de worktree test op `http://localhost:<DEV_PORT>`. De server op
3000 draait vanuit `repo` en laat het niet zien; bij de eerste echte feature (PR #58) keek Jarón
daardoor naar de verkeerde app (HDR-032, versie 1.1).

Start je geen eigen werk in de worktree vanuit deze sessie. Het punt is juist dat de feature in een
aparte sessie loopt.

## Opruimen

Pas na een merge, of als Jarón de worktree weggooit. Opruimen gooit een map weg, dus de naam komt
altijd van Jarón. Noemde hij er geen, draai het script dan zonder naam:

```bash
bash .claude/skills/feature-worktree/scripts/feature-worktree.sh teardown
```

Dat verwijdert niets en geeft per worktree die in aanmerking komt een regel `CANDIDATE`. Toon die
lijst aan Jarón en vraag welke weg moet. Kies nooit zelf, ook niet als er maar één staat of als hij
schoon en gemerged lijkt. Draai daarna met de naam die hij noemt:

```bash
bash .claude/skills/feature-worktree/scripts/feature-worktree.sh teardown <naam>
```

Het script weigert een worktree met niet-gecommitte wijzigingen. Toon dan de lijst aan Jarón en
gebruik `--force` alleen nadat hij daarmee akkoord is. De branch wordt alleen verwijderd als hij
gemerged is (`git branch -d`); anders meldt het script `BRANCH_KEPT` en beslist Jarón.

## Grenzen

- Het script start geen dev server en opent geen venster.
- Het script pusht niets. Branch, commit en PR volgen de gewone afspraken.
- Bestaat er al een worktree of branch met die naam, dan stopt het script; kies een andere naam.
