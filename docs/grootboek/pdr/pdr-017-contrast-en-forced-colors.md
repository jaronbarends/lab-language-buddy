# PDR-017: Contrast en forced-colors: bewust geaccepteerd

- **Status:** implemented
- **Date:** 2026-09-28
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Twee tekstparen vallen onder de 4,5:1 die WCAG stelt voor tekst kleiner dan 24px, of kleiner dan
18,66px bold. "Grote tekst" is 24px, of 18,66px *bold* (700), dus semibold telt niet mee. Beide
paren zijn bewust geaccepteerd:

- **Wit op `--color-bg-primary`: 4,05:1**, de primaire knop op 18px bold. Het is de merkkleur, en
  de 20px "Start chat" haalt de 3:1 die voor grote tekst geldt. Geaccepteerd op 2026-09-28.
- **Wit op `--color-bg-secondary`: 3,16:1**, de geselecteerde AI/Me-optie op 18px semibold. Dit
  paar is op 2026-09-30 gevonden en dezelfde dag bewust geaccepteerd. Het is het eigen tokenpaar
  van de bestaande app, en anders dan bij de knop is er geen grote-tekstuitzondering om op te
  leunen. Het paar blijft zoals het is, op dezelfde manier als de 4,05:1 van de primaire knop.
  Het besluit is genomen met de alternatieven voor zich, die eerst gemeten waren: een donkerdere
  vulling (4,37:1 bij blue-600, 6,15:1 bij blue-700), donkere tekst op het huidige blauw (5,33:1),
  of 18,66px bold, waarmee de 3:1-drempel van toepassing wordt en het paar die nipt haalt.

Ook het contrast van de randen van bedieningselementen is bewust geaccepteerd (besluit van
2026-10-02). De rand van de taalkaarten, de niveau-select en de starter-toggle is
`--color-border-input` (`--color-gray-100`) op wit, ongeveer 1,48:1 (ongeveer 1,36:1 tegen de
paginakleur `--color-gray-50`). WCAG 1.4.11 vraagt 3:1 voor de begrenzing van een bedieningselement.
De waarden komen uit het ontwerpsysteem van de bestaande Language Buddy (besluit van 09-28), net
als de 4,05:1 en 3,16:1 van de tekstparen. De geselecteerde toestanden halen de drempel wel: de
roze rand met 4,05:1 en de blauwe pill met 3,16:1. De randcontrasten zijn berekend uit de
oklch-tokenwaarden met de standaard sRGB-conversie, niet op een scherm gemeten.

In forced-colors-modus zijn de geselecteerde AI/Me-optie en de geselecteerde taalkaart
`Highlight`/`HighlightText`. De modus verving de blauwe vulling, tint en rand door Canvas en
CanvasText, waardoor een geselecteerde optie er hetzelfde uitzag als de andere zodra de focus de
groep verliet. Systeemkleuren worden niet vervangen, dus beide gebruiken ze. Bij de AI/Me-toggle is
de schuivende pill ook `Highlight`; de optie kleurt zichzelf alleen in de baseline zonder anchor
positioning. `forced-color-adjust: none` op de twee geselecteerde elementen haalt de Canvas-backplate
weg die de browser achter tekst schildert.

## Voorgeschiedenis

Een eerdere versie van dit besluit (toen nog een open vraag) beweerde dat alle andere paren slaagden. Dat was beweerd en
niet gemeten; het blauwe paar was nooit berekend. De vondst van de 3,16:1 was een correctie op die
ongemeten bewering, geen ontwerpwijziging. Sindsdien zijn gemeten en geslaagd: de geselecteerde
taalkaart (8,00:1), de secundaire knop (7,75:1), bodytekst op de gebruikersbubbel (12,27:1),
fouten (5,33:1) en de bijschriften (6,22:1).

De eerste versie van de forced-colors-regel was fout, te zien in een screenshot van Jarón: de
vulling klopte, maar het label stond in een wit vak, witte tekst op wit. De browser schildert een
Canvas-backplate achter tekst in forced-colors-modus; `forced-color-adjust: none` haalt die weg.
Daarna controleerde Jarón het opnieuw in forced-colors-modus: witte tekst op de donkerpaarse
vulling, bij beide bedieningselementen. De modus is vanuit de tooling niet te openen, dus die
controle was van hem.

Verwant: ADR-022 (Design system overgenomen uit de bestaande app)
