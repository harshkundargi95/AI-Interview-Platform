import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createDatabase } from '../src/database.js'
import { createPersistentInterviewService } from '../src/services/persistentInterviews.js'
import { createAiOperations } from '../src/ai/operations.js'
import { createMockProvider } from '../src/ai/provider.js'
import { preferencesSchema } from '../src/validation.js'
import { createApp } from '../src/app.js'
import { authOptions, tokenFor } from './auth-fixture.js'

describe.skipIf(!process.env.TEST_DATABASE_URL)('durable AI workflow', () => {
  let db
  const preferences = preferencesSchema.parse({ role: 'general', type: 'mixed', difficulty: 'foundations', questionCount: 3 })
  beforeAll(() => { db = createDatabase(process.env.TEST_DATABASE_URL) })
  afterAll(() => db?.$disconnect())
  async function setup(provider = createMockProvider(), options) {
    const user = await db.user.create({ data: { clerkUserId: 'ai-' + randomUUID() } })
    const generate = vi.fn(provider.generate)
    const ai = createAiOperations(db, { ...provider, generate }, options)
    return { user, ai, generate, service: createPersistentInterviewService(db, user.id, ai) }
  }
  const start = service => service.create({ requestId: randomUUID(), preferences }).then(r => r.session)
  const answers = row => row.questions.map(q => ({ questionId: q.id, text: 'My saved answer about ' + q.subject }))

  it('persists plan, bounds and deduplicates follow-ups, caches report and survives new service instances', async () => {
    const { service, generate, user, ai } = await setup()
    let row = await start(service)
    expect(row.generation.source).toBe('mock')
    row = await service.save(row.id, answers(row), row.revision)
    const base = row.questions.map(q => q.id)
    row = await service.followup(row.id, base[0], row.revision)
    expect(row.questions).toHaveLength(4)
    expect((await service.followup(row.id, base[0], row.revision - 1)).questions).toHaveLength(4)
    row = await service.followup(row.id, base[1], row.revision)
    await expect(service.followup(row.id, base[2], row.revision)).rejects.toMatchObject({ code: 'FOLLOWUP_LIMIT' })
    row = await service.complete(row.id, answers(row), row.revision)
    row = await service.report(row.id)
    expect(row.feedback.source).toBe('mock')
    expect(row.feedback.content.answers).toHaveLength(5)
    expect(row.feedback.content.subjects.length).toBeGreaterThan(0)
    expect(await createPersistentInterviewService(db, user.id, ai).report(row.id)).toEqual(row)
    expect(generate).toHaveBeenCalledTimes(4)
    await service.remove(row.id)
    expect(await db.aiOperation.count({ where: { ownerId: user.id, status: 'succeeded' } })).toBe(0)
  })
  it('does not duplicate concurrent provider calls or replay ambiguous failures', async () => {
    let release
    const wait = new Promise(resolve => { release = resolve })
    const { ai, user, generate } = await setup({ mode: 'mock', model: 'test-concurrent', generate: async () => { await wait; return { data: { text: 'A distinct follow-up?' }, inputTokens: 1, outputTokens: 1 } } })
    const pending = ai.run(user.id, 'concurrent', 'followup', { questions: [] })
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1))
    await expect(ai.run(user.id, 'concurrent', 'followup', { questions: [] })).rejects.toMatchObject({ code: 'AI_IN_PROGRESS' })
    release(); await pending
    await ai.run(user.id, 'concurrent', 'followup', { questions: [] })
    expect(generate).toHaveBeenCalledTimes(1)
  })
  it('falls back visibly on plan failure and preserves completed answers on report failure', async () => {
    const mock = createMockProvider()
    const { service, generate } = await setup({ ...mock, generate: async (kind, input) => { if (kind !== 'followup') throw new Error('outage'); return mock.generate(kind, input) } })
    let row = await start(service)
    expect(row.generation.source).toBe('fixed-bank-fallback')
    row = await service.complete(row.id, answers(row), row.revision)
    await expect(service.report(row.id)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    await expect(service.report(row.id)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    expect((await service.read(row.id)).answers).toEqual(row.answers)
    expect(generate).toHaveBeenCalledTimes(2)
  })
  it('enforces durable per-user daily quotas without changing saved state', async () => {
    const { service, generate } = await setup(undefined, { dailyLimit: 1 })
    let row = await start(service)
    row = await service.complete(row.id, answers(row), row.revision)
    await expect(service.report(row.id)).rejects.toMatchObject({ code: 'AI_QUOTA' })
    expect((await service.read(row.id)).answers).toEqual(row.answers)
    const fallback = await start(service)
    expect(fallback.generation.source).toBe('fixed-bank-fallback')
    expect(generate).toHaveBeenCalledTimes(1)
  })
  it('times out without automatic replay, rejects malformed output, bounds explicit 429 retries', async () => {
    const slow = await setup({ mode: 'mock', model: 'slow', generate: () => new Promise(() => {}) }, { timeoutMs: 40 })
    await expect(slow.ai.run(slow.user.id, 'slow', 'followup', { questions: [] })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    await expect(slow.ai.run(slow.user.id, 'slow', 'followup', { questions: [] })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    expect(slow.generate).toHaveBeenCalledTimes(1)
    const bad = await setup({ mode: 'mock', model: 'bad', generate: async () => ({ data: { text: '' } }) })
    await expect(bad.ai.run(bad.user.id, 'bad', 'followup', { questions: [] })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    const limited = await setup({ mode: 'mock', model: 'limited', generate: async () => { throw Object.assign(new Error(), { status: 429 }) } })
    await expect(limited.ai.run(limited.user.id, 'limited', 'followup', { questions: [] })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    expect(limited.generate).toHaveBeenCalledTimes(2)
  })
  it('does not restore cached report content when the interview is deleted during generation', async () => {
    const mock = createMockProvider()
    let release
    const gate = new Promise(resolve => { release = resolve })
    const { service, generate, user } = await setup({ ...mock, generate: async (kind, input) => { if (kind === 'report') await gate; return mock.generate(kind, input) } })
    let row = await start(service)
    row = await service.complete(row.id, answers(row), row.revision)
    const pending = service.report(row.id)
    const checked = expect(pending).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(2))
    await service.remove(row.id)
    release(); await checked
    const records = await db.aiOperation.findMany({ where: { ownerId: user.id } })
    expect(records.every(r => r.result === null)).toBe(true)
    expect(await db.feedbackReport.count({ where: { interviewId: row.id } })).toBe(0)
  })
  it('does not append a follow-up after completion and does not replay changed AI input', async () => {
    const mock = createMockProvider()
    let release
    const gate = new Promise(resolve => { release = resolve })
    const { service, generate, ai, user } = await setup({ ...mock, generate: async (kind, input) => { if (kind === 'followup') await gate; return mock.generate(kind, input) } })
    let row = await start(service)
    row = await service.save(row.id, answers(row), row.revision)
    const pending = service.followup(row.id, row.questions[0].id, row.revision)
    const checked = expect(pending).rejects.toMatchObject({ code: 'STALE_INTERVIEW' })
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(2))
    await service.complete(row.id, answers(row), row.revision)
    release(); await checked
    expect((await service.read(row.id)).questions).toHaveLength(3)
    await expect(ai.run(user.id, `followup:${row.id}:${row.questions[0].id}`, 'followup', { questions: [], answer: 'changed' })).rejects.toMatchObject({ code: 'AI_INPUT_CHANGED' })
  })
  it('retries adapter-level serialization conflicts without replaying provider calls', async () => {
    const { user } = await setup()
    let calls = 0
    const wrapped = { interview: db.interview, $transaction: async (...args) => {
      calls++
      if (calls === 1) throw Object.assign(new Error('serialization'), { cause: { kind: 'TransactionWriteConflict', originalCode: '40001' } })
      return db.$transaction(...args)
    } }
    const row = await start(createPersistentInterviewService(wrapped, user.id))
    expect(row.questions).toHaveLength(3)
    expect(calls).toBe(2)
  })
  it('blocks foreign and unauthenticated AI routes before provider invocation', async () => {
    const { ai, service, user, generate } = await setup()
    const row = await start(service)
    const app = createApp({ db, authOptions, ai })
    for (const [path, body] of [['report', {}], ['followups', { questionId: row.questions[0].id, revision: 0 }]]) {
      expect((await request(app).post(`/api/v1/interviews/${row.id}/${path}`).send(body)).status).toBe(401)
      expect((await request(app).post(`/api/v1/interviews/${row.id}/${path}`).set('Authorization', 'Bearer ' + tokenFor('foreign-ai-user')).send(body)).status).toBe(404)
    }
    expect(generate).toHaveBeenCalledTimes(1)
    const saved = await service.complete(row.id, answers(row), row.revision)
    const result = await request(app).post(`/api/v1/interviews/${row.id}/report`).set('Authorization', 'Bearer ' + tokenFor(user.clerkUserId)).send({})
    expect(result.status).toBe(200)
    expect(result.body.data.answers).toEqual(saved.answers)
  })
})
