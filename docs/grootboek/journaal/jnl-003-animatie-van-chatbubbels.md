---
titel: "Animatie van chatbubbels"
status: discovery
datum: 2026-10-23
kernvraag: Hoe gaat een AI-bubbel van denkpuntjes naar zijn tekst als één element dat groeit, zonder de scroll, de meeleesmarkering of de screen reader te breken?
doel-records:
  - "ADR voor de structuur van de bubbel (K2), te schrijven zodra het besloten is"
  - "HDR-013 (K10), geboekt 2026-10-23"
  - "een spec als bouwplan, zodra de kwesties besloten zijn"
  - "een PDR alleen als de mens het bewegingsgedrag als productbelofte behandelt"
---

# JNL-003 — Animatie van chatbubbels

**Kernvraag.** Hoe gaat een AI-bubbel van denkpuntjes naar zijn tekst als één element dat groeit,
zonder de scroll, de meeleesmarkering of de screen reader te breken?

**Hoofdboodschap.** `docs/plan.md` open vraag 11 ("One bubble for the AI's thinking dots and its
text") beschrijft het gewenste effect en twee manieren om aan het ene overlevende element te komen.
Wat de vraag niet beslecht, is hoe de bubbel behalve in hoogte ook in *breedte* groeit, en hoe dat
samengaat met het scroll-effect in de thread. Dat zijn de twee echte onbekenden; de rest zijn
keuzes voor de mens.

**Hoe dit is gemaakt.** Een lezing van `docs/plan.md` (open vraag 11 en het besluitenlog), de
componenten voor bubbel, beurtbubbel, denkbubbel en conversatiethread met hun CSS, en
`.claude/rules/safari-ios.md`. Er is geen code gewijzigd en er is nog niets besloten, behalve de
proef in K10.

**Waar de besluiten worden geboekt.** Dit werk draait op een `arc/*` branch en valt dus onder
HDR-001: de besluiten worden in het grootboek geboekt, niet in `plan.md`. Open vraag 11 in het plan
dateert van vóór 2026-10-20 en verwijst hiernaartoe, zodat de twee plekken niet uit elkaar lopen.

## Kwesties

| # | Kwestie | Status |
|---|---|---|
| K1 | Reikwijdte: alleen open vraag 11, of ook een enter-animatie op elke bubbel? | besloten 2026-10-23 |
| K2 | Het overlevende element: key op positie (a) of een wachtende AI-beurt (b)? | besloten 2026-10-23 (a) |
| K3 | Groeien in hoogte en breedte: welke techniek? (spike op een iPhone) | spike gebouwd 2026-10-23, tuning open |
| K4 | Het scroll-effect van de thread tegenover een bubbel die nog groeit | besloten 2026-10-23 (A) |
| K5 | Meelezen: mag de highlight starten terwijl de tekst nog verschijnt? | besloten 2026-10-23 (alleen als volledig zichtbaar) |
| K6 | Eén element, één rol: `status` of `log`? | geparkeerd 2026-10-23 |
| K7 | De bubbel van de gebruiker die groeit als zijn evaluatie binnenkomt | besloten 2026-10-23 (voorlopig alleen de AI-bubbel) |
| K8 | `prefers-reduced-motion` | besloten 2026-10-23 |
| K9 | Overlap met de pulse van de microfoonstip en de richting van puntjes en bounce | besloten 2026-10-23 (buiten scope); de pulse van de microfoonstip is op 2026-10-27 opgepakt als K13 |
| K10 | Modern Web Guidance: geeft het een beter antwoord voor K3? | proef afgesproken, uitkomst open |
| K11 | De bubbel van de gebruiker bij het versturen: wat animeert | besloten en gebouwd 2026-10-27, iPhone-test open; het krimpen in de balk en de vertraging van de denkbubbel volgen daarna |
| K12 | Start van de spraak tegenover het einde van de onthulling | geparkeerd 2026-10-27 |
| K13 | De luisterindicator pulseert zolang de microfoon live is | besloten en gebouwd 2026-10-27, getest op de iPhone |
| K15 | De denkbubbel wacht ook na een Retry 800ms | geparkeerd 2026-10-30 |
| K14 | De denkbubbel van de AI verschijnt met dezelfde onthulling, na een vertraging als hij op een verstuurde beurt volgt | besloten en gebouwd 2026-10-28; het antwoord groeit uit de grootte van de denkbubbel (spike 2026-10-30); getest op de iPhone |

### K1 — Reikwijdte

Op dit moment heeft geen enkele bubbel een enter-animatie; de enige animatie in de bubbels is de
pulse van de denkpuntjes. Open vraag 11 vraagt om de overgang van puntjes naar tekst en zegt dat
die "samen met het andere animatiewerk" moet gebeuren. **Vraag aan de mens:** gaat dit journaal
alleen over die overgang, of ook over een enter-animatie voor elke nieuwe bubbel (ook die van de
gebruiker)? Dat zijn twee afzonderlijke stukken werk met verschillend risico.

**Besluit (2026-10-23, de mens):** begin alleen met de overgang (optie A): de AI-bubbel die van
denkpuntjes naar zijn tekst gaat als één element. Een enter-animatie voor elke bubbel hoort niet
bij dit eerste stuk; die wordt besloten na de K3-spike, omdat wat "verschijnen" voor de AI-bubbel
betekent afhangt van K2 (met één overlevend element verschijnt hij wanneer de puntjes verschijnen,
niet wanneer de tekst verschijnt). Het groeien van de bubbel van de gebruiker bij de evaluatie
blijft K7, apart.

### K2 — Het overlevende element

Nu zijn `ThinkingBubble` en `TurnBubble` twee elementen, waarvan het ene unmount als het andere
mount, dus er is niets om te animeren. Het plan woog op 2026-10-08 twee wegen af:

- (a) **Key op positie.** De thread rendert één AI-bubbel met key `ai-<aantal AI-beurten ervoor>`
  voor zowel de wachttoestand als de echte beurt. Geen wijziging in de reducer, de types of de
  drivers. In het plan aanbevolen.
- (b) **Het wachten is onderdeel van de AI-beurt.** Een `pending` AI-beurt met een eigen
  identiteit. Eén element en één rol, maar de AI-beurt wordt een union en alles wat "de laatste
  beurt" leest, moet een pending beurt overslaan; twee bronnen van waarheid; kosten staan in het
  plan.

**Vraag aan de mens:** (a) bevestigen? (b) loont alleen als een mislukte AI-beurt ooit inline met
een retry wordt getoond, wat niet gepland is. Landt in een ADR.

**Besluit (2026-10-23, de mens):** (a), key op positie. Voor het besluit nagekeken: de reducer
voegt alleen beurten toe, werkt er één op zijn plek bij met `map`, of zet `turns` terug op `[]`
(session-reducer.ts regels 253, 467, 496, 314), dus de positiekey kan midden in een sessie niet
verschuiven. Regel 314 is niet geopend; aangenomen wordt dat het de reset naar een nieuwe sessie
is. De ADR is nog niet geschreven: die wacht op K3 tot en met K6, zodat één record de structuur
dekt, inclusief de rol waarvoor gekozen wordt. Voorwaarde die dit heropent: elke toekomstige actie
die één enkele beurt verwijdert.

### K3 — Groeien in hoogte en breedte

`.bubble` is `width: fit-content` met `max-width: 85%` en `overflow: hidden`
(`bubble.module.css`). Het plan noemt de `0fr`-naar-`1fr` grid-trick voor een onbekende hoogte;
die animeert één as. Van de breedte van drie puntjes naar de breedte van een afgebroken alinea is
een ander probleem. Op te lossen met een kleine spike op een echte iPhone, niet met een schatting.

**Baseline, geschreven op 2026-10-23 voordat er webguidance werd geraadpleegd (zie K10).** Dit is
wat de agent zou doen vanuit eigen kennis (training cutoff juni 2026), niet geverifieerd tegen de
huidige browserondersteuning:

- Alleen hoogte: `grid-template-rows: 0fr` naar `1fr` op een wrapper. Werkt in de huidige Safari,
  voor zover ik weet.
- Hoogte en breedte samen: meten, en dan expliciete pixelwaarden transitionen. Leg de uiteindelijke
  tekst op zijn uiteindelijke breedte uit (buiten beeld of in een layout effect), lees breedte en
  hoogte, zet die op de bubbel vanaf de maat van de puntjes, transition ernaartoe, en laat bij
  `transitionend` los naar `auto`. Onthul de tekst met een opacity-fade zodra de maat bijna
  bereikt is.
- Ik zou `interpolate-size: allow-keywords` of `calc-size()` niet gebruiken. Voor zover ik weet
  werken ze alleen in Chromium, en Safari op iPhone is een harde eis.
- Terugvaloptie als meten op iOS fragiel blijkt: geen maatanimatie; cross-fade de puntjes uit en
  de tekst in op een bubbel die al op zijn eindmaat staat. Minder ambitieus, maar goedkoop en
  robuust.
- Risico's die ik op iOS verwacht: `transitionend` dat niet afgaat als de tab op de achtergrond
  staat of de transition wordt onderbroken (dus het loslaten naar `auto` heeft een timeout als
  terugval nodig), en het samenspel met K4.

**Spike-resultaat (2026-10-23, gebouwd op `arc/bubble-animation`, op het oog getuned op desktop
Chrome en de iPhone van de mens; "werkt min of meer zoals gewild", wordt vervolgd).** Wat is
gebouwd is niet de baseline en ook niet de eerste spike:

- Eerste versie: een `clip-path`-onthulling vanaf de maat van de puntjes (K4(A)). Die draaide op de
  iPhone.
- Op verzoek van de mens vervangen door een `scale` 0 naar 1 vanuit de linkerbovenhoek, 350ms,
  met de overshoot in de easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`, piek ongeveer 1,10). Reden:
  een clip-path kan geen overshoot tonen, en keyframes van 1 naar 1,02 waren te zwak om te zien. De
  prijs, geaccepteerd: de bubbel begint niet meer op de maat van de puntjes; hij groeit uit zijn
  hoek.
- De tekst (label en alinea) is tijdens de groei transparant en faadt in over 200ms, beginnend
  wanneer de groei eindigt; één CSS-variabele (`--reveal-duration`) stuurt beide aan. De puntjes
  verdwijnen meteen. Reduced motion: geen scale, geen fade (beredeneerd, niet getest).
- De layout staat meteen op de eindmaat, dus K4(A) blijft gelden: het scroll-effect is ongewijzigd.

### K4 — Het scroll-effect tegenover een groeiende bubbel

`conversation-thread.tsx` scrolt in een `useLayoutEffect`, vóór de paint, op basis van het aantal
beurten, de statenaam en de evaluatiestatus van de laatste gebruikersbeurt. Het kiest tussen
"scroll naar de onderkant" en "lijn de bovenkant van de bubbel uit" aan de hand van de maat van de
bubbel op dat moment (`newestItem.offsetTop < bottomScrollTop`). Een bubbel die na dat moment
groeit, kan deels buiten beeld eindigen, of de beslissing om de bovenkant uit te lijnen kan op de
verkeerde maat worden genomen. **Vraag:** scrollen naar de *uiteindelijke* maat vooraf, of de
groei frame voor frame volgen?

Een scrollpositie kan niet verder gezet worden dan de inhoud op dat moment beslaat, dus "scrollen
naar de uiteindelijke maat" werkt alleen als de bubbel meteen zijn uiteindelijke ruimte in de
layout inneemt. Twee opties:

- (A) **Layout meteen op de eindmaat, animatie alleen visueel** (bijvoorbeeld een
  `clip-path`-onthulling). Het scroll-effect blijft ongewijzigd. Veilig, omdat de animerende
  bubbel altijd het laatste element in de thread is, dus er verschuift niets anders.
- (B) **De groei volgen** met een `ResizeObserver` of `requestAnimationFrame`, en tijdens de
  animatie opnieuw scrollen. Meer code, en scrollen tijdens een animatie is een bekende bron van
  jank op iOS.

**Besluit (2026-10-23, de mens):** (A), met (B) als terugval als de spike laat zien dat (A) op de
iPhone niet werkt. Niet getest: hoe `clip-path` zich op iOS gedraagt bij een bubbel met
`overflow: hidden` en afgeronde hoeken; de spike (K3) is waar dat uitgezocht wordt.

**Gevolg voor K3, genoteerd nadat de K3-baseline was geschreven.** Als de layout meteen op de
eindmaat staat, gaat K3 niet meer over het animeren van hoogte en breedte maar over het onthullen
van een al volle bubbel. Dat is een ander en makkelijker probleem dan de baseline aanneemt (meten
en dan pixelwaarden transitionen). De baseline is gelaten zoals geschreven, omdat zij het
referentiepunt voor HDR-013 is; dit gevolg maakte er geen deel van uit.

### K5 — Meelezen

`spokenWordCount` en `HighlightedText` starten zodra de state `aiSpeaking` is. **Vraag aan de
mens:** mag de highlight starten terwijl de tekst nog verschijnt, of pas als de tekst volledig
zichtbaar is? Het tweede is eenvoudiger om over na te denken, maar vertraagt de highlight met de
duur van de animatie.

**Besluit (2026-10-23, de mens):** de highlight start pas als de tekst volledig zichtbaar is. De
prijs is een vertraging van ongeveer de duur van de onthulling; hoe lang die is, is nog niet
bekend en volgt uit de spike (K3). Als de vertraging merkbaar blijkt, is dit de kwestie om te
heropenen. Hoe de highlight wordt tegengehouden (de start van de audio, de `spokenWordCount` of
alleen de styling) is een bouwdetail, hier niet besloten, en vraagt eerst een blik op de
playback-hook.

### K6 — Eén element, één rol

`ThinkingBubble` is `role="status"` met een `aria-label`; `TurnBubble` is een wrapper met een
alinea in de `role="log"` van de thread. Eén enkel overlevend element moet kiezen, of wisselen,
wat een screen reader aankondigt. VoiceOver viel uitdrukkelijk buiten scope voor stage 1 (zie de
reviewnotities in het plan), dus dit kan geparkeerd worden in plaats van besloten.

**Geparkeerd (2026-10-23, de mens).** Er is geen bestaand screen-readergedrag om te behouden en
geen testprocedure, dus nu besluiten zou blind besluiten zijn. Voorwaarde voor de bouw: de rollen
en het label die er nu zijn blijven werken zoals ze doen, en de builder meldt het als één
overlevend element dat onmogelijk maakt. Open risico, niet geverifieerd: de rol wisselen van een
element dat gemount blijft is een ongebruikelijk patroon voor screen readers, en het kan zijn dat
het niet zonder wijziging kan. Op te pakken met een echte VoiceOver-test, als eigen stuk werk.

### K7 — De bubbel van de gebruiker die groeit

De bubbel van de gebruiker groeit zodra zijn evaluatie is afgerond (de evaluatiesectie wordt eraan
vastgemaakt). Het plan zegt dat dezelfde techniek geldt. **Vraag:** dezelfde animatie als de
AI-bubbel, of in de eerste versie alleen de AI-bubbel?

**Besluit (2026-10-23, de mens):** in de eerste versie alleen de AI-bubbel. De bubbel van de
gebruiker blijft naar zijn grotere maat springen als de evaluatie is afgerond; dat is voor nu
geaccepteerd en is het vervolg als het in gebruik hindert. Opmerking: met K4(A) blijft het
scroll-effect daarvoor onaangeroerd, dus er gaat niets nieuws stuk.

### K8 — Reduced motion

De puntjespulse respecteert `prefers-reduced-motion` al. Het voorstel om te bevestigen: met
reduced motion aan worden de maattransition en elke enter-animatie overgeslagen en gaat de bubbel
direct naar zijn eindtoestand. Het oordeel is aan de mens.

**Besluit (2026-10-23, de mens):** bevestigd. Met `prefers-reduced-motion: reduce` wordt de
onthulling overgeslagen en gaat de bubbel direct naar zijn eindtoestand, zoals de puntjespulse nu
al doet. De meeleesvertraging van K5 verdwijnt dan ook voor die gebruikers.

### K9 — Overlap met ander animatiewerk

Het plan heeft een pulse gepland voor de stip van de actieve microfoon (besluitenlog, 09-25) en de
mens heeft na de TTS-latentiemetingen een richting van puntjes en bounce genoemd. **Vraag:** in of
buiten dit journaal? Standaard: erbuiten, om dit journaal bij de bubbels te houden.

**Besluit (2026-10-23, de mens):** erbuiten. De pulse van de microfoonstip en de richting van
puntjes en bounce zijn apart werk en krijgen een eigen journaal of kwestie als ze worden opgepakt.

### K10 — Modern Web Guidance

Geboekt als **HDR-013**: een proef met Google's Modern Web Guidance (agent skills met actuele
guidance over het webplatform), afgebakend tot deze feature. De vergelijking is de baseline van K3
hierboven tegenover wat de guidance aanbeveelt, met het resultaat als één regel hier na de
iPhone-spike. De guides omvatten `css/animate-to-intrinsic-sizes`, `ui-behaviors/motion` en
`ui-behaviors/animate-element-entry-exit`, en daarom is K3 het testgeval. De uitkomst is open; het
exitcriterium staat in HDR-013.

**Resultaat (in te vullen na de spike):** hetzelfde / anders en beter / anders en slechter /
niets toegevoegd; en of de iPhone het bevestigde.

**Feiten tot nu toe (2026-10-23; het oordeel is aan de mens en is nog niet geschreven).** De
builder raadpleegde de guidance voordat hij de K3-baseline las (guides
`animate-to-intrinsic-sizes`, `motion`, `animate-element-entry-exit`):

- Het bevestigt dat de baseline `interpolate-size` afwijst: de guide zelf zegt dat het alleen
  Chromium is (Chrome en Edge 129), en een directe sprong in Safari.
- De `motion`-guide beveelt `clip-path` aan voor geometrische onthullingen; dat kwam overeen met
  K4(A) en de eerste spike, die op de iPhone draaide. De uiteindelijke oplossing (scale met
  back-easing) is NIET wat de guidance aanbeveelt, en staat ook niet in de baseline: die kwam van
  de mens.
- Het veranderde niets aan de aanpak die de agent zou hebben gekozen zodra K4(A) besloten was, en
  zei niets over overshoot. Een redelijke lezing is "hetzelfde, met één bevestigende bron", met
  het voorbehoud dat het uiteindelijke ontwerp buiten het bereik van de guidance valt.
- De extra sectie "Modern Web Guidance" verstoorde het rapportformaat van de builder niet.
- `DISABLE_TELEMETRY=1` stond in de shell van de builder-subagent (zie HDR-013).

Procesnotitie: de eerste spike toonde helemaal geen animatie, omdat de wachtbubbel en het antwoord
in verschillende child-slots van de thread zaten, zodat React opnieuw mountte in plaats van het
element te hergebruiken. Noch de builder noch de reviewer ving het; het scherm van de mens wel.
K2(a) draagt daarom een voorwaarde die het plan niet noemde: beide moeten in DEZELFDE array zitten.

### K11 — De bubbel van de gebruiker bij het versturen

Nieuwe scope: K1 liet een enter-animatie voor de andere bubbels tot na de spike liggen, en de
timing van de AI-bubbel ligt nu vast (350ms, 200ms, zoals gebouwd). De evaluatie binnen de bubbel
van de gebruiker hoort hier NIET bij (K7 blijft: later).

Hoe het nu werkt (uit de code gelezen, 2026-10-27): de tekst die wordt samengesteld staat in de
bedieningsbalk onderaan, buiten de thread: het live transcript, daarna `DraftBubble` (of
`DraftEditor`). Send (`composing-controls.tsx`) dispatcht `USER_TURN_SENT`; de conceptbubbel
verdwijnt uit de balk en een `TurnBubble` voor de gebruiker verschijnt aan het eind van de thread,
vlak boven de balk. De verstuurde bubbel is dus een nieuw element, niet het concept dat verhuist.

Ontwerpvragen aan de mens, nog geen enkele beantwoord:

1. Wat beweegt: dezelfde scale-up als de AI-bubbel, gespiegeld (verankerd rechtsonder, omdat de
   bubbel van de gebruiker rechts staat), of een slide van de positie van het concept in de balk
   naar de thread? Aanbeveling: de scale. De slide vraagt om het concept te meten en vecht met
   een balk waarvan de inhoud bij Send verandert, met Safari als risico.
2. De tekst: tijdens de scale verborgen en daarna ingefaded, zoals in de AI-bubbel, of de hele tijd
   zichtbaar? Aanbeveling: zoals de AI-bubbel, voor de consistentie.
3. Timing: dezelfde 350ms, 200ms en curve als de AI-bubbel?
4. Op het apparaat te bekijken, niet besloten: de puntjes van de AI verschijnen op hetzelfde
   moment als de verstuurde bubbel, dus er komen twee dingen tegelijk binnen.

**Besluiten (2026-10-27, de mens):**

1. Dezelfde scale als de AI-bubbel, verankerd rechtsonder (de bubbel van de gebruiker staat
   rechts). Later in deze feature wil de mens waarschijnlijk dat het concept eerst in de
   bedieningsbalk krimpt tot scale 0 en daarna in de thread groeit; dat voegt een vertraging toe.
   Geen onderdeel van deze stap.
2. De tekst is eerst verborgen en faadt daarna in, zoals in de AI-bubbel.
3. Dezelfde timing: 350ms, 200ms, dezelfde curve.
4. Niet in deze stap, "zo meteen": de denkbubbel van de AI moet na een kleine vertraging
   verschijnen, zodat de gebruiker de volgorde ziet: eerst zijn eigen tekst, daarna lijkt de AI te
   gaan nadenken. De timing daarvan wordt hierna besloten.

De eigen groei van de evaluatie als die is afgerond blijft erbuiten (K7).

**Toegevoegd door de mens nadat hij het zag (2026-10-27):** de tekst "Evaluating…" mag niet
zichtbaar zijn zolang de tekst van de gebruiker nog verborgen is. Hij blijft verborgen tijdens de
scale en de fade van de tekst van de gebruiker en faadt daarna in, zodat een volgorde zichtbaar
is: scale, dan de tekst van de gebruiker, dan de evaluatietekst. De strook zelf (scheidingslijn en
blauwe achtergrond) is meteen zichtbaar en schaalt mee met de bubbel. De agent las "de strook
moet faden" eerst als de hele strook en bouwde dat; de mens corrigeerde dit.

**Baseline (de eigen aanpak van de agent, geschreven op 2026-10-27 voordat er webguidance werd
geraadpleegd; HDR-013, test 2).** Vanuit eigen kennis van de agent, niet geverifieerd tegen de
huidige browserondersteuning:

- Hergebruik de onthulling van de AI-bubbel in plaats van haar twee keer te schrijven: verplaats de
  regels `.reveal` en `.text` en de keyframes uit `ai-bubble.module.css` naar één gedeelde
  CSS-module, met het anker als custom property (`--reveal-origin`: linksboven voor de AI,
  rechtsonder voor de gebruiker). De waarden van de AI-animatie veranderen niet.
- De `TurnBubble` van de gebruiker krijgt de reveal-klasse en de tekstklasse als de beurt
  verschijnt nadat de thread is gemount. Hoe dat te weten: de thread onthoudt hoeveel beurten hij
  bij zijn eerste render had (een ref) en alleen beurten daarna animeren, zodat een remount niet
  alles opnieuw afspeelt.
- De scale houdt `transform-origin: bottom right` en dezelfde curve en duurvariabele. De layout
  staat meteen op de eindmaat (K4(A)), dus het scroll-effect blijft onaangeroerd.
- Verankerd rechtsonder groeit de overshoot naar links en omhoog, weg van de rechterrand, dus
  anders dan bij de AI-bubbel kan hij aan de zijkant niet worden afgesneden. Hij kan de bubbel
  erboven even overlappen.
- Reduced motion: geen scale en geen fade, zoals bij de AI-bubbel.
- Risico's die ik verwacht: het concept in de bedieningsbalk verdwijnt in hetzelfde frame waarin
  de bubbel op scale 0 begint, dus de verstuurde tekst is misschien even nergens te zien (een gat
  dat de latere stap van het krimpen in de balk zou vullen); Safari die de rand opnieuw rastert
  terwijl hij schaalt; en de extractie die de AI-animatie raakt, die de mens net heeft getuned en
  wil behouden.

**Gebouwd (2026-10-27), nog niet getest op de iPhone.** De verstuurde gebruikersbeurt schaalt van
0 naar 1 vanuit rechtsonder in 350ms met de curve van de AI-bubbel; "You: " en de alinea faden in
over 200ms vanaf 350ms; de tekst van de "Evaluating…"-strook (het kader is meteen zichtbaar) faadt
in over 200ms vanaf 800ms (een pauze van 250ms, `--evaluation-pause`, na de tekst van de
gebruiker: de mens vond het zonder pauze te snel). De twee onthullingen delen
`bubble-reveal.module.css` (het anker is `--reveal-origin`; de duren zijn `--reveal-duration` en
`--fade-duration`), en de waarden van de AI-bubbel zijn ongewijzigd. Alleen een beurt die
verschijnt nadat de thread is gemount animeert: de thread houdt zijn aantal beurten bij het mounten
vast in lazy state (de baseline zei een ref; de lazy state is hetzelfde idioom als
`startedAsThinking` in de AI-bubbel en voorkomt het lezen van een ref tijdens het renderen). Een
dev-only previewknop toont de verstuurde bubbel zonder gesprek (zie `docs/plan.md`, besluitenlog
10-27).

Guidance-resultaat voor de proef (alleen feiten, het oordeel is aan de mens): de Modern Web
Guidance was het op alle inhoudelijke punten eens met de baseline (een gedeelde module, alleen
`scale` en `opacity`, reduced motion uit, dezelfde curve). Het voegde één regel toe, de
identiteitsbasis `scale: 1` voor een element dat `scale` animeert (guide
`individual-transform-properties`), die bewust NIET is toegepast: het voegt een permanente stacking
context toe voor een risico dat hier niet opdook, en de reviewer vond geen echt risico in de CSS.
Het zei niets over een `transform-origin` die afhangt van de kant waarop de bubbel staat.

Proces: dit is test 2 van de HDR-013-proef. Volgorde: de mens besloot, de agent schreef de
baseline hierboven, de builder raadpleegt de guidance en rapporteert, er komt een rij in het
proeflog. Een buildercheck: alleen beurten die verschijnen nadat de thread is gemount mogen
animeren.

### K12 — Start van de spraak tegenover het einde van de onthulling

De mens wil dat de spraak van de AI pas start als de bubbel zijn eindmaat heeft. Geparkeerd op
2026-10-27 totdat het in de praktijk hindert. Redenering: het TTS-verzoek start als het antwoord
binnenkomt, samen met de animatie (`use-audio-playback.ts`), en de gemeten kloof tussen antwoord
en spraak was ongeveer 0,85s voor 240 tekens en 1,55s voor 584 (Azure, de standaardprovider;
desktop Chrome, 2026-10-05, iPhone niet gemeten). De onthulling duurt 350ms en de fade eindigt op
550ms, dus met een echte provider start de spraak normaal gesproken sowieso na de animatie. Een
kort antwoord, een snelle of gecachte respons, of de mock-TTS kan eerder starten. K5 blijft zoals
besloten: de highlight start wanneer de tekst volledig zichtbaar is, na de fade (550ms), niet aan
het einde van de scale (350ms). Er is niets gebouwd.

### K13 — De luisterindicator pulseert zolang de microfoon live is

K9 legde de pulse van de microfoonstip buiten dit journaal "tot hij wordt opgepakt"; de mens
pakte hem op 2026-10-27 op, dus hij is hier als kwestie geboekt in plaats van in een eigen
journaal. De richting van puntjes en bounce uit K9 blijft erbuiten.

Wat uit de referentie-app is gelezen, op aanwijzing van de mens, die het bestand aanwees (plan, "Keeping the
experiment honest"; alleen de regel en keyframes die hieronder genoemd worden, niets anders uit het
bestand): `.listeningIndicator` in `SpeechResults.module.css` is een stip (`--size-12`,
`--color-bg-primary`) met een `::after` eroverheen (`position: absolute; inset: 0`, dezelfde
cirkel, `background-color: inherit`) die `animation: pulse 1.6s infinite` draait; `@keyframes
pulse` gaat van `scale: 1; opacity: 0.8` naar `scale: 2.2; opacity: 0`. Een ring die wijder wordt
en vervaagt terwijl de stip blijft. Het origineel heeft geen `prefers-reduced-motion`-regel.

Zoals het nu hier is: de stip is `.listeningIndicator` in `live-transcript.module.css`, 8px, alleen gerenderd
zolang `microphoneIsLive` waar is (`live-transcript.tsx`), binnen een bubbel die klipt
(`overflow: hidden`).

**Besluiten (2026-10-27, de mens):**

1. Het element is die stip (degene die `listeningIndicator` heet).
2. Hij pulseert alleen terwijl de microfoon live is, niet in "Preparing mic…".
3. Reduced motion: geen pulse; alleen de gewone stip die er nu is.
4. (Nadat hij het zag met een stip van 8px, dezelfde dag.) De stip krijgt de maat van het
   origineel, 12px, en de ring de dimensie van het origineel (2,2 x de stip, dus 26,4px breed).
   Alleen de maat veranderen zou de stip uit lijn hebben gebracht, dus zijn `margin-top` volgt de
   regelhoogte: zie "Gebouwd".

Zonder eigen besluit overgenomen van het origineel: de animatie zelf (1,6s, infinite, scale 1 naar
2,2, opacity 0,8 naar 0). Tuning is voor het apparaat.

**Baseline (de eigen aanpak van de agent, geschreven op 2026-10-27 na het lezen van het origineel
en voordat er webguidance werd geraadpleegd; HDR-013, test 3).** Vanuit eigen kennis van de agent,
niet geverifieerd:

- Houd de structuur van het origineel: `position: relative` op `.listeningIndicator` en een
  `::after` eroverheen (`position: absolute; inset: 0`, `border-radius: inherit`,
  `background: inherit`) die de pulse draait. De `::after` is de ring; de stip zelf animeert nooit,
  dus de reduced-motionversie is precies de stip van nu.
- De keyframes zoals in het origineel, die alleen `scale` en `opacity` animeren
  (compositor-vriendelijk), met `transform-origin` in het midden (de default), zodat de ring
  gelijkmatig rond de stip groeit.
- De timing van het origineel (1,6s, infinite) en zijn standaard-easing; ik zou geen `ease-out`
  toevoegen tenzij het er op het apparaat verkeerd uitziet.
- Reduced motion: `animation: none` op de `::after` en verberg hem (`display: none`), omdat een
  statische ring op `scale: 1; opacity: 0.8` precies op de stip zou zitten maar zijn kleur zou
  veranderen.
- De ring reikt tot 2,2 x 8px = 17,6px, 4,8px voorbij de stip aan elke kant. De stip zit 16px van
  de linkerrand van de bubbel en 20px van de bovenkant (padding plus de `margin-top` van 8px), en
  8px van de tekst, dus ik verwacht geen klipping door de `overflow: hidden` van de bubbel en geen
  aanraking met de tekst.
- Geen `will-change` en geen JavaScript; de pulse duurt zo lang als het element bestaat.
- Risico's die ik verwacht: de ring die te zwak of te klein is bij 8px, en Safari die de cirkel
  opnieuw rastert terwijl hij schaalt.

**Gebouwd (2026-10-27), nog niet getest op de iPhone.** `.listeningIndicator` in
`live-transcript.module.css` heeft `position: relative` en een geneste `&::after`-ring (dezelfde
cirkel, `inset: 0`, `border-radius` en `background` geërfd, zodat de tokens behouden blijven) die
`listening-pulse 1.6s infinite` draait: `scale` 1 naar 2,2 en `opacity` 0,8 naar 0, de
standaard-easing van het origineel. Onder `prefers-reduced-motion: reduce` is de ring
`display: none`, zodat alleen de gewone stip van nu overblijft. De stip is 12px (`--size`), en zijn
`margin-top` is `calc((1lh - var(--size)) / 2)`: bij tekst van 18px met een regelhoogte van 1,25 is
een regel 22,5px, dus de marge is 5,25px en het midden van de stip (11,25px) komt op het midden van
de eerste regel. `lh` wordt ondersteund sinds Chrome 109 en Safari 16.4, uit eigen kennis van de
agent; de guidance heeft er geen guide over. Uit de CSS (niet gemeten): de ring reikt 7,2px voorbij
de stip, de stip staat 16px van de klipkant van de bubbel aan de linkerkant en 17,25px van de
bovenkant, en de tekst staat 8px weg, dus de ring wordt niet geklipt en eindigt 0,8px voor de
tekst, waar hij bijna transparant is; dat kan er op het apparaat krap uitzien.

Gevonden tijdens het nakijken van de uitlijning (niet veroorzaakt door de pulse, niet gewijzigd):
de tekst staat NIET op dezelfde plek als de stip verschijnt en verdwijnt. De stip neemt zijn breedte
plus de gap van 8px in, dus de tekst begint 20px van de padding-rand zolang de microfoon live is
(het was 16px met de stip van 8px) en 0px in "Preparing mic…" en in het afgeronde concept, die
geen stip hebben. De tekst verschuift 20px als de microfoon live gaat en 20px terug als de opname
stopt, en de tekstbreedte krimpt in dezelfde mate zolang hij live is, dus een langer transcript kan
op die momenten opnieuw afbreken. De comment bij `.listening` ("nothing shifts when recording ends
— the indicator dot is the only difference") klopt voor het frame, maar niet voor de tekst.

**Besluit 5 (2026-10-27, de mens, nadat hij het live zag):** de verschuiving in breedte was licht
storend, dus de drie bubbels waar de woorden van de gebruiker doorheen gaan tijdens het
samenstellen (live transcript, afgerond concept, editor) krijgen één gedeelde minimumbreedte,
`min-width: 17ch`, afgeleid van de placeholder "Preparing mic…" (de mens probeerde zelf 17ch). Die
is eenmalig gedefinieerd in `bubble.module.css` en wordt aangezet met `hasMinimumWidth` van
`Bubble`. De comment bij `.listening` is gecorrigeerd. Door de mens geaccepteerd: bij tekst langer
dan dat verschuift de tekst nog steeds 20px als de stip weggaat, omdat de kleur en de omlijning van
de bubbel op dat moment toch veranderen; en een concept van één woord is nu een bubbel van 17ch
breed. Afgewezen: de ruimte van de stip in elke toestand vrijhouden (een ontwerpwijziging, nu niet
nodig). De 17ch is een schatting (ongeveer 184px border box, 148px inhoud, uit de kennis van de
agent van het font; niet gemeten) en moet opnieuw worden afgeleid als de placeholdertekst, de stip,
de gap, de padding of het font verandert. Hij blijft onder 85% van de breedte van de thread op een
scherm van 320px, volgens dezelfde schatting.

Daarna is de eigen `min-width: 4ch` van de editor als overbodig verwijderd: de editortekst is een
blok in een bubbel die nu minstens 17ch breed is, en `min-height: 1lh` blijft voor de hoogte.
**Door de mens getest op de iPhone (2026-10-27): alle punten geslaagd**, die voor deze wijziging
waren opgesomd (de bubbel die zijn breedte houdt van "Preparing mic…" via live tot het concept, het
concept van één woord en de editor op 17ch, een lang transcript ongewijzigd, het smalle scherm).

Guidance-resultaat voor de proef (alleen feiten, het oordeel is aan de mens): geen enkele guide
dekt een pulserende indicator of een uitdijende ring; de zoekopdrachten vonden alleen algemene
motion-guides (`motion`, `individual-transform-properties`, `spinner`). Het was het met de baseline
eens over het animeren van alleen `scale` en `opacity` (de compositor), over het niet globaal
toepassen van `animation-duration: 0.01ms`, en over het per regel afhandelen van reduced motion.
Verschillen: (1) het schrijft een identiteitsbasis `scale: 1` voor op een element dat `scale`
animeert, die de baseline niet had. De builder paste hem toe op de `::after`-ring (de bubbels in
K11 hadden hem weggelaten); de mens besloot dat hij hier niet nodig is en liet hem weer
verwijderen (2026-10-28). Dus geen van de drie animaties heeft hem: er ging op het apparaat niets
zichtbaar mis zonder, de ring is een pseudo-element zonder kinderen, en de regel zou van elk ervan
een permanente stacking context maken. (2) Het geeft de voorkeur aan "standaard statisch, motion
als opt-in", en zijn `spinner`-guide zegt een blijvende animatie onder reduced motion te
vertragen in plaats van te stoppen, zodat de gebruiker nog kan zien dat hij actief is. Dat
spreekt besluit 3 tegen (geen pulse onder reduced motion). K13 is gevolgd; de gewone stip zegt al
dat de microfoon live is.

### K14 — De denkbubbel verschijnt met dezelfde onthulling, na een vertraging

Gewenst (de mens, 2026-10-28): de volgorde is zichtbaar. Eerst de tekst van de gebruiker, daarna
lijkt de AI te gaan nadenken. Nu wordt de wachtbubbel met de puntjes meteen gerenderd, direct onder
de verstuurde bubbel, en heeft hij geen eigen entry-animatie.

Hoe het nu werkt (uit de code gelezen): `USER_TURN_SENT` zet de sessie meteen in `aiThinking` en
het chatverzoek vertrekt meteen; de wachtende `AiBubble` (`turn={null}`, key `ai-<positie>`) staat
direct in de itemlijst van de thread (K2). Het antwoord onthult daarna in hetzelfde element, scale
0 naar 1 op zijn eindmaat (K4(A)).

**Besluiten (2026-10-28, de mens):**

1. De vertraging is 800ms: de denkbubbel verschijnt 800ms na de verstuurde beurt, het moment
   waarop de tekst "Evaluating…" begint (350 + 200 + de pauze van 250ms).
2. De denkbubbel krijgt dezelfde entry als de andere bubbels: hij schaalt 0 naar 1 (verankerd
   linksboven, 350ms, dezelfde curve), en de puntjes faden daarna in (200ms, zoals de tekst van de
   andere bubbels). Als de tekst van de AI binnenkomt, schaalt de bubbel opnieuw op naar de maat
   die hij dan heeft. (De agent leest dit als de onthulling die er nu is: het antwoord onthult
   vanaf scale 0 op zijn eindmaat. Als de mens bedoelde dat hij groeit vanaf de maat van de
   puntjesbubbel, is dat iets anders en moet dat gezegd worden.)
3. Na een verstuurde beurt start de entry na de vertraging van 800ms. Voor de openingsbeurt van de
   AI krijgt de denkbubbel dezelfde scale en fade maar ZONDER vertraging: hij start zodra het
   chatscherm getoond wordt.
4. Een preview van de hele reeks: de verstuurde bubbel, de denkbubbel na de vertraging, dan het
   antwoord.

Randvoorwaarden die de agent ziet: de vertraging is puur visueel (het verzoek wordt niet
vertraagd); de bubbel moet tijdens de vertraging gerenderd blijven, op scale 0, omdat K2 eist dat
de wachtbubbel en het antwoord één element zijn (een bubbel die pas na de vertraging mount zou een
nieuw element zijn als het antwoord eerst kwam, zonder onthulling); de timingvariabelen staan op
de `.reveal` van de bubbel van de gebruiker, dus de denkbubbel kan ze niet lezen en ze hebben één
gedeelde plek nodig; en een CSS-animatie start alleen opnieuw als haar `animation-name`
verandert, dus de entry van de puntjes en de onthulling van het antwoord hebben verschillende
keyframes-namen nodig.

**Gebouwd (2026-10-28), nog niet getest op de iPhone.** De wachtbubbel heeft een eigen entry:
`.waiting` draait `grow-waiting` (scale 0 naar 1, linksboven, 350ms, de gebruikelijke curve) met
een `backwards` fill en `animation-delay: var(--entry-delay, 0ms)`; `.waitingAfterSentTurn` zet
`--entry-delay` op `--thinking-delay`; de puntjes (`.waitingDots`, een klasse die aan
`ThinkingIndicator` wordt meegegeven) faden na de scale van de bubbel in over 200ms. Als het
antwoord binnenkomt, wordt de klasse `.reveal` (`grow`), een andere animatienaam, zodat de
onthulling van het antwoord net als eerder opnieuw start vanaf scale 0; haar regels zijn
ongewijzigd. `AiBubble` heeft een boolean prop `followsSentTurn`; de thread geeft
`turns.at(-1)?.author === "user"` mee. Tijdlijn in ms vanaf de verstuurde beurt: bubbel van de
gebruiker scale 0-350, tekst van de gebruiker 350-550, "Evaluating…" 800-1000, denkbubbel scale
800-1150, puntjes fade 1150-1350; voor de openingsbeurt schaalt de denkbubbel 0-350 en faden de
puntjes 350-550. Als het antwoord tijdens de vertraging binnenkomt, staat de bubbel nog op scale 0,
start de klassenwissel de onthulling van het antwoord meteen en zijn de puntjes weg: ze worden
nooit gezien (beredeneerd, niet gezien).

De timingvariabelen (`--reveal-duration` 350ms, `--fade-duration` 200ms, `--evaluation-pause`
250ms en `--thinking-delay`, hun som, 800ms) verhuisden van `.reveal` naar `.thread` in
`conversation-thread.module.css`, de ene voorouder van elke bubbel die ze leest; elk getal bestaat
één keer, en ze blijven buiten `src/app/tokens/` (timings van één feature, geen designtokens).
Dev-preview: een derde knop, "sent turn + thinking + reply", speelt de verstuurde bubbel, de
vertraagde denkbubbel en, ongeveer 3s na de druk, een kort antwoord af; de gebruikerspreview rendert
nu vóór de AI-preview. Niet gedaan: het concept dat eerst in de bedieningsbalk krimpt (later nog
gewenst).

**Verduidelijking van besluit 2 (2026-10-30, de mens, nadat hij het op het apparaat zag):** als de
tekst van de AI binnenkomt, mag de bubbel NIET tot niets krimpen en vanaf scale 0 opnieuw groeien;
hij moet groeien van de maat die de denkbubbel heeft naar de maat die hij dan krijgt (dit was de
open vraag over "de bubbel groeit naar de grootte van de tekst" in `docs/plan.md`, punt 11). De
agent had "opnieuw opschalen" gelezen als de onthulling vanaf 0 en zei dat; de mens corrigeerde
het. Oorspronkelijk was dit de K3-vraag en de eerste spike (een `clip-path`) beantwoordde hem
zonder overshoot.

Overwogen: de referentie-app animeert `width`/`height` met een `transition` tussen een expliciete
pending-maat en `fit-content`/`auto` (alleen de regels over maat zijn gelezen, op aanwijzing van de
mens). Niet overgenomen: een lengte naar een keyword is in gewone CSS niet te interpoleren (het
vraagt `interpolate-size`, dat Safari niet heeft), en het zou de layout animeren, tegen K4(A) in.
In plaats daarvan besloten tot een spike: een niet-uniforme `scale` (x en y) van de gemeten maat van
de denkbubbel naar de gemeten maat van het antwoord, zodat de layout meteen op de eindmaat blijft
(K4(A)) en de beweging een compositor-transform blijft. Vanaf het begin open: de randen en
hoekradii vervormen zolang de twee assen verschillen (de tekst is dan verborgen), en Safari. De
maat van de bubbel wordt gelezen met `offsetWidth`/`offsetHeight` (niet beïnvloed door transforms)
in een layout effect bij de wissel.

**Spike gebouwd en geaccepteerd (2026-10-30).** `AiBubble` meet de wachtbubbel één keer, terwijl
hij wacht, en de bubbel van het antwoord in een layout effect bij de wissel. De startscale per as
is oude maat / nieuwe maat (`--grow-from-x`, `--grow-from-y`, gezet als inline custom properties);
de `grow`-keyframes zijn `from { scale: var(--grow-from-x, 0) var(--grow-from-y, 0) }`, dus alles
zonder de variabelen (de bubbel van de gebruiker, een AI-antwoord dat nooit een denkbubbel was)
start nog steeds op 0 zoals eerder. Volgorde, door constructie en niet door timing: het antwoord
rendert eerst ZONDER de reveal-klasse, het layout effect leest de maten (wat een layout forceert
terwijl niets animeert) en zet state, en de synchrone re-render vóór de paint voegt de klasse, de
tekstklassen en de variabelen in één commit toe, zodat de animatie niet zonder ze kan starten. De
layout blijft meteen op de eindmaat (K4(A)); het scroll-effect is onaangeroerd. **Door de mens
getest op de iPhone: alle vijf punten goed** (het eerste frame bij de wissel heeft de maat van de
puntjesbubbel, de randen en hoeken terwijl de assen verschillen, de overshoot, een heel kort en een
heel lang antwoord, de scrollpositie; de bubbel van de gebruiker ongewijzigd).

Bekende beperkingen, niet opgelost: de check "was de denkbubbel ooit zichtbaar" gebruikt de tijd
sinds hij mountte, niet de eigen klok van de animatie (de commit van de wissel heeft die animatie
al verwijderd), dus een antwoord vlak na de vertraging groeit uit een bubbel die nauwelijks
zichtbaar was, en bij de openingsbeurt (geen vertraging) groeit een heel snel antwoord uit een
bubbel die nog in zijn eigen entry zit; de wachtmaat wordt één keer gemeten, dus een font- of
viewportwijziging tijdens het wachten zou de startmaat licht scheef laten; een antwoord dat kleiner
is dan de puntjesbubbel laat de verhouding boven 1 uitkomen en de bubbel krimpt naar zijn maat.

### K15 — De denkbubbel wacht ook na een Retry 800ms

Gevonden in de review van K14 (2026-10-28), op 2026-10-30 door de mens geparkeerd als niet
belangrijk.

Het probleem: na een fout drukt de gebruiker op Retry en de sessie gaat opnieuw naar `aiThinking`.
De foutstate had de wachtbubbel verwijderd, dus hij mount vers, en de laatste beurt is nog steeds
die van de gebruiker, dus `followsSentTurn` (`turns.at(-1)?.author === "user"`) is waar en de
bubbel wacht 800ms, onzichtbaar, op een "Evaluating…"-moment dat lang geleden voorbij is. De
gebruiker ziet 800ms niets na het drukken op Retry. Hetzelfde geldt als de thread tijdens
`aiThinking` opnieuw mount.

De eenvoudige oplossing, als hij wordt opgepakt: in `conversation-thread.tsx` de vertraging alleen
toepassen als de evaluatie van de laatste gebruikersbeurt nog pending is
(`evaluation.status === "pending"`), wat bij een nieuwe verzending altijd zo is en bij een retry
meestal niet. Kanttekeningen: het is een benadering (als de chat sneller mislukt dan de evaluatie,
is de evaluatie bij Retry nog pending en komt de vertraging terug, een zeldzamer geval); het
retry-pad in de reducer is niet nagelopen; en de propnaam `followsSentTurn` belooft dan te veel,
dus hernoem hem met de wijziging (bijvoorbeeld `followsFreshTurn`; twee bestanden).

Samen hiermee open gelaten uit dezelfde review, beide cosmetisch en dev-only of latent: nadat de
gebruikerspreview vóór de AI-preview was verplaatst, staat een achtergebleven AI-previewantwoord
boven een nieuwe "verstuurde gebruikersbubbel"; en `.waiting` in `bubble-reveal.module.css`
hardcodet `transform-origin: top left` terwijl `.reveal` `--reveal-origin` leest, wat zou
uiteenlopen als het anker van de AI-bubbel ooit veranderde.

## Besluitenlog

- **2026-10-23 — journaal geopend.** Kwesties K1 tot en met K10 uit een lezing van het plan en de
  code. De mens bevestigde dat dit werk voorlopig op `arc/*` blijft, dus geen nieuwe HDR over de
  scope van de methode.
- **2026-10-23 — K1 besloten.** De reikwijdte is alleen de overgang van puntjes naar tekst; een
  algemene enter-animatie wacht tot na de K3-spike.
- **2026-10-23 — K2 besloten.** Key op positie; de reducer is nagekeken op het verwijderen van
  beurten.
- **2026-10-23 — K4 besloten.** Layout meteen op de eindmaat, animatie alleen visueel; verandert
  waar K3 over gaat (zie de notitie bij K4).
- **2026-10-23 — K5 besloten.** De highlight start zodra de tekst volledig zichtbaar is.
- **2026-10-23 — K6 geparkeerd.** Met de voorwaarde dat de rollen en het label van nu blijven
  werken.
- **2026-10-23 — K7, K8, K9 besloten.** Voorlopig alleen de AI-bubbel; reduced motion slaat de
  onthulling over; het andere animatiewerk valt buiten scope.
- **2026-10-23 — K10 afgesproken als proef, geboekt als HDR-013 (geaccepteerd).** De baseline voor K3
  is geschreven voordat de guidance werd geraadpleegd.
- **2026-10-23 — spike gebouwd en gecommit op `arc/bubble-animation`.** `AiBubble` (één element,
  positiekey, wachtbubbel in dezelfde array als de beurten), scale 0 naar 1 met back-easing,
  vertraagde tekstfade. K3 blijft open voor tuning; K10 heeft feiten maar geen oordeel.
- **2026-10-27 — timing vastgelegd, K11 en K12 geopend.** De mens is tevreden met de timing en wil
  hem houden. Een dev-only preview van de AI-bubbel is toegevoegd om de overgang opnieuw af te
  spelen (zie `docs/plan.md`, besluitenlog 10-27; een eerste poging via de reducer werd in review
  afgewezen). K11: de bubbel van de gebruiker animeren bij Send. K12: spraakstart na de onthulling,
  geparkeerd. K5 ongewijzigd.
- **2026-10-27 — K11 gebouwd.** De bubbel van de gebruiker onthult bij het versturen, met de tekst
  "Evaluating…" die na de tekst van de gebruiker infaadt (de toevoeging van de mens; het kader van
  de strook is meteen zichtbaar); een dev-only preview van de verstuurde bubbel is toegevoegd. De
  basis `scale: 1` van de guidance is niet toegepast. Volgende: de iPhone-test, daarna de
  vertraging van de denkbubbel en, later, het krimpen van het concept in de bedieningsbalk.
- **2026-10-27 — K13 besloten en gebouwd.** De luisterstip pulseert zolang de microfoon live is
  (een ring, zoals in de originele app); geen pulse onder reduced motion. Test 3 van de
  HDR-013-proef. Door de mens op de iPhone getest, alle punten geslaagd. Volgende: het oordeel van
  de mens over de proef.
- **2026-10-28 — de identiteits-`scale: 1` van de guidance van de ring verwijderd.** De mens besloot
  dat hij daar niet nodig is. Nu consistent over de drie animaties van de proef: niet gebruikt.
- **2026-10-28 — K14 besloten en gebouwd.** De denkbubbel komt binnen met scale en fade, 800ms na
  een verstuurde beurt en meteen bij de openingsbeurt; de timingvariabelen verhuisden naar de
  thread; een gecombineerde dev-preview is toegevoegd. Volgende: de iPhone-test.
- **2026-10-30 — het antwoord groeit uit de maat van de denkbubbel.** De mens corrigeerde de lezing
  van de agent van besluit 2 (het antwoord mag niet vanaf scale 0 starten); een niet-uniforme scale
  vanaf de gemeten maten is gebouwd als spike en geaccepteerd na de iPhone-test (alle vijf
  punten). De laatste open wens van de oorspronkelijke vraag 11 in `docs/plan.md` is daarmee
  gebouwd.

**Waar je verder gaat (geschreven voor de volgende sessie):**

- Tunen op de telefoon: de tweede waarde van de cubic-bezier (1,56 geeft een piek van ongeveer
  1,10; 1,3 ongeveer 1,03; 1,0 geen), de 350ms en 200ms. Controleer een hoog antwoord onderaan de
  thread op een scrollverschuiving (een geschaald element vergroot de scrollbare ruimte even).
- K5 is besloten maar niet gebouwd: de meelees-highlight start nog steeds meteen. Daarvoor eerst
  een blik op de playback-hook.
- K6 is geparkeerd: een VoiceOver-test van de rolwissel op het overlevende element is nog
  verschuldigd.
- Opruiming die is blijven liggen: de AI-tak in `TurnBubble` is dode code en de markup ervan is
  gedupliceerd in `AiBubble`. Gedaan 2026-10-27: `ThinkingBubble` is nu `ThinkingIndicator` (de
  keuze van de mens, genoemd naar zijn functie in plaats van zijn vorm, zodat een andere animatie
  niet nog een hernoeming afdwingt; de agent had `ThinkingDots` voorgesteld).
- Nog niet geschreven: de ADR voor K2 (nadat K3 is afgerond), de spec, het K10-oordeel en het
  besluit over HDR-013 (behouden, uitzetten of bijstellen).
- Geparkeerd: K6 (VoiceOver), K12 (spraakstart na de onthulling) en K15 (de Retry-vertraging).

Dit journaal sluit wanneer K1 tot en met K9 besloten of geparkeerd zijn en de ADR (K2) en de spec
bestaan.
