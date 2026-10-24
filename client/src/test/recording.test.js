import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { recordAnswer, encodeWav } from '../voice/recording.js'
import { VOICE_BYTES, VOICE_RATE } from '../../../shared/voice.js'
let track, context, node, getUserMedia
beforeEach(() => {
  vi.useFakeTimers()
  track = { stop: vi.fn(), onended: null }
  getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [track] })
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
  vi.stubGlobal('AudioContext', class {
    constructor() { context = this; this.sampleRate = VOICE_RATE; this.audioWorklet = { addModule: vi.fn().mockResolvedValue() }; this.close = vi.fn().mockResolvedValue(); this.resume = vi.fn().mockResolvedValue(); this.destination = {} }
    createMediaStreamSource() { return { connect: vi.fn() } }
    createGain() { return { gain: {}, connect: vi.fn() } }
  })
  vi.stubGlobal('AudioWorkletNode', class { constructor() { node = this; this.port = {}; this.connect = vi.fn(); this.disconnect = vi.fn() } })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); delete navigator.mediaDevices })
it('caps audio samples at 60 seconds and releases the microphone', async () => {
  const onFinish = vi.fn(), onError = vi.fn()
  await recordAnswer({ signal: new AbortController().signal, onTime: vi.fn(), onFinish, onError })
  node.port.onmessage({ data: new Float32Array(VOICE_RATE * 61) })
  expect(onFinish).toHaveBeenCalledOnce(); expect(onFinish.mock.calls[0][0].size).toBe(VOICE_BYTES)
  expect(track.stop).toHaveBeenCalled(); expect(context.close).toHaveBeenCalled(); expect(onError).not.toHaveBeenCalled()
})
it('enforces wall-clock duration even when sample delivery stalls', async () => {
  const onFinish = vi.fn()
  await recordAnswer({ signal: new AbortController().signal, onTime: vi.fn(), onFinish, onError: vi.fn() })
  node.port.onmessage({ data: new Float32Array(VOICE_RATE) })
  await vi.advanceTimersByTimeAsync(60000)
  expect(track.stop).toHaveBeenCalled(); expect(onFinish).toHaveBeenCalledOnce()
})
it('releases a late microphone grant after permission cancellation', async () => {
  let resolve
  getUserMedia.mockImplementation(() => new Promise(done => { resolve = done }))
  const controller = new AbortController(), onFinish = vi.fn()
  const result = recordAnswer({ signal: controller.signal, onTime: vi.fn(), onFinish, onError: vi.fn() })
  controller.abort(); resolve({ getTracks: () => [track] }); await result
  expect(track.stop).toHaveBeenCalled(); expect(onFinish).not.toHaveBeenCalled()
})
it('rejects too-short recordings and handles microphone removal', async () => {
  const onError = vi.fn(), onFinish = vi.fn()
  const handle = await recordAnswer({ signal: new AbortController().signal, onTime: vi.fn(), onFinish, onError })
  handle.stop(); expect(onError).toHaveBeenCalledWith(expect.stringContaining('at least one second'))
  await recordAnswer({ signal: new AbortController().signal, onTime: vi.fn(), onFinish, onError })
  track.onended(); expect(onError).toHaveBeenCalledWith(expect.stringContaining('disconnected'))
  expect(onFinish).not.toHaveBeenCalled()
})
it('encodes a size-bounded PCM container', () => {
  expect(encodeWav([new Float32Array(VOICE_RATE)]).size).toBe(32044)
})
