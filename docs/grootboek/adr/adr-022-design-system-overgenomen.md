# ADR-022: Design system overgenomen uit de bestaande app

- **Status:** implemented
- **Date:** 2026-09-28
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

Het design system van de bestaande app is overgenomen: vijf tokenbestanden onder `src/app/tokens/`, vrijwel letterlijk behouden. Bevels vervangen `--shadow-raised`. Daarna zijn `reset.css` en `elements.css` overgenomen, tussen de tokens en `globals.css`.

## Waarom

Redenen op het moment van het besluit:

- Het eigen palet van de rebuild was vlak naast het echte werk. Een nieuwe skin was op dat moment het goedkoopst, voordat stage 3 de weergave van highlights zou toevoegen en stage 4 een geheel nieuw soort content.
- Het systeem markeerde diepte met een dikke onderrand die inklapt bij indrukken, niet met zachte schaduwen. Een enkele schaduw behouden zou een vreemd element hebben achtergelaten.
- `reset.css` en `elements.css` vervingen de algemene `*{margin:0;padding:0}` van de agent en de elementregels die in `globals.css` stonden door die van de bestaande app. Zo deelden beide apps één definitie van een kaal element.
- Bijschriften zouden 14px semibold zonder tracking worden, zodra de componentklassen die ze overschrijven waren weggehaald. De 12px bold met 0.06em van de agent was geschat vanaf een screenshot.

## Gevolgen

- Er is geen synchronisatie met de bestaande app meer en afwijkingen worden niet bijgehouden, zie PDR-001 (Een app voor dagelijks gebruik, en een experiment in werkwijze). Dit is een gevolg van dat besluit, niet iets uit de oorspronkelijke rijen.

Verwant: ADR-015 (Styling: CSS Modules over het overgenomen design system)
