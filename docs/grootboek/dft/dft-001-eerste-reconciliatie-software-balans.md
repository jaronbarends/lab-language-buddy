# DFT-001: Eerste reconciliatie van de software-balans — geen drift gevonden

- **Status:** resolved
- **Date:** 2026-10-21
- **Trigger:** een bewuste proef met het driftmechanisme van het grootboek (HDR-002,
  REQ-GG-05), geen incident en geen terugkerend patroon: de vijfde, uitzonderlijke route naar
  een DFT, namelijk het mechanisme zelf uitproberen voordat het ooit heeft gedraaid.

## SOLL vs IST

**SOLL:** `docs/grootboek/software-architectuur.md` v1.0, zoals het er staat na de boeking van
K1-K5 (`94497a4`) en de uitbreiding met de frontendlaag (`663a528`).

**IST:** de huidige code (`src/lib`, `src/hooks`, `src/app`, `next.config.ts`, `package.json`,
`.env.example`) en de rijen van `docs/plan.md` die de balans aanhaalt.

**Bevinding: geen verschil.** Er is niets in `src/` veranderd sinds de balans voor het eerst is
geschreven: een `git log` op `src/` sinds commit `94497a4` geeft geen commits. Een doorloop met
een schone context controleerde elke sectie (componentenkaart, de twee diagrammen, de
authenticatiematrix, de gedeelde contracten, de technologiekeuzes, de beveiligingsprincipes)
tegen de huidige code en elke verwijzing naar `plan.md`/`ADR`/`HDR` tegen de bron, en meldde nul
afwijkingen. Ik heb zelf twee van de beweringen (de standaardproviders voor TTS en STT) opnieuw
gecontroleerd tegen `src/lib/tts/index.ts` en `src/lib/stt/index.ts`; beide klopten.

## Patroon

Geen. Dit is één bewuste controle, met nog niets om mee te vergelijken: er is geen tweede
voorval om van een kleinigheid naar een structurele zwakte te escaleren. Een patroon kan pas ontstaan
als deze DFT minstens twee keer heeft gedraaid, bij voorkeur één keer na een echte
codewijziging.

## Besluiten

1. **Geen documentwijziging nodig.** De balans blijft zoals geaccepteerd; deze reconciliatie
   is zelf het bewijs, geen reden om hem aan te passen.
2. **Het mechanisme werkt, maar is niet op de proef gesteld.** Deze run bewijst het *proces*
   van de DFT (een reconciliatie kan worden aangevraagd, uitgevoerd en geregistreerd), niet dat
   het drift *vangt*: er was geen drift om te vangen. De eerste DFT die draait na een echte
   wijziging in `src/lib`, `src/hooks` of `src/app/api` toetst de detectie, niet alleen het
   proces.
3. **Procesnotitie, geen besluit:** het eigen rapport van de reconciliatie-agent gaf minder
   bewijs per bewering (bestandspaden, regelnummers) dan gevraagd was in zijn opdracht, ondanks
   de claim dat alles gecontroleerd was. Een volgende reconciliatie moet dat bewijs strenger
   eisen, of ruimte inplannen voor een tweede ronde die een steekproef van de "geverifieerd
   OK"-beweringen naloopt, zoals deze deed voor twee.

## Gevolgen

- `docs/grootboek/registers/dft-register.yml` krijgt zijn eerste regel, met `bevindingen: 0`.
- Het besluitenlog van JNL-001 krijgt een regel: REQ-GG-05 is nu één keer beproefd, met een
  schoon resultaat; de lus (journaal → besluit → document → code → drift) is nog niet van begin
  tot eind gesloten, omdat nog geen codewijziging een driftrapport heeft uitgelokt. Dat is wat
  er van REQ-GG-09 nog openstaat, niet van deze.
