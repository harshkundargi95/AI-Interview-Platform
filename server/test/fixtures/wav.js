import { VOICE_RATE } from '../../../shared/voice.js'
export function wav(seconds = 1) {
  const data = Buffer.alloc(44 + VOICE_RATE * 2 * seconds)
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16)
  data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(VOICE_RATE, 24); data.writeUInt32LE(VOICE_RATE * 2, 28)
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(data.length - 44, 40)
  return data
}
