# ADR-031: De AI-bubbel blijft één element, van wachten tot antwoord

- **Status:** implemented
- **Date:** 2026-10-23
- **Implementation date:** 2026-10-30
- **Type:** Architecture Decision Record (WHAT do we build)

Besloten op 2026-10-23 in JNL-003 (Animatie van chatbubbels), K2 en K4; geboekt op 2026-11-08,
toen K3 besloten was en K6 buiten scope viel. Dit record beschrijft wat de code nu doet. Paden
zonder map staan in `src/components/conversation/`; regelnummers gelden voor commit e385630.

## De krachten

De bubbel van de AI moet van drie denkpuntjes naar zijn antwoord groeien. Vier dingen trekken
daarbij aan elkaar:

1. **React animeert alleen wat blijft.** Een element overleeft een re-render alleen met dezelfde
   key, op dezelfde plek, in dezelfde array van children. Eerst waren de puntjes en het antwoord
   twee componenten (`ThinkingBubble` en `TurnBubble`), waarvan de ene unmountte als de andere
   mountte: er was niets om te animeren (JNL-003, K2).
2. **De wachttoestand heeft nog geen beurt.** Een beurt krijgt haar identiteit, een
   `crypto.randomUUID()`, pas als ze bestaat (ADR-018, Sessiestate: één reducer, beurtstatus als
   discriminated union). Het overlevende element moet een identiteit hebben voordat er een beurt is.
3. **Een wachtende beurt in de state kost veel.** Optie (b) in K2 gaf het wachten een eigen
   `pending` AI-beurt. Dan wordt de AI-beurt een union, moet alles wat "de laatste beurt" leest een
   wachtende beurt overslaan, en zijn er twee bronnen van waarheid.
4. **Het scroll-effect beslist vóór de paint, op de maat van dat moment.** `ConversationThread`
   kiest in een layout effect tussen scrollen naar de onderkant en de bovenkant van de nieuwste
   bubbel uitlijnen (`conversation-thread.tsx:64-92`, de test op regel 87; PDR-011, Scroll en
   tekstvakken). Een bubbel die daarna nog in layout groeit, maakt die beslissing op de verkeerde
   maat (JNL-003, K4).

## Besluit

**Eén `AiBubble` voor het wachten en het antwoord, met een key op positie.** De key is
`ai-<n>`, met n het aantal AI-beurten vóór de bubbel (`conversation-thread.tsx:25-32`). Het
antwoord krijgt `countAiTurns(turns, index)` (regel 117), de wachtbubbel
`countAiTurns(turns, turns.length)` (regel 132): zolang de AI denkt, is dat dezelfde n die het
antwoord krijgt zodra het op die plek wordt toegevoegd. De bubbels van de gebruiker houden hun
`turn.id` als key (regel 104).

**In dezelfde array.** De wachtbubbel wordt in dezelfde `items`-array gezet als de beurten
(`conversation-thread.tsx:94-97` en 130), niet in een eigen child-slot van de thread. Alleen dan
herkent React het antwoord als hetzelfde element.

**Gemount vanaf het begin van het wachten.** De wachtbubbel staat in de array zodra de beurtstatus
`aiThinking` is (`conversation-thread.tsx:125-139`), ook tijdens de visuele vertraging na een
verstuurde beurt. Die vertraging is een `animation-delay` met `backwards` fill
(`bubble-reveal.module.css:67-78`), geen latere mount: een bubbel die pas na de vertraging mountte,
zou een nieuw element zijn als het antwoord eerder kwam (JNL-003, K14).

**De layout staat meteen op de eindmaat; alleen het beeld beweegt.** Wat animeert is `scale`, een
transform die de layout niet raakt (`bubble-reveal.module.css:20-25` en 86-96). Het scroll-effect
ziet daardoor de uiteindelijke maat en hoefde niet te veranderen (K4, optie A). Hoe de beweging
eruitziet (de curve, de duren, de groei vanaf de maat van de denkbubbel) is PDR-013 (Animatie van
bubbels).

**De beurt houdt haar eigen identiteit.** Alles wat naar een beurt wijst, matcht nog steeds op
`turn.id`: de beurt die wordt voorgelezen bijvoorbeeld (`conversation-thread.tsx:53-54` en 98-99;
`src/lib/session-reducer.ts:14-28`). De positiekey identificeert een plek in het gesprek, geen
beurt.

**De rol wisselt op hetzelfde element.** Tijdens het wachten is de bubbel `role="status"` met
`aria-label="Waiting for a reply"` (`ai-bubble.tsx:118-119`); als antwoord heeft hij geen eigen
rol en valt hij onder de `role="log"` van de thread (`ai-bubble.tsx:143-149`,
`conversation-thread.tsx:142-147`). Of een screenreader die wissel goed aankondigt, is niet getest
en wordt niet getest: screenreaders zijn geen doel van deze app (PDR-019, Screenreaders zijn geen
doel). De rollen en het label blijven staan zoals ze zijn.

## Waarom: drie principes

**Een bubbel is geen beurt.** De identiteit van een beurt is haar UUID, en alles wat naar een beurt
wijst gebruikt die. De identiteit van een bubbel is zijn plek: de n-de AI-bubbel. Die plek bestaat
al voordat de beurt er is, en daarom kan alleen een positie de wachtbubbel en het antwoord
verbinden zonder iets aan de reducer, de types of de drivers te veranderen. De off-by-one die
ADR-018 met de UUID uitsloot, kwam van een stale closure die `turns.length` las om naar een beurt
te wijzen; de positiekey wordt bij elke render uit de actuele `turns` berekend en wijst nergens
naar (redenering, niet apart getest).

**Hetzelfde element betekent: dezelfde key in dezelfde array.** Gelijke keys zijn niet genoeg. De
eerste spike gaf de wachtbubbel en het antwoord dezelfde key, maar zette ze in verschillende
child-slots van de thread, en er draaide geen animatie. De builder en de reviewer misten het,
omdat de reviewer de redenering over de key volgde zonder haar aan de code te toetsen; het werd
op het scherm van Jarón gevonden (incidentregister, patroon `reviewer-claim-unchecked`,
2026-10-23). De voorwaarde staat daarom als commentaar boven de array.

**Animeer het beeld, niet de layout.** Met de layout op de eindmaat blijft het scroll-effect zoals
het was, animeert alleen de compositor, en is er geen `interpolate-size` nodig, die Safari niet
heeft (JNL-003, K3 en K10). Om dezelfde reden is de `width`/`height`-transitie van de originele
app niet overgenomen (PDR-013).

## Voorgeschiedenis

- **Twee elementen.** Tot 2026-10-23 waren de puntjes `ThinkingBubble` (`role="status"`) en het
  antwoord een `TurnBubble` in de `log` van de thread; de wissel was een unmount en een mount
  (JNL-003, K2 en K6). `ThinkingBubble` heet nu `ThinkingIndicator` en zit in de wachtbubbel.
- **Optie (b), een wachtende AI-beurt.** Op 2026-10-08 in het plan afgewogen en op 2026-10-23
  afgewezen voor (a), om de kosten onder kracht 3.
- **De aparte child-slots.** De eerste spike zette de wachtbubbel in een eigen child-slot van de
  thread, naast de array van beurten, en remountte daardoor. Nog vóór de commit verholpen door beide in dezelfde array te zetten: commit
  750dc49 (2026-10-23) bevat de positiekey en die plaatsing samen.
- **Het wachten op K3 tot en met K6.** JNL-003 liet dit record wachten tot de tuning van K3
  klaar was en K6 (de rol) besloten, zodat één record de structuur dekte. Op 2026-11-08 besloot
  Jarón dat de timing niet verder getuned hoeft (K3) en dat screenreaders geen doel zijn (K6,
  PDR-019).

## Gevolgen

- **Wat K2 heropent.** Een actie die een AI-beurt verwijdert, tussenvoegt of verplaatst. De key
  telt alleen de AI-beurten vóór de bubbel (`conversation-thread.tsx:25-28`), dus zo'n actie
  verschuift de keys van de AI-bubbels erna, en React zou dan de state van het ene element (zoals
  `startedAsThinking`, `ai-bubble.tsx:51`) aan een andere beurt geven. Een gebruikersbeurt
  verwijderen of tussenvoegen verandert geen enkele AI-key. In JNL-003 K2 luidde de voorwaarde
  breder ("elke toekomstige actie die één enkele beurt verwijdert"); Jarón scherpte haar op
  2026-11-08 aan tot AI-beurten, na een review van CodeRabbit op PR #40. Nu voegt de reducer alleen
  toe (`src/lib/session-reducer.ts:253-254` en 467-468), werkt hij één beurt op haar plek bij
  (regel 496), of begint hij met een lege lijst bij `START` (regel 314); `SESSION_ENDED` verlaat de
  gespreksfase helemaal (regels 335-336). Komt zo'n actie er, dan is de key op positie niet meer
  veilig en moet dit record worden vervangen. Volgens JNL-003, K2 is (b) dan weer een kandidaat,
  net als wanneer een mislukte AI-beurt ooit inline met een retry wordt getoond.
- **Buiten dit record: de onthulling van de gebruikersbubbel.** Die vergelijkt de index van een
  beurt met het aantal beurten bij het mounten (`conversation-thread.tsx:45` en 108), en rekent er
  dus op dat beurten alleen worden toegevoegd. Het verwijderen of tussenvoegen van welke beurt ook
  breekt die aanname: een nieuwe gebruikersbubbel animeert daarna niet meer (redenering, niet
  getest). Dat hoort bij JNL-003 K11 en PDR-013 (Animatie van bubbels), niet bij dit besluit.
- **Niet "repareren" naar `turn.id`.** De positiekey lijkt de regel "nooit een array-index" uit
  ADR-018 en `.claude/rules/code-style.md` te breken. Dat doet hij niet: die regel gaat over wat
  naar een beurt wijst. Een key op `turn.id` breekt de animatie, want de wachtbubbel heeft geen
  beurt.
- **Landing.** § 3 van `docs/grootboek/software-architectuur.md` (Componenten:
  verantwoordelijkheden en beslissingen) noemt dit record voor de thread en de AI-bubbel. De
  commentaren in de code die naar JNL-003 K2 en K4 verwezen, verwijzen naar dit record.
- Verwant: PDR-013 (Animatie van bubbels), PDR-011 (Scroll en tekstvakken), ADR-018
  (Sessiestate: één reducer, beurtstatus als discriminated union), PDR-019 (Screenreaders zijn
  geen doel).
- Bron: JNL-003 (Animatie van chatbubbels), K2, K3, K4, K6 en K14.
