# Livegang — optionele module

**Gebruik deze module alleen als jouw project een livegang-register heeft**
(`docs/grootboek/livegang/register.yml` — een conventiepad dat de skill
aanlegt zodra het nodig is). Geen register? Dan is deze module niet actief.
Stel hem hooguit vóór wanneer het project omgevingswerk krijgt: env vars,
externe diensten, datamigraties — werk dat bij promotie naar productie
afgevinkt moet worden en dat git niet vanzelf onthoudt.

## Het idee

Een merge naar main is het moment dat je werk live gaat. Code reist
vanzelf mee; omgevingswerk niet — een nieuwe env-var, een externe dienst, een
datamigratie. Die verdwijnen uit beeld als je ze niet opschrijft.

Vaak hebben meerdere agents, in meerdere sessies, onderweg dingen aangeraakt die
bij het live zetten nog geregeld moeten worden. Daarom verzamel je ze onderweg in
een livegang-checklist (`lg-NNN-<feature>.yml`), zodat je ze bij de merge in één
keer afvinkt in plaats van ze te vergeten. De flow voor de mens: je maakt een PR
aan, de checks lopen, je merget naar main, je schrijft release notes, en
je werkt het grootboek bij.

Elke checklist heeft een status-lifecycle (`pending → dev-complete → prod-ready →
done`); het register is de index van alle checklists. Een afgeronde checklist
blijft in de map staan met status `done` — die is meteen het permanente archief
van die release.

## De geheugen-lagen

Het livegang-geheugen leeft bewust in vier lagen. Elke laag heeft één rol —
dubbel geheugen drift altijd.

| Laag | Rol |
|---|---|
| `lg-NNN.yml` (de livegang-map) | Permanent archief per release — wat is gebouwd, status, prod-voltooid |
| Hooks + grondwet (CLAUDE.md) + themakaarten | De afgedwongen regel — wat de agent moet doen |
| Productcode | De spec — een opgeloste bug hoort in de code, niet in een learnings-lijst |
| `learnings.md` | Alleen wat nergens anders past: tijdloze valkuilen + wijzer naar open werk |

## De toevoegregel

Voeg een learning aan `learnings.md` alléén toe als hij **terugkerend** is
én **nergens anders geborgd kan worden**. Hoort hij in een hook, de
grondwet, een leidend document of de code? Borg hem daar. Is hij eenmalig?
Dan hoort hij in de `lg-NNN.yml` van die release, niet in learnings.

Zo blijft het learnings-document bewust dun: een document dat alles
onthoudt, onthoudt uiteindelijk niets — de agent leest het niet meer.
Groeit het toch dicht, dan is dat een kandidaat voor de indik-lus
(zie `opschoon-workflow.md`).

## Bij een merge naar main

1. Lees het livegang-register — doorloop alle open checklists.
2. Voer de prod-stappen uit of meld wat de mens zelf moet doen.
3. Een learning die de toevoegregel haalt → `learnings.md`; de rest →
   de checklist zelf.
4. Na voltooiing: status naar `done` — de checklist blijft in de map als
   permanent archief van die release.
