# HDR-003: De checks van de repo draaien op pull requests naar `main` en `arc/arc-main`

- **Status:** implemented
- **Date:** 2026-10-20
- **Implemented:** 2026-10-22
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Dat er in deze repo geen CI was, was geen bewuste keuze. De checks die al in `CLAUDE.md` staan
(lint, typecheck, build, `npm run docs:check`) draaien automatisch op elke pull request naar
`main` of `arc/arc-main`, in `.github/workflows/checks.yml`. De registerdriftcheck van REQ-AH-12
(mechanisme 2) draait bewust in dezelfde workflow: één stuk CI-infrastructuur, niet twee.

*Aangevuld op 2026-10-27, met Jaróns go-ahead hoewel het record al was geland:* dezelfde
workflow draait ook `npm run test:scripts`, de tests van de scripts die documenten herschrijven
(HDR-007).

## Waarom

De checks bestaan en zijn gedocumenteerd, maar niets dwingt af dat ze daadwerkelijk zijn
gedraaid vóór een merge die rechtstreeks naar productie gaat (zie ADR-001). Dat gat kwam naar
boven tijdens de onboarding van het grootboek en was geen afgewogen keuze.

## Gevolgen

- **Triggers.** `pull_request` met `branches: [main, arc/arc-main]`. Een branch die niet meer
  bestaat, matcht nooit, dus het later verwijderen van `arc/arc-main` vraagt geen aanpassing.
- **Volledige history.** `docs:check` leest de git history voor zijn waarschuwing over een
  verouderd plan, dus de checkout gebruikt `fetch-depth: 0`.
- **De driftcheck controleert, herstelt nooit.** `npm run register:check` draait
  `sync-code-architectuur-register.mjs --check`: niet schrijven, geen `git add`, exit 1 bij
  drift. Samen met de Husky-hook (mechanisme 1) maakt dit REQ-AH-12 compleet.
- **Lockfile.** `npm ci` weigerde de lockfile op Linux (ontbrekende `@emnapi/core` en
  `@emnapi/runtime`, optionele wasm-dependencies). Beide staan nu vast als devDependencies.
- **Lintbereik.** `.claude/hooks/**` is uitgesloten van ESLint: de CommonJS-hooks lieten
  `npm run lint` al falen.
- (Nog) geen verplichte statuscheck: of een rode run de merge-knop blokkeert, is een
  branch-protection-instelling van GitHub, buiten de repo.
- Bron: JNL-001, kwesties K4 en K8.
