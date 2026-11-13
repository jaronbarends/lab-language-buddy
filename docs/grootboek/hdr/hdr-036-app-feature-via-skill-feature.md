# HDR-036: Een nieuwe app-feature loopt via de skill `feature`

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een route die over veel plekken verspreid staat, wordt alleen gevolgd waar een hook haar afdwingt.
Een skill die de volgorde draagt en voor de inhoud van elke stap naar de bestaande plek verwijst,
maakt de rest onafhankelijk van wat een sessie zich herinnert, zonder die inhoud te kopiëren.

## Probleem

Jarón vroeg op 2026-11-13 of ARC bepaalt hoe je een feature toevoegt, met de wens zelf zo min
mogelijk te doen. Die route bestond, maar nergens als geheel: de grootboek-skill ("Bij nieuwe
feature": spec, ADR, PDR), de skills `triage` en `feature-worktree`, de agents builder en reviewer,
de iPhone-regel (HDR-029, De iPhone-test alleen bij audio, opname of layout, en geen vaste ronde
langs de faalpaden) en de reconciliatie (HDR-026, Een pull request die code in een werkgebied raakt,
sluit met een reconciliatie, met de hook uit HDR-030). Alleen de stappen met een hook gebeurden
vanzelf: de triage, de builder voor `src/` en de DFT vóór de PR. De spec, de PDR, de reviewer en de
iPhone-test hingen af van de sessie. Geen app-feature was ooit via de spec-route gegaan; de vier
specs die er ooit waren, gingen alle vier over harnaswerk.

De infomelding (PDR-020, Een infomelding als de gebruiker het gesprek begint; PR #58) was de spike:
de route met de hand gelopen. Drie dingen schuurden:

- Jarón keek naar de dev server van `repo` op poort 3000 en niet naar die van de worktree, en zag de
  wijziging daardoor niet.
- Een wens van Jarón, een gedeeld component bij twee aanroepers, botste met regel 2.5 van
  `docs/code-architectuur.md`. Dat kwam alleen boven omdat de lead de doctrine las; de builder kreeg
  alleen de spec.
- De DFT moet naar een code-commit verwijzen, dus de reconciliatie kan niet in die commit. Het
  werden twee commits, zoals bij DFT-005.

Dit is geen incident (geen regel in het incidentregister).

## Besluit

- **De skill `feature`** (`.claude/skills/feature/SKILL.md`) draagt de route voor een nieuwe
  app-feature in zeven stappen, van plek (0) tot na de merge (6). De inhoud van elke stap blijft in
  de skill of het document waar hij naar verwijst.
- **Alleen app-features.** Bugfixes, kleine aanpassingen en harnaswerk vallen erbuiten.
- **Vanzelf én via `/feature`.** De skill start als het model een nieuwe feature herkent, en als
  Jarón `/feature` typt; de beschrijving sluit de drie gevallen hierboven uit.
- **De drie schuurpunten hebben elk een regel in de skill.** De dev-poort staat in stap 0 en 4, met
  een commando om te zien welke server vanuit welke map draait, en ook in `feature-worktree` (HDR-032
  versie 1.1). De doctrinecheck staat in stap 2, de twee commits in stap 5.
- **De vijf momenten van Jarón** staan in de skill op een rij.

## Waarom

De keuzes van Jarón (2026-11-13) bij twee vragen:

- **Alleen app-features.** De ene geteste run was app-werk. Harnaswerk loopt anders: de lead
  bewerkt het zelf, de iPhone-test vervalt, er komt meestal een HDR in plaats van een PDR, en vaak
  is er geen reconciliatie omdat `.claude/` buiten de werkgebieden valt. Een skill die beide dekt,
  krijgt in bijna elke stap een splitsing. Komt het patroon voor harnaswerk terug, dan krijgt het een
  eigen variant.
- **Vanzelf starten.** Jarón hoeft het commando dan niet te onthouden, en dat past bij zijn doel om
  zelf zo min mogelijk te doen. Het risico, een start bij een kleine aanpassing, vangt de uitsluiting
  in de beschrijving grotendeels op; een onterechte start zie je aan het eerste antwoord.

Afgewogen door de lead:

- **Verwijzen in plaats van kopiëren.** De triage-skill, de spec-schrijfgids en de
  reconciliatieregel veranderen los van deze route. Een kopie in de skill zou ervan wegdrijven.

## Grenzen

- **Eén run, en die zonder de skill.** De route is één keer met de hand gelopen. Of een verse sessie
  de skill vanzelf vindt en volgt, is niet getest.
- **Geen hook.** De stappen zonder hook (spec, PDR, reviewer, iPhone-test) hangen nog steeds van de
  sessie af, nu met een checklist.
- **De root-`CLAUDE.md` is ongewijzigd**, net als bij HDR-032: de skill wordt door haar beschrijving
  gevonden. Start ze bij een echte feature niet vanzelf, dan is een regel in `CLAUDE.md` de volgende
  stap; dat valt onder de communicatieplicht.
- **De kostenmeting is tijdelijk.** Stap 5 noemt haar; na DFT-010 vervalt die zin samen met het blok
  in `docs/grootboek/CLAUDE.md`.

## Gevolgen

- `.claude/skills/feature/SKILL.md` is nieuw.
- HDR-032 (Een feature-worktree zet de skill `feature-worktree` op, vanaf `main` en met een eigen
  install) gaat naar versie 1.1: de skill zegt bij het doorgeven van de dev-command dat de server op
  3000 uit `repo` komt.
- Een registerregel in `hdr-register.yml` en twee regels in `docs/index.yml` (dit record en de skill).

Verwant: HDR-032 (Een feature-worktree zet de skill `feature-worktree` op, vanaf `main` en met een eigen install)
Verwant: PDR-020 (Een infomelding als de gebruiker het gesprek begint)
Verwant: HDR-034 (Een beslispunt begint met uitleg, een directe vraag met het antwoord)
