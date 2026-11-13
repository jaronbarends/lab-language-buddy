# HDR-026: Een pull request die code in een werkgebied raakt, sluit met een reconciliatie

- **Status:** implemented
- **Date:** 2026-11-09
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Reconcilieer terwijl de maker nog weet wat er veranderde en waarom. Een reconciliatie is een
vergelijking van document en code, en die gaat het beste door wie net heeft gebouwd. Hoe langer je
wacht, hoe meer je opnieuw moet uitzoeken wat een commit bedoelde.

## Wat een reconciliatie is

- **Vergelijken.** Je neemt de beweringen in het leidende document (SOLL) en toetst ze aan de code
  zoals die nu is (IST). De diff van de pull request wijst aan welke beweringen geraakt kunnen
  zijn, maar de toets is bewering tegen code, met bestand en regel als bewijs (DFT-004, DFT-005).
- **Het verschil heeft geen vaste richting.** Een reconciliatie stelt vast dat document en code
  verschillen. Wat je ermee doet, staat per bevinding in de Besluiten van de DFT: het document
  aanpassen aan bedoelde code (DFT-004), of de code aanpassen (of het record vervangen) wanneer het
  document is wat bedoeld was. Jarón beslist; de agent signaleert.
- **Code aanpassen is een nieuwe commit in het werkgebied.** `getoetst-tegen` moet dan de commit
  zijn waarvan de uiteindelijke code is vergeleken. Een aangepast leidend document volgt de
  communicatieplicht.
- **De DFT legt vast:** welke documenten je controleerde (`documenten`), tegen welke commit
  (`getoetst-tegen`), de bevindingen of "geen verschil" met bewijs, en het besluit per bevinding.
- **"Het signaal wordt stil"** betekent: `docs:check` telt per leidend document de commits in zijn
  werkgebied sinds het nulpunt (de `getoetst-tegen`-commit van de nieuwste afgesloten DFT die het
  document noemt). Zijn dat er nul, dan is er geen drift-waarschuwing meer. Het document aanraken
  of een DFT die nog open staat, verandert dat niet (HDR-022).

## Besluit

HDR-022 liet open hoe vaak er wordt gereconcilieerd. Dit record kiest: **per pull request**.

- **Een pull request die code wijzigt in het werkgebied van een leidend document, bevat een
  reconciliatie van dat document**, geboekt als DFT met `documenten` en `getoetst-tegen` en met
  status `resolved`, in dezelfde pull request. De trigger is het driftsignaal zelf: meldt
  `docs:drift` na de codecommits een document, dan hoort de DFT erbij.
- **Een pull request die geen werkgebied raakt, krijgt geen DFT.** Het signaal is dan stil.
- **Ook een wijziging die alleen commentaar raakt, krijgt een DFT.** Alleen een afgesloten DFT zet
  het signaal stil (HDR-022); een aanraking of een oordeel dat het "maar commentaar" was, doet dat
  niet. DFT-005 deed dit al: kort, met bewijs, bevinding "geen verschil".
- **`getoetst-tegen` is de commit waarvan de code is vergeleken**, zoals voorheen: de laatste
  commit van de pull request die code in het werkgebied wijzigt. De commit die de DFT zelf boekt,
  raakt alleen `docs/` en valt buiten elk werkgebied.
- **Een achterstand wordt meegenomen.** Is een eerdere pull request zonder DFT gemerged, dan staat
  het signaal nog aan en meet het vanaf het laatste nulpunt (HDR-022). De eerstvolgende
  reconciliatie dekt die commits dan mee, zoals DFT-004 deed.

**Werkregel** (in `docs/grootboek/CLAUDE.md`, door Jarón gecontroleerd): sluit een pull request die
code in een werkgebied raakt af met een reconciliatie als DFT, in dezelfde pull request.

## Waarom

**De keuze van Jarón (2026-11-09):** per pull request, "omdat ik dan goed weet wat ik gedaan heb".
Dat is het argument: de reconciliatie is het moment waarop de bouwer zijn eigen wijziging naast het
document legt, en dat werkt het best zolang de wijziging vers is.

Wat de twee bestaande reconciliaties zeggen, is dun bewijs, en dit record doet niet alsof het
anders is. DFT-004 dekte een achterstand van 16 commits uit meerdere pull requests. DFT-005 dekte
één pull request, twee commits, alleen commentaar. Geen van beide liet zien dat uitstel drift
verborg: de bevindingen van DFT-004 kwamen uit "nooit gereconcilieerd" en uit een record dat de
balans niet meenam (HDR-003). De keuze rust dus op de reden van Jarón, niet op een meting.

**Afgewogen:**
- **Niets vastleggen.** HDR-022 houdt zijn eigen trigger (de waarschuwing die wallpaper wordt). Het
  ritme blijft dan impliciet, en een impliciet ritme is wat bij de bubbelmerge misging (HDR-022,
  Waarom).
- **Per stage of bij een drempel.** Goedkoper in vaste kosten, maar elke reconciliatie wordt zo
  groot als DFT-004 en de bouwer weet minder meer waarom een commit gebeurde. Dat is het
  tegenovergestelde van wat Jarón wil.
- **Per pull request, maar alleen bij gedragswijziging.** Voorkomt records zoals DFT-005, maar
  vraagt een oordeel "dit is alleen commentaar" dat `docs:drift` niet kan toetsen. Een oordeel dat
  het signaal stilzet zonder DFT is de stille bewerking die HDR-022 wil voorkomen.
- **Per week.** Past niet bij een project zonder vast werkritme.

## Gevolgen

- **Meer records en meer vaste kosten.** Elke reconciliatie betaalt het document lezen, het record
  schrijven, register en `index.yml` bijwerken en de checks draaien, ook bij een wijziging van een
  paar commentaren. De kosten waren bij het besluit niet gemeten; een tijdelijke meting tot en met
  DFT-010 haalt dat in (zie hieronder). Dit record accepteert de kosten voor kleine, scherpe
  reviews in plaats van één grote.
- **HDR-022 is aangepast:** zijn Gevolgen zeggen niet meer dat het ritme niet vastligt, maar
  verwijzen hiernaar.
- **HDR-023 vuurt hier zelden.** Een DFT die in dezelfde pull request wordt geopend en afgesloten,
  wordt nooit veertien dagen oud. HDR-023 blijft dekken wat wel blijft liggen.
- **Heroverwegen na de vijfde DFT onder dit record.** Na de vijfde DFT die onder HDR-026 wordt
  geboekt weegt Jarón de regel opnieuw, wat die DFT's ook vonden. DFT-010 is het markeerpunt: de
  laatste DFT was bij dit besluit DFT-005, dus de vijf onder dit record zijn DFT-006 tot en met
  DFT-010. Blijken ze vooral "geen verschil" te zijn en voelt het als administratie, dan is de
  variant "alleen bij gedragswijziging" het volgende te wegen. Een drempel die alleen bij
  "knelt" vuurt, vuurt niet als niemand het meldt; vandaar het vaste getal.
- **Tijdelijke kostenmeting tot en met DFT-010.** Bij die heroverweging horen de gemeten kosten
  van een reconciliatie. `docs/grootboek/CLAUDE.md` bevat daarvoor een tijdelijk blok naast de
  werkregel: Jarón noteert `/usage` voor en na, en de agent zet het resultaat als één regel
  (`Kosten: <x>% sessielimiet, <y> min van Jarón`) in de DFT. Na DFT-010 vervalt het blok. De
  meting staat bewust niet in de DFT-schrijfgids van de grootboek-skill: één plek is genoeg.
- **`docs/grootboek/CLAUDE.md` is een leidend document.** De werkregel daarin, en het tijdelijke
  meetblok ernaast, zijn aan Jarón getoond en gecontroleerd (communicatieplicht).

Verwant: HDR-030 (Een hook houdt een pull request zonder reconciliatie tegen), de afdwinging van dit besluit
Verwant: HDR-022 (Het driftsignaal meet vanaf de laatste reconciliatie, niet vanaf de laatste aanraking)
Verwant: HDR-023 (Een driftrapport dat langer dan veertien dagen open staat, meldt zich)
Verwant: DFT-004 (Eerste reconciliatie op een echt signaal — `src/components/CLAUDE.md` beschrijft een context die nooit heeft bestaan, de balans mist de CI)
Verwant: DFT-005 (Reconciliatie na ADR-031 — geen drift)
