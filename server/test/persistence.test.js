import { authEnvironment, tokenFor } from './auth-fixture.js'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createDatabase } from '../src/database.js'
import { createPersistentInterviewService } from '../src/services/persistentInterviews.js'
import { createApp } from '../src/app.js'
import { preferencesSchema } from '../src/validation.js'

describe.skipIf(!process.env.TEST_DATABASE_URL)('real PostgreSQL persistence', () => {
  let db, service, app
  const preferences = preferencesSchema.parse({ role: 'backend', type: 'technical', difficulty: 'foundations', subjects: ['cn'], topicMode: 'selected', questionCount: 3 })
  const start = () => service.create({ requestId: randomUUID(), preferences })
  const answers = session => session.questions.map(q => ({ questionId: q.id, text: 'Explain ' + q.subject }))
  beforeAll(async () => { db = createDatabase(process.env.TEST_DATABASE_URL); await db.user.upsert({ where: { id: 'persistence-test-owner' }, create: { id: 'persistence-test-owner', clerkUserId: 'user_persistence' }, update: {} }); service = createPersistentInterviewService(db, 'persistence-test-owner'); app = createApp({ service }) })
  afterAll(async () => { await db?.$disconnect() })

  it('deduplicates concurrent starts and freezes exact ordered question metadata', async () => {
    const input = { requestId: randomUUID(), preferences }
    const results = await Promise.all([service.create(input), service.create(input)])
    expect(results.map(r => r.created).sort()).toEqual([false, true])
    expect(results[0].session).toEqual(results[1].session)
    expect((await service.read(results[0].session.id)).questions).toEqual(results[0].session.questions)
    await expect(service.create({ ...input, preferences: { ...preferences, difficulty: 'advanced' } })).rejects.toMatchObject({ status: 409 })
  })

  it('saves, rejects stale writers and incomplete completion, and retries completion safely', async () => {
    const { session } = await start()
    const draft = answers(session).slice(0, 1)
    const saved = await service.save(session.id, draft, 0)
    expect(saved.revision).toBe(1)
    expect(await service.save(session.id, draft, 0)).toEqual(saved)
    await expect(service.save(session.id, [{ ...draft[0], text: 'stale change' }], 0)).rejects.toMatchObject({ code: 'STALE_INTERVIEW' })
    await expect(service.complete(session.id, draft, 1)).rejects.toMatchObject({ code: 'INCOMPLETE_INTERVIEW' })
    const submissions = await Promise.all([service.complete(session.id, answers(session), 1), service.complete(session.id, answers(session).reverse(), 1)])
    expect(submissions[0]).toEqual(submissions[1])
    await expect(service.save(session.id, draft, 2)).rejects.toMatchObject({ code: 'INTERVIEW_COMPLETED' })
    expect((await service.read(session.id)).status).toBe('completed')
  })

  it('rejects unrelated answers at API and database layers without partial writes', async () => {
    const { session } = await start()
    const path = '/api/v1/interviews/' + session.id
    expect((await request(app).put(path + '/answers').send({ revision: 0, answers: [{ questionId: 'foreign', text: 'answer' }] })).status).toBe(400)
    expect((await request(app).put(path + '/answers').send({ revision: 0, answers: [answers(session)[0], answers(session)[0]] })).status).toBe(400)
    await expect(db.answer.create({ data: { interviewId: session.id, questionId: 'foreign', text: 'invalid' } })).rejects.toMatchObject({ code: 'P2003' })
    expect((await service.read(session.id)).answers).toEqual({})
  })

  it('rejects concurrent conflicting saves rather than losing updates', async () => {
    const { session } = await start()
    const first = answers(session).slice(0, 1)
    const results = await Promise.allSettled([service.save(session.id, first, 0), service.save(session.id, [{ ...first[0], text: 'Other tab' }], 0)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1)
  })

  it('lists real records, isolates server identities and cascades deletion including feedback', async () => {
    const { session } = await start()
    const other = createPersistentInterviewService(db, 'other-local-workspace')
    expect((await other.list()).items).toEqual([])
    await expect(other.read(session.id)).rejects.toMatchObject({ status: 404 })
    await expect(other.remove(session.id)).rejects.toMatchObject({ status: 404 })
    await service.save(session.id, answers(session).slice(0, 1), 0)
    await db.feedbackReport.create({ data: { interviewId: session.id, source: 'test-fixture', content: { note: 'not live AI' } } })
    const history = await request(app).get('/api/v1/interviews?take=1')
    expect(history.status).toBe(200)
    expect(history.body.data.items[0].id).toBe(session.id)
    expect((await request(app).delete('/api/v1/interviews/' + session.id)).status).toBe(200)
    expect(await db.question.count({ where: { interviewId: session.id } })).toBe(0)
    expect(await db.answer.count({ where: { interviewId: session.id } })).toBe(0)
    expect(await db.feedbackReport.count({ where: { interviewId: session.id } })).toBe(0)
    expect((await request(app).delete('/api/v1/interviews/' + session.id)).status).toBe(404)
  })

  it('survives an actual API process restart', async () => {
    const { session } = await start()
    const saved = await service.save(session.id, answers(session).slice(0, 1), 0)
    async function boot() {
      const child = spawn(process.execPath, ['src/index.js'], {
        env: { ...process.env, ...authEnvironment, DATABASE_URL: process.env.TEST_DATABASE_URL, PORT: '43193', NODE_ENV: 'development' },
        windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      })
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { child.kill(); reject(new Error('API startup timed out')) }, 15000)
        child.once('error', error => { clearTimeout(timer); reject(error) })
        child.once('exit', code => { clearTimeout(timer); reject(new Error('API exited: ' + code)) })
        child.stdout.on('data', text => { if (text.toString().includes('Local API:')) { clearTimeout(timer); resolve() } })
      })
      return child
    }
    for (let run = 0; run < 2; run++) {
      const child = await boot()
      try {
        const response = await fetch('http://127.0.0.1:43193/api/v1/interviews/' + session.id, { headers: { Authorization: 'Bearer ' + tokenFor('user_persistence') } })
        expect((await response.json()).data).toEqual(saved)
      } finally { const exited = once(child, 'exit'); child.kill(); await exited }
    }
  }, 40000)
})
