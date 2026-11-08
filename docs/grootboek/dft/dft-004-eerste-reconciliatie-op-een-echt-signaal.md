# DFT-004: Eerste reconciliatie op een echt signaal — `src/components/CLAUDE.md` beschrijft een context die nooit heeft bestaan, de balans mist de CI

- **Status:** resolved
- **Date:** 2026-11-07
- **Trigger:** het driftsignaal onder HDR-022 (Het driftsignaal meet vanaf de laatste
  reconciliatie, niet vanaf de laatste aanraking). Geen van de drie leidende documenten die code
  beschrijven was ooit gereconcilieerd met de velden van HDR-022: de software-balans liep 16
  commits achter (sinds 8c7eacc), `src/components/CLAUDE.md` 9 en `src/lib/CLAUDE.md` 4 (beide
  sinds d2b7ffa). Dit is de reconciliatie die HDR-008 verwachtte bij de merge van
  `arc/bubble-animation` (2026-10-30) en die toen niet is gedaan.

## SOLL vs IST

**SOLL:** de drie documenten zoals ze op `ddab397` staan (`main` na PR #36).
**IST:** de code op `ddab397`.

### Bevinding 1 — `src/components/CLAUDE.md` beschrijft een sessiecontext voor state die nooit heeft bestaan (hoog)

**SOLL:** "Schermen lezen state via de sessiecontext en sturen acties via de dispatch hook."

**IST:** de enige context is `SessionDispatchContext` (`src/hooks/use-session-dispatch.ts:7`), en
die draagt alleen `dispatch`. `ConversationScreen` (`conversation-screen.tsx:16`) en `SetupScreen`
(`setup-screen.tsx:31`) krijgen hun state als props van `language-buddy.tsx` (r. 44-63). Alleen vier
leaf controls roepen `useSessionDispatch()` aan: `composing-controls`, `idle-controls`,
`error-controls` en de dev-only `state-stepper`. De balans (§ 2 en § 3) beschrijft het goed.

**Sinds:** de eerste versie van het bestand (d2b7ffa, 2026-10-20). Toen bestond ook al alleen de
dispatch-context; de regel was nooit waar.

**Gewicht: hoog.** Dit bestand laadt bij elke builder die in `src/components/` werkt. Een builder
die het volgt, bouwt een state-context of laat een scherm zelf dispatchen, en beide gaan tegen
ADR-018 (Sessiestate: één reducer, beurtstatus als discriminated union) in. Het oude signaal kon dit
niet vinden, omdat het alleen `docs/` las.

### Bevinding 2 — de balans zegt in § 5 dat er geen CI is (midden)

**SOLL:** "Er is geen CI-workflow in de repo; de checks zijn die uit `CLAUDE.md`. Ze op pull
requests naar `main` draaien is gewenst maar niet gebouwd (HDR-003; JNL-001, K8)."

**IST:** `.github/workflows/checks.yml` draait sinds 2026-10-22 op elke pull request naar `main`:
lint, typecheck, `docs:check`, `test:scripts`, `register:check` en build. HDR-003 (De checks van de
repo draaien op pull requests naar `main`) staat op implemented.

**Waarom het signaal het niet zag:** `.github/` viel buiten het werkgebied van de balans. De commit
die HDR-003 bouwde, werkte de balans niet bij, hoewel de werkafspraak zegt dat een record en het
document dat het raakt in dezelfde commit gaan.

### Bevinding 3 — de dev-previews van de bubbels staan niet in de balans (laag)

**SOLL:** § 2 en § 3 noemen de `StateStepper` als enige onderdeel dat alleen in development
bestaat. § 1, principe 3, zegt dat één reducer de enige schrijver van sessiestate is.

**IST:** sinds cf0e0ed (2026-10-27) mount `ConversationThread` twee previews,
`UserBubblePreview` en `AiBubblePreview` (`conversation-thread.tsx:154-158`, achter
`NODE_ENV === "development"`). Elk leest een eigen kleine store op moduleniveau via
`useSyncExternalStore` (`src/components/dev/*-preview-store.ts`), en `StateStepper` schrijft
erin. Het principe houdt stand: previewstate is geen sessiestate en staat bewust buiten de
reducer, omdat een echte beurt de chat- en evaluatiedrivers zou starten (JNL-003, K11). Maar wie
die stores vindt en de balans leest, ziet een schijnbare breuk zonder uitleg.

### Wat klopt, met bewijs

- Keten met `previous_interaction_id` (§ 1, § 4): `gemini-chat.ts:55`, `gemini-evaluation.ts:59`.
- Deadlines van 30 s en 10 s (§ 4): `use-chat-driver.ts:25`, `evaluation-deadline.ts:5`.
- Afspelen afgekapt vóór het einde (§ 4): `use-audio-playback.ts`, `onEarlyEnd` (JNL-004, K9).
- Registries gooien bij een onbekende naam (§ 1, § 3): `tts/index.ts:39`, `stt/index.ts:37`;
  standaard-STT native: `stt/index.ts:14`.
- Authenticatie (§ 6), steekproef: de Google-key als header `x-goog-api-key` (`tts/google.ts:62`),
  het Scribe-token als queryparameter (`stt/elevenlabs.ts:203`), het Deepgram-token als
  subprotocol `Bearer` (`stt/deepgram.ts:165`).
- Mockroutes geven 404 buiten development (§ 9): `mock/chat/route.ts:31`,
  `mock/evaluation/route.ts:28`. Het requestsignaal gaat naar Gemini en TTS: `chat/route.ts:12`,
  `evaluation/route.ts:13`, `tts/route.ts:23` en de drie providers.
- App shell en hooks (§ 3): `layout.tsx`, `page.tsx`, `manifest.ts`; vijf effect drivers plus
  `use-session-dispatch`. Buiten de twee preview-stores zijn `useReducer` in `language-buddy.tsx`
  en de dispatch-context de enige bronnen van state.
- **`src/lib/CLAUDE.md`: geen verschil.** De drie wijzigingen sinds d2b7ffa (een verwijzing in
  commentaar in `languages.ts`, een strengere promptregel in `prompt.ts`, de header in
  `tts/google.ts`) raken geen bewering in het bestand. De stemtabellen staan per provider, en
  `languages.ts:32-38` zegt dat ook.
- **De bubbelanimatie zelf** (het antwoord in dezelfde bubbel als de stippen, `ThinkingIndicator`,
  de animatietokens) is product en visueel ontwerp. Dat perspectief behandelt de balans
  uitdrukkelijk niet, dus het is geen drift van de balans. Dat de structuur van de bubbel nog
  geen ADR heeft (JNL-003, K2), is een gat in de kringloop, geen balansdrift.

## Patroon

Drie keer in drie weken bleef een toegezegde vervolgstap liggen tot een controle van buitenaf hem
vond:

1. HDR-003 is op 2026-10-22 gebouwd zonder de balans bij te werken (bevinding 2).
2. HDR-008 zei dat de eerste reconciliatie aan de beurt was bij de merge van
   `arc/bubble-animation`. Die merge was op 2026-10-30, en de reconciliatie is toen niet gedaan
   (HDR-022, Waarom).
3. DFT-003 (Het hernummerscript laat record-ids in broncommentaar ongewijzigd) staat nog op
   `in_progress`, hoewel aan zijn sluitvoorwaarde al is voldaan: de drie comments zeggen JNL-003.

Ze hebben gemeen dat de vervolgstap afhangt van iemands geheugen en niet van een signaal. Voor
drift maakt HDR-022 een signaal dat alleen stil wordt na een controle. Voor de andere twee
vormen (een record dat implemented wordt zonder het document mee te nemen, een DFT die niet wordt
gesloten) is er nog geen signaal. Bevinding 1 hoort er in een andere vorm bij: een document dat
nooit tegen de code is gelegd.

## Besluiten

1. **`src/components/CLAUDE.md`:** de regel over schermen beschrijft wat er is: state als props
   vanuit `language-buddy.tsx`, en alleen de leaf controls dispatchen. *Gedaan; de wijziging is
   door Jarón gecontroleerd (2026-11-07).*
2. **Balans § 5:** de zin over CI beschrijft de workflow die draait. Het werkgebied krijgt er
   `.github/workflows` bij. *Gedaan; door Jarón gecontroleerd.*
3. **Balans § 3:** een rij voor de dev-previews en hun stores, met de reden waarom ze buiten de
   reducer staan. *Gedaan; door Jarón gecontroleerd.*
4. **`src/lib/CLAUDE.md`:** geen wijziging.
5. **Deze DFT is `resolved`**, met de drie documenten onder `documenten` en `getoetst-tegen:
   ddab397`: de code op `main` waartegen is vergeleken. Op de branch van deze reconciliatie is
   in het werkgebied geen code veranderd, alleen leidende documenten, en die vallen buiten elk
   werkgebied (HDR-022). Het signaal wordt hiermee voor het eerst stil door een controle in plaats
   van door een aanraking.

## Gevolgen

- REQ-GG-05 (Richt drift-detectie in): de eerste reconciliatie op een echt signaal, met echte
  bevindingen. DFT-001 bewees het proces; deze bewijst dat het drift vangt.
- REQ-GG-09 (Sluit de kringloop): 8095deb (ADR-004, Google TTS-key als header) zit in de lijst
  van het signaal, en § 6 van de balans klopt ermee. De stap code → drift voor de lus van JNL-001
  K6 is daarmee gezet.
- De procesnotitie van DFT-001 (bewijs per bewering) is toegepast: elke bewering onder "Wat klopt"
  heeft een bestand en een regel.

Verwant: HDR-022 (Het driftsignaal meet vanaf de laatste reconciliatie, niet vanaf de laatste aanraking)
Verwant: HDR-008 (Een driftsignaal meldt wanneer de code die een leidend document beschrijft is doorgegroeid)
Verwant: DFT-001 (Eerste reconciliatie van de software-balans — geen drift gevonden)
