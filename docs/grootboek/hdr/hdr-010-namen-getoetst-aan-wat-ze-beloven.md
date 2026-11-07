# HDR-010: Een naam wordt getoetst aan wat hij belooft

- **Status:** implemented
- **Date:** 2026-10-27
- **Implementation:** 100
- **Type:** Harness Decision Record (HOW do we work)

## Besluit

Een regel in `.claude/rules/code-style.md`, die laadt zodra een `.ts`- of `.tsx`-bestand in `src/`
wordt aangeraakt: een naam zegt wat de functie teruggeeft of doet, niet waarvoor hij wordt
gebruikt, en gebruikt hetzelfde woord als zijn buren. Als Jarón een naam aanwijst, is de agent
het eens, zegt hij duidelijk waarom die fout was, stelt hij een betere voor met de reden, en laat
hij Jarón beslissen; een hernoeming over meerdere bestanden is goedkoop, en de bestanden worden
opgesomd zodra het er meer dan ongeveer vijf zijn.

## Waarom

**Kernprincipe:** Jarón leest namen als de specificatie en reviewt ze als onderdeel van het werk.
Een naam die meer of minder belooft dan de code doet, kost hem reviewtijd, en een codebase leest
alleen goed als één woord één ding betekent.

Dit is het eerste patroon dat het incidentregister (HDR-009) tot een oplossing bracht. In de
review van stage 4 corrigeerde hij zeven namen, elk met een reden, en elke keer had hij gelijk:
een functie die een request-*body* teruggeeft maar request heet (`createChatRequestBody`), een
endpoint dat naar het werkwoord is genoemd terwijl het zelfstandig naamwoord werd opgevraagd
(`evaluation`), een functie die beweert dat het antwoord is uitgesproken terwijl het pas begon
met spreken (`addAiTurnAndStartSpeaking`), een status `running` terwijl er nog niets liep
(`pending`), en een CSS-class in een ander hoofdlettergebruik dan zijn buren. De bestaande
stijlregels dekten hoe namen worden *geschreven* (`handleX`, booleans als zinnen, camelCase), niet
wat ze moeten *beloven*.

## Gevolgen

- `naming-precision` in het incidentregister noemt nu dit record als zijn `maatregel`, en de
  `docs:check`-waarschuwing ervoor is weg.
- **Een regel is niet mechanisch te controleren.** Anders dan de hooks houdt niets een slechte
  naam tegen. De maatstaf voor succes is dat er geen nieuw naming-incident meer wordt gelogd. Als
  er toch een komt, is dat een nieuw incident in hetzelfde patroon, en moet het patroon
  doorgroeien naar iets steviger, niet een regel tekst blijven.
- De regel laadt alleen voor TypeScript in `src/`. Namen in documenten, scripts en CSS-bestanden
  vallen er niet onder.
- `.claude/rules/code-style.md` is geen leidend document; de wijziging wordt toch aan Jarón
  getoond voordat ze wordt gecommit.
