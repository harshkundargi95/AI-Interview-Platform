import { describe, it, expect, vi } from 'vitest'
import { validateWav } from '../src/voice/routes.js'
import { configuredVoiceProvider, transcriptSchema } from '../src/voice/provider.js'
import { VOICE_SECONDS } from '../../shared/voice.js'
import { wav } from './fixtures/wav.js'
describe('voice boundary', () => {
  it('validates real PCM layout and server-computed duration', () => {
    expect(validateWav(wav())).toBe(1); expect(validateWav(wav(VOICE_SECONDS))).toBe(VOICE_SECONDS)
    for (const value of [Buffer.from('fake'), wav(0), wav(VOICE_SECONDS + 1)]) expect(() => validateWav(value)).toThrow()
    const wrongRate = wav(); wrongRate.writeUInt32LE(8000, 24); expect(() => validateWav(wrongRate)).toThrow()
    const wrongSize = wav(); wrongSize.writeUInt32LE(0, 40); expect(() => validateWav(wrongSize)).toThrow()
  })
  it('labels mock output and can disable voice independently', async () => {
    const provider = configuredVoiceProvider({ VOICE_MODE: 'mock' })
    expect((await provider.generate()).data.transcript).toContain('Mock transcript')
    expect(configuredVoiceProvider({ VOICE_MODE: 'disabled', AI_MODE: 'live' })).toBeNull()
    expect(() => transcriptSchema.parse({ transcript: '' })).toThrow()
    expect(() => transcriptSchema.parse({ transcript: 'x'.repeat(3001) })).toThrow()
  })
  it('sends only audio to Gemini with a transcription-only instruction and abort signal', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: '{"transcript":"I used SQL."}' })
    const provider = configuredVoiceProvider({ VOICE_MODE: 'live', GEMINI_API_KEY: 'test-fixture', GEMINI_MODEL: 'gemini-3.1-flash-lite' }, { models: { generateContent } })
    const signal = new AbortController().signal
    const result = await provider.generate('transcription', { audio: 'encoded', resume: 'private resume' }, signal)
    expect(result.data.transcript).toBe('I used SQL.')
    expect(generateContent.mock.calls[0][0].contents).toEqual([{ role: 'user', parts: [{ inlineData: { mimeType: 'audio/wav', data: 'encoded' } }] }])
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBe(signal)
  })
})
