# ADR-017: De bubbel en het bewerkvak

- **Status:** implemented
- **Date:** 2026-09-30
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Eén gedeelde `Bubble`.** Een component houdt het frame van elke spraakbubbel vast; elk blad
houdt zijn eigen stijlen. `Bubble` heeft een auteur, een className en doorgegeven attributen, en
bepaalt grootte, padding, rand, kleur, regelhoogte en gewicht. Hij is altijd een `div` met altijd
`overflow: hidden`. De tekst erin kan een `<p>` zijn; `TurnBubble` gebruikt dat. De denkpunten, de
stip van het live transcript, de markering en het schermlezerlabel met de spreker staan in
modules naast hun eigen componenten.

**Het bewerkvak is een ongecontroleerde `contenteditable="plaintext-only"` div binnen een
`Bubble`**, in plaats van de bordered textarea over de volle breedte. De bubbel groeit met de
tekst tot het maximum van 85%, breekt dan af en groeit omlaag. De tekst wordt één keer
ingeschreven, vóór de eerste paint, en bij input teruggelezen; hij wordt nooit uit state
gerenderd. `role`, `aria-multiline` en `aria-label`, die een textarea zelf meegeeft, zijn met de
hand gezet. `spellCheck`, `autoCorrect` en `autoCapitalize` staan uit.

**Een bubbel met een bewerkbaar gebied wordt wit**, met de focusring op de bubbel. De voorwaarde
is `:has([contenteditable])`, niet focus.

**Bubbels gebruiken `white-space: pre-line`.** Het bewerkvak zelf blijft `pre-wrap`.

## Waarom

- **Gedeelde `Bubble`.** Er waren twee componenten met identieke styling, alleen door een
  commentaar op één lijn gehouden. Nu kunnen het live transcript en het concept niet uit elkaar
  lopen. De denkbubbel behield zijn 68×44px doordat de oude 4px extra padding op de wrapper van
  zijn punten kwam. Gemeten voor en na: luister-, concept- en denkbubbel hebben identieke
  afmetingen.
- **`overflow: hidden` altijd.** De bubbel is alleen de wrapper. `overflow: hidden` is het
  gewenste effect, of er nu iets overloopt of niet, dus het hangt niet aan een aanwezige bijlage.
  Voorgesteld was het te beperken tot bubbels met een bijlage, en de `div` alleen voor de
  gebruikersbubbel met een bijlage.
- **`contenteditable`.** Het oude bewerkvak sprong bij Edit naar 648px breed. Nu geeft Edit een
  bubbel precies zo groot als het concept dat hij vervangt (550,8×73px in de test). Het is één
  gewoon blok waarvan breedte en regelhoogte uit de bubbel komen zoals bij elke andere bubbel,
  zonder kopie om gelijk te houden.
- **Ongecontroleerd.** Uit state renderen zou de caret naar het begin gooien. Dat is veilig omdat
  het bewerkvak alleen bestaat in de editing-state.
- **Spellingscontrole uit.** De tekst is in de oefentaal, niet die van het toetsenbord, dus
  iOS-correcties en rode onderstrepingen werken de gebruiker tegen. Nog niet op een device
  gecontroleerd. De iPhone-controle van het bewerkvak noemt autocorrect als gedekt risico; de rij
  over het uitzetten van de drie attributen zegt dat dat nog niet op een device is gecontroleerd.
- **Wit met `:has([contenteditable])`.** Het wit-bij-bewerken is een idee van Jaron. De
  voorwaarde in plaats van focus is een verfijning van de agent, door hem aanvaard: het bewerkvak
  bestaat alleen in de editing-state, terwijl een klik elders de focus laat vallen terwijl je nog
  bewerkt. Getest: na wegklikken is het bewerkvak zonder focus, blijft de bubbel wit zonder ring,
  staat "Cancel edit" er nog en is Edit nog uitgeschakeld. De ring vraagt echte vensterfocus; met
  alleen programmatische focus in een geautomatiseerd tabblad matcht `:focus-visible` niet, wat
  op een bug leek en dat niet was.
- **`pre-line`.** Een regeleinde getypt in het bewerkvak bleef als `\n` in de verzonden tekst maar
  werd getoond als spatie, omdat `.bubble` de standaard gebruikte. Voor de wijziging getest: een
  bericht van drie regels toonde als één regel van 50,5px hoog. `pre-line` houdt regeleinden en
  klapt reeksen spaties nog samen, wat `pre-wrap` niet doet. Het geldt voor elke bubbel, dus ook
  een AI-antwoord met regeleinden toont ze. Het bewerkvak blijft `pre-wrap`, omdat getypte spaties
  tijdens het typen moeten blijven staan. Dit sloot de open vraag over regeleinden die als spatie
  in de thread verschenen.

## Voorgeschiedenis

Het bewerkvak is twee keer gebouwd. De eerste versie was een textarea gestapeld op een verborgen
kopie van zijn eigen tekst, gekozen boven `field-sizing: content` (pas in Safari 26.2). Op een
iPhone nam die textarea de volle breedte en legde hij zijn regels anders uit dan de kopie: dat
nodigt een constructie uit die twee elementen nodig heeft om tekst gelijk te leggen. Jaron stelde
`contenteditable` voor. Getest in Chrome met echt typen: Enter geeft `\n` in een tekstnode zonder
`<br>` of `<div>`, geplakte opmaak komt als platte tekst binnen, Send verstuurt precies wat is
getypt, Cancel edit herstelt de tekst van vóór het bewerken, en een leeggemaakt bewerkvak houdt
een zichtbare bubbel met Send uitgeschakeld. Daarna gecontroleerd op een iPhone, waar de eerste
poging was mislukt: het gedraagt zich. Dat dekte Enter, het toetsenbord en autocorrect, de open
risico's.

De rij van 09-30 over `Bubble` kende een `as`-prop (`p` of `div`). Die is op 10-08 vervallen;
`thinking-bubble.tsx` en `draft-review.tsx` verloren daardoor hun `as="div"`.

## Gevolgen

- `src/components/conversation/bubble.tsx` en `bubble.module.css` houden het frame. Het bewerkvak
  staat in `src/components/conversation/draft-review.tsx`; het gebruikt `BubbleText`, een span die
  met CSS een blok wordt, niet letterlijk een `div` (uit de code, niet uit het plan).
- `thinking-bubble.tsx` bestaat niet meer; de denkbubbel staat nu in `ai-bubble.tsx` (uit de
  code, niet uit het plan).
- Verwant: PDR-004 (Tekst in spraakbubbels: regelhoogte 1.25 en gewicht medium).

## Herkomst

- L51 (09-30) One shared `Bubble` component holds the frame of every speech bubble, and each leaf keeps its own styles
- L52 (09-30) The editor is an uncontrolled `contenteditable="plaintext-only"` div inside a `Bubble`, replacing the full-width bordered textarea
- L53 (09-30) A bubble containing an editable region goes white, with the focus ring on the bubble
- L54 (09-30) Bubbles use `white-space: pre-line`
- L59 (09-30) The draft editor turns off `spellCheck`, `autoCorrect` and `autoCapitalize`
- L137 (10-08) `Bubble` is always a `div` (the `as` prop is gone) and always has `overflow: hidden`; the text inside a bubble can be a `<p>`, which `TurnBubble` now uses
