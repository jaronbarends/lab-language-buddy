# iPhone: native spraakherkenning, tweede beurt en volume — samenvatting van de runs

De runs achter kwestie K9 in JNL-004 (Openstaande kwesties; gevonden 10-13, onderzocht 10-14).
Eén iPhone (iOS-versie niet vastgelegd), Safari, `NEXT_PUBLIC_STT_PROVIDER=native` tenzij een
rij Deepgram zegt, Nederlands tenzij anders vermeld, de AI opent het gesprek, twee beurten van
de gebruiker per run.

De ruwe consolelogs staan niet in de repo: het zijn tweeduizend regels herhaalde `result`- en
`audio`-events plus een tijdelijk tunneladres. Ze staan naast de repo, in
`resources/stt-ios-logs/` (`stt-logging.md`, `-round2.md`, `-round3.md`), en de aantallen
hieronder kunnen daartegen worden gecontroleerd.

## Termen

- **natural**: de spraak van de AI werd uit zichzelf tot het einde afgespeeld (het audio-element
  bereikte `ended`).
- **cut**: er werd op Reply getikt terwijl de AI nog sprak; **cut late**: in de laatste seconde.
- **EP**: early pause, de spraak werd 0.15 s voor het einde gepauzeerd, zodat het element nooit
  eindigt.
- **HS**: een `getUserMedia`-stream die naast de herkenning openstaat.
- **ok / fail** voor een beurt: de native engine gaf tekst terug / hij startte (`audiostart`) en
  ontving daarna niets, en eindigde na 20 tot 40 s in `audio-capture` ("Source is stopped").
  Met HS eindigde ook de eigen track van de vastgehouden stream ("MediaStreamTrack ended due to
  a capture failure") in elke mislukte beurt.
- **gap**: seconden van het einde van de spraak van de AI tot `start requested`.

## Aantallen

| Setup | Beurt 1 | Beurt 2 |
|---|---|---|
| natural, no EP, no HS | 14 van 15 ok | **2 van 13 ok** |
| cut or cut late, no EP, no HS | 7 van 8 ok | 8 of 8 ok |
| natural, **EP**, no HS | 4 van 4 ok | **4 van 4 ok** |
| natural, no EP, **HS** | 3 van 4 ok | 0 of 3 ok |
| natural, **EP + HS** (2 unlogged runs) | 2 van 2 ok | 2 of 2 ok |

Volume van de spraak van de AI in beurt 2 ten opzichte van beurt 1, op het gehoor: zachter
zonder HS, ook met alleen EP (een algemene indruk, niet per run genoteerd); **gelijk met HS**,
in de drie gelogde runs van ronde 3 die beurt 2 bereikten en in de twee EP + HS-runs. Met
Deepgram als STT-engine werd geen verschil gehoord. De stem van de AI is TTS en hangt niet af van
de STT-engine; in ronde 3 en de EP + HS-runs werd een vaste zin gebruikt, zodat de vergelijking
niet afhing van wat de AI zei.

Niet meegeteld: tests 18 tot 21 van ronde 1, vlak vóór de telefoon opnieuw werd opgestart, met
EP aan (18: native, beurt 1 fail; 19: Deepgram, beurt 1 fail, socket gesloten bij gebrek aan
audio; 20: Deepgram, beurt 1 ok, de AI maakte geen geluid; 21: native, beurt 1 fail, de AI maakte
geen geluid). Het afspeellog zag er in alle vier normaal uit.

## Ronde 1 (`stt-logging.md`)

| Test | Setup | T1 | T2 | Opmerking |
|---|---|---|---|---|
| 1–5 | cut | ok | ok | 5 in het Noors; events gelogd, audio-element nog niet |
| 6–9 | natural | ok | fail | 6 meldde nooit een fout; 7 tot 9 `audio-capture` |
| 10 | natural | ok | fail | events van het audio-element gelogd vanaf hier |
| 11 | cut | ok | ok | |
| 12 | natural; stille clip van `unlockAudio()` meteen gepauzeerd | ok | fail | |
| 13 | natural; `audioSession.type = "play-and-record"` gezet vóór `start()` | ok | fail | het type was in beurt 2 al zo |
| 14 | cut; als 13 | **fail** | – | de enige mislukte beurt na een cut |
| 15 | natural, daarna cut late; als 13 | ok | ok | |
| 16 | cut, daarna cut late; als 13 | ok | ok | |
| 17 | EP | ok | ok | derde bericht van de AI werd nog afgespeeld |
| 18–21 | EP, vóór de herstart | zie hierboven | | niet meegeteld |

## Ronde 2 (`stt-logging-round2.md`, na de herstart)

| Test | Setup | T1 (gap) | T2 (gap) |
|---|---|---|---|
| 1 | EP | ok (6.3) | ok (16.3) |
| 2 | EP | ok (21.7) | ok (4.6) |
| 3 | EP | ok (1.4) | ok (0.6) |
| 4 | natural | **fail** (0.9) | – |
| 5 | natural | ok (0.5) | ok (32.2) |
| 6 | natural | ok (25.6) | fail (1.5) |
| 7 | natural, korte gap gevraagd | ok (0.6) | fail (0.3) |
| 8 | natural, korte gap gevraagd | ok (0.2) | fail (0.2) |
| 9 | natural, lange gap gevraagd | ok (23.7) | fail (23.2) |
| 10 | natural, lange gap gevraagd | ok (26.6) | ok (22.2) |

De gap voorspelt het resultaat niet: mislukkingen kwamen bij 0.2 s en bij 23 s, successen bij
0.2 s, 0.5 s en 27 s.

## Ronde 3 (`stt-logging-round3.md`, geen EP, HS, vaste zin van de AI)

| Test | T1 (gap) | T2 (gap) | Volume T2 ten opzichte van T1 |
|---|---|---|---|
| 1 | **fail** (1.1) | – | – |
| 2 | ok (1.2) | fail (1.6) | gelijk |
| 3 | ok (1.2) | fail (1.7) | gelijk |
| 4 | ok (0.8) | fail (1.7) | gelijk |

## Wat de runs laten zien

- De tweede beurt mislukt wanneer de spraak van de AI uit zichzelf eindigde, en ook voor de eigen
  track van de vastgehouden stream, dus de microfoonbron is dood voor elke gebruiker, niet alleen
  voor `SpeechRecognition`.
- EP herstelt de opname (4 van 4 tegenover 2 van 13, p ongeveer 0.006 als het geen verschil
  maakte) maar niet het volume; HS herstelt het volume maar niet de opname; beide samen
  herstelden beide.
- Geen experiment in strikte zin: de runs waren niet gerandomiseerd, de EP-runs kwamen eerst in
  ronde 2, en de telefoon werd vóór ronde 2 opnieuw opgestart.
- Niet begrepen: waarom beide maatregelen werken, de mislukte eerste beurten (14, 18, 19, 21,
  test 4 van ronde 2, test 1 van ronde 3), en de stille AI in tests 20 en 21.
