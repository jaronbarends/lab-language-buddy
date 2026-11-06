---
titel: Metingen van de corrector
status: discovery
datum: 2026-10-06
kernvraag: Wat is er gemeten aan de corrector, en wat houdt niet stand of is nog niet beoordeeld?
doel-records:
  - "per kwestie een record zodra er een besluit valt"
---

# JNL-005 — Metingen van de corrector

**Kernvraag.** Wat is er gemeten aan de corrector, en wat houdt niet stand of is nog niet
beoordeeld?

**Hoofdboodschap.** Er zijn drie metingen: de vergelijking van drie promptvarianten (6 en 7
oktober), dezelfde invoer opnieuw met de echte prompts, en de contextmeting van 10 oktober. De
vergelijking en de context staan als besluit in ADR-007 (Evaluatie per beurt, in een eigen call) en
de promptregels in ADR-008 (Prompts van de corrector). Dit journaal bewaart de cijfers en de
voorbehouden, en de zwakke plekken die gemeten maar niet opgelost zijn. De vergelijking van de
varianten is klein en grof: lees haar als richting.

**Hoe dit is gemaakt.** Overgenomen uit het gedeelte van `docs/plan.md` over de evaluatiefase bij de
overzetting van het plan naar het grootboek (HDR-015). Bewoording en getallen zijn niet aangepast.

## Kwesties

| # | Kwestie | Status |
|---|---|---|
| K1 | Het spellingverbod houdt niet stand als spelling het enige zichtbare gebrek is | open (gemeten, niet opgelost) |
| K2 | De transcriptiehint werkt voor een deel van de gevallen | open (gemeten, niet opgelost) |
| K3 | De aparte call levert meer aanhalingstekens in de tekst | open (gemeten, niet opgelost) |
| K4 | Speech-to-text-fouten worden als taalfouten gecorrigeerd | open (niet beoordeeld) |

Tussen haakjes staat de status uit het plan: gemeten maar niet opgelost, of niet beoordeeld.

## De metingen

### Drie varianten, 6 en 7 oktober

`gemini-3.1-flash-lite`, Noors B1, 5 runs per invoer over 8 invoeren: duidelijke fouten, correcte
zinnen, een lange zin met een kleine fout, een fout die op een speech-to-text-fout lijkt, een zin in
kleine letters en een zin zonder diakrieten. Drie varianten, 40 calls elk: A de prompt voor één
call, C één call met een expliciete tweede rol voor `correction`, D een aparte correctorcall met de
bewoording van de originele app.

| | A | C | D |
|---|---|---|---|
| Segmenttypes verkeerd | 7 | 4 | 0 |
| Correctie op een correcte zin | 0 | 0 | 0 |
| Correctie waar alleen spelling of diakrieten niet klopten (10 calls) | 10 | 10 | 10 |
| ...waarvan alleen spelling | 6 | 3 | 4 |
| `eld` (een waarschijnlijke transcriptiefout) `null` of als zodanig gemarkeerd, van 5 | 1 | 0 | 3 |
| Aanhalingstekens in de tekst, van 30 | 4 | 3 | 7 |

De segmentregels in de `description`-velden van het schema zetten in plaats van in de prompt is
geprobeerd en was slechter: meer verkeerde types, en de uitleg in de verkeerde taal.

### Opnieuw met de echte prompts

De regels in `system_instruction`, via `/api/evaluation` op de dev server, 40 calls over dezelfde 8
invoeren (de eerdere meting zette de regels in `input`):

- verkeerde types 1 van 30;
- een correctie op de twee correcte zinnen 0 van 10;
- een correctie op de zin in kleine letters en de zin zonder diakrieten 10 van 10, waarvan 5 alleen
  spelling;
- `eld` `null` of als transcriptiefout gemarkeerd 2 van 5;
- aanhalingstekens in de tekst 8 van 30.

De toegevoegde regel om niet naar een fout te zoeken veranderde niets bij de invoeren waar alleen de
spelling afweek. De latency van de call: mediaan 2550 ms (1897 tot 3241), vier verzoeken tegelijk,
dev server inbegrepen. Dat is ruim onder de time-out van 10 s en ongeveer even lang als de
chatcall.

### De context, 10 oktober

`gemini-3.1-flash-lite`, Nederlands B1, de AI vraagt hoe de gebruiker zijn koffie neemt, de
gebruiker antwoordt `Ik vind zwart het lekkerst.`, 6 runs per variant:

- zonder het gesprek maakten 6 van 6 correcties bezwaar tegen *lekkerst* (het zou alleen voor smaak
  zijn, terwijl het antwoord op een vraag over drinken was);
- met het gesprek 0 van 6, allemaal `null`;
- een echte fout in een later bericht werd met de geschiedenis nog gevonden (3 van 3);
- het verborgen startbericht werd in de feedback niet genoemd (0 van 3);
- drie runs via de echte route gaven ook `null`.

## De kwesties uitgewerkt

### K1 — Het spellingverbod houdt niet stand

**Wat er open staat.** Als spelling het enige zichtbare gebrek is, geeft de corrector toch een
correctie: 10 van 10 in elke variant, waarvan alleen spelling 6, 3 en 4 (A, C, D), en met de echte
prompts 10 van 10 waarvan 5 alleen spelling.

**Wat de bron zegt.** Gemeten, niet opgelost. De regel over niet naar een fout zoeken veranderde
niets op deze invoeren. De corrector geeft een correctie op de twee correcte zinnen niet (0 van 10).
Het plan merkt op dat de heuristieken grof waren en de meting klein.

Verwant: ADR-008 (Prompts van de corrector)

### K2 — De transcriptiehint werkt voor een deel

**Wat er open staat.** De fout `eld` die waarschijnlijk een transcriptiefout is, wordt `null` of als
zodanig gemarkeerd in 3 van 5 gevallen met de losse call op de bewoording van de originele app, en
in 2 van 5 met de echte prompts.

**Wat de bron zegt.** Gemeten, niet opgelost.

Verwant: ADR-008 (Prompts van de corrector)

### K3 — Meer aanhalingstekens in de aparte call

**Wat er open staat.** De aparte call levert meer aanhalingstekens in de tekst (7 van 30, tegen 4 en
3 in de varianten met één call), en met de echte prompts 8 van 30.

**Wat de bron zegt.** Gemeten, niet opgelost. De bedoeling is dat de segmenten zelf hun spaties
dragen en het model geen aanhalingstekens toevoegt: het type markeert de frase.

Verwant: ADR-007 (Evaluatie per beurt, in een eigen call)

### K4 — Speech-to-text-fouten als taalfouten

**Wat er open staat.** Of speech-to-text-fouten door de corrector als taalfouten worden aangemerkt.

**Wat de bron zegt.** Niet geverifieerd. Het plan zegt dat dit in verder gebruik beoordeeld moet
worden. De prompt vraagt de corrector bij een mogelijke transcriptiefout dat te zeggen in plaats
van haar als taalfout uit te leggen; hoe goed dat werkt in gebruik is niet vastgelegd.

Verwant: ADR-008 (Prompts van de corrector)
