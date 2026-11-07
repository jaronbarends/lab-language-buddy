# HDR-004: Sessiegebonden refactor loop in plaats van een onbewaakte push-hook

- **Status:** implemented
- **Date:** 2026-10-21
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Bij het bouwen van REQ-AH-13 (de refactor loop van het agentic-harnas) op `arc/agentic-harnas`
koppelt de eigen conventie van ARC een push-hook op git-niveau, die de `refactor-werkplaats`-agent
onbewaakt, op de achtergrond, laat starten bij elke `git push`, ook bij pushes die helemaal buiten
Claude Code om gebeuren. Precies dat mechanisme hier bouwen werd geweigerd door de eigen
veiligheidsclassifier van Claude Code, met als reden "Create Unsafe Agents": een onbewaakte agent
die code bewerkt, automatisch getriggerd door een routinematige git-handeling.

Wat in plaats daarvan is gebouwd, is sessiegebonden: een `guard-push-sweep` PreToolUse-hook
(`.claude/hooks/guard-push-sweep.cjs`) die, wanneer de lead thread (niet een subagent)
`git push` draait, `src/` doorzoekt op bestanden voorbij de doorbell/hard-limit zonder
registerbesluit (`scripts/sweep-code-architectuur.mjs`). Vindt hij bestanden die nieuw zijn
aangemerkt, dus nog niet pending, dan weigert hij de push en noemt ze. De lead thread start dan
zelf de `refactor-werkplaats`-agent voor die bestanden, in dezelfde sessie onder toezicht van een mens,
voordat de push opnieuw wordt geprobeerd. Een pending-marker (`docs/.refactor-pending.json`, 24
uur TTL) voorkomt dat een latere push een bestand opnieuw aanmerkt waarvoor al een voorstel op
review wacht.

## Waarom

**Kernprincipe:** de eigen veiligheidsgrens van het harnas voor onbewaakte automatisering die
code bewerkt, gaat voor het letterlijk overnemen van een externe conventie, ook als die zo
doordacht is als die van ARC zelf. Een agent die bestanden kan bewerken en wordt getriggerd door
iets zo routinematigs en frequents als `git push`, zonder dat er op het moment van afvuren een
mens aanwezig is, valt precies in de risicoklasse die deze classifier moet afvangen, hoe zorgvuldig
de agent zelf ook is afgebakend (worktree-isolatie, een guard tegen zijn eigen push/merge,
menselijke goedkeuring van het resultaat). Het veiligere mechanisme houdt de trigger binnen een
actieve, bewaakte sessie: de hook weigert in plaats van te starten, en de lead thread, met een
mens in de sessie, neemt de feitelijke beslissing om te delegeren.

Dit betekent ook dat de refactor loop alleen pushes via Claude Code opvangt; een push vanuit een
gewone terminal omzeilt hem volledig. Dat is een geaccepteerde, benoemde blinde vlek, in lijn met
dezelfde beperking die elders in dit harnas al is geaccepteerd voor `guard-no-subagent-commit` en
`triage-guard`.

## Gevolgen

- `.claude/hooks/guard-push-sweep.cjs`, `scripts/sweep-code-architectuur.mjs` en
  `.claude/agents/refactor-werkplaats.md` implementeren dit; `docs/code-architectuur.md` §4 en de
  regel "Refactor loop" in de werkafspraken van `CLAUDE.md` documenteren het voor elke sessie.
- Toekomstig harnaswerk dat een andere ARC-conventie letterlijk wil overnemen, moet die eerst aan
  deze grens toetsen, in plaats van de weigering midden in de bouw te ontdekken.
- Als de grens van deze veiligheidsclassifier ooit verandert, of een mechanisme met een andere
  afbakening dat onbewaakt draait wordt voorgesteld, is dit het besluit om te herzien, en geen
  reden om de weigering stilletjes te omzeilen.
