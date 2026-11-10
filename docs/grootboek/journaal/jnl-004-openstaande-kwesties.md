---
titel: Openstaande kwesties
status: discovery
datum: 2026-11-06
kernvraag: Welke vragen stonden open toen het plan werd afgebouwd of toen een journaal sloot, en wat is er per vraag bekend en niet bekend?
doel-records:
  - "per kwestie een record zodra er een besluit valt"
---

# JNL-004 — Openstaande kwesties

**Kernvraag.** Welke vragen stonden open toen het plan werd afgebouwd of toen een journaal sloot,
en wat is er per vraag bekend en niet bekend?

**Hoofdboodschap.** Het plan eindigde met negen open vragen. Dit journaal neemt ze over als
kwesties, met de bevindingen, cijfers en voorbehouden zoals het plan ze vastlegde. Niets is hier
besloten: waar een kwestie een status heeft (bewust geaccepteerd, niet gedaan, uitgesteld,
gedeeltelijk gemitigeerd), is dat de status uit het plan. Richtingen die het plan noemt zijn
onbevestigde ideeën, geen besluiten. Sinds 2026-11-08 staan hier ook vier kwesties uit JNL-003
(Animatie van chatbubbels), dat die dag sloot terwijl ze nog openstonden: K10 tot en met K13. K10
was daar al besloten, maar is niet gebouwd; K11 en K12 zijn daar geparkeerd; K13 was een
opruimpunt dat bleef liggen. Sinds 2026-11-09 staat hier ook K14, de bescherming van de
serverroutes, die uit JNL-001 (Instapjournaal: de software-balans) kwam toen dat sloot.

**Hoe dit is gemaakt.** K1 tot en met K9 zijn overgenomen uit de open vragen van `docs/plan.md`
bij de overzetting van het plan naar het grootboek (HDR-015). Bewoording en getallen zijn niet
aangepast. K10 tot en met K13 zijn op 2026-11-08 overgenomen uit JNL-003, met de bevindingen en
voorbehouden zoals ze daar stonden. K14 is op 2026-11-09 overgenomen uit JNL-001, K7. K1 kreeg op
2026-11-10 een scherpere titel (eerst: "Er zijn geen tests; review is de enige kwaliteitspoort") en
een gedateerde aanvulling; de tekst uit het plan staat er ongewijzigd boven.

## Kwesties

| # | Kwestie | Status |
|---|---|---|
| K1 | `src/` heeft geen testsuite | open |
| K2 | De Spaanse vlag is 81 KB | open (niet gedaan) |
| K3 | Een sessie beëindigen is één tik en niet terug te draaien | open (consistent met de opdracht) |
| K4 | "Cancel edit" breekt af op een 320px-viewport | open (niet opgelost) |
| K5 | Knoppen onder het toetsenbord tijdens het bewerken | geparkeerd (bewust geaccepteerd voor nu, later heroverwegen) |
| K6 | Audio bufferen terwijl de Deepgram-socket opent | geparkeerd (niet gebouwd, uitgesteld) |
| K7 | De invariant van het vastgehouden antwoord heeft geen enkele eigenaar | geparkeerd (uitgesteld) |
| K8 | De twee Gemini-wrappers en -routes zijn bijna-kopieën | geparkeerd (uitgesteld) |
| K9 | Native engine op iPhone: zacht geluid en geen opname in de tweede beurt | open (gedeeltelijk gemitigeerd, niet begrepen) |
| K10 | Meelezen: de highlight start pas als de tekst volledig zichtbaar is | besloten, niet gebouwd (JNL-003, K5) |
| K11 | De spraak start pas als de bubbel zijn eindmaat heeft | geparkeerd (JNL-003, K12) |
| K12 | De denkbubbel wacht ook na een Retry 800ms | geparkeerd (JNL-003, K15) |
| K13 | De AI-tak in `TurnBubble` is dode code | open (JNL-003, opruiming die bleef liggen) |
| K14 | Hoe de serverroutes te beschermen (vervolg op ADR-002) | geparkeerd 2026-11-09, heroverwegen rond 2026-12-09 (JNL-001, K7) |

Open betekent dat er niets over is besloten of gedaan; geparkeerd dat het bewust is uitgesteld of
geaccepteerd; besloten, niet gebouwd dat het besluit er is en de code nog niet. Tussen haakjes
staat de status uit het plan, of bij K10 tot en met K13 de plek in JNL-003 waar de kwestie vandaan
komt.

### K1 — `src/` heeft geen testsuite

**Wat er open staat.** Er zijn geen tests, dus review is nu de enige kwaliteitspoort.

**Wat de bron zegt.** `word-timing.ts` en de reducer zijn pure code en zouden bij Vitest passen.
De Gemini-aanroep zit nu in `askGemini`, zodat de foutpaden van de route getest kunnen worden
met die aanroep vervangen.

**Aangevuld op 2026-11-10.** De vraag is nu: krijgt `src/` een testsuite, dus een testrunner (een
script in `package.json` dat tests onder `src/` draait), en wat wordt er getest? De twee alinea's
hierboven komen uit het plan en kloppen niet meer helemaal:

- Er zijn wel tests, maar alleen onder `scripts/`, voor de tooling die documenten herschrijft
  (`npm run test:scripts`); zo besliste HDR-017 (Geen testsuite, behalve scripts die documenten
  herschrijven). Onder `src/` staat geen testbestand en geen testrunner, volgens de stand van
  2026-11-10 in HDR-028 (Mutatietests bij het risky-regime zijn geparkeerd tot `src/` een
  testsuite heeft).
- Review is niet de enige poort. Voor `src/` leunt de staffel op lint en typecheck, ook bij
  `risky` (triage-vraag 4, volgens HDR-028). Wat audio, opname of layout raakt, krijgt daarnaast
  een handmatige test op een echte iPhone.

**Wat ervan afhangt.** HDR-028 gaat pas weer open als `src/` een testrunner krijgt. De vragen
die dan op tafel liggen (wie de mutaties draait, alleen `risky` of ook `normal`, handmatig of met
een tool) staan in dat record.

**Niet besloten.** Of `src/` een suite krijgt, welke runner, en wat er getest wordt. De richting
uit het plan (Vitest, `word-timing.ts`, de reducer, `askGemini`) is niet aan de huidige code
getoetst.

Verwant: HDR-017 (Geen testsuite, behalve scripts die documenten herschrijven), HDR-028
(Mutatietests bij het risky-regime zijn geparkeerd tot `src/` een testsuite heeft)

### K2 — De Spaanse vlag is 81 KB

**Wat er open staat.** De Spaanse vlag (het volledige wapenschild) is 81 KB, tegen ongeveer 250
bytes voor elk van de andere vijf. Het detail is onzichtbaar op 24 px, en de vlag is in feite de
hele vlaggenpayload.

**Wat de bron zegt.** Hier is niets mee gedaan.

Verwant: ADR-016 (Vlaggen: flag-icons)

### K3 — Een sessie beëindigen is één tik en niet terug te draaien

**Wat er open staat.** Het beëindigen van een sessie vraagt geen bevestiging en er wordt niets
bewaard.

**Wat de bron zegt.** Dit is consistent met de opdracht, maar de knop staat naast Reply.

### K4 — "Cancel edit" breekt af op 320px

**Wat er open staat.** Op een viewport van 320px breekt "Cancel edit" af, met 2,2px, en de
andere knoppen in dezelfde rij ook.

**Wat de bron zegt.** 320px is de oorspronkelijke iPhone SE en iPhones met Display Zoom; iOS
26-toestellen zijn verder 375px of breder. Niet opgelost: die 2,2px dichten betekent een gap,
een lettergrootte of de zijmarge van het scherm aanpassen, en daar was niet om gevraagd.

Verwant: PDR-008 (Knoppen)

### K5 — Knoppen onder het toetsenbord tijdens het bewerken

**Wat er open staat.** Edit, Cancel edit en Send worden tijdens het bewerken deels of geheel
bedekt door het toetsenbord.

**Wat de bron zegt.** Jarón zag dit op een iPhone met een lang concept, met de app aan het
beginscherm toegevoegd. Met het toetsenbord open in de staat `editing` komen Edit en Cancel edit
onder het toetsenbord te liggen en wordt Send deels bedekt door de accessoirebalk van het
toetsenbord (de pijltjes en het vinkje). Bij heel korte concepten wordt een kleiner deel
bedekt; dat is gemeld, niet gemeten. In een Safari-tab staan de knoppen boven het toetsenbord,
maar worden ze bedekt door de adresbalk van Safari en de accessoirebalk. Het vinkje op de
accessoirebalk sluit het toetsenbord en maakt de knoppen vrij. De oorzaak is de `100dvh`-kolom,
die het toetsenbord niet verkleint; de 40vh-begrenzing van de tekst maakt het erger maar is niet
de hele oorzaak. Het is voor nu geaccepteerd en wordt in een latere fase heroverwogen (besluit
van 2026-10-02). Het versoepelt de eis uit de opdracht dat Send, Edit en Cancel bruikbaar blijven
met het toetsenbord open.

**Richtingen (onbevestigde ideeën, geen besluiten).** Dat het scherm de hoogte van
`window.visualViewport` volgt, eerst als spike; dat de bediening tijdens het bewerken boven de
editor komt; en de viewport-instelling `interactive-widget`, waarvan het gedrag in iOS Safari
niet is gecontroleerd.

Verwant: ADR-023 (Safari/iPhone: safe area en geaccepteerde beperkingen)

### K6 — Audio bufferen terwijl de Deepgram-socket opent

**Wat er open staat.** De recorder start pas als de socket open is. Wat eerder wordt gezegd
wordt dus niet opgenomen, en het scherm toont "Preparing mic…" tot het zover is.

**Wat de bron zegt.** Dit kwam naar voren in de review van de fase waarin de Deepgram-provider
werd gebouwd. Het alternatief is `MediaRecorder` starten direct na `getUserMedia`, de chunks in
volgorde bewaren (de eerste draagt de WebM-header) en ze versturen zodra de socket open is: geen
verloren woorden en geen wachttijd voor het spreken. Het kost code voor de volgorde en voor
sneller-dan-realtime doorsturen, en het eerste transcript komt in één golf. Nog niet gebouwd.
Gemeten op een iPhone na die review: het opzetten van de microfoonverbinding duurt ongeveer 1,5
seconde, wat Jarón te lang vindt; dit moet daarom op een later moment worden gebouwd.

Verwant: ADR-011 (Deepgram-provider)

### K7 — De invariant van het vastgehouden antwoord heeft geen enkele eigenaar

**Wat er open staat.** `pendingReply` hoort alleen te bestaan zolang de evaluatie van de laatste
gebruikersbeurt `pending` is. `AI_TURN_RECEIVED`, `EVALUATION_RECEIVED`, `EVALUATION_FAILED` en
`lastUserTurnIsBeingEvaluated` controleren dat elk afzonderlijk, en het type zegt het niet.

**Wat de bron zegt.** Dit kwam naar voren in de review van de fase waarin de evaluatie werd
gebouwd en is uitgesteld. Het is geen probleem zolang geen enkele actie het wachten kan
beëindigen. Zodra er een wordt ontworpen (annuleren, opnieuw proberen), maak dan eerst één
helper `releaseHeldReply(state)` in de reducer waar elke zo'n actie doorheen gaat, en verplaats
het vastgehouden antwoord pas in het type van de evaluatie als dat niet genoeg is.
`DEV_FORCED_TURN_STATE` kan elke combinatie zetten, maar alleen de stepper gebruikt die.

Verwant: ADR-018 (Sessiestate: één reducer, beurtstatus als discriminated union)

### K8 — De twee Gemini-wrappers en -routes zijn bijna-kopieën

**Wat er open staat.** `askGemini` en `askGeminiForEvaluation` herhalen de key-controle, de
aanroep van `interactions.create`, de controle op lege uitvoer en het parsen van de JSON; de twee
`route.ts`-handlers herhalen het foutpad.

**Wat de bron zegt.** Dit kwam naar voren in dezelfde review als K7 en is uitgesteld. De modellen
zijn bewust aparte constanten, en de evaluatie-aanroep heeft nu `store: false`, dus ze verschillen
al. Maak een helper zoals `callGeminiJson` bij de derde Gemini-aanroep, of wanneer de twee
blijvend uiteenlopen, zodat de parameters dan bekend zijn.

Verwant: ADR-019 (Chat-API en gespreksgeschiedenis)

### K9 — Native engine op iPhone: zacht geluid en geen opname in de tweede beurt

**Wat er open staat.** Twee problemen met de native engine op een iPhone, gevonden op 2026-10-13
bij het zoeken naar "het tweede bericht van de AI is zachter". Voor beide is er sinds 2026-10-14
een mitigatie (een vroege pauze in de playback-hook, een vastgehouden microfoonstream in
`native.ts`) en geen van beide is begrepen. Alle runs staan samengevat in `docs/ios-stt-runs.md`.
De ontwikkelomgeving staat weer op `NEXT_PUBLIC_STT_PROVIDER=native` (2026-10-14).

**Zacht geluid.** Op een iPhone met de native engine is alles wat de AI daarna zegt zachter zodra
de microfoon is gebruikt. Als de gebruiker het gesprek begint, is zelfs het eerste AI-bericht
zacht; als de AI begint, is het eerste bericht luid en zijn de latere dat niet. De TTS-provider
doet er niet toe (Azure en Google allebei), en de playback-hook is niet de oorzaak: het gedeelde
`Audio`-element houdt `volume` op 1, staat niet gedempt, en `navigator.audioSession.type` blijft
de hele tijd `auto`, zodat de pagina niet kan zien wat iOS verandert. Met Deepgram op dezelfde
iPhone was geen verschil in volume te horen, zowel als de AI begon als als de gebruiker begon
(op het gehoor, niet gemeten). De native engine maakt het dus zacht, en de eigen `getUserMedia`
van de app met de standaardconstraints doet dat niet.

**Geprobeerd, werkte niet.** `navigator.audioSession.type = "playback"` in `unlockAudio()` en
vóór `play()`: het volume bleef laag, en in een pagina die dit had gezet faalde `getUserMedia`
van Deepgram met `InvalidStateError: AudioSession category is not compatible with audio
capture`. Zet het niet. Teruggedraaid; er staat niets van in de code.

**Niet geprobeerd.**
- `echoCancellation`, `noiseSuppression` en `autoGainControl` op `false` in
  `getUserMedia({ audio })` (`deepgram.ts`). Alleen de moeite waard als Deepgram alsnog zacht
  blijkt te zijn, wat niet zo was.
- Afspelen via een `AudioContext` in plaats van het `<audio>`-element. Nu minder waarschijnlijk
  dat het helpt: het speelt via dezelfde audiosessie.
- Vanaf de Start-klik een microfoonstream open houden. Dit werd eerst afgewezen op de
  redenering dat een open opname iOS in play-and-record houdt en de spraak zacht maakt. Het is
  nooit zo geprobeerd, en een stream die *naast de native herkenning* wordt vastgehouden bleek
  het volume juist te herstellen (zie hieronder).

**Geen opname in de tweede gebruikersbeurt: gevonden op 2026-10-14, gemitigeerd, niet begrepen.**
Het loggen van elk `SpeechRecognition`-event en de events van het audio-element op een iPhone
liet zien dat iOS de engine niet beëindigt: één sessie start, `audiostart` vuurt, en daarna komt
er niets; na 20 tot 40 s volgt `error: audio-capture` ("Source is stopped"). De eigen track van
de vastgehouden stream eindigt ook, en met Deepgram gebeurde het één keer als een gesloten
socket (geen audiodata). De microfoonbron is dus dood voor elke gebruiker en het ligt niet aan de
Web Speech API. Het gebeurt wanneer de spraak van de AI **tot het natuurlijke einde** speelde
vóór de beurt van de gebruiker, en vooral in de **tweede** beurt:
- met natuurlijke einden nam beurt 2 op in 2 van de 13 runs en beurt 1 in 14 van de 15;
- met de vroege pauze nam beurt 2 op in 4 van de 4 (p ongeveer 0,006 als het geen verschil
  maakte);
- toen Reply de AI afkapte, nam het op in 8 van de 8.

Geen strikte A/B: de runs waren niet gerandomiseerd en de telefoon is herstart tussen de runs met
vroege pauze en de meeste andere.

Werkhypothese, niet aangetoond: het natuurlijke einde van de AI-audio *nadat de microfoon één
keer is gebruikt* breekt de volgende opname, wat zou passen bij beurt 1 die goed gaat.

Uitgesloten door runs:
- de stille clip van `unlockAudio()` die nog speelt als de herkenning start;
- een start te kort na het einde (mislukkingen kwamen bij 0,2 s en bij 23 s, successen bij 0,2 s
  en bij 27 s);
- `audioSession.type = "play-and-record"` vóór `start()`;
- de herstartlogica in `native.ts` (één sessie, nooit beëindigd);
- het `statechange`-event bij `ended` (het vuurt ook in runs die wel opnamen, en niet in een run
  die faalde).

`audioSession.state` is `undefined` op deze iPhone; `type` blijft `auto`.

De mitigatie zit in de playback-hook: de spraak wordt 0,15 s vóór het einde gepauzeerd en
`AI_SPEECH_FINISHED` wordt van daaruit verstuurd, zodat het element nooit eindigt; het derde
AI-bericht speelde nog. Met het controle-interval van 50 ms snijdt dit 0,10 tot 0,15 s van het
einde van elke spraak. Jarón luisterde op een iPhone en op desktop Chrome: de audio heeft aan het
einde genoeg stilte, zodat er geen gesproken tekst verloren ging (welke TTS-providers en zinnen
zijn gecontroleerd is niet vastgelegd).

Ook onverklaard: mislukte eerste beurten af en toe (ongeveer 1 op 8 zonder de vroege pauze), en,
vlak vóór de telefoon werd herstart, runs waarin de AI helemaal geen geluid gaf terwijl het
playback-log er normaal uitzag.

**Desktop Chrome met een Bluetooth-headset.** Het tweede AI-bericht begint op vol volume en zakt
na ongeveer een zin. Met de Windows-instelling "andere geluiden verminderen wanneer een
communicatie-activiteit wordt gedetecteerd" op "Do nothing" zakte het nog steeds; met de headset
uit was het beter (volume niet gemeten). De waarschijnlijke oorzaak is dat de headset naar zijn
belprofiel (HFP) schakelt zodra de microfoon opent, wat buiten de app valt. Niet geprobeerd: de
headset voor uitvoer en een andere microfoon voor invoer. Op 2026-10-14 testte Jarón desktop
Chrome met dezelfde headset met beide mitigaties (de vroege pauze en de vastgehouden
microfoonstream) aanwezig, en de daling trad niet op. Dat verzwakt de HFP-verklaring (een headset
die naar zijn belprofiel schakelt had met een open stream ook moeten dalen); de oorzaak blijft
onbekend. Het volume is op het gehoor beoordeeld, niet gemeten.

**Zacht geluid: gemitigeerd op 2026-10-14 door een microfoonstream vast te houden.** De vroege
pauze raakt het volume niet: daarmee is de AI in beurt 2 nog steeds zachter dan in beurt 1 (op
het gehoor). `native.ts` opent nu een `getUserMedia({ audio: true })`-stream die niets leest,
vóór de eerste sessie start, en geeft hem vrij in `stop()`; daarmee klinkt de AI in beurt 2 even
luid als in beurt 1 (3 gelogde runs, plus 2 met ook de vroege pauze, op het gehoor, met één vaste
zin zodat de woorden van de AI niet uitmaakten). Het herstelt de opname niet (0 van 3 in beurt 2
zonder de vroege pauze), dus beide zijn nodig. Waarom het werkt is niet bekend. Met Deepgram als
STT-engine was het verschil er al niet of veel kleiner.

**Neveneffecten van de vastgehouden stream, niet gecontroleerd.** De microfoonindicator staat aan
zolang de native engine luistert, zoals bij Deepgram al zo was; een geweigerde microfoon wordt
door de engine gemeld, niet door de stream; een stream die uit zichzelf sterft wordt niet
opgemerkt.

**Beide mitigaties draaien in elke browser, zonder platformcontrole.** De problemen zijn op de
iPhone gezien; op desktop werd de spraak ook zachter en de mitigatie voorkwam dat ook, en dat de
herkenning niet start is op desktop niet gezien. Jarón koos ervoor geen onderscheid tussen
platforms te maken, om de code eenvoudig te houden. Als de mitigatie op de iPhone niet meer nodig
is, is ze op desktop waarschijnlijk ook niet nodig.

**Als dit wordt opgepakt (richting uit de bron, geen besluit).** Draai de native engine op een
iPhone met beide mitigaties langer dan deze runs (de mislukte eerste beurten), en maak uit of
iOS toch standaard Deepgram moet gebruiken. De native standaard van 2026-10-12 rustte op een
indruk uit de spike; Jarón liet hem op 2026-10-14 staan.

Verwant: ADR-010 (Native engine op iPhone: herstart en twee mitigaties). De runs: `docs/ios-stt-runs.md`.

### K10 — Meelezen: de highlight start pas als de tekst volledig zichtbaar is

**Wat er open staat.** Het besluit is er, de code niet: de meelees-highlight start nog steeds
zodra de state `aiSpeaking` is, terwijl de tekst van het antwoord nog infaadt.

**Wat de bron zegt.** Besloten door Jarón op 2026-10-23 (JNL-003, K5): de highlight start pas als
de tekst volledig zichtbaar is, dus na de fade (op 550 ms), niet aan het einde van de scale
(350 ms). De prijs is een vertraging van ongeveer de duur van de onthulling; blijkt die merkbaar,
dan is dit de kwestie om te heropenen. Onder reduced motion is er geen onthulling, dus ook geen
vertraging (JNL-003, K8). Hoe de highlight wordt tegengehouden (de start van de audio, de
`spokenWordCount` of alleen de styling) is een bouwdetail, niet besloten, en vraagt eerst een blik
op de playback-hook.

Verwant: PDR-015 (Markering van het gesproken woord), PDR-013 (Animatie van bubbels). Overgenomen
uit JNL-003 (Animatie van chatbubbels), K5, op 2026-11-08.

### K11 — De spraak start pas als de bubbel zijn eindmaat heeft

**Wat er open staat.** Jarón wil dat de spraak van de AI pas start als de bubbel zijn eindmaat
heeft. Er is niets gebouwd.

**Wat de bron zegt.** Geparkeerd op 2026-10-27 tot het in de praktijk hindert (JNL-003, K12). Het
TTS-verzoek start als het antwoord binnenkomt, samen met de animatie (`use-audio-playback.ts`), en
de gemeten kloof tussen antwoord en spraak was ongeveer 0,85 s voor 240 tekens en 1,55 s voor 584
(Azure, de standaardprovider; desktop Chrome, 2026-10-05, iPhone niet gemeten). De onthulling
duurt 350 ms en de fade eindigt op 550 ms, dus met een echte provider start de spraak normaal
gesproken sowieso na de animatie. Een kort antwoord, een snelle of gecachte respons, of de
mock-TTS kan eerder starten. K10 blijft zoals besloten: de highlight start na de fade (550 ms),
niet aan het einde van de scale (350 ms).

Verwant: PDR-013 (Animatie van bubbels), ADR-020 (TTS-providers en stemmen). Overgenomen uit
JNL-003, K12, op 2026-11-08.

### K12 — De denkbubbel wacht ook na een Retry 800ms

**Wat er open staat.** Na een fout drukt de gebruiker op Retry en gaat de sessie opnieuw naar
`aiThinking`. De foutstate had de wachtbubbel verwijderd, dus hij mount vers, en de laatste beurt
is nog steeds die van de gebruiker, dus `followsSentTurn` (`turns.at(-1)?.author === "user"`) is
waar en de bubbel wacht 800 ms, onzichtbaar, op een "Evaluating…"-moment dat lang geleden voorbij
is. De gebruiker ziet 800 ms niets na het drukken op Retry. Hetzelfde geldt als de thread tijdens
`aiThinking` opnieuw mount.

**Wat de bron zegt.** Gevonden in de review van JNL-003 K14 (2026-10-28) en op 2026-10-30 door
Jarón geparkeerd als niet belangrijk (JNL-003, K15). De eenvoudige oplossing, als hij wordt
opgepakt: in `conversation-thread.tsx` de vertraging alleen toepassen als de evaluatie van de
laatste gebruikersbeurt nog pending is (`evaluation.status === "pending"`), wat bij een nieuwe
verzending altijd zo is en bij een retry meestal niet. Kanttekeningen: het is een benadering (als
de chat sneller mislukt dan de evaluatie, is de evaluatie bij Retry nog pending en komt de
vertraging terug, een zeldzamer geval); het retry-pad in de reducer is niet nagelopen; en de
propnaam `followsSentTurn` belooft dan te veel, dus hernoem hem met de wijziging (bijvoorbeeld
`followsFreshTurn`; twee bestanden).

Uit dezelfde review open gelaten, beide cosmetisch en dev-only of latent: nadat de
gebruikerspreview vóór de AI-preview was verplaatst, staat een achtergebleven AI-previewantwoord
boven een nieuwe "verstuurde gebruikersbubbel"; en `.waiting` in `bubble-reveal.module.css`
hardcodet `transform-origin: top left` terwijl `.reveal` `--reveal-origin` leest, wat zou
uiteenlopen als het anker van de AI-bubbel ooit veranderde.

Verwant: ADR-031 (De AI-bubbel blijft één element, van wachten tot antwoord), ADR-021 (Fouten en
herstel). Overgenomen uit JNL-003, K15, op 2026-11-08.

### K13 — De AI-tak in `TurnBubble` is dode code

**Wat er open staat.** `TurnBubble` heeft nog takken voor een AI-beurt (het anker op
`turn-bubble.tsx:37-38`, het label `"AI: "` op regel 50), maar krijgt alleen beurten van de
gebruiker: de thread rendert hem alleen voor `author === "user"` (`conversation-thread.tsx:101-111`)
en de dev-preview maakt een beurt met `author: "user"` (`user-bubble-preview-store.ts:53`). De
AI-bubbel is sinds 2026-10-23 een eigen component, `AiBubble` (ADR-031), met zijn eigen versie van
die markup.

**Wat de bron zegt.** In JNL-003 genoteerd als opruiming die bleef liggen: "de AI-tak in
`TurnBubble` is dode code en de markup ervan is gedupliceerd in `AiBubble`". Op 2026-11-08
nagekeken in de code (commit 9c15d01): nog steeds zo. Er is niets over besloten.

**Richting (onbevestigd idee, geen besluit).** De AI-takken weghalen en de prop van `TurnBubble`
versmallen tot een gebruikersbeurt, zodat het type zegt wat de component krijgt.

Verwant: ADR-031 (De AI-bubbel blijft één element, van wachten tot antwoord). Overgenomen uit
JNL-003 ("Waar je verder gaat"), op 2026-11-08.

### K14 — Hoe de serverroutes te beschermen (vervolg op ADR-002)

**Wat er open staat.** Niets controleert wie `/api/chat`, `/api/evaluation`, `/api/tts` of de twee
tokenroutes aanroept, en elk daarvan gebruikt een betaalde vendor-key. Iedereen die de
productie-URL kent, kan ze aanroepen. ADR-002 (De serverroutes hebben geen authenticatie van de
aanroeper, voorlopig geaccepteerd) heeft dat risico voorlopig geaccepteerd en zegt dat een nieuwe
ADR hem vervangt zodra er een beschermingsmechanisme is.

**Besluit: geparkeerd (2026-11-09, Jarón).** De kans dat iemand de productie-URL achterhaalt
beoordeelt Jarón als heel klein; dat is een inschatting, geen meting. Heroverwegen rond
2026-12-09. Er bestaat geen mechanisme dat hieraan herinnert: de datum staat alleen hier, en
Jarón houdt hem zelf bij.

**Voorwaarde voor de heroverweging.** ADR-002 noemt de bestedingslimieten per leverancier als
enige vangnet buiten de code, en Jarón heeft daar nog geen overzicht van (JNL-001, K3). Dat
overzicht hoort er bij de heroverweging te zijn; het bepaalt hoe groot de schade van een
misbruikte key zou zijn. Het is een taak van Jarón, buiten de repo.

**Wat de bron zegt.** JNL-001, K7, was nog niet onderzocht. Er is geen discovery gedaan en er ligt
geen voorstel. K7 noemde als uiteinden van de opties bescherming op platformniveau voor de
deployment (Vercel Deployment Protection, die voor het productiedomein bewust niet is ingesteld,
JNL-001 K3) en een controle binnen de routes. Voor beide geldt wat K7 vroeg: wat het kost aan
complexiteit en in de iPhone-flow. Dat is niet uitgezocht, en of Vercel Deployment Protection op
het productiedomein werkt voor aanroepen vanuit de app is evenmin nagegaan.

Verwant: ADR-002 (De serverroutes hebben geen authenticatie van de aanroeper, voorlopig
geaccepteerd). Overgenomen uit JNL-001, K7, op 2026-11-09.
