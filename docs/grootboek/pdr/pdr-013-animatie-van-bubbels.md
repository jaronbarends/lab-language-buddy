# PDR-013: Animatie van bubbels

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

**De bubbel van de gebruiker.** Bij het versturen groeit hij in, met de onthulling van de AI-bubbel
gespiegeld: `scale` van 0 naar 1 vanuit rechtsonder, 350 ms, met dezelfde overshoot-curve. Het
label "You: " en de tekst zijn tijdens de schaling verborgen en faden in over 200 ms. De tekst
"Evaluating…" in de evaluatiestrook faadt in na de tekst van de gebruiker en een pauze van 250 ms
(vanaf 800 ms, `--evaluation-pause`); het kader van de strook is meteen zichtbaar.

**Gedeelde onthulling.** De twee onthullingen delen één CSS-module (`bubble-reveal.module.css`). Het
anker is `--reveal-origin`, de duren zijn `--reveal-duration` en `--fade-duration`;
`ai-bubble.module.css` bestaat niet meer. Alleen een beurt die verschijnt nadat de thread is
gemount animeert (`ConversationThread` onthoudt zijn aantal beurten bij het mounten). Bij
reduced motion gebeurt niets hiervan.

**De denkbubbel van de AI.** Hij komt binnen zoals de andere bubbels: `scale` van 0 naar 1 vanuit
linksboven (350 ms, dezelfde curve), daarna faden de puntjes in (200 ms). Na een verstuurde beurt
start hij 800 ms later (`--thinking-delay`, het moment waarop de tekst "Evaluating…" begint); bij
de openingsbeurt van de AI start hij meteen. De vertraging is alleen visueel: de wachtbubbel blijft
op `scale` 0 in de layout, zodat hij en het antwoord één element blijven (zie JNL-003, Chat bubble
animation). Hij heeft een eigen keyframes-naam (`grow-waiting`), omdat een CSS-animatie alleen
opnieuw start als de naam verandert. De timings van de onthulling (350 / 200 / 250 ms) zijn van
`.reveal` naar de CSS-module van de thread verhuisd, zodat de wachtbubbel ze kan lezen. Een derde
dev-preview-knop, "sent turn + thinking + reply", speelt de hele reeks af.

**Het antwoord groeit uit de denkbubbel.** Als de tekst van de AI binnenkomt, groeit de bubbel van
de grootte die de denkbubbel had naar zijn eigen grootte, in plaats van vanaf `scale` 0. `AiBubble`
meet de wachtbubbel één keer (`offsetWidth`/`offsetHeight`) en de bubbel van het antwoord in een
layout effect bij de wissel. De `grow`-keyframes starten op `scale: old/new` per as
(`--grow-from-x`, `--grow-from-y`; `0` zonder die variabelen, zodat de bubbel van de gebruiker en
een AI-antwoord zonder denkfase ongewijzigd blijven). Het antwoord rendert eerst zonder de
onthullingsklasse, zodat de animatie niet kan starten voor de variabelen bestaan.

Nog niet gedaan: het concept dat eerst krimpt in de bedieningsbalk, en de eigen groei van de
evaluatie. De groei van de denkbubbel naar het antwoord is door Jaron op een iPhone getest en
slaagt. De denkbubbel zelf is inmiddels ook op een iPhone getest en goed bevonden (door Jaron
bevestigd op 2026-11-06; dit staat niet in het plan).

## Waarom

De verstuurde tekst sprong eerst de thread in. De layout krijgt meteen zijn eindmaat, dus het
scroll-effect van de thread hoefde niet te veranderen. De basis `scale: 1` van de Modern Web
Guidance is bewust weggelaten: die voegt een permanente stacking context toe voor een risico dat
hier niet is gezien (proef van HDR-013, Try Modern Web Guidance on the bubble animation, with the
baseline written first).

De volgorde was niet zichtbaar: de verstuurde tekst, de evaluatie en de puntjes verschenen allemaal
tegelijk. Buiten dit besluit vallen het concept dat eerst krimpt in de bedieningsbalk (later
gewenst) en het starten van de spraak na de onthulling (geparkeerd).

Het groeien naar de grootte van de tekst is het antwoord op de open wens dat de bubbel groeit naar
de grootte van de tekst, die de eerste spike beantwoordde met een `clip-path` zonder overshoot.
Niet overgenomen uit de originele app: haar `width`/`height`-transitie, die in Safari niet naar `auto` kan interpoleren en de layout
animeert.

## Voorgeschiedenis

De eerste spike groeide de bubbel naar de grootte van de tekst met een `clip-path` en zonder
overshoot. Die is ingehaald door de `scale`-animatie vanaf de grootte van de denkbubbel, omdat de
agent "scale up again" als een onthulling vanaf 0 had gelezen en Jaron dat corrigeerde.

## Gevolgen

- Bekende grenzen: of de denkbubbel ooit zichtbaar was, wordt beoordeeld aan de tijd sinds hij
  mountte, niet aan zijn animatieklok; de maat van de wachtbubbel wordt één keer gemeten.

## Herkomst

- L204 (10-27) The user's bubble grows in when it is sent, with the AI bubble's reveal mirrored
- L206 (10-28) The AI's thinking bubble enters like the other bubbles
- L207 (10-30) When the AI's text arrives, the bubble grows from the size the thinking bubble had
