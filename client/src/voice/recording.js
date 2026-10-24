import { VOICE_RATE, VOICE_SECONDS } from '../../../shared/voice.js'
export function voiceSupported() {
  return Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia && window.AudioContext && window.AudioWorkletNode)
}
export function encodeWav(chunks) {
  const count = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const buffer = new ArrayBuffer(44 + count * 2), view = new DataView(buffer)
  const word = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)) }
  word(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, VOICE_RATE, true); view.setUint32(28, VOICE_RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  word(36, 'data'); view.setUint32(40, count * 2, true)
  let index = 44
  for (const chunk of chunks) for (const sample of chunk) { const bounded = Math.max(-1, Math.min(1, sample)); view.setInt16(index, bounded < 0 ? bounded * 32768 : bounded * 32767, true); index += 2 }
  return new Blob([buffer], { type: 'audio/wav' })
}
export async function recordAnswer({ signal, onTime, onFinish, onError }) {
  let stream, context, node, interval, deadline, ended = false, chunks = [], frames = 0
  const cleanup = () => {
    clearInterval(interval); clearTimeout(deadline)
    if (node) { node.port.onmessage = null; node.disconnect() }
    stream?.getTracks().forEach(track => { track.onended = null; track.stop() })
    context?.close().catch(() => {})
    signal.removeEventListener('abort', cancel)
  }
  const cancel = () => { ended = true; chunks = []; cleanup() }
  const fail = message => { if (ended) return; cancel(); onError(message) }
  const stop = () => {
    if (ended) return
    ended = true; cleanup()
    if (frames < VOICE_RATE) { chunks = []; onError('Record at least one second, or type your answer.'); return }
    const blob = encodeWav(chunks); chunks = []; onFinish(blob)
  }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    if (signal.aborted) { cancel(); return null }
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: VOICE_RATE, echoCancellation: true, noiseSuppression: true }, video: false })
    if (signal.aborted) { cancel(); return null }
    context = new AudioContext({ sampleRate: VOICE_RATE })
    if (context.sampleRate !== VOICE_RATE) throw new Error('Unsupported recording rate')
    await context.audioWorklet.addModule('/voice-capture.js')
    if (signal.aborted) { cancel(); return null }
    node = new AudioWorkletNode(context, 'voice-capture')
    const source = context.createMediaStreamSource(stream), silent = context.createGain()
    silent.gain.value = 0
    source.connect(node); node.connect(silent); silent.connect(context.destination)
    node.port.onmessage = ({ data }) => {
      if (ended) return
      const part = data.slice(0, VOICE_RATE * VOICE_SECONDS - frames)
      chunks.push(part); frames += part.length
      if (frames >= VOICE_RATE * VOICE_SECONDS) stop()
    }
    stream.getTracks().forEach(track => { track.onended = () => fail('Microphone disconnected. Record again or type your answer.') })
    await context.resume()
    if (signal.aborted) { cancel(); return null }
    const started = Date.now()
    interval = setInterval(() => onTime(Math.min(VOICE_SECONDS, Math.floor((Date.now() - started) / 1000))), 250)
    deadline = setTimeout(stop, VOICE_SECONDS * 1000)
    return { stop, cancel }
  } catch (error) {
    cancel()
    if (!signal.aborted) onError(error.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow it in your browser or type your answer.' : 'Microphone recording is unavailable. Check your device or use the text answer.')
    return null
  }
}
