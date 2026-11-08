# HDR-022: Het driftsignaal meet vanaf de laatste reconciliatie, niet vanaf de laatste aanraking

- **Status:** implemented
- **Date:** 2026-11-07
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

Een alarm mag alleen stil worden door iemand die heeft gekeken. "Het document is aangeraakt" is
iets anders dan "het document is gecontroleerd". Wie die twee gelijkstelt, laat elk onderhoud aan
een document (een vertaling, een typfout, een hernoemde verwijzing) het alarm uitzetten.

## Besluit

Dit vervangt de baseline van HDR-008 (Een driftsignaal meldt wanneer de code die een leidend
document beschrijft is doorgegroeid). De rest van HDR-008 blijft: het is een signaal en geen
oordeel, `docs:check` waarschuwt bij drift en faalt alleen bij een kapotte verwijzing.

- **Het nulpunt komt uit het DFT-register.** Een DFT die een reconciliatie boekt, noemt de
  documenten die hij controleerde (`documenten`) en de commit waarvan de code is vergeleken
  (`getoetst-tegen`). Het nulpunt van een document is de nieuwste `getoetst-tegen`-commit van een
  afgesloten DFT (`status: resolved`) die het document noemt. Telt de nieuwste commit, niet het
  hoogste id: een commit die voorouder is van een andere kandidaat valt af, en tussen commits
  zonder voorouderrelatie beslist de commitdatum, bij gelijke datum de hash. Zo hangt de uitkomst
  niet af van de volgorde in het register. Een DFT die nog `open` of `in_progress` is telt niet:
  dan klopt het document nog niet.
- **Een aanraking van het document reset niets meer**, ook niet een commit die document en code
  samen wijzigt. Zo'n commit kan eerdere, ongecontroleerde commits verbergen.
- **Nooit gereconcilieerd:** dan meet het signaal vanaf de commit die het document toevoegde, en
  zegt het dat erbij.
- **De `CLAUDE.md`-bestanden onder `src/`** (nu `src/components/` en `src/lib/`) vallen onder het
  signaal, met hun eigen map als impliciet werkgebied en zonder front matter, omdat ze letterlijk in
  de context van elke sessie worden geladen.
- **Leidende documenten tellen niet als drift van zichzelf of van elkaar.** Elk leidend document
  valt buiten elk werkgebied. Een commit die alleen `src/lib/CLAUDE.md` wijzigt, is geen drift van
  de balans; een commit die `src/lib/CLAUDE.md` en `src/lib/prompt.ts` samen wijzigt, is dat wel,
  vanwege `prompt.ts`.
- **Fouten** waarop `docs:check` faalt:
  - een `getoetst-tegen` die geen commit-hash is, of een hash die git niet kent;
  - een `getoetst-tegen` van een afgesloten DFT die niet in de geschiedenis van `HEAD` staat;
  - een pad onder `documenten` dat niet exact het pad van een leidend document is, zoals
    `docs:drift` het noemt (forward slashes, dezelfde hoofdletters). Het register blijft canoniek
    en Windows en CI gedragen zich gelijk;
  - een afgesloten DFT die `documenten` noemt maar geen `getoetst-tegen` heeft;
  - een flow-lijst (`documenten: [a, b]`) in plaats van een block list.

**Werkregel** (in `docs/grootboek/CLAUDE.md`): volg een driftsignaal op met een reconciliatie en
boek die als DFT met `documenten` en `getoetst-tegen`. Pas als die DFT is afgesloten, wordt het
signaal stil.

## Waarom

HDR-008 accepteerde dit gat bewust ("een typfout in het document herstellen zet het signaal
terug") en schreef dat de eerste echte reconciliatie aan de beurt was zodra `arc/bubble-animation`
zou mergen. Wat er gebeurde:

1. PR #33 mergde op 2026-10-30 met 14 commits in het werkgebied van de software-balans, de hele
   bubbelanimatie inbegrepen.
2. `docs:check` waarschuwde daarna een week lang. Niemand reconcilieerde.
3. Op 2026-11-06 raakten drie commits de balans aan zonder hem tegen de code te leggen: verwijzingen
   naar plan.md vervangen (fee830a), Nederlandse bestandsnamen (afd34a7) en de vertaling (608274b).
   Daarmee zei het signaal "up to date".

Het gat was dus niet theoretisch: bij de eerste gelegenheid ging het precies zo mis. Het werd op
2026-11-07 gevonden bij een coachingsronde op het kennisdocument het-gedirigeerde-grootboek, niet
door het systeem zelf.

**Waarom uit het register en niet uit een veld in het document.** Jarón koos dit op 2026-11-07. De
reconciliatie is het bewijs, dus het nulpunt hoort bij het bewijs. Een veld in de front matter
(`gereconcilieerd: <commit>`) is een bewerking meer die vergeten kan worden en die los van een
reconciliatie gezet kan worden.

**Afgewezen:** commits wegfilteren op hun bericht ("Translate…"). Dat breekt bij de eerste commit
die anders heet.

**Waarom leidende documenten buiten elkaars werkgebied vallen.** Een werkgebied gaat over code, en
elk leidend document heeft nu een eigen alarm. Zonder die regel zou de fix van
`src/components/CLAUDE.md` in DFT-004 de balans meteen weer op "behind" zetten, en vier van de
zestien commits in het eerste signaal waren zulke documentwijzigingen. HDR-008 hield `package.json`
om dezelfde reden buiten het werkgebied: een alarm dat afgaat op iets wat er niet toe doet, wordt
genegeerd. Jarón besloot dit op 2026-11-07, net als de fout voor een afgesloten DFT zonder
`getoetst-tegen`: het veld vergeten is precies de stille bewerking die dit record wil voorkomen.

**Waarom een exact pad en geen normalisatie.** De eerste review vond dat `./docs/…`, backslashes en
hoofdletterverschillen op Windows door `existsSync` kwamen maar nooit matchten. De DFT telde dan
stil niet mee, terwijl dezelfde regel in CI (Linux) wel faalde. Een exact pad eisen vangt alle
varianten op beide platforms en houdt het register leesbaar voor een mens die het doorzoekt.

**Waarom de `CLAUDE.md`-bestanden onder `src/`.** Ze beschrijven de code het directst en worden
elke sessie geladen, dus een verouderde regel daarin stuurt elke builder de verkeerde kant op.
HDR-008 noemde ze al als mogelijke uitbreiding.

## Gevolgen

- **Het signaal is luider.** Elke codewijziging in een werkgebied blijft gemeld tot er een DFT is.
  Hoe vaak er wordt gereconcilieerd (per PR, per stage, per week) ligt niet vast. Gaat de
  waarschuwing in `docs:check` een vast onderdeel van het beeld worden dat niemand meer leest, dan
  is dat het moment om een ritme te kiezen.
- **De eerste reconciliatie onder deze regel is DFT-004.** Zonder die DFT staan de balans en de
  twee `src/`-`CLAUDE.md`-bestanden direct op "behind".
- **Grenzen, geaccepteerd:**
  - Het register bewijst dat iemand een reconciliatie afsloot, niet dat hij goed keek. Een DFT die
    te snel `resolved` wordt, zet het alarm toch stil.
  - Het nulpunt van een document dat nooit is gereconcilieerd, volgt geen hernoemingen: na een
    hernoeming telt de commit van de nieuwe naam. Wordt een document hernoemd dat al in een
    afgesloten DFT staat, dan wordt het oude pad onder `documenten` een fout tot iemand die
    registerregel bijwerkt. Dat is bewust: de fout zegt waar het nulpunt kwijt is.
  - Een `getoetst-tegen` die na een squash of rebase niet meer in de geschiedenis van `HEAD`
    staat, is een fout: zet hem op de commit die de gereconcilieerde code bevat. Eerst stond hier
    dat zo'n commit het signaal alleen luider maakt. CodeRabbit vond op PR #37 het geval waarin
    het juist stil wordt: de commit bevat code in het werkgebied die `HEAD` niet heeft, en `HEAD`
    veranderde het werkgebied sinds de merge-base niet. Met de merge commits die deze repo
    gebruikt, speelt dit niet.
  - De root-`CLAUDE.md`, `docs/grootboek/CLAUDE.md` en `docs/code-architectuur.md` zijn leidende
    documenten zonder werkgebied: ze beschrijven werkafspraken en doctrine, geen code. Ze kunnen
    niet onder `documenten` in een DFT worden geboekt. Moet zo'n document tegen de code worden
    gelegd, dan krijgt het eerst een werkgebied.
- **`docs/grootboek/CLAUDE.md` is een leidend document.** De wijziging aan de werkregel is aan
  Jarón getoond en gecontroleerd (communicatieplicht).
- Bijdrage aan REQ-GG-05 (Richt drift-detectie in): HDR-008 gaf het signaal, dit record zorgt dat
  het alleen stil wordt na een controle.

Verwant: HDR-008 (Een driftsignaal meldt wanneer de code die een leidend document beschrijft is doorgegroeid)
Verwant: DFT-001 (Eerste reconciliatie van de software-balans — geen drift gevonden)
Verwant: HDR-018 (Contextlagen en een drift-check voor de documentatie)
