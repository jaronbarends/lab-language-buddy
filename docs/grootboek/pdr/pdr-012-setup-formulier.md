# PDR-012: Setup-formulier

- **Status:** implemented
- **Date:** 2026-09-30
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

**Structuur.** Het setup-scherm is één `<form>`. Elk veld is een `fieldset` met een `legend` die
het scherm zelf bezit; de bediening (taalkiezer, niveau-select, starter-toggle) rendert geen eigen
bijschrift. Enter verstuurt het formulier. Dit vervangt de wrappers per veld en de
bijschriftklassen van de agent.

**Niveau-select.** De select krijgt `aria-labelledby` dat naar zijn legend wijst. Een legend
benoemt de fieldset, niet de bediening erin, dus de select had geen eigen toegankelijke naam.
Een `label` voor dit ene veld is verworpen: de legendstijl op elementniveau zou een `label` niet
bereiken.

**Pijl van de select.** De pijl is een `mask` gevuld met `currentcolor`. Dat vervangt een
achtergrondafbeelding met een vaste streekkleur.

**Starter-toggle.** Native radio's met een schuivende indicator (CSS anchor positioning) en een
hoverstatus op de niet-geselecteerde optie. De indicator is feature-getest: zonder
anchor positioning schildert de geselecteerde optie zichzelf.

**"Start chat".** De knop is half zo breed als het formulier, onder 30rem vier vijfde, gecentreerd.
Eén variabele `--flex-basis` bepaalt de breedte en het breakpoint verandert die. Het breakpoint is
`(width < 30rem)`, het complement van de eigen `min-width: 30rem` van de taalkiezer. Het origineel
schrijft `29.99rem`; hier staat de moderne vorm. Voor het centreren is `center` gekozen in plaats
van de `space-around` van het origineel: met één item is dat identiek en `center` zegt wat er
bedoeld wordt.

## Waarom

- **Formulier en fieldsets.** De drie velden gebruikten drie mechanismen (een fieldset, een label,
  een kale span), en alleen de taalkiezer bezat zijn eigen legend. Eén vorm voor alle drie, met de
  legend bij het scherm, maakt dat gelijk en laat Enter verzenden.
- **`aria-labelledby`.** Zie hierboven: de legend benoemt de fieldset, niet de select.
- **Starter-toggle.** Het was de laatste bediening met `role="radio"`, een overblijfsel van vóór
  de wijziging van de taalkiezer.
  De hoverstatus is een kleine toevoeging die met de component meekwam en niet apart gevraagd was.
- **Terugval.** Safari 26 levert anchor positioning maar gedeeltelijk. Zonder terugval toont een
  browser die het mist witte labeltekst op een witte achtergrond. Geverifieerd aan de hand van de
  regelstructuur, niet op zo'n browser.
- **Mask.** De pijl volgt zo de tekstkleur in plaats van een hex te herhalen. De vaste kleur
  sprak ook een eerdere bewering tegen dat er buiten de tokens geen hex meer stond; de controle
  had die regel overgeslagen.
- **Breedte van de knop.** De knop was volledig breed: de port liet de `.actions`-regel van het
  origineel weg. Gemeten in iframes van 320 tot 700px; de omslag valt precies tussen 479 en 480px.
