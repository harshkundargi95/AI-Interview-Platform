import { createHash } from 'node:crypto'
import { ApiError } from '../middleware/errors.js'
import { RUBRIC, validateOutput } from './contracts.js'
const failed = () => new ApiError(503, 'AI_UNAVAILABLE', 'AI could not safely finish this operation. Your saved answers are safe. This attempt will not be charged again by an automatic retry; continue practice or start a new interview.')
const hash = input => createHash('sha256').update(JSON.stringify(input)).digest('hex')
export function createAiOperations(db, provider, { dailyLimit = 30, timeoutMs = 45000 } = {}) {
  return { mode: provider.mode, model: provider.model, async run(ownerId, key, kind, input) {
    const inputHash = hash(input)
    const claim = await db.$transaction(async tx => {
      // One shared transaction lock serializes quotas/claims across local API processes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(6102026)`
      const existing = await tx.aiOperation.findUnique({ where: { ownerId_key: { ownerId, key } } })
      if (existing) {
        if (existing.inputHash !== inputHash) throw new ApiError(409, 'AI_INPUT_CHANGED', 'This AI operation already used different saved content. Continue without a follow-up or start a new interview.')
        if (existing.model !== provider.model) throw new ApiError(409, 'AI_MODE_CHANGED', 'AI model changed. Start a new interview.')
        if (existing.status === 'succeeded') return { cached: existing.result }
        if (existing.status === 'failed' || Date.now() - existing.createdAt.getTime() > timeoutMs + 15000) throw failed()
        throw new ApiError(409, 'AI_IN_PROGRESS', 'This AI request is already running. Wait a moment, then retry to retrieve its result.')
      }
      const day = new Date(); day.setUTCHours(0, 0, 0, 0)
      const count = await tx.aiOperation.count({ where: { ownerId, createdAt: { gte: day } } })
      if (count >= dailyLimit) throw new ApiError(429, 'AI_QUOTA', 'Your daily AI request allowance is used. Fixed-bank practice is still available. Try AI again tomorrow (UTC).')
      const running = { status: 'running', createdAt: { gte: new Date(Date.now() - timeoutMs - 15000) } }
      if (await tx.aiOperation.count({ where: { ...running, ownerId } }) || await tx.aiOperation.count({ where: running }) >= 3) throw new ApiError(429, 'AI_BUSY', 'AI is busy. Wait a moment before retrying. Your answers are saved.')
      const operation = await tx.aiOperation.create({ data: { ownerId, key, kind, inputHash, status: 'running', model: provider.model, rubric: RUBRIC } })
      return { operation }
    })
    if (claim.cached) return claim.cached
    const id = claim.operation.id
    const controller = new AbortController()
    let timer
    const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('AI timeout')) }, timeoutMs) })
    let attempts = 0
    let stage = 'provider'
    try {
      const work = async () => {
        for (;;) {
          attempts++
          await db.aiOperation.update({ where: { id }, data: { attempts } })
          try { return await provider.generate(kind, input, controller.signal) }
          catch (error) {
            // Retry only an explicit rate-limit rejection, never an ambiguous timeout/5xx.
            if (error.status !== 429 || attempts >= 2 || controller.signal.aborted) throw error
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }
      const result = await Promise.race([work(), deadline])
      stage = 'validation'
      const data = validateOutput(kind, result.data, input)
      stage = 'storage'
      const stored = await db.aiOperation.updateMany({ where: { id, status: 'running' }, data: { status: 'succeeded', result: data, inputTokens: result.inputTokens, outputTokens: result.outputTokens } })
      if (!stored.count) throw new Error('Operation was cancelled')
      return data
    } catch (error) {
      // Store only bounded categories, never provider messages, prompts or answers.
      const errorCode = controller.signal.aborted ? 'AI_TIMEOUT'
        : stage === 'validation' ? 'AI_INVALID_OUTPUT'
          : stage === 'storage' ? 'AI_STORAGE_ERROR'
            : Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? `AI_PROVIDER_${error.status}` : 'AI_PROVIDER_ERROR'
      await db.aiOperation.updateMany({ where: { id, status: 'running' }, data: { status: 'failed', errorCode } })
      throw failed()
    } finally { clearTimeout(timer) }
  } }
}
