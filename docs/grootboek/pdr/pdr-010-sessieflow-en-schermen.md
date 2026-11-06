# PDR-010: Sessieflow en schermen

- **Status:** implemented
- **Date:** 2026-09-24
- **Implementation:** 100
- **Type:** Product Decision Record (WHY this way)

## Besluit

De sessie loopt zonder tussenscherm van setup naar gesprek en terug:

- **Geen config-regel op het gesprekscherm.** De regel met de sessieconfiguratie is van het scherm
  gehaald, en `config` is daarmee uit de props van `ConversationScreen` gegaan.
- **Geen `ended`-fase.** End session brengt je rechtstreeks terug naar setup. `RESTART` en het
  eindscherm zijn met de fase verdwenen.
- **`lastConfig` wordt de nieuwe standaard.** De vorige configuratie gaat mee naar setup als
  beginwaarde.
- **De eerste beurt heet "Start conversation"** als de gebruiker opent. De knop heet dan niet
  "Reply". De voorwaarde is dat de beurtlijst leeg is *en* dat de knop actief is.
- **Reply is actief in `aiSpeaking`.** Tikken stopt de spraak en gaat naar `listening`. In
  `aiThinking` blijft Reply uitgeschakeld.

## Waarom

- De config-regel viel weg samen met de prop; de rij geeft geen andere reden.
- Zonder `lastConfig` als standaard betekende elke herhaalsessie dat je dezelfde taal opnieuw moest kiezen.
- "Reply" klopt niet voordat er iets gezegd is. De voorwaarde is dat de beurtlijst leeg is *en* de
  knop actief is.
- Wachten tot een lange reply was uitgesproken duurde te lang.

## Gevolgen

- `LISTENING_STARTED` is nu geldig vanuit `aiSpeaking` én `awaitingUser`. Het verlaten van
  `aiSpeaking` is de onderbreking: de bubbel laat zijn markering los en toont de volledige tekst, zoals
  na een normaal einde.
- Dit is niet de open-mic-modus. Reply vraagt een expliciete tik, dus de risico's van echo en van
  Safari-unlock die bij de open-microfoonmodus horen gelden hier niet. Eén uitzondering: fase 3 moet de
  `<audio>` stoppen in de cleanup van het playback-effect en de microfoon starten vanuit
  dezelfde tik.
- De mock driver stopt zijn ticker al bij het verlaten van de state.
- Gecontroleerd met `tsc` en eslint; niet in de browser uitgeprobeerd.
- Verwant: PDR-003 (Eén set bediening zonder Stop, het live transcript in de control bar) en
  PDR-008 (Knoppen).
