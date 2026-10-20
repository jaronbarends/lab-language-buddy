---
paths:
  - "src/components/**"
  - "src/hooks/**"
  - "src/lib/stt/**"
  - "src/app/**/*.css"
---

# Safari on iPhone is a hard requirement

Full reasoning and the numbered list: "Safari/iPhone requirements" in `docs/plan.md`.
The short form:

1. Never hardcode a recording mimeType. Ask `MediaRecorder.isTypeSupported`, then read
   back the real `mediaRecorder.mimeType`.
2. Unlock audio inside every gesture: play the silent WAV on the one reused
   `HTMLAudioElement` synchronously, before any `await`, in each click handler that can
   lead to playback. In a form, that is the submit button's `onClick`, not `onSubmit`.
3. Layout is a flex column at `100dvh`, with `viewport-fit=cover` and the safe-area insets.
   No `position: fixed` bar.
4. Every focusable control is at least 16px, or iOS zooms on focus.
5. An editable bubble is `contenteditable="plaintext-only"`, not a textarea.
6. Test on a real device (`next dev` plus an ngrok tunnel; `getUserMedia` needs HTTPS).
   Reasoning from the spec is not a test.
