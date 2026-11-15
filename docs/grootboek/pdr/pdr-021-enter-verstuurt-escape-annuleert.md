# PDR-021: Het bewerkvak als chatvenster: Enter verstuurt, Escape annuleert

- **Status:** implemented
- **Date:** 2026-11-15
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

In de edit-modus werkt het bewerkvak met het toetsenbord als een chatvenster.

- **Enter verstuurt op een apparaat met muis of trackpad** (`(pointer: fine)`). Dat is hetzelfde
  als op Send klikken. **Shift+Enter** geeft daar een nieuwe regel.
- **Op een apparaat zonder fijne pointer**, zoals de iPhone, blijft Enter (de return-toets) een
  nieuwe regel geven, zoals nu.
- **Escape breekt de bewerking af, op elk apparaat.** Dat is hetzelfde als Cancel edit: de tekst
  gaat terug naar wat er stond voordat je ging bewerken. Daarna staat de focus op Edit.
- Enter in een leeg vak doet niets. Tijdens IME-compositie doen Enter en Escape wat de IME ermee
  doet.
- Dit geldt alleen in de edit-modus. In `reviewing` (na Cancel edit of Escape) verstuurt Enter
  niet.

## Waarom

- **Op de laptop is Edit de manier om te typen.** ADR-029 (Geen mock-STT) noemt de Edit-bediening
  als route voor getypte invoer, en Jarón gebruikt hem op de laptop ook zo.
- **Het scherm ziet eruit als een chatvenster.** Dan verwacht je dat Enter verstuurt, en is een
  nieuwe regel de verrassing. Shift+Enter voor een nieuwe regel is daar de conventie.
- **De iPhone houdt return als nieuwe regel.** Het schermtoetsenbord heeft geen Shift+Enter.
  Verstuurt Enter overal, dan kun je op de iPhone geen nieuwe regel meer typen en verstuurt een tik
  op return de beurt meteen. WhatsApp, Slack en Telegram doen het ook zo: op desktop versturen, op
  mobiel een nieuwe regel. Zo blijft ook het iPhone-gedrag staan dat ADR-017 (De bubbel en het
  bewerkvak) testte. Afgevallen is Enter overal laten versturen, met `enterKeyHint="send"`: één
  regel voor alle apparaten. Dat is te verdedigen, want regeleinden betekenen weinig in een
  gesproken beurt. Maar het verandert het dagelijks gebruik op de telefoon.
- **`(pointer: fine)` is een heuristiek.** Een iPad met trackpad telt als laptop, en een laptop met
  touchscreen ook. Beide gedragen zich dan zoals je op dat apparaat verwacht.
- **Escape als Cancel edit.** Dit voegde Jarón toe in het spec-gesprek: wie met het toetsenbord
  bewerkt, wil er ook met het toetsenbord uit.
- **De focus op Edit na Escape.** Zonder keuze valt de focus op `<body>` en kun je niet verder met
  het toetsenbord. Edit is de knop die de bewerking opende. De focus daarheen terugzetten is het
  patroon van een dialoog (WAI-ARIA), en na een stap terug het voorspelbaarst. Afgewogen zijn
  nergens (je pakt de muis) en Send (dan ben je één toets van versturen, vlak nadat je je wijziging
  weggooide).
- **Geen Enter in `reviewing`.** Jaróns keuze. In `reviewing` heeft geen bewerkvak de focus, en met
  de focus op Edit opent Enter juist de bewerking opnieuw.
- **Het lege vak en IME** heeft de agent ingevuld en Jarón aanvaard. Een leeg vak volgt de
  uitgeschakelde Send-knop. Een IME gebruikt Enter en Escape zelf. Voor de zes talen van de app
  speelt IME niet, maar de check kost niets.

## Gevolgen

- `DraftEditor` krijgt een `onKeyDown` en twee callback-props. `ComposingControls` koppelt Enter
  aan dezelfde `handleSend` als de Send-knop. Enter krijgt dus dezelfde trim en dezelfde
  audio-unlock binnen de gesture (ADR-026, Safari/iPhone-eisen).
- `Button` geeft een ref door, voor de focus op Edit.
- ADR-017 verandert niet. De Voorgeschiedenis daarvan noemt dat Enter in de test een `\n` gaf. Dat
  is geschiedenis, en op de iPhone blijft het waar.
- Het gedrag na een klik op de knop Cancel edit verandert niet. Alleen Escape zet de focus op Edit.
- **Landing.** Het bewerkvak in de control bar (`draft-review.tsx`, `composing-controls.tsx`). Het
  bouwplan staat in `docs/grootboek/specs/enter-verstuurt-in-het-bewerkvak.md`.
