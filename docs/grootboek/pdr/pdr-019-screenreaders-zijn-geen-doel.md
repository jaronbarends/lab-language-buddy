# PDR-019: Screenreaders zijn geen doel

- **Status:** implemented
- **Date:** 2026-11-08
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

Screenreaders, VoiceOver op de iPhone voorop, zijn geen doel van deze app. Er wordt niet met een
screenreader getest, en hoe een screenreader iets aankondigt, is geen reden om een ontwerp- of
bouwkeuze open te houden. Een review of een journaal voert screenreadergedrag niet op als
bevinding of als open kwestie.

Wat er nu aan rollen en labels in de code staat, zoals de `role="log"` van de thread en de
`role="status"` van de wachtbubbel, blijft staan. Dit besluit zegt niet dat het weg moet, alleen
dat het niet getest en niet gegarandeerd wordt.

Het gaat alleen over screenreaders. Andere besluiten over toegankelijkheid blijven gelden, zoals
reduced motion (JNL-003, Animatie van chatbubbels, K8) en contrast en forced colors (PDR-017,
Contrast en forced-colors: bewust geaccepteerd).

## Waarom

De app heeft één gebruiker, de bouwer, en is niet voor een publiek gedeployd (README, "Who it is
for and what it aims at"; PDR-001, Een app voor dagelijks gebruik, en een experiment in
werkwijze). Jarón gebruikt geen screenreader en gaat er geen gebruiken: "die voice over is niet
belangrijk voor deze app. Ik ga daar naar verwachting nooit gebruik van maken" (2026-11-08), en
hij gaat het in de nabije toekomst zeker niet testen.

Zonder dit besluit bleven screenreadervragen openstaan zonder dat iemand ze kon beantwoorden.
JNL-003 K6 (welke rol het ene overlevende element van de AI-bubbel heeft) was geparkeerd tot een
echte VoiceOver-test, en daarop wachtte ook het record voor de structuur van die bubbel, nu
ADR-031 (De AI-bubbel blijft één element, van wachten tot antwoord). VoiceOver viel al buiten scope
voor stage 1 (JNL-003, K6), maar dat stond nergens als besluit voor de app als geheel, dus elke
nieuwe review of sessie kon het opnieuw opbrengen.

## Gevolgen

- JNL-003 K6 is hiermee besloten (buiten scope) in plaats van geparkeerd. ADR-031 noemt de wissel
  van rol op de AI-bubbel als niet getest en niet gegarandeerd.
- **Wat dit heropent.** Krijgt de app andere gebruikers (de README noemt dat als het moment om de
  lat opnieuw te leggen), of gaat Jarón zelf een screenreader gebruiken, dan vervalt de grond onder
  dit besluit.
- **Landing.** Er verandert geen productoppervlak. Het besluit is te vinden via het PDR-register;
  ADR-031 en JNL-003 K6 verwijzen ernaar.
