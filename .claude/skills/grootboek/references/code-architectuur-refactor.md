# Een code-architectuur document refactoren

*Referentie voor de grootboek-skill. Roep dit aan wanneer een code-architectuur
(of vergelijkbaar leidend code-kwaliteitsdocument) opgeschoond, geactualiseerd
of teruggebracht tot de kern moet worden.*

Dit is **geen invulformulier**. Het is voeding: het geeft je het materiaal om
zelf te redeneren over wat in zo'n document thuishoort en wat eruit moet. Lees
het, kijk naar het meegeleverde voorbeeld, en pas het oordeel toe op het
document dat vóór je ligt.

---

## Het dragende inzicht

Een code-architectuur document is geen mensentekst die toevallig over code gaat.
Het is **de voeding van een agent**. Een refactor-agent (of jij, in een refactor-
sessie) leest de spelregels en de beslissingen en handelt ernaar. Het document
refactoren betekent dus: **die voeding scherp en betrouwbaar houden.**

Daaruit volgt de hele aanpak. Een agent die verkeerde getallen leest, raadt
verkeerd. Een agent die door een changelog moet ploegen om één spelregel te
vinden, verspilt context. Het doel van de refactor is een document dat een agent
**snel en zonder ruis voedt**.

---

## Het kernmodel: een document kent drie soorten geheugen

De meeste code-architectuur documenten groeien scheef omdat ze **drie rollen
tegelijk** gaan vervullen. Ze beginnen als doctrine (de principes), maar trekken
gaandeweg een register (de beslissingen), een momentopname (de getallen) en een
changelog (de learnings) naar zich toe. Die horen elk bij een andere drager.

| Geheugen | Wat het is | Hoort in | Verandert |
|----------|-----------|----------|-----------|
| **Doctrine** | de these, de spelregels, het werkrecept — het *waarom* en *wanneer* | **het document** (het "huis") | zelden |
| **Contract** | per-bestand beslissingen (mag dit bestand groot zijn? waarom?) + drempels | een **machine-leesbaar register** (bv. JSON) | doorlopend |
| **Staat** | regelaantallen, totalen, gemiddelden — alles meetbaar | **nergens** — *live gemeten* | elke commit |
| **Procesgeheugen** | learnings over hoe het refactor-proces zelf beter werkt | het **harnas** (hooks, config, beslissingsdocumenten) | per ontdekking |

```
            VOEDT
   ┌─────────────────────────────────────────────┐
   │                                             ▼
 DOCTRINE  ───────leest───►   REFACTOR-AGENT   ───muteert──►  CONTRACT
 het huis, kaal               (of jij)                        beslissingen
   ▲                               │                              │
   │                         rapporteert                    afgedwongen door
   │                         per sectie                     de lint/push-laag
   │                               ▼                              │
   └── doctrine-wijziging ──   DE MENS   ◄── learning      STAAT live gemeten
       loopt via de mens                                   (genereer, niet bewaren)
```

**De agent muteert alleen het contract.** Het huis is voor hem onveranderlijk:
een nieuwe spelregel komt er alleen via de mens. Loopt de agent telkens tegen
hetzelfde aan, dan *signaleert* hij dat in zijn rapport — de mens beslist of het
doctrine wordt.

---

## De gouden regel

> **Bewaar in het huis alleen wat je niet kunt meten — de beslissing. Laat het
> meetbare meten.**

Dit is de toetssteen voor élke regel in het document. Stel bij elk blok één vraag:

**"Kan een script dit uit de echte code afleiden?"**

- **Ja** → het is *staat*. Het hoort niet in het huis. Haal het weg en meet het
  live. (Niet verplaatsen naar een tweede bestand — dan herhaal je de fout: een
  met de hand bewaard meetbaar feit drift altijd.)
- **Nee, het is een afspraak** → het is *contract*. Het hoort in het register.
- **Nee, het is een principe of een werkwijze** → het is *doctrine*. Het blijft.

### Drift is je beste bewijs

Het scherpste argument om getallen uit een document te halen is dat ze er
**aantoonbaar fout** in staan. Meet de echte staat en leg hem naast wat het
document beweert. Een document dat zijn eigen getallen niet bijhoudt, bewijst
zelf dat die getallen er niet in thuishoren. Gebruik die drift expliciet in je
verdict — het overtuigt sterker dan een principe.

---

## Streng in het huis, voedend in dit recept

Let op het verschil in regime tussen het document dat je refactort en dit recept:

- **Het huis** wordt *streng*: na de refactor bevat het **geen enkel veranderlijk
  getal**. Voor de actuele staat verwijst het naar het contract.
- **Dit recept en het voorbeeld** mogen *juist wél* concrete getallen tonen —
  "zó ziet een register-regel eruit, en zó redeneer je over een plafond." Dat is
  geen drift maar **voeding**: een compact, realistisch voorbeeld bouwt
  intelligentie op bij wie het leest. Houd het concise; één sprekend voorbeeld is
  genoeg.

Een volledig, realistisch voorbeeld staat in
`references/voorbeelden/code-architectuur-arc.md` — een echt code-architectuur
document in zijn **rijke vorm** (mét register, regelaantallen, per-component
analyse). Het is bewust *niet* ingedikt: het dient als voeding, zodat je de vorm
en de redenering ziet waar dit recept naartoe werkt. Lees het naast dit recept.
De bestandsnamen zijn voorbeelden uit één repo — laat je voeden door het patroon,
niet door de namen.

---

## Het werkrecept

Onafhankelijk van repo of taal. Werk in deze volgorde.

```
1. METEN — leg de echte staat naast het document
   Tel live (regels, bestanden per component). Vergelijk met wat het
   document beweert. Noteer de drift — dat is je bewijsmateriaal.

2. SCHEIDEN — markeer per sectie het soort geheugen
   Loop het document door en label elk blok: doctrine / contract / staat /
   procesgeheugen. De gouden-regel-vraag beslist.

3. VERZILVER-TOETSEN — learnings mogen alleen weg mét bewijs
   Voor elke learning/changelog-regel: zoek waar het al geborgd is (in code,
   een hook, config, een beslissingsdocument). Bewijs gevonden → weg uit het
   huis. Geen bewijs → het is nog levend; laat het staan of borg het eerst
   elders.

4. STRIPPEN — breng het huis terug tot doctrine
   Verwijder staat (getallen), het register-duplicaat, de afgeronde-werk-logs
   en de verzilverde learnings. Wat overblijft: these, spelregels, werkrecept,
   de fundering (bronnen, beslissings-index).

5. VERHUIZEN — beslissingen naar het contract
   Elke bewuste afspraak (dit bestand mag groot zijn, om deze reden) hoort in
   het machine-leesbare register, niet in het huis.

6. RAPPORTEREN — per sectie een verdict aan de mens
   Geen big-bang-dump. Per sectie: wat blijft, wat gaat eruit, met welk bewijs.
   De mens beslist per blok. Pyramid: hoofdboodschap + de verdicts eronder.
```

### Wat doorgaans waar landt

Een typische sloop-en-behoud-uitkomst, als oriëntatie (niet als wet):

| Sectie-soort | Verdict | Waarom |
|---|---|---|
| These + onderbouwende research | **behouden** | fundering onder de spelregels — doctrine |
| Kwalitatieve spelregels | **behouden** | de kern; dit is wat de agent voedt |
| Werkrecept (god-file splitsen e.d.) | **behouden**, getallen eruit | doctrine; concrete regelaantallen erin zijn drift |
| Bestandsregister-tabel met regelaantallen | **verwijderen** | spiegel van het contract; meetbaar |
| Per-component aggregaten (totalen) | **verwijderen** | meetbaar → live |
| "Afgeronde refactors" / "opgeloste god files" | **verwijderen** | bevroren historie; hoort bij de beslissing die het dreef |
| Learnings al geborgd in code/hook/config | **verwijderen** | verzilverd; dubbel geheugen |
| Codebase-snapshot (X bestanden, Y regels) | **verwijderen** | momentopname |

---

## Hoe de mens en de agent samenwerken hierin

- **De agent** (autonoom, bij een normale refactor-ronde) muteert **alleen het
  contract**: hij splitst een bestand, of legt een bewuste plafond-beslissing
  vast in het register. Het huis raakt hij niet aan.
- **De mens** is de poort naar de doctrine. Een nieuwe spelregel, een herziene
  these: dat loopt via de mens. De agent levert het signaal ("ik kom dit telkens
  tegen"), de mens beslist.
- **Learnings** van de agent gaan via zijn **rapport** naar de mens, die ze borgt
  in het harnas (een hook, een config, een beslissingsdocument) — niet terug in
  het huis.

Zo blijft het huis kaal, stabiel en betrouwbaar: precies de voeding die een agent
nodig heeft om goed te refactoren.

---

## Toetssteen voor jezelf, als je klaar bent

- Bevat het huis nog één veranderlijk getal? → dan ben je niet streng genoeg.
- Staat er een learning die je niet elders kon terugvinden? → dan was de
  verzilver-toets niet sluitend; borg hem eerst.
- Zou een agent die alleen het huis leest, de spelregels kunnen toepassen zonder
  de repo te kennen? → dan is de doctrine zuiver.
- Heb je per sectie een verdict mét bewijs aan de mens voorgelegd, in plaats van
  alles in één klap te wijzigen? → dan blijft de mens in de loop.
