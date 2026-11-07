# ADR-001: Omgeving en deployment-topologie

- **Status:** accepted
- **Date:** 2026-10-20
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

`main` is de productiebranch. Geen enkele andere branch is in Vercel ingesteld, dus de
standaardinstellingen van Vercel gelden: elke andere branch (ook `arc/*`) wordt als preview
gedeployd, en niets komt in productie behalve via een merge in `main` (die loopt via een pull
request).

De omgevingsvariabelen zijn op dezelfde manier verdeeld: de publieke `NEXT_PUBLIC_*`-variabelen
staan aan voor Preview en voor Production; elk geheim (de API-keys van de leveranciers) staat
alleen aan voor Production.

## Waarom

De eis was beperkt: `arc/*`-branches mogen nooit in productie komen, previews zijn prima. De
standaardinstellingen van Vercel voldoen daar al aan zonder enige configuratie, dus er hoefde
niets te veranderen. De verdeling van de omgevingsvariabelen bestond al (gecontroleerd in het
dashboard, hier niet besloten) en past toevallig bij dezelfde eis: een preview kan geen key van
een leverancier uitgeven, ook niet als iemand de URL vindt.

## Gevolgen

- Een preview van een `arc/*`-branch wordt gebouwd, maar elke route die een leverancier aanroept
  (chat, evaluatie, TTS, beide tokenroutes) heeft geen key en faalt tijdens runtime. Alleen
  native spraakherkenning, die geen server nodig heeft, werkt daar.
- De mockroutes helpen in een preview ook niet: ze antwoorden met 404 buiten `next dev`.
- Dit besluit leeft in het Vercel-dashboard, niet in de repo; niets hier dwingt het af in code
  (geen `vercel.json`). Een wijziging in het dashboard kan dit record ongemerkt ongeldig maken:
  er is geen driftcontrole voor Vercel-instellingen.
- Vastgelegd in `docs/grootboek/software-architectuur.md` § 5 (Environments).
- Bron: JNL-001, kwestie K2.
