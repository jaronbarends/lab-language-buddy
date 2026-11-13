---
titel: "Een infomelding als de gebruiker begint, en een gedeeld Feedback-component"
type: spec
soort: bouwplan
status: concept
datum: 13 november 2026
auteurs: Jarón, Mama Claude
---

# Een infomelding als de gebruiker begint, en een gedeeld Feedback-component

**Waar het om gaat.** Kies je op het setup-scherm "Me" bij wie begint, dan opent het gesprek met
een lege thread. Het enige wat zegt dat jij aan de beurt bent, is het label "Start conversation"
op de knop. Deze feature zet bovenaan de thread een infomelding: *Ask a question or name a topic
you want to discuss*. Die zegt twee dingen tegelijk: jij begint, en zo kun je beginnen.

De melding lijkt op de foutbox en niet op een bubbel. Daarom komt er een gedeeld component,
`Feedback`, dat het recept draagt dat beide meldingen delen, en wordt de foutbox erop omgebouwd.
Het waarom van het product staat in PDR-020 (Een infomelding als de gebruiker het gesprek begint).
Dit document is het bouwplan en vervalt na oplevering.

## Wat de gebruiker ziet

- **Bij starter `user`** is de infomelding het eerste item in de thread, vanaf het moment dat het
  gesprekscherm opent.
- **Hij blijft de hele sessie staan.** Groeit de thread, dan scrollt hij mee naar boven en uit
  beeld. Geen sluitknop, en geen animatie bij het verschijnen: hij staat er al als het scherm opent.
- **Bij starter `ai`** is er geen melding.
- **Een vaste Engelse tekst**, niet in de oefentaal. We leggen niet uit dat je met een AI praat.
- **De gewone tekstgrootte**, geërfd van het document; de melding zet zelf geen grootte.
- **De volle breedte van de thread**, zoals de foutbox de volle breedte van de control bar heeft.

## Het gedeelde recept: `Feedback`

De grens van het component volgt één vraag: wat moet altijd samen veranderen? De afgeronde hoeken,
de padding, de borderdikte en de plek van icoon en tekst. Als je die in de ene melding wijzigt,
moet het ook in de andere. Dat staat dus op één plek. Wat een melding eigen maakt, zit erbuiten.

| Waar | Wat |
|---|---|
| `Feedback` en `feedback.module.css` | de box (radius, padding, borderdikte), de plek en grootte van het icoon, de tekstkolom, de kleuren per variant |
| `ErrorFeedback`, `InfoFeedback` | welke variant, welk icoon, welke role |
| de aanroeper, als children | de tekst en de typografie daarvan |

```tsx
// src/components/ui/feedback.tsx
type FeedbackProps = {
  variant: "error" | "info";
  icon: ComponentType<IconProps>;
  role?: "alert";
  children: ReactNode;
};

// Not exported: a box always comes with a variant, its icon and its role.
function Feedback({ variant, icon: Icon, role, children }: FeedbackProps) {
  return (
    <div className={`${styles.feedback} ${styles[variant]}`} role={role}>
      <Icon size={24} />
      <div className={styles.text}>{children}</div>
    </div>
  );
}

export function ErrorFeedback({ children }: { children: ReactNode }) {
  return (
    <Feedback variant="error" icon={WarningIcon} role="alert">
      {children}
    </Feedback>
  );
}

export function InfoFeedback({ children }: { children: ReactNode }) {
  return (
    <Feedback variant="info" icon={InfoIcon}>
      {children}
    </Feedback>
  );
}
```

De keuzes die erin zitten:

- **`Feedback` wordt niet geëxporteerd.** Een aanroeper kan geen box maken zonder variant, dus
  `ErrorFeedback` zet altijd zijn `role="alert"`.
- **Het icoon gaat als component mee, niet als element.** De grootte (24px) hoort bij het recept
  en staat daarom in `Feedback`, niet bij elke variant.
- **`ErrorFeedback` en `InfoFeedback`, niet `Error` en `Info`.** Een component `Error` overschaduwt
  de ingebouwde `Error` van JavaScript in elk bestand dat hem importeert.
- **Alleen `"error" | "info"`.** Success en warning hebben nog geen geval en geen tokens. Een
  variant erbij is één regel in de union, één class en zijn eigen kleurtokens.
- **De tekst als children.** De foutbox heeft een vette titel, een melding en soms een detail; de
  infomelding één zin. Dat verschil lossen de children voorlopig op. Krijgt de fout later een
  `title`-prop, dan krijgt `ErrorFeedback` die, niet `Feedback`. Losse wrappers bestaan juist
  daarvoor; één component met een map per variant had dezelfde garantie gegeven, maar geen plek
  voor eigen props.
- **Kleuren.** Error: `--color-bg-error` en `--color-text-error`. Info: `--color-bg-info` en
  `--color-text-info`. De rand heeft in beide de tekstkleur, zoals de foutbox nu.
- **Geen lettergrootte in `Feedback`.** De tekst erft de gewone grootte. `min-width: 0` en
  `overflow-wrap: break-word` gaan mee naar de tekstkolom van `Feedback`: dat een lange melding
  afbreekt en de box binnen zijn container blijft, hoort bij het recept (gecontroleerd in PDR-016,
  Typografie en iconen).
- **De foutmelding verliest `--font-size-minor`** en krijgt dus ook de gewone grootte, zodat beide
  meldingen dezelfde tekstgrootte hebben. De vette titel blijft in `ErrorControls`.
- **Een nieuw icoon `InfoIcon`** (`FaCircleInfo`) in `icons.tsx`, volgens het patroon van de
  andere: decoratief, `aria-hidden`.

## Waar het landt in de code

- `src/components/ui/feedback.tsx` en `feedback.module.css`: nieuw.
- `src/components/ui/icons.tsx`: `InfoIcon` erbij.
- `src/components/conversation/error-controls.tsx` en `error-controls.module.css`: de foutbox
  wordt `ErrorFeedback`; `.error`, `.error > svg` en `.errorText` vervallen, `.errorMessage` verliest
  zijn lettergrootte en zijn `overflow-wrap`. Wat er dan van over is, blijft of verdwijnt.
- `src/components/conversation/conversation-thread.tsx`: `InfoFeedback` als eerste kind van de
  thread bij starter `user`, vóór de beurten en vóór de dev-previews.
- `src/components/conversation/conversation-screen.tsx`: een prop `starter`, door naar de thread.
- `src/components/language-buddy.tsx`: geeft `state.config.starter` mee.

PDR-010 (Sessieflow en schermen) haalde `config` uit de props van `ConversationScreen`, omdat de
config-regel van het scherm ging. Dit voegt alleen het ene veld toe dat de thread nodig heeft.

De auto-scroll van de thread kijkt naar het laatste kind. Zonder beurten is dat in productie de
infomelding, die bovenaan past, dus de thread blijft op nul staan. De builder controleert dat het
scrollgedrag verder niet verandert.

## Grootboek en leidende documenten, in dezelfde pull request

- **PDR-020** (nieuw): het waarom. Gaat naar `implemented` bij de merge.
- **PDR-016, versie 1.1**: de foutmelding heeft de gewone grootte, dus de regelhoogte van 21px die
  het Waarom noemt, wordt 27px.
- **`docs/code-architectuur.md` § 2.5**: een uitzondering op de regel van drie voor een gedeeld
  visueel recept, met `Feedback` als praktijkvoorbeeld. Een leidend document, dus de diff gaat vóór
  de commit langs Jarón. De tekst zoals voorgesteld op 13 november:

  > **Uitzondering: een gedeeld visueel recept.** Moet een wijziging aan het uiterlijk van het
  > ene onderdeel altijd ook in het andere gebeuren, dan beslist de toets van 2.1 en niet de
  > telling: het gedeelde uiterlijk staat op één plek, ook bij twee aanroepers. Dit geldt voor
  > uiterlijk, niet voor gedeelde logica; daarvoor blijft de telling. Het argument van deze regel,
  > een koppeling die moeilijk ongedaan te maken is, weegt licht bij een presentatiecomponent
  > zonder logica.
  >
  > *Praktijkvoorbeeld:* `Feedback` in `src/components/ui/feedback.tsx`. De fout- en de
  > infomelding delen hun hoeken, padding, borderdikte en de plek van icoon en tekst. Wat ze
  > onderscheidt (kleur, icoon, role, tekst) zit in de varianten `ErrorFeedback` en `InfoFeedback`
  > en in de children.

- **Geen ADR.** De uitzondering in § 2.5 en haar praktijkvoorbeeld dragen de reden voor het
  gedeelde component; een ADR zou een tweede plek voor hetzelfde argument zijn.
- **Een reconciliatie** (HDR-026, Een pull request die code in een werkgebied raakt, sluit met een
  reconciliatie). De wijziging raakt `src/components`, het werkgebied van
  `docs/grootboek/software-architectuur.md` en van `src/components/CLAUDE.md`. Eén DFT voor beide.
  Tot en met DFT-010 meldt de lead het vooraf en achteraf, voor de kostenmeting.

## Bouwen

- Eén builder: de bestanden hangen van elkaar af (de thread gebruikt `InfoFeedback`, de foutbox
  `ErrorFeedback`). Verwacht regime: `normal`, een gedragswijziging in een scherm zonder test op
  het pad. De triage gebeurt bij de start.
- CSS-werk, dus de builder raadpleegt eerst Modern Web Guidance (HDR-013, Modern Web Guidance
  proberen op de bubbelanimatie, met eerst de eigen baseline).
- Daarna een reviewer met frisse ogen.

## Klaar wanneer

- De controles uit `CLAUDE.md` zijn groen: `npm install`, `npm run lint`,
  `npm run typegen && npm run typecheck`, `npm run docs:check`, `npm run test:scripts`,
  `npm run register:check`, `npm run build`.
- **In de browser** (`next dev`): met "Me" staat de melding bovenaan; met "AI" is er geen; na een
  paar beurten is hij uit beeld gescrolld. In development staan de preview-bubbels eronder.
- **De foutbox** (via de dev-stepper): ziet eruit als nu, behalve dat de melding de gewone grootte
  heeft. Een heel lange melding breekt af, het icoon houdt zijn grootte en de box blijft binnen
  de control bar, zoals PDR-016 dat controleerde.
- **Op de iPhone** (layout, dus HDR-029, De iPhone-test alleen bij audio, opname of layout, en geen
  vaste ronde langs de faalpaden): beide meldingen, en of de infomelding genoeg verschilt van de
  eerste gebruikersbubbel eronder. Beide zijn blauw, en `--color-bg-info` is dezelfde blue-50 als
  de evaluatiesectie in die bubbel. Het onderscheid moet uit de vorm en het icoon komen.

## Buiten scope

- De varianten success en warning.
- Een `title`-prop op `ErrorFeedback`.
- Een sluitknop, of een melding die na de eerste beurt verdwijnt.
- De tekst in de oefentaal.
- Uitleggen dat je met een AI praat.

## Bronnen

- **Het denkwerk:** het spec-gesprek van 13 november 2026 op de branch `add-info-box`;
  `docs/grootboek/pdr/pdr-020-infomelding-als-de-gebruiker-begint.md` voor het waarom.
- **De realisatie:** `src/components/ui/feedback.tsx`, `src/components/ui/icons.tsx`,
  `src/components/conversation/error-controls.tsx`,
  `src/components/conversation/conversation-thread.tsx`,
  `src/components/conversation/conversation-screen.tsx`, `src/components/language-buddy.tsx`; de
  tokens in `src/app/tokens/colors.css` (`--color-bg-info`, `--color-text-info`).
- **De plek in het systeem:** `docs/code-architectuur.md` § 2.1 en § 2.5;
  `docs/grootboek/software-architectuur.md`; `src/components/CLAUDE.md`; PDR-010 (de starter en het
  label "Start conversation"); PDR-016 (de opbouw van de foutbox); PDR-019 (Screenreaders zijn geen
  doel), waardoor de rollen niet met een screenreader getest worden.
