# ADR-003: Gemini `flash-lite` als model, gekozen op prijs

- **Status:** implemented
- **Date:** 2026-10-20
- **Implementation date:** 2026-10-20
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Zowel de chatroute als de evaluatieroute gebruikt de modelconstante `gemini-3.1-flash-lite`.
Het model was een bewuste keuze, gemaakt op prijs. Er is geen uitgebreide vergelijking met
andere Gemini-modellen gedaan.

## Waarom

Gemini als leverancier lag vooraf vast (`docs/plan.md` → Fixed constraints); het specifieke
model niet. `flash-lite` is het goedkope uiteinde van de familie, wat past bij een persoonlijk
project dat dagelijks door zijn eigen bouwer wordt gebruikt. De metingen in het plan (10-06 tot
10-10) beschrijven hoe goed dit model zijn taak uitvoert; ze vergelijken het niet met een ander
model.

## Gevolgen

- Als de kwaliteit van `flash-lite` ooit de beperkende factor wordt, moet die vergelijking nog
  steeds worden gedaan; dit record beweert niet dat dat al gebeurd is.
- De twee routes delen de constante door duplicatie, niet door een import; een toekomstige
  modelwissel moet zowel `src/app/api/chat/gemini-chat.ts` als
  `src/app/api/evaluation/gemini-evaluation.ts` aanraken, en dit record verandert dat niet.
- Vastgelegd in `docs/grootboek/software-architectuur.md` § 8 (Technology choices).
- Bron: JNL-001, kwestie K5.
