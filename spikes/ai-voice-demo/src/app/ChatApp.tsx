'use client';

import { useRef, useState } from 'react';
import { countSpokenWords, estimateWordTimings, type WordTiming } from '@/lib/textHighlight';

type Turn = { id: string; author: 'user' | 'ai'; text: string };

type Status =
  | 'idle'
  | 'aiThinking'
  | 'aiSpeaking'
  | 'readyToRecord'
  | 'recording'
  | 'transcribing'
  | 'error';

type ChatApiResponse = { interactionId: string; reply: string; correction: string | null };

// Chrome records webm/opus by default, Safari mp4/aac (which Google STT can't read).
// Ask for webm/opus explicitly; if the browser can't do it, fall back to its own default.
const PREFERRED_RECORDING_MIME_TYPE = 'audio/webm;codecs=opus';

// Deepgram's live model/language — must match what /api/stt/token's grant is used for.
const LIVE_LISTEN_URL =
  'wss://api.deepgram.com/v1/listen?model=nova-2&language=no&interim_results=true';

// Keeps whitespace intact (capturing group) so the rendered text still
// matches the original spacing/punctuation.
function renderHighlightedText(text: string, spokenWordCount: number) {
  let wordIndex = 0;

  return text.split(/(\s+)/).map((token, tokenIndex) => {
    const tokenIsWhitespace = token.trim().length === 0;
    if (tokenIsWhitespace) {
      return token;
    }

    const wordHasBeenSpoken = wordIndex < spokenWordCount;
    wordIndex += 1;

    return (
      <span
        key={tokenIndex}
        style={{ backgroundColor: wordHasBeenSpoken ? '#fff3cd' : 'transparent' }}
      >
        {token}
      </span>
    );
  });
}

// ~2ms of silence; only used to unlock the shared audio element inside a user gesture
const SILENT_AUDIO_SRC =
  'data:audio/wav;base64,UklGRuwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

export default function ChatApp() {
  const [status, setStatus] = useState<Status>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [correction, setCorrection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const [spokenWordCount, setSpokenWordCount] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState({ finalized: '', interim: '' });

  const previousInteractionIdRef = useRef<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveSocketRef = useRef<WebSocket | null>(null);
  // Mirrors liveTranscript so finishRecording() can read the latest value
  // synchronously once the socket closes, without waiting on React state.
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  // iOS Safari only lets an audio element play if it was started inside a user gesture.
  // The AI reply is played after several awaited fetches (gesture is gone by then), so we
  // start one shared element with silence during the click and reuse it for every reply.
  // Must be called synchronously from a click handler, before any await.
  function unlockAudio() {
    audioRef.current ??= new Audio();
    audioRef.current.src = SILENT_AUDIO_SRC;
    audioRef.current.play().catch(() => {
      // unlocking is best-effort; speak() surfaces a real playback failure
    });
  }

  function handleStartClick() {
    unlockAudio();
    void requestAiTurn();
  }

  async function requestAiTurn(input?: string) {
    setStatus('aiThinking');
    setErrorMessage(null);
    setCorrection(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          previousInteractionId: previousInteractionIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: ChatApiResponse = await response.json();
      const aiTurnId = crypto.randomUUID();

      previousInteractionIdRef.current = data.interactionId;
      setCorrection(data.correction);
      setTurns((current) => [...current, { id: aiTurnId, author: 'ai', text: data.reply }]);

      await speak(data.reply, aiTurnId);
      setStatus('readyToRecord');
    } catch (error) {
      handleError(error);
    }
  }

  async function speak(text: string, turnId: string) {
    setStatus('aiSpeaking');

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = audioRef.current;
    if (!audio) {
      throw new Error('Audio is not unlocked');
    }

    // Filled in once the audio's real duration is known (onloadedmetadata),
    // then read from the ontimeupdate closure below on every tick.
    let wordTimings: WordTiming[] = [];

    setSpeakingTurnId(turnId);
    setSpokenWordCount(0);

    try {
      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => {
          wordTimings = estimateWordTimings(text, audio.duration);
        };
        audio.ontimeupdate = () => {
          setSpokenWordCount(countSpokenWords(wordTimings, audio.currentTime));
        };
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.src = audioUrl;
        audio.play().catch(reject);
      });
    } finally {
      setSpeakingTurnId(null);
    }
  }

  async function startRecording() {
    // this click is the gesture that precedes the next AI reply
    unlockAudio();
    setErrorMessage(null);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setLiveTranscript({ finalized: '', interim: '' });

    try {
      const tokenResponse = await fetch('/api/stt/token', { method: 'POST' });
      if (!tokenResponse.ok) {
        throw new Error(await tokenResponse.text());
      }
      const { accessToken }: { accessToken: string } = await tokenResponse.json();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Browsers can't set an Authorization header on a WebSocket handshake,
      // so the token travels via the Sec-WebSocket-Protocol subprotocol
      // instead — 'Bearer' scheme for this short-lived token (findings.md).
      const socket = new WebSocket(LIVE_LISTEN_URL, ['Bearer', accessToken]);
      liveSocketRef.current = socket;

      socket.addEventListener('message', (event) => {
        const data: {
          type: string;
          is_final?: boolean;
          channel?: { alternatives?: { transcript: string }[] };
        } = JSON.parse(event.data);

        if (data.type !== 'Results') {
          return;
        }

        const transcript = data.channel?.alternatives?.[0]?.transcript ?? '';
        if (!transcript) {
          return;
        }

        if (data.is_final) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
          interimTranscriptRef.current = '';
        } else {
          interimTranscriptRef.current = transcript;
        }

        setLiveTranscript({
          finalized: finalTranscriptRef.current,
          interim: interimTranscriptRef.current,
        });
      });

      await new Promise<void>((resolve, reject) => {
        socket.addEventListener('open', () => resolve(), { once: true });
        socket.addEventListener(
          'error',
          () => reject(new Error('Kon geen verbinding maken met live transcriptie')),
          { once: true }
        );
      });

      socket.addEventListener('error', () => {
        handleError(new Error('Live transcriptie-verbinding is mislukt'));
      });

      const mediaRecorder = new MediaRecorder(
        stream,
        MediaRecorder.isTypeSupported(PREFERRED_RECORDING_MIME_TYPE)
          ? { mimeType: PREFERRED_RECORDING_MIME_TYPE }
          : undefined
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void finishRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // send a chunk to Deepgram every 250ms
      setStatus('recording');
    } catch (error) {
      handleError(error);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function finishRecording() {
    setStatus('transcribing');

    try {
      const socket = liveSocketRef.current;

      if (socket && socket.readyState === WebSocket.OPEN) {
        // Tells Deepgram no more audio is coming; it flushes any pending
        // final result before closing the socket on its own.
        socket.send(JSON.stringify({ type: 'CloseStream' }));
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(resolve, 3000);
          socket.addEventListener(
            'close',
            () => {
              clearTimeout(timeoutId);
              resolve();
            },
            { once: true }
          );
        });
      }

      const text = finalTranscriptRef.current || interimTranscriptRef.current;

      if (!text.trim()) {
        setStatus('readyToRecord');
        return;
      }

      setTurns((current) => [...current, { id: crypto.randomUUID(), author: 'user', text }]);
      await requestAiTurn(text);
    } catch (error) {
      handleError(error);
    } finally {
      liveSocketRef.current = null;
    }
  }

  function handleError(error: unknown) {
    setErrorMessage(error instanceof Error ? error.message : 'Onbekende fout');
    setStatus('error');
  }

  const buttonStyle = {
    display: 'block',
    margin: '10px auto',
    padding: '0.5em 1em',
    background: 'hotpink',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AI-stem spike</h1>
      <p>
        Gesprek in het Noors (B1) — Configureerbare providers voor spraak (luisteren en spreken), Gemini voor het
        gesprek en de correctie.
      </p>

      {status === 'idle' && <button style={buttonStyle} onClick={handleStartClick}>Start gesprek</button>}

      <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {turns.map((turn) => (
          <p key={turn.id} style={{ margin: 0 }}>
            <strong>{turn.author === 'ai' ? 'AI: ' : 'Jij: '}</strong>
            {turn.id === speakingTurnId
              ? renderHighlightedText(turn.text, spokenWordCount)
              : turn.text}
          </p>
        ))}
      </div>

      {status === 'recording' && (liveTranscript.finalized || liveTranscript.interim) && (
        <p style={{ margin: 0, color: '#555' }}>
          <strong>Jij (live): </strong>
          {liveTranscript.finalized}
          {liveTranscript.interim && (
            <span style={{ color: '#999' }}> {liveTranscript.interim}</span>
          )}
        </p>
      )}

      {correction && (
        <p style={{ background: '#fff3cd', padding: '0.75rem', borderRadius: 4 }}>
          <strong>Correctie: </strong>
          {correction}
        </p>
      )}

      {status === 'readyToRecord' && <button onClick={startRecording} style={buttonStyle}>Spreek</button>}
      {status === 'recording' && <button onClick={stopRecording} style={buttonStyle}>Stop met spreken</button>}
      {(status === 'aiThinking' || status === 'aiSpeaking' || status === 'transcribing') && (
        <p>Bezig… ({status})</p>
      )}

      {status === 'error' && (
        <p style={{ color: 'crimson' }}>
          Fout: {errorMessage} — herlaad de pagina om opnieuw te beginnen.
        </p>
      )}
    </main>
  );
}
