---
titel: "Enter verstuurt, Escape annuleert: het bewerkvak als chatvenster"
type: spec
soort: bouwplan
status: concept
datum: 15 november 2026
auteurs: Jarón, Mama Claude
---

# Enter verstuurt, Escape annuleert: het bewerkvak als chatvenster

**Waar het om gaat.** Op de laptop gebruik je Edit om te typen. Omdat het scherm eruitziet als een
chatvenster, verwacht je dat Enter verstuurt, maar nu geeft Enter een nieuwe regel. Met deze
feature verstuurt Enter op de laptop en geeft Shift+Enter een nieuwe regel. Escape breekt de
bewerking af en zet de focus op Edit. Op de iPhone verandert er aan Enter niets. Het waarom staat
in PDR-021 (Het bewerkvak als chatvenster: Enter verstuurt, Escape annuleert). Dit document is het
bouwplan en vervalt na oplevering.

## Wat de gebruiker ziet

Dit geldt alleen in de edit-modus (beurtstatus `editing`), met de focus in het bewerkvak.

| Toets | Laptop: `(pointer: fine)` | iPhone: geen fijne pointer |
|---|---|---|
| Enter | verstuurt, zoals Send | nieuwe regel, zoals nu |
| Shift+Enter | nieuwe regel | (bestaat niet op het schermtoetsenbord) |
| Escape | Cancel edit, daarna de focus op Edit | idem, met een hardwaretoetsenbord |

- **Een leeg vak.** Is het vak leeg of staat er alleen witruimte in, dan doet Enter niets: geen
  verzending en geen nieuwe regel. Dat volgt de uitgeschakelde Send-knop.
- **Na Escape** staat de tekst weer zoals hij was voordat je ging bewerken, is de beurtstatus
  `reviewing` en staat de focus op Edit. Met Enter of Space open je de bewerking opnieuw; dat is
  het gewone gedrag van een knop.
- **IME.** Tijdens IME-compositie doen Enter en Escape wat de IME ermee doet.
- **Niet veranderd.** Na een klik op de knop Cancel edit blijft alles zoals het nu is. In
  `reviewing` verstuurt Enter niet.

## Hoe het in de code landt

**`DraftEditor`** ([draft-review.tsx](../../../src/components/conversation/draft-review.tsx))
krijgt een `onKeyDown` en twee callback-props: `onSend` en `onCancelEdit`. Het component zelf
dispatcht niets, volgens het patroon in `src/components/CLAUDE.md`.

```tsx
function handleKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
  // An IME uses Enter and Escape itself while composing. Safari fires the keydown of
  // the Enter that ends a composition after compositionend, with isComposing false
  // and keyCode 229, so the deprecated keyCode is the only way to tell.
  if (event.nativeEvent.isComposing || event.keyCode === 229) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onCancelEdit();
    return;
  }

  // Asked at the keypress rather than once, so an iPad that gains or loses a trackpad
  // follows along.
  const enterSends = window.matchMedia("(pointer: fine)").matches;
  if (event.key === "Enter" && !event.shiftKey && enterSends) {
    event.preventDefault();
    // A held Enter on the Edit button repeats into the editor it just opened.
    if (event.repeat) {
      return;
    }
    onSend();
  }
}
```

- `preventDefault()` gebeurt ook bij een leeg vak. `handleSend` doet bij een lege tekst al niets,
  en zo ontstaat "doet niets" vanzelf.
- **Een herhaalde Enter** (`event.repeat`) doet niets: geen verzending en geen nieuwe regel. Houd
  je Enter ingedrukt op de Edit-knop, dan opent de eerste aanslag het bewerkvak. Zonder deze check
  zouden de herhalingen daarna in dat vak het concept versturen. `preventDefault()` staat vóór de
  check, zodat de herhalingen ook geen lege regels invoegen. Dit kwam uit de review en Jarón
  koos voor de reparatie.
- **`keyCode === 229`** is de check die MDN aanraadt voor Safari (zie het commentaar). Dit kwam
  ook uit de review en Jarón koos voor de regel.
- Het commentaar staat in het Engels in de code (HDR-014, Documentatie is Nederlands; code, UI en
  commits blijven Engels).

**`ComposingControls`**
([composing-controls.tsx](../../../src/components/conversation/composing-controls.tsx)):

- `onSend={handleSend}`. Dat is dezelfde functie als die van de Send-knop, dus met dezelfde trim
  en dezelfde synchrone `unlockAudio()`. Een keydown telt als gesture, dus de unlock valt erbinnen
  (ADR-026, Safari/iPhone-eisen).
- `onCancelEdit` dispatcht `DRAFT_EDIT_CANCELLED` en zet daarna de focus op de Edit-knop. Die knop
  is uitgeschakeld zolang de bewerking loopt en pas na de render weer bruikbaar. Daarom gaat de
  dispatch in `flushSync` (uit `react-dom`) en volgt de `focus()` erna, in dezelfde handler:

  ```tsx
  function handleCancelEditFromKeyboard() {
    // The Edit button is disabled until this state change has rendered.
    flushSync(() => dispatch({ type: "DRAFT_EDIT_CANCELLED" }));
    editButtonRef.current?.focus();
  }
  ```

  Afgewogen is een `useEffect` die reageert op de overgang naar `reviewing`. Die heeft een vlag
  nodig om Escape te onderscheiden van een klik op Cancel edit. `flushSync` houdt alles in één
  handler.

**`Button`** ([button.tsx](../../../src/components/ui/button.tsx)) geeft een `ref` door aan de
`<button>`. In React 19 is `ref` een gewone prop voor een function component, dus `forwardRef` is
niet nodig. Alleen het type moet hem toelaten, want `ButtonHTMLAttributes` kent geen `ref`.
`...rest` geeft hem daarna vanzelf door.

De reducer verandert niet: `DRAFT_EDIT_CANCELLED` en `USER_TURN_SENT` bestaan al.

## Grootboek en leidende documenten, in dezelfde pull request

- **PDR-021** (nieuw): het waarom. Na een geslaagde test gaat het naar `implemented`.
- **Geen ADR.** Er is geen architectuurkeuze. De callback-props volgen het bestaande patroon.
- **ADR-017 (De bubbel en het bewerkvak) verandert niet.** Dat Enter in de test een `\n` gaf, staat
  in de Voorgeschiedenis daarvan. Dat is geschiedenis, en op de iPhone blijft het waar.
- **Leidende documenten.** De balans en `src/components/CLAUDE.md` noemen het toetsenbordgedrag van
  het bewerkvak niet (grep op de balans, `src/components/CLAUDE.md` helemaal gelezen). Er wordt
  geen wijziging verwacht.
- **Een reconciliatie** (HDR-026, Een pull request die code in een werkgebied raakt, sluit met een
  reconciliatie). De wijziging raakt `src/components`, het werkgebied van
  `docs/grootboek/software-architectuur.md` en van `src/components/CLAUDE.md`. Daar komt één DFT
  voor. Tot en met DFT-010 meldt de lead het vooraf en achteraf, voor de kostenmeting.

## Bouwen

- Eén builder. De drie bestanden hangen van elkaar af: de props van `DraftEditor` worden in
  `ComposingControls` ingevuld, en die heeft de ref van `Button` nodig. Het verwachte regime is
  `normal`, een gedragswijziging in de bediening zonder test op het pad. De triage gebeurt bij de
  start.
- Geen CSS, dus geen Modern Web Guidance.
- Daarna een reviewer met frisse ogen.

## Klaar wanneer

- De controles uit `CLAUDE.md` zijn groen: `npm install`, `npm run lint`,
  `npm run typegen && npm run typecheck`, `npm run docs:check`, `npm run test:scripts`,
  `npm run register:check` en `npm run build`.
- **In de browser op de laptop** (`next dev`, poort van deze worktree):
  - Enter in het bewerkvak verstuurt de beurt, en het AI-antwoord wordt hoorbaar afgespeeld. Dat
    bewijst niet dat de audio-unlock in de keydown werkt. Chrome laat geluid toe zodra je ergens op
    de pagina hebt geklikt, en de klik op Start chat doet dat al. Waar de unlock er wel toe doet
    (Safari op een Mac, een iPad met trackpad), is hij niet te testen. De code zelf roept hem
    synchroon aan via `handleSend`.
  - Shift+Enter geeft een nieuwe regel, en die regel staat ook in de verzonden bubbel.
  - Enter in een leeggemaakt vak doet niets.
  - Escape zet de tekst terug naar wat er stond voordat je ging bewerken. De bubbel is weer de
    gewone conceptbubbel en de focus staat zichtbaar op Edit. Enter opent dan de bewerking
    opnieuw.
  - Een klik op Cancel edit werkt zoals voorheen.
  - Houd Enter ingedrukt op Edit: het bewerkvak opent, er wordt niets verstuurd en er komen geen
    lege regels bij. Laat los en druk nog een keer op Enter: de beurt wordt verstuurd.
- **Op de iPhone, één controle.** HDR-029 (De iPhone-test alleen bij audio, opname of layout, en
  geen vaste ronde langs de faalpaden) vraagt hier niet om een iPhone-test. De heuristiek
  `(pointer: fine)` bepaalt echter of een tik op return je beurt verstuurt, en redeneren vanuit de
  spec is geen test (`.claude/rules/safari-ios.md`). Daarom: geeft return in het bewerkvak een
  nieuwe regel?
- **Niet te testen zonder codewijziging of ander apparaat:** Safari op een Mac (Jarón werkt op
  Windows) en een iPad met trackpad.

## Buiten scope

- Enter als Send in `reviewing` (Jaróns keuze: niet).
- Enter laten versturen op de iPhone, of `enterKeyHint="send"` (afgevallen in PDR-021).
- De focus op Edit na een klik op Cancel edit.
- Andere sneltoetsen, zoals Ctrl+Enter.

## Bronnen

- **Het denkwerk:** het spec-gesprek van 15 november 2026 op de branch `enable-enter-for-edit`;
  `docs/grootboek/pdr/pdr-021-enter-verstuurt-escape-annuleert.md` voor het waarom.
- **De realisatie:** `src/components/conversation/draft-review.tsx` (`DraftEditor`),
  `src/components/conversation/composing-controls.tsx` (`handleSend`, de Edit-knop),
  `src/components/ui/button.tsx`; `src/lib/session-reducer.ts` voor `DRAFT_EDIT_CANCELLED`, de
  enige overgang naar `reviewing`.
- **De plek in het systeem:** `src/components/CLAUDE.md` (alleen leaf controls dispatchen);
  ADR-006 (`editing` is een eigen beurtstatus met `draftBeforeEdit`); ADR-017 (het bewerkvak als
  `contenteditable`); ADR-026 (audio-unlock binnen elke gesture); ADR-029 (Edit als route voor
  getypte invoer); PDR-003 (Eén set bediening zonder Stop), waardoor `reviewing` alleen via Cancel
  edit bereikbaar is.
