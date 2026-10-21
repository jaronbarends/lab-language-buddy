---
titel: "Requirements — Kwaliteitsborging"
bron: lab/briefings/kwaliteitsborging.md (v1.1)
datum: 12 juni 2026
status: concept
---

# Requirements: Kwaliteitsborging

Van hopen dat het werkt naar weten dat het werkt. Vier lagen op een fundament
van CI/CD + TypeScript strict. Dit is een **menu, geen vast pakket** — doseer
naar projectprofiel. Toolnamen zijn voorbeelden; het patroon is universeel.
Voer één requirement per cyclus uit; fundament eerst.

## Fundament (prerequisites — geen laag)

### REQ-KB-0a · Maak de CI/CD-pipeline operationeel
- **Klaar wanneer:** workflows draaien automatisch bij elke PR.
- **Waarom:** een linter die je handmatig moet starten, start je niet — zonder pipeline zijn alle lagen handwerk.

### REQ-KB-0b · Activeer TypeScript strict mode
- **Klaar wanneer:** `"strict": true` in tsconfig.json.
- **Waarom:** één instelling die een hele categorie bugs voorkomt die je anders pas in productie vindt.

## Laag 1 — Statische analyse

### REQ-KB-01 · Implementeer ESLint blokkerend in CI
- **Klaar wanneer:** ESLint geconfigureerd én blokkerend in CI in alle modules, met fout-blokkerende regels. TypeScript strict telt niet als deze laag.
- **Waarom:** goedkoopste laag, vangt het meest — een `any` dat door de keten lekt wordt gevangen bij het schrijven, niet bij de klant.

## Laag 2 — Unit tests

### REQ-KB-02 · Configureer unit tests (Vitest/Jest) in CI
- **Klaar wanneer:** testframework geconfigureerd; *.test.ts/*.spec.ts aanwezig; test-script in package.json; tests draaien in CI.
- **Waarom:** tests leggen gedrag vast als contract dat elke refactoring overleeft — voor berekeningen en beslislogica, niet 100% coverage.

## Laag 3 — E2E tests

### REQ-KB-03 · Configureer E2E-tests (Playwright/Cypress) in CI
- **Klaar wanneer:** E2E-testbestanden aanwezig; draaien in CI of als pre-deploy stap.
- **Waarom:** de hele keten van klik tot resultaat bewijzen voor de 5-10 gouden paden waar een fout omzet kost.

## Laag 4 — Visuele regressie

### REQ-KB-04 · Richt visuele regressie in (Percy o.v.)
- **Klaar wanneer:** .percy.yml of equivalent; screenshots vergeleken bij PRs.
- **Waarom:** een gedeelde component raakt tien pagina's; handmatig controleren over drie viewports schaalt niet.
