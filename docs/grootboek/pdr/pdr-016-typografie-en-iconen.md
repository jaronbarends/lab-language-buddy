# PDR-016: Typografie en iconen

- **Status:** implemented
- **Date:** 2026-09-28
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

### Typografie

- De basislettergrootte is 18px.
- De labels van de pickers en de level select zijn semibold (`--font-weight-label`); de open optielijst blijft regular.

### Iconen

- De iconen zijn Font Awesome 6 Free via `react-icons/fa6`, in plaats van de met de hand getekende SVG's.
- De foutbox krijgt `FaTriangleExclamation` (`WarningIcon`) links van het hele tekstblok, bovenaan uitgelijnd, 12px van de tekst. De 8px tussenruimte tussen de regels is weg.

## Waarom

### Typografie

- 18px haalt ook de ondergrens van 16px weg. Die bestond om de focus-zoom van iOS te voorkomen; we zitten daar nu ruim boven, dus die bewakingen zijn weg.
- De labels en de select waren als fout gemeld. Oorzaak: Baloo was in de originele app alleen beschikbaar op 600 en 700, dus het overgeërfde 400 werd als 600 getoond, terwijl next/font een echte 400 geeft. De select volgt de `SelectBox` van het origineel: semibold als hij dicht is, regular in de lijst. De `:checked`-kleuring van die lijst is weggelaten: de vraag ging over gewichten, en het zou een tweede keer wit op `--color-bg-secondary` zijn.

### Iconen

- De oorspronkelijke iconen bevielen niet. Jaron noemde de iconen bij hun `Fa…`-namen; de agent leidde daar `react-icons` uit af, omdat `@fortawesome` namen als `faCircleInfo` gebruikt, en controleerde dat alle 14 namen in `fa6` bestaan. Op het moment van het besluit werden acht gebruikt en hadden zes nog geen plek. De mapping en de attributie (CC BY 4.0) staan in `ui/icons.tsx`.
- Het foutico beantwoordt een open vraag, nadat de foutbox in het dev-paneel bekeken was. Het staat naast titel, bericht en detail samen, niet alleen naast de titel. Het is 24px met `align-items: start`, dus het zit bovenaan het blok. De regels hebben geen eigen tussenruimte meer en staan op de regelhoogte van de tekst: 27px voor de titel, 21px voor de andere. Met een heel lang bericht gecontroleerd: het breekt af, het icoon houdt zijn grootte en de box blijft binnen zijn container.

## Voorgeschiedenis

Het foutico was eerst verticaal gecentreerd gebouwd, met 8px tot de tekst; na het bekijken is het bovenaan uitgelijnd en 12px geworden.

## Herkomst

- L21 (09-28) Base font size 18px
- L43 (09-30) Icons are Font Awesome 6 Free via `react-icons/fa6`, replacing the hand-drawn SVGs
- L50 (09-30) The error box gets `FaTriangleExclamation` (`WarningIcon`) to the left of the whole text block
- L56 (09-30) Picker labels and the level select are semibold (`--font-weight-label`), the open option list regular
