import ChatApp from './ChatApp';

export default function Page() {
  const sttProvider = process.env.STT_PROVIDER ?? 'elevenlabs';
  const ttsProvider = process.env.TTS_PROVIDER ?? 'elevenlabs';

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: '#222',
          color: '#fff',
          padding: '0.35rem 0.75rem',
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: '0.85rem',
        }}
      >
        stt: {sttProvider}<br />tts: {ttsProvider}
      </div>
      <ChatApp />
    </>
  );
}
