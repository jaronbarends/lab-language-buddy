# ADR-019: Chat-API en gespreksgeschiedenis

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Geschiedenis via Gemini.** De gespreksgeschiedenis staat server-side bij Google, aan elkaar
gekoppeld met `previous_interaction_id`. Bij elke call stuurt de client alleen de nieuwe uiting;
het model, de system instruction en het antwoordformaat gaan bij elke call mee. De client houdt
wel een eigen array bij om te renderen.

**Ketting in de beurten.** Elke AI-beurt draagt de `interactionId` van Gemini, en
`previous_interaction_id` wordt gelezen uit de laatste AI-beurt, niet uit een apart veld. `Turn`
wordt daarvoor een union op `author`, en `AI_TURN_RECEIVED` neemt `interactionId` mee.

**System instruction op de server.** De system instruction wordt bij elke call op de server
gebouwd uit `{ language, level }`; de client stuurt alleen die twee gevalideerde waarden. De
bouw is een template string, dus cachen levert niets op. De persona is die van de spike, in het
Engels, zonder de Correction-sectie.

**Request als discriminated union.** Het chat-request is een discriminated union op `kind`
(`aiStarts`, `userTurn`). `input` moet niet leeg zijn en de id is begrensd op 200 tekens.

**Foutbody en gedeelde request-lezing.** De foutbody heeft een schema (`ChatErrorSchema`). Het
lezen van het request is voor beide routes gedeeld in `chat-request.ts`.

**Antwoordvorm.** Het chat-antwoord is `{ interactionId, reply }`, zonder `correction`.

**Gemini-call apart.** Het Gemini-schema en de call staan in `api/chat/gemini-chat.ts`
(`askGemini`). De route houdt request, response en fouten over.

## Waarom

- Geschiedenis server-side: de client hoeft alleen de nieuwe uiting te sturen.
- Ketting uit de laatste AI-beurt: er is één bron van waarheid. Een sessie beëindigen zet de
  ketting terug samen met de beurten, en een retry na een fout stuurt hetzelfde request opnieuw,
  omdat een mislukking geen beurt toevoegt.
- Instruction op de server: een instruction van de client zou elke aanroeper de prompt laten
  schrijven op een publiek endpoint dat de API-key houdt.
- Union op `kind`: een request zonder input maar met een id stuurde de startprompt midden in een
  keten, en de dev-stepper kon zo'n request maken.
- Foutschema en gedeelde lezing: de handgeschreven controle van `{ error }` door de client en de
  twee kopieën van de JSON- en validatiestappen konden uit elkaar gaan lopen.
- `askGemini` apart: de route blijft over met request, response en fouten, en de call kan
  worden vervangen bij het testen van de foutpaden.

## Voorgeschiedenis

In stage 2 liet de keuze voor de antwoordvorm open of feedback per beurt komt; dat was precies de
vraag van stage 4. Zonder `correction` bleef die vraag open in plaats van per ongeluk een
standaard te krijgen. Hoe de correctie er uiteindelijk kwam, staat in ADR-007.

Verwant: ADR-007 (Evaluatie per beurt, in een eigen call)

Verwant: ADR-008 (Prompts van de corrector)

Verwant: PDR-002 (Geen persistentie)

Verwant: ADR-003 (Gemini `flash-lite` as the model, chosen on price)
