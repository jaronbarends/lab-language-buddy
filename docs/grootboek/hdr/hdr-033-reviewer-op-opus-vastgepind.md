# HDR-033: De reviewer draait op Opus, vastgepind in `reviewer.md`

- **Status:** implemented
- **Date:** 2026-11-13
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Kernprincipe

De controle is minstens zo sterk als het werk dat ze controleert. Bij `normal` en `risky` is het
verdict van de reviewer de uitleg waar de lead op leunt: een zwakker model daar verzwakt precies de
borging waarvoor HDR-024 (Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`) Opus
koos. En een model dat niet vastligt, hangt stil af van het model van de lead.

## Probleem

In ronde drie van JNL-002 (Koude-startjournaal: kan een nieuwkomer werken met alleen de repo?,
K10) draaide de lead op Sonnet. `builder.md` pinde `model: opus` (HDR-024), `reviewer.md` pinde
niets. Een subagent zonder `model` in zijn definitie neemt het model van de lead over, dus een
Sonnet-reviewer keurde het werk van een Opus-builder goed.

HDR-024 zei "De reviewer valt buiten dit besluit", maar rekende in zijn Waarom met een reviewer op
Opus. In de proef draaide de reviewer in beide runs op Opus, zodat alleen het model van de builder
verschilde. Die reviewer vond de twee serieuze bevindingen. En de besparing bij `normal`
("ongeveer een kwart") ging ervan uit dat de reviewer op Opus bleef. Wat het besluit aannam, lag
nergens vast.

## Besluit

**`.claude/agents/reviewer.md` pint `model: opus` in de frontmatter**, zoals `builder.md` en
`refactor-werkplaats` al deden.

- Het speelt alleen bij `normal` en `risky`: bij `trivial` is er geen reviewer (triage-skill).
- De lead hoeft niets te doen. Een `model` in de aanroep gaat nog voor de pin; dat is een uitweg,
  geen werkwijze.
- HDR-024 wijst bij zijn zin over de reviewer naar dit record (versie 1.1).

## Waarom

De keuze van Jarón (2026-11-13). Afgewogen:

- **De reviewer volgt de lead, en dat in HDR-024 opschrijven.** Goedkoper bij een lead op Sonnet.
  Maar dan is de controle zwakker dan het werk dat ze controleert, en er is geen proef met een
  reviewer op Sonnet. Een fout valt dan naar de goedkope kant, terwijl HDR-024 haar naar de
  duurdere, veiligere kant laat vallen. Afgewezen.
- **Per regime kiezen, met het model in de aanroep** (bijvoorbeeld Sonnet bij `normal`, Opus bij
  `risky`). Een nieuw besluit zonder proef, en niets dwingt het af: wie het vergeet, krijgt het
  model van de lead. Afgewezen; pas te overwegen na een proef zoals die van HDR-024, met de
  beslisregel vooraf vastgelegd.
- **De pin** maakt waar wat HDR-024 al aannam, om dezelfde reden als de pin op de builder.

Een eigen record en geen uitbreiding van HDR-024: de reviewer heeft een eigen aanleiding (K10) en
een eigen reden, en zo blijft de titel van HDR-024 kloppen.

## Grenzen

- **Kosten bij een lead op Sonnet.** Draait de lead op Opus, dan verandert er niets. Draait hij op
  Sonnet, dan kost elke review Opus-tokens: 91.223 en 102.371 in de proef van HDR-024. Op een
  Pro-plan telt dat.
- **Geen proef.** Niet gemeten hoe een reviewer op Sonnet het doet. De pin ontwijkt die vraag; hij
  beantwoordt haar niet.
- **`/stage-review` valt erbuiten.** Die skill start een `general-purpose`-subagent, niet de agent
  `reviewer`. Welk model daar draait, is niet nagekeken.
- **De root-`CLAUDE.md` bleef ongewijzigd.** De alinea Staffel noemt de builder op Opus; dat blijft
  waar, en de pin werkt zonder werkregel.

## Gevolgen

- `.claude/agents/reviewer.md`: `model: opus` in de frontmatter.
- HDR-024 naar versie 1.1: de zin "De reviewer valt buiten dit besluit" verwijst nu naar dit
  record.
- JNL-002: K10 besloten.

Verwant: HDR-024 (Builders op Sonnet bij `trivial`, op Opus bij `normal` en `risky`)
