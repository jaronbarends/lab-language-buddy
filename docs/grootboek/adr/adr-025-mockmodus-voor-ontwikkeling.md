# ADR-025: Mockmodus voor ontwikkeling

- **Status:** implemented
- **Date:** 2026-10-03
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Ontwikkelen kan zonder sleutel of quota, met een mockmodus die op de echte fetch-paden meeloopt.

**De schakelaars en de mockroutes**

- De chat kan worden gemockt met `NEXT_PUBLIC_USE_MOCK_CHAT`. De schakelaar kiest de route (`/api/mock/chat` of
  `/api/chat`), zoals in de eerdere app. De mockroute geeft buiten development een 404, en die 404 zegt waarom;
  `.env.example` vermeldt dat de schakelaar alleen onder `next dev` werkt.
- Eén mockschakelaar, `NEXT_PUBLIC_USE_MOCK_CHAT`, bedient de chat en de evaluatie. `chat-schema.ts` en
  `chat-request.ts` houden hun namen, hoewel ze nu ook de evaluatie bevatten. De namen `ChatError` en
  `ChatErrorSchema` zijn niet besproken.
- TTS krijgt een eigen schakelaar, `NEXT_PUBLIC_USE_MOCK_TTS`. Die wordt één keer gelezen in `LanguageBuddy` en als
  `enabled` doorgegeven aan zowel `useAudioPlayback` als `useMockDriver` (uit de code, niet uit het plan: in de code heet de hook nu `useMockTts`). Hij is niet dev-only zoals de chatmock,
  omdat hij geen route nodig heeft.

**Het gedrag van de mockantwoorden**

- De mockroute codeert de scriptpositie in het interaction-id (`mock-<n>`).
- De mockevaluatie faalt voor een bericht met `[fail]` en antwoordt pas na 15 s voor een bericht met `[slow]`.
- De mockevaluatie citeert de eerste vier woorden van het bericht als `userInput`, met een vaste uitleg en
  suggestie. Invoer die alleen uit witruimte bestaat, geeft `null`.
- `mockUserLine` en `mockTranscriptAt` blijven in `mock-conversation.ts` als voorbeeldtekst voor de dev-stepper;
  `wordCountOf` verdwijnt.

**De dev-stepper**

- `aiThinking` afdwingen op een AI-beurt eindigt nu in `FAILED` in plaats van een request te sturen.
- Nieuwe ingangen "listening (mic not live)" en "speech fails" (die `AI_SPEECH_FAILED` verstuurt).
- Onder "Preview bubbles" komen twee knoppen, "short reply" en "long reply". Er verschijnt een lokale `AiBubble`
  aan het eind van de thread met de puntjes, en na 1,5 s wordt hetzelfde element een dummyantwoord, zodat de
  animatie van puntjes naar tekst draait. Het is lokale state in een kleine module-store
  (`src/components/dev/ai-bubble-preview*.ts(x)`), alleen in development gerenderd door `ConversationThread`; de
  reducer en `turns` blijven onaangeroerd. Of het blijft, wordt later besloten.
- Een tweede knop, "sent user bubble", toont één verstuurde gebruikersbeurt (evaluatie pending) met de onthulling
  eronder, uit een eigen store.

## Waarom

- **Schakelaar:** ontwikkelen blijft mogelijk zonder sleutel of quota, terwijl het echte fetch-pad in gebruik
  blijft. De vlag is client-side omdat de client de URL kiest; alternatief was een server-side `if` in één route.
- **Scriptpositie in het id:** voorgesteld om een beurtteller in het request te vermijden, door Jaron goedgekeurd.
  Deterministisch, geordend, en een retry krijgt dezelfde regel.
- **Duidelijke 404:** een lege 404 liet niet zien dat de modus de mock uitzette, en niet een ontbrekende route.
- **Eén schakelaar:** Jaron stemde in en zei dat de bestandsnamen nu niet moesten veranderen. **Eén `enabled` voor
  TTS:** precies één van de twee speelt de beurt van de AI af, en de vlaggen kunnen elkaar niet tegenspreken.
- **`[fail]` en `[slow]`:** zo zijn de mislukte en de verlopen evaluatie te zien zonder een sleutel te breken.
  Voorgesteld door de agent als optie (a) van drie, gekozen door Jaron.
- **Citeren van het bericht:** een vaste zin hoeft niet in het bericht te staan, en dat is in strijd met het
  contract. Citeren houdt de hele sectie zichtbaar voor elke invoer; `null` teruggeven als de zin ontbrak, niet.
- **Voorbeeldtekst blijft:** het plan zei dat de gebruikersregels verdwenen, maar de stepper gebruikt ze nog.
- **`aiThinking` afdwingen:** er is geen gebruikersbeurt om te beantwoorden, en het request dat eerder werd
  verstuurd, had geen invoer. **Nieuwe ingangen:** de terugval naar alleen tekst was alleen te zien met een echte,
  falende provider; Jaron vroeg om de eerste ingang.
- **Preview-knoppen:** de animatie was alleen te zien door een echt gesprek te voeren. Een eerste poging dwong
  `aiThinking` af en werd in review afgewezen: dat start `useChatDriver`, die met een AI-beurt als laatste `FAILED`
  stuurt (de sessie komt in `error`) en met een gebruikersbeurt als laatste een echt chatrequest. De preview scrolt
  de thread niet, dus het scrollen bij aankomst van een hoog antwoord wordt nog alleen in een echt gesprek
  gecontroleerd. "sent user bubble" bestaat om dezelfde reden.

## Voorgeschiedenis

De mockchatroute gaf per taal een correctie terug (een fout als segmenten die een deel van de mockgebruikersregel
van die taal citeren, daarna `null`), en geen correctie op de openingsbeurt: die beantwoordt niets en heeft dus
niets te corrigeren. De eerste versie citeerde Engelse zinnen, wat dat uitsluit.

Verwant: ADR-007 (Evaluatie per beurt, in een eigen call)

## Herkomst

- L73 (10-03) Chat can be mocked via `NEXT_PUBLIC_USE_MOCK_CHAT`, which selects the route
- L74 (10-03) The mock route encodes its script position in the interaction id (`mock-<n>`)
- L84 (10-03) The mock route says why it answers 404, and `.env.example` notes that the flag only works under `next dev`
- L85 (10-03) The dev stepper forcing `aiThinking` on an AI turn now ends in `FAILED` instead of sending a request
- L91 (10-03) `mockUserLine` and `mockTranscriptAt` stay in `mock-conversation.ts` as sample text for the dev stepper
- L96 (10-03) `NEXT_PUBLIC_USE_MOCK_TTS` is read once in `LanguageBuddy` and passed as `enabled`
- L107 (10-05) The dev state stepper gets a "listening (mic not live)" entry and a "speech fails" entry
- L122 (10-06) The mock chat route returns a per-language correction
- L139 (10-08) The mock evaluation route fails for a message containing `[fail]`
- L155 (10-10) The mock evaluation quotes the first four words of the message as `userInput`
- L157 (10-10) One mock switch, `NEXT_PUBLIC_USE_MOCK_CHAT`, serves the chat and the evaluation
- L203 (10-27) The dev state stepper gets two buttons, "short reply" and "long reply", under "Preview bubbles"
