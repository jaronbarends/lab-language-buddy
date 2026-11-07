# Voeden, niet activeren — het ontwerpprincipe van deze skill

## Het principe

Moderne modellen redeneren al uitstekend. Het harnas (de grondwet/CLAUDE.md,
skills, hooks) stuurt al effectief. Referentiedocumenten in een skill hoeven
reasoning niet te activeren — ze hoeven het model alleen te **voeden** met de
juiste domeincontext.

Het verschil is fundamenteel:

- **Output afdwingen** (een template met lege secties) onderdrukt reasoning.
  Het model gaat invullen in plaats van denken. Research toont dat rigide
  templates tot 40% prestatieverschil veroorzaken door distributional shift
  (He et al., 2024).

- **Reasoning activeren** (vragen stellen, denkstappen voorschrijven) is
  overbodig. Het model stelt zelf betere vragen dan een vooraf geschreven
  lijst kan anticiperen.

- **Voeden** (domeincontext bieden) geeft het model het materiaal om mee
  te redeneren. De kracht van een schrijfgids zit niet in de structuur die
  hij voorschrijft, maar in het begrip dat hij overdraagt.

## Wat dit betekent voor referentiedocumenten

Een referentiedocument in een skill is geen template en geen vragenlijst.
Het is een **contextdocument** dat domeinkennis overdraagt:

- Wat maakt dit documenttype uniek in **dit** project
- Welke krachten spelen typisch bij dit soort beslissingen
- Hoe ziet een sterk voorbeeld eruit en waarom werkt het
- Wat gaat er mis bij mechanisch gebruik
- Hoe raakt dit document het grotere geheel

De vorm van het uiteindelijke document bepaalt het model zelf, gevoed door
de context. Het referentiedocument bepaalt alleen wat rigide is (frontmatter,
registervelden) en laat de rest open.

## Drie niveaus van sturing

```
RIGIDE           WAT moet exact zo          Frontmatter-schema, register-format,
                                            status-lifecycle, mapstructuur

VOEDEND          WAT is de context          Schrijfgidsen, leidende documenten,
                                            framework-documenten (voeden met
                                            documenten, niet met templates!)

VRIJ             HOE het model het doet     Structuur, toon, diepte, volgorde
                                            van het uiteindelijke document
```

De fout die templates maken is het vrije niveau binnendringen: secties
voorschrijven, volgorde bepalen, invulvelden aanbieden. Dat neemt het
model de ruimte om de juiste vorm voor de specifieke situatie te kiezen.

## De toetssteen in de praktijk

Een gegenereerd document moet vóéden, geen invuloefening zijn. Twee
werkregels die daaruit volgen:

- **Een eerlijk gat is voedender dan vulsel.** Secties waarvoor geen stof
  bestaat krijgen "geen beslissing aangetroffen" — niet een paragraaf
  plausibel klinkende opvulling.
- **Het waarom hoort in het document.** Een kale invariantenlijst ("wij
  gebruiken X, Y, Z") is technisch juist maar krachteloos; de leidende
  principes erbij maken het document een denkpartner in plaats van een
  naslaglijst.

## Herkomst

Dit principe is gedestilleerd uit een sessie waarin de referentiedocumenten
van deze skill werden herontworpen: de templates (`*-template.md`) werden
vervangen door schrijfgidsen (`*-schrijfgids.md`).

Ondersteunende research:
- He et al. (2024): prompt-format beïnvloedt LLM-prestatie tot 40%
- Meta's Agentic Code Reasoning (2026): structureer het denkproces, niet de output
- Bucinca et al. (2021, Harvard): cognitive forcing functions activeren diep denken
- Stripe's schrijfcultuur: voorbeelddocumenten zijn nuttiger dan invultemplates

---

*Bron: ARC, gedeeld principe met de communiceren-skill — lokale kopie,
bijgesloten zodat de skill zelfdragend is.*
