import { setTimeout as delay } from 'node:timers/promises'
import { createHash } from 'node:crypto'
import { ApiError } from '../middleware/errors.js'
import { RUBRIC, validateOutput } from './contracts.js'
const failed = (errorCode, kind, attempts = 0) => {
  if (errorCode === 'AI_PROVIDER_503') return new ApiError(503, 'AI_UNAVAILABLE', kind === 'transcription'
    ? attempts < 4 ? 'Gemini is temporarily unavailable. Your recording is still here. Wait 5 seconds, then retry transcription.' : 'Gemini is still unavailable. This recording reached its retry limit. You can type your answer or record again later.'
    : 'Gemini is temporarily unavailable. Your saved answers are safe. Please try a new interview later.', { retryable: kind === 'transcription' && attempts < 4 })
  return new ApiError(503, 'AI_UNAVAILABLE', kind === 'transcription'
    ? 'Transcription could not finish safely. This uncertain or invalid result will not be replayed automatically. Your recording and typed answer are unchanged; you can type or record again.'
    : 'AI could not safely finish this operation. Your saved answers are safe. This request will not be replayed automatically; continue practice or start a new interview.')
}
const hash = input => createHash('sha256').update(JSON.stringify(input)).digest('hex')
export function createAiOperations(db, provider, { dailyLimit = 30, globalDailyLimit = 500, timeoutMs = 45000, validate = validateOutput, retainResult = true, retryDelayMs = 1000, retryCooldownMs = 5000 } = {}) {
  if (![dailyLimit, globalDailyLimit].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('AI daily limits must be positive integers.')
  return { mode: provider.mode, model: provider.model, async run(ownerId, key, kind, input) {
    const inputHash = hash(input)
    const claim = await db.$transaction(async tx => {
      // One shared transaction lock serializes quotas/claims across local API processes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(6102026)`
      const existing = await tx.aiOperation.findUnique({ where: { ownerId_key: { ownerId, key } } })
      if (existing) {
        if (existing.inputHash !== inputHash) throw new ApiError(409, 'AI_INPUT_CHANGED', 'This AI operation already used different saved content. Continue without a follow-up or start a new interview.')
        if (existing.model !== provider.model && !(kind === 'transcription' && existing.status === 'failed' && existing.errorCode === 'AI_PROVIDER_503' && existing.attempts < 4)) throw new ApiError(409, 'AI_MODE_CHANGED', 'AI model changed. Start a new interview.')
        if (existing.status === 'succeeded') {
          if (!retainResult) throw new ApiError(409, 'AI_RESULT_NOT_RETAINED', 'This recording was already transcribed. For privacy its transcript was not retained; edit your draft or record again.')
          return { cached: existing.result }
        }
        if (existing.status === 'failed') {
          // Only an explicit provider 503 permits manual reuse of this voice recording.
          if (kind !== 'transcription' || existing.errorCode !== 'AI_PROVIDER_503' || existing.attempts >= 4) throw failed(existing.errorCode, kind, existing.attempts)
          if (Date.now() - existing.updatedAt.getTime() < retryCooldownMs) throw new ApiError(429, 'AI_RETRY_COOLDOWN', 'Gemini is busy. Wait 5 seconds before retrying this recording.')
        } else {
          if (Date.now() - existing.updatedAt.getTime() > timeoutMs + 15000) throw failed(existing.errorCode, kind, existing.attempts)
          throw new ApiError(409, 'AI_IN_PROGRESS', 'This AI request is already running. Wait a moment before retrying.')
        }
      }
      const day = new Date(); day.setUTCHours(0, 0, 0, 0)
      const usedToday = { OR: [{ createdAt: { gte: day } }, { updatedAt: { gte: day } }] }
      const count = await tx.aiOperation.count({ where: { ownerId, ...usedToday } })
      if (count >= dailyLimit) throw new ApiError(429, 'AI_QUOTA', 'Your daily AI request allowance is used. Fixed-bank practice is still available. Try AI again tomorrow (UTC).')
      if (await tx.aiOperation.count({ where: usedToday }) >= globalDailyLimit) throw new ApiError(429, 'AI_QUOTA', 'The server daily AI allowance is used. Fixed-bank practice remains available.')
      const running = { status: 'running', updatedAt: { gte: new Date(Date.now() - timeoutMs - 15000) } }
      if (await tx.aiOperation.count({ where: { ...running, ownerId } }) || await tx.aiOperation.count({ where: running }) >= 3) throw new ApiError(429, 'AI_BUSY', 'AI is busy. Wait a moment before retrying. Your answers are saved.')
      if (existing) {
        const operation = await tx.aiOperation.update({ where: { id: existing.id }, data: { status: 'running', model: provider.model, errorCode: null, updatedAt: new Date() } })
        return { operation }
      }
      const operation = await tx.aiOperation.create({ data: { ownerId, key, kind, inputHash, status: 'running', model: provider.model, rubric: RUBRIC } })
      return { operation }
    })
    if (claim.cached) return claim.cached
    const id = claim.operation.id
    const controller = new AbortController()
    let timer
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('AI timeout')) }, timeoutMs) })
    let attempts = claim.operation.attempts
    let runAttempts = 0
    let stage = 'provider'
    try {
      const work = async () => {
        for (;;) {
          controller.signal.throwIfAborted()
          attempts++; runAttempts++
          await db.aiOperation.update({ where: { id }, data: { attempts } })
          controller.signal.throwIfAborted()
          try { return await provider.generate(kind, input, controller.signal) }
          catch (error) {
            // Bounded retries for explicit rate-limit/unavailable responses only.
            // Network errors, timeouts, 500s and invalid output remain non-replayable.
            if (![429, 503].includes(error.status) || runAttempts >= 2 || attempts >= 4 || controller.signal.aborted) throw error
            await delay(retryDelayMs * 2 ** (runAttempts - 1) + Math.floor(Math.random() * Math.min(250, retryDelayMs)), undefined, { signal: controller.signal })
          }
        }
      }
      const result = await Promise.race([work(), deadline])
      stage = 'validation'
      const data = validate(kind, result.data, input)
      stage = 'storage'
      const stored = await db.aiOperation.updateMany({ where: { id, status: 'running' }, data: { status: 'succeeded', result: retainResult ? data : null, inputTokens: result.inputTokens, outputTokens: result.outputTokens } })
      if (!stored.count) throw new Error('Operation was cancelled')
      return data
    } catch (error) {
      // Store only bounded categories, never provider messages, prompts or answers.
      const errorCode = controller.signal.aborted ? 'AI_TIMEOUT'
        : stage === 'validation' ? 'AI_INVALID_OUTPUT'
          : stage === 'storage' ? 'AI_STORAGE_ERROR'
            : Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? `AI_PROVIDER_${error.status}` : 'AI_PROVIDER_ERROR'
      await db.aiOperation.updateMany({ where: { id, status: 'running' }, data: { status: 'failed', errorCode } })
      throw failed(errorCode, kind, attempts)
    } finally { clearTimeout(timer) }
  } }
}
