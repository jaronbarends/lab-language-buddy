---
titel: "Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?"
status: afgerond
datum: 2026-10-27
kernvraag: Waar beschrijft de repo zichzelf niet goed genoeg voor een agent die niets heeft dan de repo?
doel-records:
  - "HDR-011 (K1, K2)"
---

# JNL-002 — Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?

**Kernvraag.** REQ-GG-10 (Stroomlijn onboarding tot zelfde-dag-productief) vraagt dat een nieuwe
agent of teamgenoot dezelfde dag productief is. Waar beschrijft de repo zichzelf niet goed genoeg
voor iemand die niets heeft dan de repo?

**Hoofdboodschap.** De oriëntatie werkt; de werkwijze heeft twee gaten. Een verse agent zonder
geheugen en zonder hints beantwoordde vier oriëntatievragen uit de geladen `CLAUDE.md`-bestanden
zonder iets te verzinnen, en maakte een correcte kleine wijziging. Hij miste twee dingen die de
repo nergens uitdrukkelijk zegt: van welke branch arc-werk uitgaat, en dat de branch vóór de
eerste edit wordt gemaakt.

**Hoe dit is gemaakt.** Een verse clone in `repo-cold` (geen geheugen, geen lokale settings, push
uitgeschakeld) op `arc/arc-main` bij bd508d5, en een nieuwe Claude Code-sessie. Twee prompts,
geen hints: vier oriëntatievragen waarbij niets hoefde te veranderen, en daarna "de README zegt
welke checks je draait: controleer dat en repareer het". Beoordeeld aan de hand van de working
tree en het transcript van Jarón. Een ronde, dus het meet het eerste uur en niet de dag. Een
voorspelling van mij klopte niet: de README noemde drie checks, niet een; ik had een zoekopdracht
gelezen die `npx`-regels mist.

## Wat de run liet zien

| Onderdeel | Resultaat |
|---|---|
| Wat is dit project | Goed. Correct, uit de geladen `CLAUDE.md`-bestanden; de Next.js-waarschuwing in `AGENTS.md` inbegrepen |
| Hoe besluiten worden vastgelegd | Goed. Twee lagen (`plan.md` voor 2026-10-20, het grootboek erna), eerst de registers |
| Wat te doen vóór een wijziging | **Gedeeltelijk.** Eigen branch, plan, skills: goed. De basisbranch voor arc-werk: ontbreekt |
| Wat je niet alleen doet | Goed, en grondig: hooks, override, triage, leidende documenten, het incidentregister, de volgorde van de checks, en het conflict tussen het Co-Authored-By-verzoek van de sessie en de regel van het project, in het voordeel van het project beslecht |
| Verzonnen antwoorden | Geen. Hij zei welke documenten hij niet had geopend |
| De kleine wijziging | Correct: de drie ontbrekende checks, in de volgorde van `CLAUDE.md`, met de iPhone-test bewust weggelaten en dat ook gezegd |
| Vragen gesteld, correcties gegeven | Geen, geen |
| Branch | **Geen.** Hij bewerkte `README.md` op `arc/arc-main`, ongecommit, en zei pas achteraf dat er een branch nodig is |
| Checks gedraaid | **Nee**, en dat zei hij. `docs:check` heeft geen `npm install` nodig |

De oriëntatie kwam volledig uit de `CLAUDE.md`-bestanden die vanzelf laden: hij opende de README,
`docs/index.yml`, `plan.md` of de registers niet. De gelaagdheid werkt.

## Kwesties

| # | Kwestie | Status |
|---|---|---|
| K1 | De basisbranch voor arc-werk staat niet in de root-`CLAUDE.md` | besloten 2026-10-27, geboekt in HDR-011 |
| K2 | Nergens staat dat de branch vóór de eerste edit komt | besloten 2026-10-27, geboekt in HDR-011 |
| K3 | De checks zijn niet gedraaid, hoewel dat kon | besloten 2026-10-27: niet herhaald in ronde twee |
| K4 | De README linkt naar een privé-artifact dat een nieuwkomer niet kan openen | besloten 2026-10-27: de link blijft |
| K5 | Wat bewijst een run van een uur? | besloten 2026-10-27 |
| K6 | Houdt de regel "geen AI-of-zelf-oordeel" stand? | besloten 2026-10-27: houdt stand in twee runs |

### K1 — De basisbranch voor arc-werk staat niet in de root-`CLAUDE.md`

De root zegt dat branches "merged into `main` through a pull request" worden. Voor arc-werk
gebeurt dat niet: het vertrekt van `arc/arc-main` en gaat daar weer in terug. Dat staat in
`docs/grootboek/CLAUDE.md`, die alleen laadt als je in die map werkt, en in de CI-workflow. Het
antwoord van de verse agent op "wat doe ik vóór een wijziging" volgde de root exact:
`stage/N-name`, een beschrijvende naam of `spike-*`, en nooit committen op `main`. Geen
basisbranch.

**Besloten (Jarón, 2026-10-27):** een zin in de root-regel `Branches`, die `arc/arc-main` noemt
als basis zolang het de integratiebranch is, en `main` als productie. **Geboekt als HDR-011.** De
zin moet veranderen wanneer `arc/arc-main` in `main` wordt gemerged.

### K2 — Nergens staat dat de branch vóór de eerste edit komt

"Een branch per stuk werk" is waar, maar zegt niet wanneer. De agent bewerkte op `arc/arc-main`
en meldde terecht dat hij een branch en een PR nodig heeft. Er is niets gecommit, dus er is geen
regel gebroken; Jarón verwachtte eerst de branch.

**Besloten (Jarón, 2026-10-27):** dezelfde zin zegt dat de branch vóór de eerste edit wordt
gemaakt. **Geen hook ervoor.** Het is één incident en de regel is nog niet eens geschreven; als
het na de regel terugkomt, escaleert het patroon (HDR-010 geeft de redenering). Gelogd als het
patroon `branch-before-edit` in het incidentregister. **Geboekt als HDR-011.**

### K3 — De checks zijn niet gedraaid, hoewel dat kon

De agent noemde de drie scripts correct en controleerde dat ze in `package.json` staan, maar
draaide geen enkele check voordat hij zei "I've fixed it", en zei dat ronduit. `docs:check` heeft
niets nodig dan Node, dus de ontbrekende install was geen excuus. Dit is gedrag, geen ontbrekende
zin: de regel staat in `CLAUDE.md`. **Besloten (2026-10-27):** het kwam niet terug. In ronde twee
draaide de agent alle zes de checks, `build` inbegrepen, plus de dev server, en zei wat hij niet
had gedaan. Geen regelwijziging.

### K4 — De README linkt naar een privé-artifact

De Arc-alinea van de README wijst naar een privé-artifact, gemarkeerd als "for my own reference
only". Een nieuwkomer kan het niet openen. De run testte dit niet: de agent las die alinea nooit.
Of de principes bereikbaar moeten zijn voor een nieuwkomer is aan Jarón. **Besloten (Jarón,
2026-10-27):** de link blijft. In ronde twee zag de agent hem, liet hem met rust en zei dat een
nieuwkomer hem niet kan openen.

### K5 — Wat bewijst een run van een uur?

Het bewijst dat de kennis er is en in de juiste lagen zit. Het bewijst niet "dezelfde dag", en
een run is een datapunt. **Besloten (2026-10-27):** het eerste uur is de maat, een run telt als
productief met hoogstens twee correcties die de repo al beantwoordt (de incidentdrempel is
drie), en REQ-GG-10 telt als bijna gehaald tot een tweede ronde na de fixes beter uitpakt. Dat
gebeurde op 2026-10-27, zie ronde twee hieronder.

### K6 — Houdt de regel "geen AI-of-zelf-oordeel" stand?

Zwak bewijs dat het zo is. De globale instructies van Jarón zeggen een eenregelige aanbeveling
"let AI generate this / write it yourself" te geven vóór elke nieuwe taak, en de tweede prompt
was een nieuwe taak. De agent had die instructies gelezen (hij citeerde de Co-Authored-By-regel
ervan tegen het verzoek van de sessie) en gaf geen oordeel. **Besloten (2026-10-27):** het hield
opnieuw stand in ronde twee, bij een andere taak, dus het houdt stand in twee runs. Een eerdere
versie van dit journaal zei ten onrechte dat er in ronde één geen aanleiding was geweest.

## Ronde twee

Een nieuwe clone (`repo-cold-2`) bij ad88f62, nadat HDR-011 was gemerged: geen geheugen, geen
lokale settings, push uitgeschakeld, dezelfde vier oriëntatievragen en een nieuwe taak ("walk the
README as a newcomer, run what can be run, fix what does not match"). Beoordeeld aan de hand van
de working tree, de reflog en het eigen rapport van de agent; zijn beweringen over de repo zijn
tegen de repo gecontroleerd.

| Onderdeel | Resultaat |
|---|---|
| Basisbranch (K1) | Genoemd: "grootboekwerk (`arc/*`) vertrekt vanuit `arc/arc-main` en gaat via een PR terug. `main` is productie" |
| Branch vóór de eerste edit (K2) | Genoemd in het oriëntatieantwoord en gedaan: de branch is gemaakt om 15:23:51 en de README is voor het laatst gewijzigd om 15:24:06 |
| Checks gedraaid (K3) | Alle zes, `build` inbegrepen, plus de dev server met de mocks; zei wat hij niet had gedaan (een browser, een iPhone, echte API-keys) |
| Privé-link (K4) | Opgemerkt, met rust gelaten, gemeld |
| AI-of-zelf-oordeel (K6) | Niet gegeven |
| Vragen gesteld, correcties gegeven, toestemming gevraagd voor `npm install` of `build` | Geen, geen, geen |
| Verzonnen beweringen | Geen gevonden; de README-beweringen zijn gecontroleerd tegen `src/lib/tts/`, de `engines` van Next, `findings.md` en de getrackte bestanden |
| De wijziging | Correct: de TTS-rij, de checks, de indeling, de alinea over findings, de Node-versie, een verwijzing naar `CLAUDE.md` en `docs/index.yml`. De laatste twee zijn eerder toevoegingen dan correcties |

Een automatische veiligheidscheck weigerde de eerste poging van de agent om de dev server te
stoppen (`taskkill` op elk node-proces); daarna stopte hij alleen zijn eigen server. `npm install`
meldde vier kwetsbaarheden (een kritieke, drie hoge); de agent zocht dat niet uit en het viel ook
niet onder de scope van dit journaal. Volgens de regel uit K5 is het criterium voor REQ-GG-10
gehaald. Wat dat bewijst is beperkt: twee runs van hetzelfde soort agent, met de globale
instructies van Jarón geladen, op het eerste uur, bij een taak die de agent naar een document
wijst dat naar al het andere wijst. Een menselijke nieuwkomer, een ander model en "dezelfde dag"
zijn niet getest.

De README-wijzigingen van ronde twee zijn overgenomen uit de diff van de clone op
`arc/cold-start-round-2`.

## Besluitenlog

- **2026-10-27 — K1 en K2 besloten en geboekt als HDR-011.** Een zin in de root-regel
  `Branches`. Het incident `branch-before-edit` is gelogd. K5 besloten: een maat van het eerste
  uur.
- **2026-10-27 — Ronde twee, en K3, K4 en K6 besloten.** K3 kwam niet terug, de link in de README
  blijft (Jarón), en de AI-of-zelf-regel hield een tweede keer stand. Elke kwestie is besloten en
  HDR-011 bestaat en wijst terug, dus het journaal is `afgerond`. REQ-GG-10 voldoet aan het
  criterium van K5, met de beperkingen hierboven.
