# PDR-015: Markering van het gesproken woord

- **Status:** implemented
- **Date:** 2026-09-30
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De markering van het gesproken woord is een `linear-gradient` als `background-image`, met
bovenaan en onderaan een strook van 1px die transparant is. Die vervangt zowel de gewone
achtergrond als de padding. Gemeten: een element van 21px, een zichtbare band van 19px, een
regelstap van 22,5px en 3,5px tussenruimte tussen de banden. De randen zijn hard, omdat de
tweede positie van elke colour stop 0 is en de browser die optrekt naar de vorige stop.

Een `@media (forced-colors: active)`-regel haalt de gradient weg. In forced-colours mode wordt
`background-color` vervangen, maar `background-image` blijft voor zover bekend ongemoeid; het geel
zou dan achter herkleurde tekst blijven staan en kan onleesbaar zijn. De markering wordt in die
modus dus gewoon niet getekend. Jarón testte het in forced-colours mode: daar wordt geen
markering getekend, en dat vond hij acceptabel.

De witruimte tussen twee gesproken woorden krijgt dezelfde markering, zodat de band doorloopt. De
constante `HIGHLIGHT_SPACES` in `highlighted-text.tsx` blijft als schakelaar staan; `false` geeft
het eerdere gedrag, alleen woorden. Een whitespace-token wordt gemarkeerd als het woord ervoor en
het woord erna allebei gesproken zijn, dus de witruimte na het laatste gesproken woord blijft
ongemarkeerd tot het volgende woord gesproken is. De bestaande `spokenWord`-stijl wordt hergebruikt.

De woordtimings worden gemaakt op de eerste `timeupdate` met een eindige `audio.duration`, niet op
`loadedmetadata` zoals in de spike.

## Waarom

De gradient houdt de banden op naastliggende regels uit elkaar bij 1.25 zonder de regelhoogte aan
te raken.

Whitespace: de markering liet een gat tussen gesproken woorden, wat nooit een bewuste keuze was,
want alleen woordtokens werden gemarkeerd. Jarón vroeg om een versie met gemarkeerde spaties,
vergeleek beide door `HIGHLIGHT_SPACES` om te zetten en koos `true`. De constante blijft met
opzet staan, zodat dit heroverwogen kan worden.

Timings: Safari kan `Infinity` als duur melden tot later, en `estimateWordTimings` gooit daarop een
fout. Zolang de duur niet bekend is, is er geen markering in plaats van een fout.

## Voorgeschiedenis

De eerste oplossing was de `padding: 1px 0` weghalen. Die padding was een toevoeging van de agent:
de banden werden er 23px hoog van, en bij 1.25 overlapten ze naastliggende regels met 0,5px.
Gemeten bij 1.3 zonder padding: banden van 21px, een regelstap van 23,4px en 2,4px tussenruimte. De
opmerking die de padding uitlegde klopte ook niet, want de padding voegde alleen hoogte toe. Deze
stap is ingehaald door de `linear-gradient`-oplossing, die bij 1.25 werkt zonder de regelhoogte aan
te raken.

De forced-colours-kwestie bleef bij de gradient eerst open: alleen het bestaan van de regel en het
ongewijzigde normale gedrag waren gecontroleerd, omdat de browser vanuit de tooling niet in die
modus kon worden gezet. Of iets anders in die modus alleen op achtergrondkleur leunt (de gekozen
taalkaart, de AI/Me-pill) is niet gemeld. Dit verving een eerdere open vraag.

## Gevolgen

Niet gecontroleerd: een whitespace-token met een nieuwe regel erin, en iOS. De witruimte is in
desktop Chrome gemeten met elementgeometrie, niet met screenshots: bij 4 gesproken woorden zijn 7
spans gemarkeerd, en een spatie aan het einde van een regel heeft breedte nul en laat dus geen
stompje achter.

Verwant: PDR-004 (Tekst in spraakbubbels: regelhoogte 1.25 en gewicht medium)

Verwant: PDR-017 (Contrast en forced-colors: bewust geaccepteerd)
