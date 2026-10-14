# iPhone: native speech recognition, second turn and volume — run summary

The runs behind open question 14 in `plan.md` (found 10-13, investigated 10-14). One
iPhone (iOS version not recorded), Safari, `NEXT_PUBLIC_STT_PROVIDER=native` unless a row says
Deepgram, Dutch unless noted, the AI opening the conversation, two user turns per run.

The raw console logs are not in the repo: they are two thousand lines of repeated `result`
and `audio` events plus a temporary tunnel address. They are kept next to the repo, in
`resources/stt-ios-logs/` (`stt-logging.md`, `-round2.md`, `-round3.md`), and the counts below
can be checked against them.

## Terms

- **natural**: the AI's speech played to its end by itself (the audio element reached `ended`).
- **cut**: Reply was tapped while the AI was still speaking; **cut late**: in its last second.
- **EP**: early pause, speech paused 0.15 s before its end so the element never ends.
- **HS**: a `getUserMedia` stream held open next to the recognition.
- **ok / fail** for a turn: the native engine returned text / it started (`audiostart`) and
  then received nothing, ending after 20 to 40 s in `audio-capture` ("Source is stopped").
  With HS the held stream's own track also ended ("MediaStreamTrack ended due to a capture
  failure") in each failed turn.
- **gap**: seconds from the end of the AI's speech to `start requested`.

## Counts

| Setup | Turn 1 | Turn 2 |
|---|---|---|
| natural, no EP, no HS | 14 of 15 ok | **2 of 13 ok** |
| cut or cut late, no EP, no HS | 7 of 8 ok | 8 of 8 ok |
| natural, **EP**, no HS | 4 of 4 ok | **4 of 4 ok** |
| natural, no EP, **HS** | 3 of 4 ok | 0 of 3 ok |
| natural, **EP + HS** (2 unlogged runs) | 2 of 2 ok | 2 of 2 ok |

Volume of the AI's speech in turn 2 against turn 1, by ear: quieter without HS, also with
EP alone (a general impression, not noted per run); **equal with HS**, in the three logged
round 3 runs that reached turn 2 and in the two EP + HS runs. No difference was heard with
Deepgram as the STT engine. The AI's voice is TTS and does not depend on
the STT engine; a fixed sentence was used in round 3 and the EP + HS runs, so the comparison
did not depend on what the AI said.

Not counted: tests 18 to 21 of round 1, run just before the phone was restarted, with EP on
(18: native, turn 1 fail; 19: Deepgram, turn 1 fail, socket closed for lack of audio;
20: Deepgram, turn 1 ok, the AI made no sound; 21: native, turn 1 fail, the AI made no
sound). The playback log looked normal in all four.

## Round 1 (`stt-logging.md`)

| Test | Setup | T1 | T2 | Note |
|---|---|---|---|---|
| 1–5 | cut | ok | ok | 5 in Norwegian; events logged, audio element not yet |
| 6–9 | natural | ok | fail | 6 never reported an error; 7 to 9 `audio-capture` |
| 10 | natural | ok | fail | audio element events logged from here |
| 11 | cut | ok | ok | |
| 12 | natural; silent clip of `unlockAudio()` paused at once | ok | fail | |
| 13 | natural; `audioSession.type = "play-and-record"` set before `start()` | ok | fail | the type was already that in turn 2 |
| 14 | cut; as 13 | **fail** | – | the one failed turn after a cut |
| 15 | natural, then cut late; as 13 | ok | ok | |
| 16 | cut, then cut late; as 13 | ok | ok | |
| 17 | EP | ok | ok | third AI message still played |
| 18–21 | EP, before the restart | see above | | not counted |

## Round 2 (`stt-logging-round2.md`, after the restart)

| Test | Setup | T1 (gap) | T2 (gap) |
|---|---|---|---|
| 1 | EP | ok (6.3) | ok (16.3) |
| 2 | EP | ok (21.7) | ok (4.6) |
| 3 | EP | ok (1.4) | ok (0.6) |
| 4 | natural | **fail** (0.9) | – |
| 5 | natural | ok (0.5) | ok (32.2) |
| 6 | natural | ok (25.6) | fail (1.5) |
| 7 | natural, short gap asked | ok (0.6) | fail (0.3) |
| 8 | natural, short gap asked | ok (0.2) | fail (0.2) |
| 9 | natural, long gap asked | ok (23.7) | fail (23.2) |
| 10 | natural, long gap asked | ok (26.6) | ok (22.2) |

The gap does not predict the result: failures came at 0.2 s and at 23 s, successes at 0.2 s,
0.5 s and 27 s.

## Round 3 (`stt-logging-round3.md`, no EP, HS, fixed AI sentence)

| Test | T1 (gap) | T2 (gap) | Volume T2 against T1 |
|---|---|---|---|
| 1 | **fail** (1.1) | – | – |
| 2 | ok (1.2) | fail (1.6) | equal |
| 3 | ok (1.2) | fail (1.7) | equal |
| 4 | ok (0.8) | fail (1.7) | equal |

## What the runs show

- The second turn fails when the AI's speech ended by itself, and for the held stream's own
  track too, so the microphone source is dead for any user, not only for `SpeechRecognition`.
- EP restores the recording (4 of 4 against 2 of 13, p about 0.006 if it made no difference)
  but not the volume; HS restores the volume but not the recording; both together did both.
- Not an experiment in the strict sense: runs were not randomized, EP runs came first in
  round 2, and the phone was restarted before round 2.
- Not understood: why either measure works, the failed first turns (14, 18, 19, 21, round 2
  test 4, round 3 test 1), and the silent AI in tests 20 and 21.
