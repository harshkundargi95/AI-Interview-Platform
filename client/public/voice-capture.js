/* AudioWorklet runs off the UI thread. No audio leaves the browser here. */
class VoiceCapture extends AudioWorkletProcessor {
  constructor() { super(); this.frames = 0 }
  process(inputs) {
    const channel = inputs[0]?.[0]
    if (!channel) return true
    const remaining = 16000 * 60 - this.frames
    if (remaining <= 0) return false
    const samples = channel.slice(0, remaining)
    this.frames += samples.length
    this.port.postMessage(samples, [samples.buffer])
    return this.frames < 16000 * 60
  }
}
registerProcessor('voice-capture', VoiceCapture)
