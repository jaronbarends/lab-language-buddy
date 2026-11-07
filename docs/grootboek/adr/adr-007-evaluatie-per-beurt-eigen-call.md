# ADR-007: Evaluatie per beurt, in een eigen call

- **Status:** implemented
- **Date:** 2026-10-06
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De evaluatie is een correctie **per gebruikersbeurt**, geleverd door een **eigen call** naar een
eigen prompt. De per-beurt-keuze viel op 10-06, de eigen call op 10-08 (de open vraag over het evaluatieontwerp is op 10-08 beslist).
Er is geen Evaluate-knop (`FaGraduationCap` blijft ongebruikt) en geen samenvatting aan het einde
van de sessie.

- `/api/chat` geeft `{ interactionId, reply }` terug, zonder `correction`; de persona-prompt heeft
  geen *Correction*-sectie meer.
- `/api/evaluation` neemt `{ language, level, input, previousInteractionId? }` aan en geeft
  `{ correction }` terug. Bestanden en types: `EvaluationRequestBody`, `EvaluationResponse`,
  `readEvaluationRequestBody`, `gemini-evaluation.ts`; het veld en de prompt-builder houden de
  naam "correction".
- Beide calls starten parallel op het moment dat de gebruiker verstuurt. De openingsbeurt van de AI
  heeft geen gebruikersbericht en doet geen call.
- De corrector krijgt het hele gesprek: `previousInteractionId` is het id van de laatste AI-beurt
  vóór het bericht (zoals in een chatverzoek) en gaat als `previous_interaction_id` mee naar Gemini.
  Het ontbreekt alleen als de gebruiker als eerste sprak. De prompt zegt dat de corrector alleen
  het laatste bericht beoordeelt, maar het leest in de context van het hele gesprek, en noemt het
  verborgen startbericht.
- De evaluatiecall loopt met `store: false`.

## Waarom

**Per beurt.** Korte feedback op elke beurt gaat voor een aantal opmerkingen over een heel gesprek.
Vooraf is een geschreven vergelijking gemaakt van drie opties: (1) na elke gebruikersbeurt, wat de
spike doet; (2) op verzoek via een Evaluate-knop, wat de referentiescreenshots tonen, inline in de
thread en over meerdere eerdere uitingen tegelijk; (3) één keer aan het einde van een sessie, wat de
huidige productie-app doet. Gekozen is optie 1.

**Eigen call.** Een aparte corrector kende de segmenttypes in 0 van 30 gevallen verkeerd toe, tegen
4 tot 7 van 30 in één call, ook met een expliciete tweede rol in de prompt. Hij houdt de correcties
buiten de gespreksketen, zoals Jarón verkoos, en vertraagt TTS niet meer. De prijs is twee
Gemini-calls per beurt, een tweede route, en een wacht- en foutstatus in de UI.

**De corrector krijgt het gesprek.** Jaróns test: op de vraag hoe hij zijn koffie drinkt kreeg het
antwoord `Ik vind zwart het lekkerst.` een correctie naar *mooist*, wat niet gebeurt als de vraag
zichtbaar is. Gemeten: 6 van 6 van zulke correcties zonder de geschiedenis, 0 van 6 met. De
correcties blijven buiten de keten omdat de evaluatiecall een zijtak is van de chatcall en zijn id
niet wordt doorgegeven.

**`store: false`.** Review B10. Getest tegen de echte API: het werkt samen met
`previous_interaction_id`, het antwoord heeft dan geen id, en de keten loopt door. Niet bekend: hoe
lang Gemini bewaart wat het opslaat, en of het kosten of quotum verandert. Open vraag 9 van het plan
(openbare deployment) blijft open; zie ADR-002 (De serverroutes hebben geen authenticatie van de aanroeper, voorlopig geaccepteerd).

## Voorgeschiedenis

Eerst kwam de correctie per beurt in de chatrespons (10-06): die werd `{ interactionId, reply,
correction }` met `correction: string | null`.

Daarna bleven de correcties in de Gemini-keten, in één call (10-06); een aparte stateless
evaluatiecall was de terugvaloptie. Een keten kan geen velden weglaten, dus ze erbuiten houden
vraagt een tweede call, een tweede route en een wacht- en foutstatus in de UI. Eerst simpel
beginnen en latency en drift meten. Jarón had ze liever buiten de keten gehad; dit was de prijs van
de simpele start. Het veld `correction` kostte ongeveer 265 ms op de ronde reis van de chat (mediaan
2273 → 2538 ms, 10 runs per variant): de extra outputtokens vertragen het hele chatantwoord, en
daarmee TTS. Dus streaming en de parallelle call bleven terugvalopties. Ruis bij n=10: de bereiken
overlappen. Met segmenten kostte het ongeveer +255 ms (mediaan 2947 → 3202 ms, 10 runs per
variant), hetzelfde als de platte string: de extra JSON-structuur voegde geen meetbare latency toe.
Van 8 steekproefsgewijze correcties waren de types goed toegekend en was `userInput` altijd een
fragment, nooit het hele bericht; één had losse aanhalingstekens in een `text`-segment; de
grammaticale uitleg was soms warrig, een kwestie van modelkwaliteit, niet van de structuur.

**Op 10-08 ingehaald door de eigen call.** De metingen: 0 van 30 verkeerde types in de eigen call
tegen 4 tot 7 van 30 in één call, de correcties buiten de keten, TTS niet vertraagd. Deze eigen call
was eerst stateless: `{ language, level, input }`, zonder geschiedenis. De route heette eerst
`/api/evaluate`; Jarón wilde het zelfstandig naamwoord, want wat wordt gevraagd is een evaluatie.
Of de corrector context krijgt (een zijtak van de keten, zoals in de originele app) bleef ongetest,
omdat context geen deel van de meting was.

Meting van 10-08 (`gemini-3.1-flash-lite`, 40 calls per variant): één call (A), één call met een
tweede rol (C) en een aparte call (D). Verkeerde types 7/4/0; een correctie op een zin in kleine
letters of zonder diakrieten 10/10/10 van 10; daarvan alleen spelling 6/3/4; `eld` gemarkeerd of
`null` 1/0/3 van 5; aanhalingstekens in de tekst 4/3/7 van 30. Schema-`description`s in plaats van
promptregels (eerdere run, 40 calls per variant): verkeerde types 14 tegen 7. Klein en grof (5 runs
per invoer, stringheuristieken, alleen een deel van de uitvoer met de hand gelezen), dus een
richting, geen uitslag. Het spellingverbod en de transcriptiehint houden niet volledig stand en D
voegt aanhalingstekens toe; geen van de drie is opgelost (zie ADR-008, Prompts van de corrector).

**Op 10-10 ingehaald: de stateless call.** De corrector kreeg het hele gesprek, vanwege de
koffietest hierboven.

## Gevolgen

- Een verzoek-**body** heet ook zo: `ChatRequestBody` en `EvaluationRequestBody` (met `…Schema`),
  `readChatRequestBody` en `readEvaluationRequestBody` (geven `{ ok, body }` terug),
  `createChatRequestBody`, en de eerste parameter van `askGemini`, `askGeminiForEvaluation`,
  `fetchChatReply` en `fetchEvaluation` is `body`. Een `Request` is het object dat een route handler
  ontvangt; wat de code bouwt en valideert is de body, en `postJson` noemde het al `body`. Het oude
  `evaluationRequestFrom` gaf een beurt-id en een body terug die weinig met elkaar te maken hadden.
  De evaluation driver krijgt de beurt via `getTurnToEvaluate(state)` en bouwt de body met
  `createEvaluationRequestBody`; `UserTurn` wordt uit de reducer geëxporteerd. `parsedRequest` in
  `api/tts/route.ts` heeft hetzelfde gebrek en is blijven staan, omdat het buiten de lijst viel.
- **Stand ten tijde van het besluit (10-10):** de evaluation driver leidde `previousInteractionId`
  zelf af, met dezelfde `findLast` op de AI-beurten als `createChatRequestBody`, in plaats van één
  helper te delen. Delen had de reducer en de chat driver ook geraakt, meer dan de bestanden
  waarnaar Jarón had gevraagd; een kandidaat voor een kleine vervolgstap. **Sindsdien ingehaald (uit
  de code, niet uit het plan):** beide drivers, `use-chat-driver.ts` en `use-evaluation-driver.ts`,
  gebruiken nu de ene gedeelde helper `getPreviousInteractionId` uit `src/lib/session-reducer.ts`.
- De route en het schema leven in `src/app/api/evaluation/` (`route.ts`, `gemini-evaluation.ts`) en
  `src/lib/chat-schema.ts`.
- Hoe de correctie eruitziet: PDR-005 (Hoe de correctie eruitziet). De prompts van de corrector:
  ADR-008 (Prompts van de corrector). Wanneer het antwoord verschijnt: PDR-006 (Antwoord pas na de
  correctie).
