# ADR-018: Sessiestate: één reducer, beurtstatus als discriminated union

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

**Eén sessiemachine.** De state van de sessie is één `useReducer`-machine; side effects zitten in
hooks. De state komt als props van `LanguageBuddy` bij de schermen, dat op `phase` narrowt. Alleen
`dispatch` reist via een context. Er is geen state context, en ook geen `useSession` of
`useConversation`.

**Beurtstatus als discriminated union.** Elke beurtstatus draagt zijn eigen data: `listening` het
transcript, `aiSpeaking` de beurt-id en het aantal woorden, `editing` de tekst van vóór het
bewerken. `listening` draagt ook `microphoneIsLive`; `MICROPHONE_STARTED` zet die vlag zodra de
recorder is gestart. Tot dan toont de bubbel "Preparing mic…" zonder stip.

**Identiteit van een beurt.** Elke beurt krijgt een `crypto.randomUUID()`, nooit een array-index.

**Acties.**

- `AI_SPEECH_PROGRESSED`, `AI_SPEECH_FINISHED` en `AI_SPEECH_FAILED` dragen een `turnId`. De
  reducer negeert ze als het niet de beurt is die wordt uitgesproken.
- `USER_TURN_SENT` en `AI_TURN_RECEIVED` nemen `{ id, text }`, geen hele `Turn`; de reducer zet de
  `author`. De regel "geen lege gebruikersbeurt" (op de getrimde tekst) leeft in de reducer.
- `getPreviousInteractionId(turns, turn)` in de reducer is de ene plek die uitrekent van welke
  AI-beurt een request verdergaat. De chat en de evaluatiedriver gebruiken hem allebei.

## Waarom

De hele app is één sessie. Een store-bibliotheek levert niets op, en een reducer maakt
onmogelijke states onrepresenteerbaar.

Een discriminated union maakt van "opnemen terwijl de AI praat" een bug die je niet kunt
schrijven.

Met een UUID per beurt is de off-by-one door een stale closure uit het spike-onderzoek
(`findings.md`) structureel onmogelijk gemaakt, in plaats van gepatcht.

Met één `<audio>`-element dat over beurten heen wordt hergebruikt, kon een late `timeupdate` of
`ended` van de audio van de vorige beurt op de huidige beurt landen. Dat zou de regel tegenspreken
dat alles wat naar een beurt wijst op zijn id matcht.

De beller kiest de `author` niet meer, en de lege-tekstregel staat nu in de reducer in plaats van
alleen in de component.

`microphoneIsLive` komt uit de review van stage 3. De recorder start pas in de `onopen` van de
socket, dus woorden die werden gezegd terwijl het token en de socket nog werden opgezet, gingen
verloren, terwijl het scherm al "Listening…" met een levende stip toonde. Dat was in strijd met de
definitie van de stip van 09-25. De formulering is van Jarón; de vlag en de actie zijn door de
agent voorgesteld.

`getPreviousInteractionId` komt uit een review: de server rekent erop dat beide aanroepen een
bericht laten aftakken van dezelfde beurt, en niets dwong dat af.

## Voorgeschiedenis

- **State context.** Eerst waren er een state context, `useSession` en `useConversation`. Die zijn
  op 09-29 verwijderd: ze werden nooit gebruikt, want `LanguageBuddy` narrowt al op `phase` en
  geeft `turns` en `turnState` door. **Open optie:** een state context plus een narrowende
  `useConversation()` (die buiten de `conversation`-phase gooit) opnieuw toevoegen als een diepere
  component of een hook van stage 2 of 3 anders state moet doorgeven via props. Doen als dat
  praktisch is, niet eerder.
- **De afleiding van de vorige interactie-id.** Een eerdere stap van 10-10 liet die afleiding
  dubbel staan. `getPreviousInteractionId` heeft die stap vervangen.

## Gevolgen

- De lege-tekstcontroles in de reducer (op `USER_TURN_SENT`) en in `ComposingControls` blijven
  bewust naast `composedTextOf` bestaan.

Verwant: ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`)
Verwant: PDR-003 (Eén set bediening zonder Stop, het live transcript in de control bar)
