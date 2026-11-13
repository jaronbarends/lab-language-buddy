# Code-architectuur

Dit document beschrijft hoe deze codebase georganiseerd moet zijn zodat een AI-agent er effectief
mee kan werken. Het is de doctrinekant van het agentic harnas (ARC's "het-agentic-harnas",
onderdeel D): alleen principes, geen drempels en geen register per bestand. Die staan in
`docs/code-architectuur-register.json` en worden door wie bouwt gelezen, niet opnieuw beslist.

Het grootboek (`docs/grootboek/`) is de bron voor *wat* deze app is en *waarom* ze is gevormd
zoals ze is. Dit document is het complement over *hoe*: hoe code georganiseerd moet zijn zodat de
agents die haar bouwen effectief blijven.

## 1. De these: codekwaliteit IS agentproductiviteit

Deze codebase wordt vrijwel geheel door Claude Code gebouwd en onderhouden. Jarón beoordeelt en
beslist; het meeste schrijft hij zelf niet. Dat maakt codekwaliteit een kwestie van
**productiviteit** en niet van esthetiek: hoe goed kan een agent de code lezen, begrijpen en
veilig wijzigen?

Drie bevindingen onderbouwen dit:

- **Agents hebben gezondere code nodig dan mensen.** CodeScene mat dat menselijke ontwikkelaars
  code begrijpen bij een code-healthscore van 9,0/10; AI-agents hebben minstens 9,4/10 nodig.
  Daaronder stijgt het defectrisico met 60% of meer — de agent kan niet vragen "wat bedoel je
  hier?", dus hij gokt, en gokt vaker fout in ongezonde code.
- **84% van de tokens van een agent gaat naar observatie.** JetBrains Research (NeurIPS 2025)
  vond dat het lezen van bestanden, foutmeldingen en tooluitvoer — niet het genereren — een
  gemiddelde agentbeurt domineert. Minder irrelevante context in een bestand bespaart tokens en
  verbetert wat er wordt gegenereerd.
- **AI-geschreven code geeft meer issues dan door mensen geschreven code.** CodeRabbit mat 10,83
  issues per door AI geschreven wijziging tegenover 6,45 bij door mensen geschreven — vooral
  logica-/correctheidsissues en over-abstractie. Dat is geen argument tegen AI-code; het is een
  argument voor een architectuur die voor juist die zwaktes compenseert.

Investeren in hoe de code is georganiseerd is hier geen overhead — het is de hefboom die bepaalt
hoe effectief de agent kan zijn die haar bouwt.

## 2. Kwalitatieve regels

Elke regel beschrijft een **wanneer**, geen **hoeveel**. Het aantal regels is een signaal, nooit
op zichzelf een trigger — de drempel die er een signaal van maakt staat in het register
(REQ-AH-11), niet hier.

### 2.1 Splits op de naad van onafhankelijke verandering

De toets: "als ik aspect A verander, moet ik dan ook aspect B in hetzelfde bestand begrijpen?"
Ja → houd bij elkaar. Nee → splits.

Een bestand dat twee aspecten mengt die om onafhankelijke redenen veranderen, dwingt een agent
context te laden die hij niet voor beide wijzigingen nodig heeft. Dat kost tokens en vergroot
de kans op een onbedoelde bewerking.

### 2.2 Samenhang boven compactheid

Een groot bestand dat één samenhangend domein is, is beter dan meerdere kleine bestanden die je
samen moet lezen om ze te begrijpen. Samenhangende code splitsen dwingt een agent meerdere bestanden
te openen en het verband daartussen te reconstrueren — meer context verbruikt, niet minder.

De vraag is nooit "is dit bestand te groot?" maar "hoort alles erin om dezelfde reden bij
elkaar?" Zo ja, dan mag het groot zijn.

*Praktijkvoorbeeld:* `session-reducer.ts` (577 regels, het grootste bestand in `src/`) is één
state machine met één reducer. `src/lib/CLAUDE.md` zegt al waarom: een nieuwe state breidt de
discriminated union uit en wordt niet als losse vlag ergens anders aangebouwd. De reducer splitsen
per beurtstatus zou één beslissing verspreiden over bestanden die allemaal samen gelezen moeten
worden om één transitie te begrijpen.

### 2.3 Een verzameling verwisselbare implementaties valt onder één registry

Bestaan er meerdere implementaties van dezelfde rol (een TTS-provider, een STT-provider), dan
vallen ze onder één registrymodule die op basis van configuratie tussen ze kiest — nooit via
verspreide `if (provider === ...)`-controles op elke aanroepplek. Wisselen is één env var
veranderen en verder niets. Een onbekende waarde gooit een fout en noemt de geldige; er is nooit
een stille fallback, zodat een typfout de app niet ongemerkt op de verkeerde provider kan laten.

*Praktijkvoorbeeld:* `getConfiguredStartFunction` in `src/lib/stt/index.ts` — één getypte map,
één expliciete throw bij een onbekende `NEXT_PUBLIC_STT_PROVIDER`. `src/lib/tts/` heeft dezelfde
vorm.

### 2.4 Dunne route handlers, de logica leeft ernaast

Een route handler (`src/app/api/**/route.ts`) is een dunne wrapper: de request parsen, de logica
aanroepen, de response vormen. Hij blijft klein door constructie en niet door regel — zodra een
handler vertakkende bedrijfslogica gaat opbouwen in plaats van te delegeren, is dat de naad (2.1)
om op te splitsen.

*Huidige stand:* elke route handler in `src/app/api/` is korter dan 35 regels. Houd het zo door
logica eruit te halen, niet door de eigen duidelijkheid van de handler weg te knippen.

### 2.5 Regel van drie voor extractie

Gedeelde code verhuist pas naar een gedeelde plek bij de derde onafhankelijke aanroeper. Twee
aanroepers → duplicatie is prima.

Vroeg extraheren creëert een koppeling die moeilijker ongedaan te maken is dan de duplicatie die
ze wegnam. Een agent die twee identieke blokken ziet, kan ze zelf extraheren zodra er een derde
aanroeper komt; een agent die een bestaande abstractie wil wijzigen, moet eerst uitzoeken wie
ervan afhangt — dat is de duurdere fout.

**Uitzondering: een gedeeld visueel recept.** Moet een wijziging aan het uiterlijk van het ene
onderdeel altijd ook in het andere gebeuren, dan beslist de toets van 2.1 en niet de telling: het
gedeelde uiterlijk staat op één plek, ook bij twee aanroepers. Dit geldt voor uiterlijk, niet voor
gedeelde logica; daarvoor blijft de telling. Het argument van deze regel, een koppeling die moeilijk
ongedaan te maken is, weegt licht bij een presentatiecomponent zonder logica.

*Praktijkvoorbeeld:* `Feedback` in `src/components/ui/feedback.tsx`. De fout- en de infomelding
delen hun hoeken, padding, borderdikte en de plek van icoon en tekst. Wat ze onderscheidt (kleur,
icoon, role, tekst) zit in de varianten `ErrorFeedback` en `InfoFeedback` en in de children.

### 2.6 Geen barrel files

Geen `index.ts` die alleen alles uit een map opnieuw exporteert. Importeer rechtstreeks uit de
module die definieert wat je nodig hebt.

Een registrymodule (2.3) is geen barrel: ze neemt één beslissing (welke implementatie) en
exporteert het resultaat van die beslissing, niet alles eronder. Er zijn op dit moment geen
barrel files in `src/` — houd dat zo terwijl de codebase groeit.

## 3. Hoe dit document evolueert

- Een nieuw structureel patroon dat het generaliseren waard is → voeg een genummerde regel toe
  onder sectie 2, met het praktijkvoorbeeld dat haar rechtvaardigde.
- Een bestand dat de drempel van het register overschrijdt → de beslissing (uitsluiten, een
  plafond geven of splitsen) komt in `docs/code-architectuur-register.json`, niet hier. Dit
  document blijft principes; het register blijft beslissingen.
- Als een regel niet meer past bij hoe de codebase werkelijk werkt, zeg dat dan en verander de
  regel — dit document beschrijft wat waar is, niet wat ooit de bedoeling was.

## 4. De refactor loop (REQ-AH-13)

De loop die dit document en zijn register levend houdt: `scripts/sweep-code-architectuur.mjs`
loopt elk bestand in `src/` langs aan de hand van de drempels en de beslissingen van het
register; de agent `refactor-werkplaats` (`.claude/agents/refactor-werkplaats.md`) leest dit
document en het register, en levert voor een gemarkeerd bestand ofwel een diff op een eigen
worktree-branch ofwel een nieuwe registerbeslissing — altijd één van beide.

**Wat het niet is, en waarom.** ARC's eigen conventie koppelt dit als een git-hook die de
refactor-agent onbewaakt, op de achtergrond, bij elke push start — ook bij pushes die helemaal
buiten Claude Code om gebeuren. Dat hier bouwen werd geweigerd door de eigen veiligheidsclassifier
van het harnas ("Create Unsafe Agents": een onbewaakte, code-bewerkende agent die door een
routine-gitoperatie wordt getriggerd). Wat er in plaats daarvan is, is sessiegebonden: een
PreToolUse-hook `guard-push-sweep` weigert een `git push` van de lead thread wanneer de sweep
nieuwe gemarkeerde bestanden vindt, en noemt ze; de lead thread start dan zelf `refactor-werkplaats`,
in dezelfde, door een mens begeleide sessie, voordat hij het opnieuw probeert. Hij vangt alleen
pushes die via Claude Code gaan — een push vanuit een gewone terminal omzeilt hem, dezelfde
bekende blinde vlek als bij de andere guard-hooks in dit harnas.
