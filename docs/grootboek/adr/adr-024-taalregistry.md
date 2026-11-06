# ADR-024: Taalregistry

- **Status:** implemented
- **Date:** 2026-09-30
- **Implementation:** 100
- **Type:** Architecture Decision Record (WHAT do we build)

## Besluit

De taalregistry heeft per taal een eigen veld per consument, elk genoemd naar de leverancier plus
`Lang`:

- `htmlLang`: de waarde voor het `lang`-attribuut van de gesprekstekst (voor Noors is dat `nb`).
  Die wordt één keer bepaald in `LanguageBuddy` en als prop doorgegeven als `conversationLang`.
  Het attribuut staat op de tekst zelf, niet op de thread, zodat het label van de spreker en de
  placeholder "Listening…" (`lang="en"`) Engels blijven.
- `deepgramLang`: voorheen `deepgram`.
- `webSpeechLang`: een tag met regio voor de native spraakherkenning (`nb-NO` voor Noors, de
  andere talen met hun gebruikelijke regio).
- `elevenLabsLang`: de `language_code` van Scribe, in ISO 639-3: `nld`, `fra`, `deu`, `ita`,
  `nor`, `spa`.

Bij het toevoegen van een taal controleer je dat elke STT-engine en elke TTS-provider haar
ondersteunt, met Noors en nova-2 als voorbeeld. Die waarschuwing staat als algemene opmerking in
`languages.ts`. De waarschuwing over het model staat bij `DEEPGRAM_MODEL`, zonder verwijzing naar
`languages.ts`.

## Waarom

- **`htmlLang`:** schermlezers kiezen de stem op basis van `lang`, en `<html lang="en">` zorgde
  ervoor dat een Noorse bubbel met een Engelse stem werd voorgelezen. Het is een prop en geen
  context, omdat de state-context bewust is verwijderd. Het `lang="en"` op de placeholder is
  Jarons verfijning van het voorstel van de agent.
- **`webSpeechLang`:** de native engine heeft een tag met regio nodig, en `htmlLang` heeft die
  niet. Jaron: elk veld noemen naar zijn leverancier plus `Lang` is consequenter.
- **Algemene opmerking:** dezelfde waarschuwing stond op twee plekken, en die in de tabel
  bewaakte een wijziging die in `deepgram.ts` wordt gedaan. Jaron stelde de algemene formulering
  voor; de agent had afgeraden.
- **`elevenLabsLang`:** Scribe's `language_code`, naast `deepgramLang`. De codes komen uit de
  talenlijst van ElevenLabs; Jaron probeerde alle zes tegen de live API (19 oktober, op het
  gehoor, zonder telling van fouten).

Verwant: ADR-009 (STT: providerkeuze en configuratie)
Verwant: ADR-012 (ElevenLabs Scribe-provider)
