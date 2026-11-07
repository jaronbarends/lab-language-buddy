# DFT-002: De subagent-tenzij-guard blokkeert CLAUDE.md-bestanden onder src/, terwijl de werkafspraak zegt van niet

- **Status:** resolved (2026-10-27)
- **Date:** 2026-10-24
- **Trigger:** gevonden bij het ontwerpen van de communicatieplicht-hook (REQ-GG-04,
  Implementeer de communicatieplicht bij documentwijzigingen): `src/components/CLAUDE.md` en
  `src/lib/CLAUDE.md` zijn leidende documenten, dus de vraag kwam op wie ze mag bewerken.

## SOLL vs IST

**SOLL:** de regel "Working model: subagent-tenzij" in de root-`CLAUDE.md` zegt dat bewerkingen
in `src/` of `spikes/` via een builder lopen, en dat `docs/`, `.claude/` en "other non-code
files" een uitzondering vormen die de lead thread direct mag bewerken.

**IST:** `.claude/hooks/guard-kenniswerker.cjs` kijkt niet naar het soort bestand. De hook
weigert elke Edit of Write van de lead thread waarvan het pad met `src/` of `spikes/` begint.
Getest op 2026-10-24 met gesimuleerde aanroepen van de lead thread:

| Pad | Lead thread |
|---|---|
| `src/lib/foo.ts` | geweigerd (bedoeld) |
| `src/lib/CLAUDE.md` | geweigerd |
| `src/components/CLAUDE.md` | geweigerd |
| `CLAUDE.md` | toegestaan |
| `docs/plan.md` | toegestaan |

Twee bestanden die geen code zijn, zijn dus geblokkeerd voor de lead thread terwijl een
subagent ze mag bewerken. De afspraak en de hook zijn het oneens over één soort bestand.

**Gewicht:** laag. Er breekt niets: de lead thread kan de tijdgebonden override of een
builder gebruiken. De prijs is dat een documentatiewijziging in twee contextbestanden een
omweg nodig heeft, en dat de afspraak de uitzondering te ruim voorstelt.

## Patroon

Nog geen. Eén voorval; geen eerdere melding van een hook die afwijkt van zijn werkafspraak. Het
is alleen een kandidaat voor de telling van zwakke plekken van het harnas (REQ-GG-06, Bouw het
immuunsysteem) als een tweede hook anders blijkt te werken dan beschreven.

## Besluiten

Besloten door Jarón op 2026-10-27: **de hook aanpassen** (optie 1 van de twee die openstonden;
de andere was de afspraak aanscherpen).

`guard-kenniswerker.cjs` bewaakt Markdown-bestanden niet meer. Een bestand met de extensie `.md`
(hoofdletterongevoelig) onder `src/` of `spikes/` is toegestaan voor de lead thread. Code en
elk ander bestandstype onder die mappen blijft bewaakt, ook een CSS-module of een JSON-bestand.
De werkafspraak hoefde niet te veranderen: die zei al dat bestanden die geen code zijn een
uitzondering vormen.

Getest op 2026-10-27 met gesimuleerde aanroepen van de lead thread:

| Pad | Lead thread |
|---|---|
| `src/lib/CLAUDE.md`, `src/components/CLAUDE.md` | toegestaan (was geweigerd) |
| `spikes/ai-voice-demo/findings.md`, `src/lib/NOTES.MD` | toegestaan |
| `src/lib/foo.ts`, `src/app/page.tsx`, `src/components/x.module.css`, `spikes/ai-voice-demo/app.js`, `src/lib/notes.md.ts` | geweigerd (ongewijzigd) |
| `CLAUDE.md`, `docs/plan.md` | toegestaan (ongewijzigd) |

Een bewerking van code door een subagent gaat door zoals eerder, en de tijdgebonden override
werkt nog steeds.

## Gevolgen

- De lead thread kan nu `src/components/CLAUDE.md` en `src/lib/CLAUDE.md` zelf bewerken, zodat
  de communicatieplicht (HDR-006) hem direct bereikt, niet meer via het rapport van een
  builder.
- Dit is het eerste driftrapport in het grootboek dat de hele keten doorliep: geboekt (DFT-002),
  besloten, in het harnas aangepast en gesloten. Het is bewijs voor REQ-GG-05 (Richt
  drift-detectie in) dat een bevinding wordt opgevolgd en niet alleen gesignaleerd.
- Naast dit record is geen ander record nodig: een hook die wordt aangepast aan een bestaande
  afspraak is een correctie, geen nieuw besluit.
