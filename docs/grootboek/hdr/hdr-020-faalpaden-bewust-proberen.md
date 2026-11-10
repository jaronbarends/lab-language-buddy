# HDR-020: Faalpaden bewust proberen

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

> Vervangen door HDR-029 (De iPhone-test alleen bij audio, opname of layout, en geen vaste ronde
> langs de faalpaden) op 2026-11-10. De faalpaden worden niet meer bij elke verificatie met de hand
> geprobeerd; de tekst hieronder is voorgeschiedenis.

## Besluit

Bij de verificatie van elke stage worden de faalpaden bewust geprobeerd: de microfoonrechten
weigeren, het netwerk midden in een `/api/chat`-aanroep afknippen, en de opname stoppen zonder dat er
iets is gezegd. Elk van die paden moet in een herstelbare `error`-state landen, niet in een dode
pagina.
