# Requirements Schrijfgids

Een requirements-spec heeft een **omgekeerde lezer**: niet de Dirigent, maar de **bouwende
agent**. Een requirements-spec vertaalt een kennisbron — een kennisdocument,
een volwassenheidsmodel, een balans — naar bouwbare opdrachten. Alles wat de
spec-schrijfgids zegt over toon, taal van het gesprek en pyramid-stijl geldt
voor de Dirigent-lezer en geldt hier dus *niet*: deze vorm is bondig,
imperatief en toetsbaar, omdat dat aantoonbaar is wat een agent het beste
uitvoert.

De vorm is bewust rigide — markt en onderzoek convergeren erop (spec-driven
tooling zoals AWS Kiro/EARS en GitHub Spec Kit; Anthropic's context
engineering; empirie toont dat lange documenten direct voeren de slagingskans
*verlaagt*):

```markdown
### REQ-XX-NN · Bondig imperatief zinnetje (max ~8 woorden)
- **Klaar wanneer:** toetsbaar criterium — wat een agent of scanner kan vaststellen
- **Waarom:** 1-3 zinnen essentie, niet het hele verhaal
```

Vijf spelregels:

1. **Eén requirement = één verifieerbare werkeenheid** — past in één
   agent-cyclus; bundel niet.
2. **Klaar-wanneer is de borging, niet het document** — een detecteerbare
   staat, geen denkregel of gedragsregel.
3. **Het waarom is verplicht maar kort** — een kale takenlijst mist het doel;
   een ingeplakt kennisdocument verlaagt de slagingskans.
4. **Verdieping gelinkt, niet ingeplakt** (progressive disclosure); overlap
   tussen documenten verwijst naar één canoniek requirement.
5. **Volgorde = prioriteit** — lagen oplopend, bouw niet vooruit.

Na de intro volgt een korte **werkwijze**-sectie die de uitvoerende agent
positief stuurt: doe eerst feitelijk onderzoek in de eigen repo en bepaal per
requirement de status (bestaat al / bouwen / beslissing nodig met de
dirigent); open punten verdwijnen niet maar gaan via een journaal naar de
mens; bij een andere stack handel je in de geest van het requirement en leg
je de keuze vast in het bijbehorende leidende document.

**Sterk voorbeeld bijgesloten:**
`references/voorbeelden/req-kwaliteitsborging.md` — let op de toetsbare
klaar-wanneers met "telt niet"-afbakening, het fundament als expliciete
prerequisite, en de dosering ("een menu, geen vast pakket").

Wat déze vorm breekt: een klaar-wanneer dat een denkregel is in plaats van
een detecteerbare staat; requirements die meerdere werkeenheden bundelen;
audit-vondsten vermomd als requirement (die horen in een DFT); en
sessieverslag-staarten — ruis voor de agent. Ook hier verdampt de spec: is
elk klaar-wanneer gehaald, dan is de code (of het harnas) de waarheid en kan
het document naar archief; de kennisbron blijft staan.

> In ARC staat de volledige visie en marktonderbouwing in
> `lab/requirements/onderbouwing-requirements-voor-agents.md` — buiten het
> ARC-project is dat pad niet op te zoeken; het patroon hierboven is het
> overdraagbare deel.
