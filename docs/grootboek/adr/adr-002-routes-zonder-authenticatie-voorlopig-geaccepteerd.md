# ADR-002: De serverroutes hebben geen authenticatie van de aanroeper, voorlopig geaccepteerd

- **Status:** accepted
- **Date:** 2026-10-20
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Geen van de serverroutes (`/api/chat`, `/api/evaluation`, `/api/tts`, de twee tokenroutes)
controleert wie ze aanroept, en geen enkele heeft een rate limit. Dit is een geaccepteerde,
voorlopige toestand, geen definitieve: de mens wil dat het snel wordt opgelost (bijgehouden als
het openstaande vervolg, JNL-001 kwestie K7). Vercel Authentication staat aan op het project
met Standard Protection, die previews en gegenereerde deployment-URL's afschermt maar het
productiedomein openbaar laat: de productieroutes blijven dus bereikbaar voor iedereen die de
URL kent.

## Waarom

De app is een persoonlijk project op een URL die niet gedeeld wordt; het risico is bewust
geaccepteerd en niet als gat ontdekt. Het was geen afgewogen keuze toen de routes werden
gebouwd: het kwam boven tijdens de onboarding van het grootboek (JNL-001) en is toen
geaccepteerd als de bestaande situatie, met de bedoeling het te dichten.

## Gevolgen

- Elke aanroep zonder authenticatie kan een betaalde key van een leverancier aanspreken
  (Gemini, Azure, Google, ElevenLabs, Deepgram). Het enige vangnet buiten de code zijn de
  bestedingslimieten per leverancier, waarvan de mens nu geen duidelijk overzicht heeft (ook
  bijgehouden onder K3/K7).
- Dit record is voorlopig van opzet: als K7 een beveiligingsmechanisme oplevert, vervangt een
  nieuwe ADR deze, in plaats van dat deze ter plekke wordt aangepast.
- Vastgelegd in `docs/grootboek/software-architectuur.md` § 6 (Security principles) en § 9.
- Bron: JNL-001, kwesties K3 en K7.
