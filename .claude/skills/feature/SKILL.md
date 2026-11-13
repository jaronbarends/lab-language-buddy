---
name: feature
description: >
  De route voor een nieuwe app-feature, van idee tot gemergede pull request: de huidige werking
  begrijpen, het spec-gesprek, bouwen met triage, builder en reviewer, de test door Jarón, de
  reconciliatie, de commits en de PR. Gebruik dit wanneer Jarón een nieuwe feature in de app wil
  ("ik wil X toevoegen", "een nieuwe feature", "kun je een melding, knop of scherm maken dat…")
  of /feature typt. NIET voor: een bugfix, een kleine aanpassing aan bestaand gedrag (een tekst,
  een label, één stijlregel) of harnaswerk (`.claude/`, `scripts/`, `docs/`); die hebben deze
  route niet nodig of een andere vorm.
---

# feature

Deze skill draagt de volgorde van de route voor een app-feature (HDR-036). De inhoud van elke stap
staat in de skill of het document waar hij naar verwijst; herhaal die hier niet. Jarón beslist op
vijf momenten, gemarkeerd met **Jarón**. Al het andere doet de lead thread.

## 0. Plek

- Een eigen branch vanaf `main`, vóór de eerste bewerking (HDR-011, HDR-021). Wil Jarón parallel
  werken, gebruik dan de skill `feature-worktree`. De feature loopt daarna verder in een nieuwe
  sessie die Jarón in die worktree start, niet in deze: geef hem de waarden uit die skill en stop
  hier.
- Werk je in een worktree, zoek dan de poort van de dev server op en noem die bij elke test. De
  server op 3000 draait meestal vanuit `repo` en laat de wijziging niet zien.

## 1. Begrip

Lees hoe het nu werkt: de code die de feature raakt, en via `docs/index.yml` de records erover.
Toon Jarón een kort mentaal model (wat er nu gebeurt, waar het in de code zit, welk bestaand
patroon in de buurt komt) voordat je vragen stelt.

## 2. Spec — **Jarón beslist**

- Start de skill `grootboek`; de spec-schrijfgids is een harde eis.
- Vraag eerst het waarom. Dat bepaalt de inhoud en of er een PDR komt.
- Leg beslispunten voor zoals HDR-034 voorschrijft: eerst uitleg, het advies als laatste. UI- en
  interactiekeuzes zijn van Jarón; vul ze niet zelf in. Wat je toch zelf invult, noem je apart om
  te laten checken.
- Raakt de feature de structuur (een nieuw gedeeld component, een bestand splitsen of laten
  groeien), lees dan eerst `docs/code-architectuur.md`. Botst een wens met een regel daar, zeg dat
  vóór het bouwen; de builder ziet alleen de spec.
- Schrijf de spec in `docs/grootboek/specs/`, een PDR bij een productkeuze (status `accepted`) en
  een ADR bij een architectuurkeuze, met registers en `docs/index.yml`. Een wijziging aan een
  leidend document: toon de tekst en vraag akkoord.

## 3. Bouwen

- Start de skill `triage`; de regimeregel is de eerste regel van de builderopdracht.
- Eén builder per set bestanden die van elkaar afhangen. De opdracht verwijst naar de spec en noemt
  de bestandsgrens. Bij CSS-werk zet je Modern Web Guidance in de opdracht (`CLAUDE.md`).
- Lees de diff zelf. Bij `normal` en `risky` volgt een reviewer.
- Spreken builder en reviewer elkaar tegen over de code, ga het zelf na voordat je het aan Jarón
  meldt.
- Werk ondertussen de records bij die de wijziging raakt, zoals een versiebump of een leidend
  document (dat laatste met akkoord). Draai `npm run docs:check` na elke documentwijziging.

## 4. Testen — **Jarón test**

- Geef een korte checklist: per gedrag uit de spec wat Jarón moet zien, in de browser, en op de
  iPhone als het audio, opname of layout raakt (HDR-029). Noem wat niet te testen is zonder een
  codewijziging.
- Vindt Jarón een fout, ga dan terug naar stap 3.
- Noem de URL met de poort. Ziet Jarón de wijziging niet, kijk dan eerst welke server vanuit welke
  map draait:

  ```bash
  netstat -ano | grep LISTENING | grep -E ":30[0-9][0-9]\s"
  powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=<pid>').CommandLine"
  ```

## 5. Reconciliatie en afronden

1. Raakt de wijziging een werkgebied (HDR-026), volg dan `docs/grootboek/CLAUDE.md`. Zolang de
   tijdelijke kostenmeting loopt: meld het vooraf en wacht op een go. **Jarón: `/usage`.**
2. Reconcilieer tegen de working tree en schrijf de DFT met een plaatshouder voor de commit. Het
   driftsignaal meet alleen gecommitte wijzigingen, dus het kan nog niet aanslaan. Meld het af en
   zet de kostenregel in de DFT.
3. Is de test van Jarón geslaagd, zet dan elke PDR en ADR van deze feature op `implemented`, in het
   record en in het register. Toon de diff van elk gewijzigd leidend document.
4. Vraag een go voor de commits, de push en de PR. **Jarón: go.**
5. Commit 1: de code met haar records. Vul de hash in de DFT in, boek de DFT in het register en in
   `docs/index.yml`, draai `npm run docs:check` en `npm run docs:drift`, en maak commit 2. De DFT
   kan niet in commit 1, omdat hij naar die commit verwijst (zo ook DFT-005 en DFT-006).
6. Haal `origin/main` op. Botsen er nummers, draai dan `npm run docs:renumber -- --base origin/main`
   (HDR-007); de lokale `main` loopt na een fetch achter. Push en open de PR; de hook `guard-reconciliatie-pr` controleert de DFT.

## 6. Na de merge — **Jarón merget**

Ruim de worktree op met de skill `feature-worktree` (teardown), maar pas als er in die map niets
meer openstaat.

## Wat Jarón doet, op een rij

1. Het waarom en de keuzes in het spec-gesprek.
2. Akkoord op de spec, op een PDR of ADR, en op elke wijziging aan een leidend document.
3. De test in de browser en, bij audio, opname of layout, op de iPhone.
4. Zolang de kostenmeting loopt: `/usage` rond de reconciliatie.
5. Een go voor de commits, de push en de PR; daarna mergen.
