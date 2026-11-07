# HDR-011: Arc-werk vertakt van `arc/arc-main`, en de branch bestaat vóór de eerste bewerking

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Eén zin toegevoegd aan de regel `Branches` van de root-`CLAUDE.md`: werk in de branches van het
grootboekexperiment (`arc/*`) vertakt van `arc/arc-main` en gaat er via een pull request weer in,
terwijl `arc/arc-main` de integratiebranch is; `main` is productie (ADR-001). De branch wordt
gemaakt vóór de eerste bewerking, niet erna.

Geen hook dwingt de tweede helft af. Het is één incident (zie het register), en de regel was tot
nu toe niet opgeschreven; een hook komt pas als het patroon terugkeert.

## Waarom

**Kernprincipe:** de root-`CLAUDE.md` is het ene bestand dat elke sessie laadt, dus wat een
nieuwkomer nodig heeft om goed te beginnen moet daar staan, niet alleen in een map die laadt als
je toevallig daar werkt. De basisbranch stond in `docs/grootboek/CLAUDE.md` en in de
CI-workflow, en een verse agent in de eerste cold-start-run (JNL-002) beantwoordde "wat doe ik
vóór een wijziging" precies zoals de root het zei: een eigen branch, nooit `main`, en geen
basisbranch. Daarna bewerkte hij op `arc/arc-main`. De beschrijving die de repo van zichzelf gaf
was achtergebleven bij hoe het werk feitelijk wordt gedaan.

## Gevolgen

- **Een zin met een houdbaarheidsdatum.** Er staat "terwijl `arc/arc-main` de integratiebranch
  is". Als `arc/arc-main` in `main` wordt gemerged en de centrale branch wordt, wordt de zin in
  dezelfde stap bijgewerkt; het driftsignaal let hier niet op.
- De basisbranch wordt nu op twee plekken genoemd, de root en `docs/grootboek/CLAUDE.md`. Een
  duplicatie, geaccepteerd: de root is wat voor iedereen laadt.
- `branch-before-edit` is gelogd in het incidentregister met dit record als `maatregel`. Als het
  na de zin terugkeert, was de regel niet genoeg en groeit het patroon door; een hook die
  bewerkingen op `arc/arc-main` en `main` weigert is de voor de hand liggende volgende stap, niet
  iets om eerst te bouwen.
- De root-`CLAUDE.md` is een leidend document: de wijziging is aan Jarón gemeld en gecontroleerd.
- Het bewijs is een tweede cold-start-ronde (JNL-002): de vraag naar de basisbranch zou nu
  beantwoord moeten worden en de bewerking zou op een branch moeten beginnen. Tot dan is dit een
  besluit, geen resultaat.
