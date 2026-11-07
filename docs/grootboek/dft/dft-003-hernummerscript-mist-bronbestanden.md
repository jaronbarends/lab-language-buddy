# DFT-003: Het hernummerscript laat record-ids in broncommentaar ongewijzigd, terwijl HDR-005 zegt van wel

- **Status:** in_progress
- **Date:** 2026-10-27
- **Trigger:** gevonden door de animatiesessie nadat `arc/arc-main` in `arc/bubble-animation`
  was gemerged (de eerste keer dat `npm run docs:renumber` draaide op een branch die `src/`
  aanraakt): drie comments in `src/` zeiden nog JNL-002, dat inmiddels het journaal over de
  koude start was en niet meer het journaal over de bubbel.

## SOLL vs IST

**SOLL:** HDR-005, stap 3: een hernummering herschrijft de bestandsnaam, de registerregels,
`docs/index.yml` "and every reference in prose (other records, the balance, **code comments**)".
HDR-007 maakte die stap mechanisch en beschrijft het script als dekkend voor de registers,
`docs/index.yml`, het record en de journalen die het noemen.

**IST:** `scripts/renumber-records.mjs` herschreef alleen bestanden die eindigen op `.md`,
`.yml`, `.yaml` of `.json`. Een verwijzing in een comment in een `.ts` of `.tsx` werd nooit
bekeken. Op 2026-10-27 liet dat drie comments achter die naar het verkeerde journaal wezen, in
`ai-bubble.tsx` (twee) en `conversation-thread.tsx` (één). Er veranderde geen gedrag; een
lezer die de verwijzing volgde, kwam in het verkeerde document terecht.

**Gewicht:** middel. De verwijzing is stilzwijgend fout, niets faalt, en alleen iemand die de
code leest ziet het. Het werd bij toeval gevonden, door de sessie die die bestanden beheert.

## Patroon

Nog geen; dit is de eerste hernummering op een branch die `src/` aanraakt, en dus de eerste
keer dat het gat kon opvallen. Het is geen incident van het soort dat het incidentregister telt
(een herhaling); het is een defect in een tool, gevonden bij het eerste gebruik.

## Besluiten

1. **Het script herschrijft nu ook `.css` en elke extensie van JavaScript- of
   TypeScript-bestanden** (`js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, `cts`), op de regels
   die de branch heeft toegevoegd, net als bij de documenten. Gedaan op
   `arc/renumber-source-files`. Gedekt door twee tests: een comment die de branch heeft
   toegevoegd wordt herschreven, en een regel in een bronbestand die de branch niet heeft
   toegevoegd blijft ongemoeid.
2. **Herhaald op het echte geval** op een wegwerp-checkout van `arc/bubble-animation` van vóór
   zijn hernummering: het script veranderde acht bestanden in plaats van zes, en de drie
   comments luidden JNL-003.
3. **De drie comments die al fout zijn** op `arc/bubble-animation` kan het script nu niet meer
   herstellen (de botsing is opgelost), dus de animatiesessie verbetert ze met de hand via een
   builder (`regime: trivial`, alleen comments). **Deze DFT blijft `in_progress` tot dat
   is gelukt.**
4. HDR-005 en HDR-007 worden niet aangepast: beide zijn geïmplementeerd. Dit record is de
   correctie.

## Gevolgen

- **Grenzen.** Een verwijzing in een bestandstype buiten de lijst (een `.html`, een `.svg`, een
  binary) wordt nog steeds niet herschreven. Voor een broncomment die een record met id citeert
  is er nog steeds geen controle of dat id bestaat, en zo'n controle had dit geval niet kunnen
  vangen: JNL-002 bestaat, het is alleen het andere journaal.
- De aanname die de vervanging veilig maakt, geldt nog steeds en omvat nu ook bronbestanden:
  vóór de merge betekent een botsend id op een regel die de branch heeft toegevoegd het eigen
  record van de branch.
- Geen incident in het register. Een tooldefect dat bij het eerste gebruik wordt gevonden is een
  reparatie, geen patroon; als hetzelfde soort gat opnieuw opduikt, is het een kandidaat voor
  een patroon.
