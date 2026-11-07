# PDR-008: Knoppen

- **Status:** implemented
- **Date:** 2026-09-24
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

- De knop heeft twee varianten, `primary` en `secondary`, elk met een eigen uitgeschakelde
  stijl. De grijze vulling is de uitgeschakelde stand van `primary`, geen aparte variant.
- Reply is een primaire knop, dus roze zodra je erop kunt tikken.
- De horizontale padding van een knop is 16px (`padding: var(--size-16)`), eerder 32px.

## Waarom

- **Twee varianten.** Een agent had de grijze vulling verkeerd gelezen en twee extra varianten
  verzonnen, en het label gedimd met `opacity`. Dat is gecorrigeerd.
- **Reply primair.** Het wijkt bewust af van de referentie, waar Reply in elke stand grijs is.
  Bevestigd als bedoeld.
- **Padding 16px.** Op een iPhone paste "Cancel edit" niet in zijn halve-breedteknop: het label
  brak over twee regels en omdat de twee knoppen in een rij altijd even hoog zijn, groeiden
  beide van 62,5px naar 85px. Hetzelfde gebeurde bij Edit, en bij Try again en End session in
  de foutrij. Dit is gereproduceerd voor er iets veranderde, door de app in iframes met
  iPhone-breedtes te laden: 85px bij 320, 375 en 390px, alleen bij 430px 62,5px. Na de wijziging
  is het 62,5px bij 360, 375, 390 en 430px. De ruimte die in "Cancel edit" overblijft is 14,3px
  bij 375px, 6,8px bij 360px en 21,8px bij 390px.

## Gevolgen

- De breedte van de knoppen komt uit de layout, niet uit hun inhoud, dus het tikvlak is
  hetzelfde gebleven.
- Bij 320px breekt het label van "Cancel edit" nog steeds over twee regels: het ontbreekt 2,2px.
  Dit is niet opgelost.
