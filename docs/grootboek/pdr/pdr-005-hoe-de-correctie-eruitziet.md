# PDR-005: Hoe de correctie eruitziet

- **Status:** implemented
- **Date:** 2026-10-06
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De correctie hangt onderaan de bubbel van de gebruiker, met `--color-blue-50` als achtergrond
(de primitive, niet `--color-bg-info`). Er komen geen nieuwe tokens bij.

**Inhoud.** De uitleg is in het Engels. De woorden van de gebruiker en het natuurlijkere
alternatief blijven in de doeltaal; van de gebruiker staat er alleen het deel dat de uitleg nodig
heeft, nooit het hele bericht. De prompt zegt dat expliciet.

**Vorm.** `correction` is een lijst segmenten van het type `text`, `userInput` of `suggestion`,
zonder aanhalingstekens in de tekst. `userInput` en `suggestion` staan cursief; alleen
`suggestion` heeft een achtergrond, die van de gebruikersbubbel.

**Markup.** De geciteerde zinnen zijn `<i lang="…">`, de uitleg heeft `lang="en"`, en de bijlage
wordt door de bubbel geclipt.

**Toestanden.** Het gedeelte toont "Evaluating…" terwijl de call loopt, "No corrections. Great!"
bij `null`, en "Evaluation failed" bij een mislukte call, een ongeldig antwoord of de timeout.
Elke tekst past op één regel. De correctie wordt niet uitgesproken: TTS leest alleen `reply`. Bij `null` komt de vaste tekst van de client; het model genereert
hem niet.

## Waarom

- **Aan de beurt vastgemaakt:** het referentiescreenshot toont het zo, en de correctie hoort
  zo bij de beurt waar ze over gaat.
- **Taalverdeling:** leermateriaal is de zin in de doeltaal; alleen de uitleg is voor de eigen
  taal van de leerling.
- **Segmenten:** drie soorten tekst moeten er verschillend uitzien, en een scheidingsteken binnen
  één string kan dat niet dragen. Jaron koos eerst "A" (scheidingsteken) maar beschreef deze
  vorm; het onderscheid in drie soorten gaf de doorslag.
- **Cursief en achtergrond:** het herziene referentiescreenshot.
- **Vaste tekst bij `null`:** bespaart tokens en houdt de zin uit de gespreksketen, waar hij als
  voorbeeld zou werken dat het model herhaalt.
- **Placeholders:** een placeholder houdt de hoogte vast, zodat de bubbel niet verspringt.
  "Evaluating…" in plaats van de denkpuntjes, en een zo kort mogelijke foutmelding, zijn de
  formulering van Jaron.
- **`--color-blue-50`:** het semantische token komt toevallig op dezelfde kleur uit, maar "info" is
  hiervoor te algemeen. De agent had het semantische token aanbevolen.
- **Markup:** `<i>` is het element voor tekst in een andere taal, en met `lang` kan een
  screenreader de zinnen in de gesprekstaal uitspreken. Dit is niet besproken; de agent koos het.

## Voorgeschiedenis

De eerste versie (10-06) maakte van de correctie een aparte bubbel onder de beurt van de gebruiker,
met dezelfde linkermarge als de gebruikersbubbels, een eigen CSS-klasse en nieuwe lichtgele
achtergrond- en randtokens. De waarden
van de tokens waren bij het bouwen te kiezen. Dit is ingehaald door de bijlage onderaan de
gebruikersbubbel, omdat het referentiescreenshot het zo toont en de correctie zo aan de
beurt vastzit. De gele tokens en de aparte klasse zijn niet gebouwd.

Twee kleinere stappen zijn eveneens ingehaald: `correction` was eerst een gewone string met
`“…”`-aanhalingstekens in de gelogde voorbeelden (nu segmenten), en een eerdere regel
markeerde beide soorten citaten en liet open of ze verschilden (nu alleen `suggestion`).

## Gevolgen

- De evaluatie zelf komt uit een eigen call: ADR-007 (Evaluatie per beurt, in een eigen call). De
  prompts staan in ADR-008 (Prompts van de corrector).
- Het antwoord wacht op de correctie: PDR-006 (Antwoord pas na de correctie).
- Code: `src/components/conversation/evaluation-section.tsx` en `evaluation-section.module.css`.
  De segmenttypes staan in `src/lib/chat-schema.ts`.

## Herkomst

- L113 (10-06) `null` means no mistake and the client shows the fixed text
- L114 (10-06) The correction is a separate bubble under the user's turn
- L117 (10-06) **Supersedes the separate yellow bubble above:** the correction is attached to the bottom
- L118 (10-06) The correction's explanation is in English, but the user's words
- L119 (10-06) `correction` is a list of segments typed `text`, `userInput` or `suggestion`
- L128 (10-08) The correction section reads "Evaluating…" while the call runs
- L129 (10-08) `userInput` and `suggestion` are italic; only `suggestion` has a background
- L136 (10-08) The correction section's background is the primitive `--color-blue-50`
- L140 (10-08) The quoted phrases are `<i lang="…">`, the explanation `lang="en"`
