'use client';

import { useRef, useState } from 'react';

type Turn = { author: 'user' | 'ai'; text: string };

type Status =
  | 'idle'
  | 'aiThinking'
  | 'aiSpeaking'
  | 'readyToRecord'
  | 'recording'
  | 'transcribing'
  | 'error';

type ChatApiResponse = { interactionId: string; reply: string; correction: string | null };

export default function ChatApp() {
  const [status, setStatus] = useState<Status>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [correction, setCorrection] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previousInteractionIdRef = useRef<string | undefined>(undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

      previousInteractionIdRef.current = data.interactionId;
      setCorrection(data.correction);
      setTurns((current) => [...current, { author: 'ai', text: data.reply }]);

      await speak(data.reply);
      setStatus('readyToRecord');
    } catch (error) {
      handleError(error);
    }
  }

  async function speak(text: string) {
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

    await new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => resolve();
      void audio.play();
    });
  }

  async function startRecording() {
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void handleRecordingStopped();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setStatus('recording');
    } catch (error) {
      handleError(error);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleRecordingStopped() {
    setStatus('transcribing');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.set('audio', audioBlob, 'speech.webm');

      const response = await fetch('/api/stt', { method: 'POST', body: formData });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: { text: string } = await response.json();

      if (!data.text.trim()) {
        setStatus('readyToRecord');
        return;
      }

      setTurns((current) => [...current, { author: 'user', text: data.text }]);
      await requestAiTurn(data.text);
    } catch (error) {
      handleError(error);
    }
  }

  function handleError(error: unknown) {
    setErrorMessage(error instanceof Error ? error.message : 'Onbekende fout');
    setStatus('error');
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AI-stem spike</h1>
      <p>
        Gesprek in het Noors (B1) — Eleven Labs voor spraak (luisteren en spreken), Gemini voor het
        gesprek en de correctie.
      </p>

      {status === 'idle' && <button onClick={() => requestAiTurn()}>Start gesprek</button>}

      <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {turns.map((turn, index) => (
          <p key={index} style={{ margin: 0 }}>
            <strong>{turn.author === 'ai' ? 'AI: ' : 'Jij: '}</strong>
            {turn.text}
          </p>
        ))}
      </div>

      {correction && (
        <p style={{ background: '#fff3cd', padding: '0.75rem', borderRadius: 4 }}>
          <strong>Correctie: </strong>
          {correction}
        </p>
      )}

      {status === 'readyToRecord' && <button onClick={startRecording}>Spreek</button>}
      {status === 'recording' && <button onClick={stopRecording}>Stop met spreken</button>}
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
