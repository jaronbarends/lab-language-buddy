# ADR-023: Safari/iPhone: safe area en geaccepteerde beperkingen

- **Status:** implemented
- **Date:** 2026-10-01
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

- **Bovenste safe-area-inset.** `--safe-top` (`env(safe-area-inset-top, 0px)`) staat in `globals.css`
  en wordt als padding bovenaan toegepast op het setup-scherm en op het gesprekscherm. De top-padding
  van het setup-scherm is `calc(var(--size-24) + var(--safe-top))`. Het gesprekscherm krijgt
  `padding-top: var(--safe-top)` op `.screen` zelf, niet in de thread, zodat het scrollgebied van de
  thread onder de statusbalk begint en gescrolde tekst er nooit onderdoor loopt. De padding telt mee
  binnen de `100dvh`. De eigen padding van de thread en de auto-scroll blijven ongemoeid. Landscape
  wordt niet ondersteund, dus er zijn geen zij-insets.
- **Landscape-telefoons worden niet ondersteund**, dus de begrensde tekst (40vh) krijgt geen
  minimumhoogte. Besloten als niet de moeite waard om af te handelen, niet open gelaten.
- **Bediening onder het toetsenbord in `editing` is voor nu geaccepteerd**, om in een later stadium
  opnieuw te bekijken. Met het toetsenbord open kunnen Edit, Cancel edit en Send op een iPhone
  afgedekt zijn. Dit versoepelt de oorspronkelijke eis dat Send, Edit en Cancel
  bruikbaar blijven met het toetsenbord open, en spreekt de eerdere regel tegen dat Send bereikbaar
  blijft met het toetsenbord open.

## Waarom

- **Safe area:** `viewport-fit=cover` stond al aan, maar alleen de onderste inset bestond. In de
  home-screen app op een iPhone loopt de pagina daardoor onder de statusbalk (de screenshot van de
  gebruiker laat thread-tekst eronderdoor lopen). De setup-kop, 24px van de bovenrand, zou zeer
  waarschijnlijk onder een notch of Dynamic Island vallen; dat is een inschatting, niet gezien.
- **Landscape:** bij 40vh kan het tekstgebied op een lage viewport tot niets krimpen. De overige
  onderdelen van de composing bar (padding, Send, de Edit/Cancel-rij, tussenruimtes) beslaan
  ongeveer 180–215px, dus onder ongeveer 450–540px viewporthoogte blijft er weinig of geen ruimte
  voor tekst. Geschat vanuit de layout, niet gemeten op een toestel.
- **Toetsenbord:** de gebruiker zag het op een iPhone met een lang concept, als home-screen app en
  in een Safari-tab. Als home-screen app belanden Edit en Cancel edit onder het toetsenbord en is
  Send deels afgedekt door de accessory bar van het toetsenbord; bij heel korte concepten is een
  kleiner deel afgedekt (gemeld, niet gemeten). In een Safari-tab staan de knoppen boven het
  toetsenbord, maar zijn ze afgedekt door de adresbalk van Safari en de accessory bar. De oorzaak is
  de `100dvh`-kolom, die het toetsenbord niet laat krimpen, niet alleen de 40vh-begrenzing van de
  tekst. Het vinkje op de accessory bar sluit het toetsenbord en maakt de knoppen vrij. In de review
  zijn drie opties voorgelegd: een hoogte op basis van `visualViewport` als spike, de knoppen boven
  de editor tijdens het bewerken, of accepteren. De gebruiker koos voor accepteren.

## Gevolgen

- **Getest:** in desktop Chrome is de inset 0 en bewoog er niets. Met een tijdelijke
  `--safe-top: 47px` in de console ging de setup-kop van 24px naar 71px en begon de conversation-thread
  47px lager, met de control bar ongewijzigd. De gebruiker controleerde het op een iPhone met een
  lage statusbalk (geen notch), zonder gemelde problemen. Niet getest op een iPhone met notch of
  Dynamic Island. Onbekend is of dat de home-screen app of een Safari-tab was.
- **Open vraag:** de bediening kan onder het toetsenbord vallen. Onbevestigde ideeën om op terug te
  komen: een hoogte op basis van `visualViewport` (als spike) of de knoppen boven de editor tijdens
  het bewerken.
