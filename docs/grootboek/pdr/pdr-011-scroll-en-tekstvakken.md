# PDR-011: Scroll en tekstvakken

- **Status:** implemented
- **Date:** 2026-09-24
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

**De thread.** De thread scrolt automatisch naar de nieuwste inhoud. Is een nieuwe bubbel te
hoog om in beeld te passen, dan komt de **bovenkant** van die bubbel bovenaan te staan. De thread
scrolt ook opnieuw wanneer de evaluatie van de laatste gebruikersbeurt zich zet.

**De tekst in de bediening.** De tekst van het live transcript, de conceptbubbel en de editor
krijgt `max-height: 40vh` en scrolt binnen de bubbel. De control bar zelf heeft geen begrenzing.
Alle drie delen dezelfde begrenzing, omdat ze van plaats wisselen zonder dat de tekst mag
springen. Het is `vh` en bewust niet `dvh`: de begrenzing volgt het toetsenbord en de inklappende
URL-balk niet. De tekst is één `BubbleText`-span in `bubble.tsx`, door CSS blok gemaakt.

- Tijdens `listening` volgt het live transcript de nieuwste woorden, zolang de gebruiker niet van
  de onderkant is weggescrold. Terugscrollen naar de onderkant hervat het volgen. "Onderaan" is
  binnen 4px van de rand, omdat scrollposities op schermen met hoge dichtheid fractioneel zijn;
  die 4px is de invulling van de agent bij het besluit. De vlag verandert alleen bij scroll-events en het scrollen
  gebeurt in een layout effect dat op de woorden van het transcript hangt, dus een re-render
  zonder nieuwe woorden scrolt niet.
- De conceptbubbel en de editor beginnen naar het einde van hun tekst gescrold, in een layout
  effect bij het mounten, en volgen daarna niets meer.

**Het `.bubble`-frame.** `.bubble` heeft `flex-shrink: 0`, naast `overflow: hidden`.

## Waarom

- **Bovenkant uitlijnen.** Naar de onderkant scrollen zette de gebruiker op de laatste regel, terwijl
  de markering buiten beeld begon, en niets opnieuw scrolde tijdens het
  afspelen. Gekozen boven de markering volgen tijdens het afspelen; dat blijft mogelijk.
- **Opnieuw scrollen bij de evaluatie.** De bubbel van de gebruiker groeit dan, wat het nieuwste
  item uit beeld kan duwen zonder nieuwe beurt of beurtstatus.
- **Begrenzing op de tekst.** Bij review bleek dat een lang transcript, concept of lange bewerking
  de bar liet groeien tot de knoppen en de thread van het scherm werden gedrukt. De begrenzing
  zelf was een voorstel van de agent, eerst op de hele control bar; Jaron veranderde dat naar een
  begrenzing op alleen de tekst en koos de 40vh. De begrenzing zit op de tekst en niet op de bar,
  zodat het frame (padding, hoek, focusring) nooit binnen het scrollende gebied valt en de knoppen
  in beeld blijven; de bar groeit met de begrensde tekst plus de knoppen.
- **Volgen van het live transcript.** Voorgesteld bij review en door Jaron goedgekeurd. Met de
  begrensde tekst vallen de nieuwste woorden anders onder de rand.
- **Einde van de tekst bij het concept en de editor.** Voorgesteld bij review en door Jaron
  goedgekeurd. Het concept vervangt een live transcript waarvan de gebruiker het einde las en mag
  niet springen als de opname stopt; de editor zet de caret aan het einde, en bij een lang concept
  ligt dat onder de rand van de begrensde tekst. Beide zijn in een layout effect gezet, zodat
  geen van beide één frame bovenaan te zien is.
- **`flex-shrink: 0`.** De automatische minimumgrootte van een flex-item is alleen zijn inhoud
  zolang het niet klipt; met `overflow: hidden` is die 0. In de thread (een flex-kolom die scrolt)
  werden de bubbels daardoor samengedrukt en hun tekst geklipt zodra de thread langer was dan het
  scherm, in plaats van dat de thread scrolde. Gezien op een iPhone en in de DevTools-preview.
  Jaron vroeg eerst om `min-height: min-content` en gaf daarna de voorkeur aan `flex-shrink: 0`
  als schonere manier om het te zeggen.

## Gevolgen

- Gemeten in desktop Chrome bij een viewport van 911px, met een lang concept programmatisch
  ingevoegd: tekst 364px, bar 575px, thread 336px. Niet getest op een iPhone.
- Het volgen is alleen logica en niet beproefd: de tekst van de dev stepper groeit nooit, dus
  volgen, stoppen en hervatten zijn niet werkend gezien. Niet getest op een iPhone.
- Caret tijdens het typen in een lange editor is met echt typen door Jaron in desktop Chrome
  getest en werkt. Het scrollen bij binnenkomst is niet met een lang concept gezien, omdat het
  concept van de dev stepper één regel is. Niet getest op een iPhone.
- `flex-shrink: 0` is gecontroleerd in Chrome bij 377px met de echte bubbels gekopieerd tot de
  thread overliep: 0 van 10 geklipt mét, 10 van 10 zonder; op de iPhone verholpen, volgens
  Jaron.
- Verwant: PDR-003 (Eén set bediening zonder Stop, het live transcript in de control bar) plaatst het live transcript in de control bar.
