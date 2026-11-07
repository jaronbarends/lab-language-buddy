# HDR-020: Faalpaden bewust proberen

- **Status:** implemented
- **Date:** 2026-09-23
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Bij de verificatie van elke stage worden de faalpaden bewust geprobeerd: de microfoonrechten
weigeren, het netwerk midden in een `/api/chat`-aanroep afknippen, en de opname stoppen zonder dat er
iets is gezegd. Elk van die paden moet in een herstelbare `error`-state landen, niet in een dode
pagina.
