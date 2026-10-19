// The audio-thread half of the ElevenLabs engine. Scribe takes only raw PCM (or u-law), not
// the webm/opus that MediaRecorder gives, so the microphone goes through an AudioWorklet
// that turns it into 16-bit PCM at PCM_SAMPLE_RATE.

export const PCM_SAMPLE_RATE = 16_000;
export const PCM_WORKLET_NAME = "pcm-downsampler";

/** How many samples go out in one message: 100 ms. */
const PCM_CHUNK_SAMPLES = 1_600;

// The worklet runs in AudioWorkletGlobalScope, which has no module imports from here, so it
// is source text that the ElevenLabs engine loads through a Blob URL. Plain JavaScript on
// purpose.
//
// It averages the input down to the target rate (a box filter, so the ratio need not be a
// whole number, and without the aliasing that just dropping samples gives) and posts each
// full chunk to the main thread as an Int16 ArrayBuffer.
export const PCM_WORKLET_SOURCE = `
class PcmDownsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${PCM_SAMPLE_RATE};
    this.phase = 0;
    this.sum = 0;
    this.count = 0;
    this.out = new Int16Array(${PCM_CHUNK_SAMPLES});
    this.outLength = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) {
      return true;
    }

    for (let index = 0; index < channel.length; index++) {
      this.sum += channel[index];
      this.count++;
      this.phase++;
      if (this.phase < this.ratio) {
        continue;
      }

      this.phase -= this.ratio;
      const sample = Math.max(-1, Math.min(1, this.sum / this.count));
      this.out[this.outLength++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      this.sum = 0;
      this.count = 0;

      if (this.outLength === this.out.length) {
        this.port.postMessage(this.out.buffer, [this.out.buffer]);
        this.out = new Int16Array(${PCM_CHUNK_SAMPLES});
        this.outLength = 0;
      }
    }
    return true;
  }
}

registerProcessor("${PCM_WORKLET_NAME}", PcmDownsampler);
`;
