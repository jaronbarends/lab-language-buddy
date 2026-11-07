---
paths:
  - "src/components/**"
  - "src/hooks/**"
  - "src/lib/stt/**"
  - "src/app/**/*.css"
---

# Safari op iPhone is een harde eis

Volledige onderbouwing: ADR-026 (Safari/iPhone-eisen).
De korte vorm:

1. Hardcode nooit een mimeType voor opname. Vraag `MediaRecorder.isTypeSupported` en lees daarna
   de echte `mediaRecorder.mimeType` terug.
2. Ontgrendel audio binnen elke gesture: speel de stille WAV af op het ene hergebruikte
   `HTMLAudioElement`, synchroon, vóór elke `await`, in elke click handler die tot afspelen kan
   leiden. In een formulier is dat de `onClick` van de submit-knop, niet `onSubmit`.
3. De layout is een flex column op `100dvh`, met `viewport-fit=cover` en de safe-area insets.
   Geen `position: fixed` balk.
4. Elk focusbaar element is minstens 16px, anders zoomt iOS in bij focus.
5. Een bewerkbare bubbel is `contenteditable="plaintext-only"`, geen textarea.
6. Test op een echt toestel (`next dev` plus een ngrok-tunnel; `getUserMedia` vereist HTTPS).
   Redeneren vanuit de spec is geen test.
