# Systeemprompt Schrijfgids

Een systeemprompt is de instructie-set die een agent krijgt voordat die aan
het werk gaat — de `systemPrompt` van een agent-SDK, het brein van een
geautomatiseerde pijplijn. Deze gids gaat over systeemprompts die
**productie-output** maken: een scanner die repo's beoordeelt, een
classifier die documenten sorteert, een generator met een afnemer
stroomafwaarts. Daar gelden andere eisen dan voor een losse chat-prompt.

> De voorbeelden in deze gids komen uit ARC, het project waaruit deze skill
> stamt: een scanner-agent die repo's beoordeelt langs tientallen maatstaven.
> Die paden en namen zijn illustratie — het patroon is wat reist.

## Wat een goede systeemprompt doet

Een systeemprompt bepaalt hoe een grote hoeveelheid bronmateriaal wordt
omgezet in gestructureerde output die de afnemer accepteert. Op
**productie-niveau** is die output gecontracteerd: de velden die de
downstream-functie verwacht, moeten eruit komen. Op **verkennings-niveau**
is de output vrij — een nieuwe prompt mag eigen velden produceren zolang er
geen productie-consumer is. Houd die twee niveaus uit elkaar; ze hebben een
verschillende foutmodus.

Een variant groeit meestal rond een **hypothese**: "als ik de toon warmer
maak, wordt de coaching actionabeler" of "als ik de rapport-sectie kort,
krijgt het dashboard stabielere samenvattingen". De hypothese is niet
versiering — ze is wat het mogelijk maakt om te oordelen of de variant
beter is. Een variant zonder hypothese produceert een andere output; zonder
hypothese is onduidelijk of dat beter of slechter is.

## Hoe een register varianten vasthoudt

Geef de promptmap een eigen klein register (een YAML naast de prompts) dat
indexeert welke systeemprompts bestaan, wat hun actieve productie-versie is,
en welke varianten in ontwikkeling zijn — elk met zijn hypothese. Het werkt
als werkgeheugen: zodra een variant een eigen bestand krijgt, hoort hij ook
in het register, zodat een volgende sessie (of een andere engineer) weet dat
hij bestaat en waarom.

Een variant die in productie heeft gestaan blijft **altijd vindbaar**. De
sterke vorm is een onveranderlijke registratie buiten git om — bijvoorbeeld
een versietabel in de productie-database, gevuld als vaste stap in het
release-ritueel. Zo is voor elke historische output te achterhalen welke
exacte prompt hem heeft gemaakt.

## Wat de vorm breekt

**Een contractbreuk bij release.** Als de output afwijkt van wat de
downstream-functie accepteert, breekt de pijplijn op het moment van
livegang. De borg is een kalibratietest: een lab-runner die dezelfde
validator uitvoert die productie gebruikt — dan is het contract beschermd
vóór de release, niet erna.

**Een variant in productie zonder registratie is stil gif:** output van
gisteren is niet meer te reconstrueren, klantvragen worden onbeantwoordbaar.
Maak de registratie daarom een vaste, liefst geautomatiseerde stap in het
release-ritueel — een prompt die naar productie gaat zonder die stap mist
zijn plek in de audit trail.

**Verkenningen die nooit worden opgeruimd** stapelen op tot ruis. Het
register kan varianten markeren als `gearchiveerd` of `rejected` — dan
blijft de verkenning vindbaar zonder actief onderhoud te vragen.

## De vorm van een sterke productie-systeemprompt

> De échte productie-prompts van ARC zijn bewust **niet** in deze skill
> opgenomen — een systeemprompt die het oordeel van een product draagt, is
> kern-IP en reist nooit mee. Wat hieronder staat is de *architectuur* van
> zo'n prompt; het concrete recept (de beoordelingsteksten, de exacte
> gewichten) bouw je zelf, gevoed door dit patroon.

Een sterke productie-systeemprompt is opgebouwd in drie lagen, in deze volgorde:

1. **Persona-definitie** — wie de agent *is* terwijl hij werkt. Niet "je bent
   een code-reviewer", maar een scherp afgebakende rol met een oordeelshouding:
   wat telt, wat negeert hij, vanuit welk perspectief weegt hij. De persona is
   wat de output consistent maakt over duizend runs heen.
2. **Gewichtenstructuur** — hoe de criteria onderling wegen. Een prompt die
   alles even zwaar maakt, produceert vlakke uitkomsten. De gewichten maken
   expliciet wat een oordeel wérkelijk bepaalt, zodat het richting heeft.
3. **Output-instructies** — het contract. Exact welke velden in welke vorm de
   prompt moet opleveren, zodat de downstream-functie ze accepteert. Dit is de
   strengste laag: hier breekt de pijplijn bij release als de vorm afwijkt.
