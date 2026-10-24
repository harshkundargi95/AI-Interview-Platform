import express from 'express'
import { z } from 'zod'
import { ApiError } from '../middleware/errors.js'
import { VOICE_BYTES, VOICE_RATE } from '../../../shared/voice.js'
// Accept only our canonical, uncompressed mono PCM WAV. Length determines duration;
// client-supplied duration and MIME declarations are never trusted.
export function validateWav(bytes) {
  const invalid = () => new ApiError(400, 'INVALID_AUDIO', 'Record a new answer of 1–60 seconds using the microphone control.')
  if (!Buffer.isBuffer(bytes) || bytes.length < 44 + VOICE_RATE * 2 || bytes.length > VOICE_BYTES) throw invalid()
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.readUInt32LE(4) !== bytes.length - 8 || bytes.toString('ascii', 8, 16) !== 'WAVEfmt ' || bytes.readUInt32LE(16) !== 16 || bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1 || bytes.readUInt32LE(24) !== VOICE_RATE || bytes.readUInt32LE(28) !== VOICE_RATE * 2 || bytes.readUInt16LE(32) !== 2 || bytes.readUInt16LE(34) !== 16 || bytes.toString('ascii', 36, 40) !== 'data' || bytes.readUInt32LE(40) !== bytes.length - 44 || (bytes.length - 44) % 2) throw invalid()
  return (bytes.length - 44) / (VOICE_RATE * 2)
}
export function voiceRoutes(db, voice) {
  const router = express.Router(), active = new Set()
  const params = z.object({ interviewId: z.uuid(), questionId: z.string().min(1).max(100), requestId: z.uuid() })
  const owned = async req => {
    const interview = await db.interview.findFirst({ where: { id: req.params.interviewId, ownerId: req.ownerId, status: 'active', questions: { some: { id: req.params.questionId } } }, select: { id: true } })
    if (!interview) throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Active interview question not found.')
  }
  router.post('/:interviewId/:questionId/:requestId', async (req, res, next) => {
    if (!voice) throw new ApiError(503, 'VOICE_DISABLED', 'Voice is disabled. You can still type your answer.')
    if (!params.safeParse(req.params).success) throw new ApiError(400, 'INVALID_REQUEST', 'Invalid interview, question or recording ID.')
    await owned(req)
    if (!req.is('application/octet-stream')) throw new ApiError(415, 'AUDIO_REQUIRED', 'Send the recorded WAV bytes.')
    if (active.has(req.ownerId) || active.size >= 2) throw new ApiError(429, 'VOICE_BUSY', 'Another recording is being processed. Please wait.')
    active.add(req.ownerId)
    const timer = setTimeout(() => { res.destroy(); active.delete(req.ownerId) }, 60000)
    res.once('close', () => { clearTimeout(timer); active.delete(req.ownerId) })
    next()
  }, express.raw({ type: 'application/octet-stream', limit: VOICE_BYTES }), async (req, res) => {
    try {
      validateWav(req.body)
      if (req.aborted || res.destroyed) return
      const result = await voice.run(req.ownerId, `voice:${req.params.interviewId}:${req.params.questionId}:${req.params.requestId}`, 'transcription', { audio: req.body.toString('base64') })
      await owned(req)
      if (!res.destroyed) res.json({ data: { ...result, mode: voice.mode } })
    } finally { req.body = undefined }
  })
  return router
}
