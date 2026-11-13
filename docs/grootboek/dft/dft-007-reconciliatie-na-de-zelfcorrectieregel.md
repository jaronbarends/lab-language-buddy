# DFT-007: Reconciliatie na de zelfcorrectieregel van de corrector — geen drift

- **Status:** resolved
- **Date:** 2026-11-13
- **Trigger:** de reconciliatie per pull request (HDR-026, Een pull request die code in een
  werkgebied raakt, sluit met een reconciliatie) voor de branch
  `corrector-prompt-user-self-correction`. De code-commit `f0369c9` raakt `src/lib`, het
  werkgebied van de software-balans en van `src/lib/CLAUDE.md`. Net als bij DFT-005
  (Reconciliatie na ADR-031 — geen drift) en DFT-006 (Reconciliatie na de infomelding en het
  Feedback-component — geen drift) toetst deze DFT tegen de code-commit in dezelfde pull request.

Kosten: niet gemeten. Tijdens de reconciliatie liep tegelijk een andere sessie van Jarón, en die
telt mee in dezelfde sessielimiet; het verschil in `/usage` zegt hier dus niets.

## SOLL vs IST

**SOLL:** `docs/grootboek/software-architectuur.md` en `src/lib/CLAUDE.md` zoals ze op `f0369c9`
staan, beide helemaal gelezen.
**IST:** de code op `f0369c9`. Sinds de vorige reconciliatie van de balans (DFT-006, op
`ebb12b5`) en van `src/lib/CLAUDE.md` (DFT-004, Eerste reconciliatie op een echt signaal, op
`ddab397`) veranderde in beide werkgebieden één bestand, in die ene commit, voor ADR-008 (Prompts
van de corrector), versie 1.2:

- `src/lib/prompt.ts`: één regel erbij in `correctorTaskSection`, een bullet over zelfcorrectie
  binnen één beurt. Geen nieuwe functie, geen nieuwe interpolatie, geen wijziging in de gedeelde
  secties die ook naar de chatpartner gaan.

**Bevinding: geen verschil.**

### Wat klopt, met bewijs

- **§ 3, de rij Prompt builder:** "Bouwt bij elke request de system instruction voor de chatcall
  en voor de correctiecall." Dat klopt nog: `buildChatSystemInstruction` en
  `buildEvaluationSystemInstruction` zijn ongewijzigd, alleen de tekst van één sectie groeide. De
  rij verwijst naar ADR-008, en dat record is in dezelfde commit bijgewerkt.
- **§ 9, "Waarden die in een system prompt terechtkomen zijn begrensd":** de nieuwe regel is
  vaste tekst zonder `${…}`; de enige waarden in de prompt blijven `language` en `level`, met hun
  zod-enums.
- **§ 1, § 2, § 4 en § 7:** geen route, geen state, geen contract en geen schema geraakt. Dat de
  correctie `null` kan zijn, gold al; de regel zegt alleen wanneer.
- **`src/lib/CLAUDE.md`:** gaat over de reducer, de registries, TTS, STT en keys. Niets daarvan is
  geraakt.

## Patroon

Geen. Het is de derde reconciliatie op rij zonder drift, net als DFT-005 en DFT-006 gedaan in
dezelfde pull request als de wijziging. Een wijziging die alleen prompttekst raakt, verandert
geen structuur die de balans beschrijft: de inhoud van de prompts staat in ADR-008, niet in de
balans.

## Besluiten

1. **Geen documentwijziging uit drift.** De balans en `src/lib/CLAUDE.md` kloppen met `f0369c9`.
2. **Geen aanvulling in `src/lib/CLAUDE.md` over de prompts.** Overwogen: daar noemen dat de
   gedeelde secties van `prompt.ts` ook naar de chatpartner gaan, want dat raakt wie een
   promptregel toevoegt. Afgewezen: het staat al waar de regel wordt toegepast, in het commentaar
   bovenaan de sectiefuncties in `prompt.ts`, en de promptregels zelf staan in ADR-008.
3. **Deze DFT is `resolved`**, met beide documenten onder `documenten` en `getoetst-tegen:
   f0369c9`. De commit die deze DFT boekt, raakt alleen `docs/`, buiten elk werkgebied, dus het
   signaal is daarna stil.

Verwant: ADR-008 (Prompts van de corrector)
Verwant: DFT-006 (Reconciliatie na de infomelding en het Feedback-component — geen drift)
Verwant: HDR-026 (Een pull request die code in een werkgebied raakt, sluit met een reconciliatie)
