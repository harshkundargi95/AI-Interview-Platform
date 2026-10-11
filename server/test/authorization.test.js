import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createDatabase } from '../src/database.js'
import { createApp } from '../src/app.js'
import { authOptions, tokenFor } from './auth-fixture.js'

describe.skipIf(!process.env.TEST_DATABASE_URL)('authenticated ownership with PostgreSQL', () => {
  let db, app
  const a = () => 'Bearer ' + tokenFor('user_owner_a')
  const b = () => 'Bearer ' + tokenFor('user_owner_b')
  const preferences = { role: 'general', type: 'technical', difficulty: 'foundations', questionCount: 3 }
  beforeAll(() => { db = createDatabase(process.env.TEST_DATABASE_URL); app = createApp({ db, authOptions }) })
  afterAll(async () => { await db?.$disconnect() })
  async function start(auth, requestId = randomUUID()) {
    const response = await request(app).post('/api/v1/interviews').set('Authorization', auth).send({ requestId, preferences })
    expect(response.status).toBe(201)
    return response.body.data
  }
  it('isolates create/history/read/save/complete/report/delete across two verified accounts', async () => {
    const key = randomUUID()
    const first = await start(a(), key)
    const second = await start(b(), key)
    expect(first.id).not.toBe(second.id)
    await db.feedbackReport.create({ data: { interviewId: first.id, source: 'test-fixture', content: { note: 'private owner A report' } } })
    const path = '/api/v1/interviews/' + first.id
    const answers = first.questions.map(q => ({ questionId: q.id, text: 'Owner A answer' }))
    expect((await request(app).get(path).set('Authorization', a())).body.data.feedback.content.note).toBe('private owner A report')
    for (const [method, suffix] of [['get', ''], ['put', '/answers'], ['post', '/complete'], ['delete', '']]) {
      const response = await request(app)[method](path + suffix).set('Authorization', b()).send({ revision: 0, answers })
      expect(response.status).toBe(404)
      expect(JSON.stringify(response.body)).not.toContain('private owner A report')
    }
    const history = await request(app).get('/api/v1/interviews').set('Authorization', b())
    expect(history.body.data.items.map(row => row.id)).toContain(second.id)
    expect(history.body.data.items.map(row => row.id)).not.toContain(first.id)
    expect((await request(app).put(path + '/answers').set('Authorization', a()).send({ revision: 0, answers: answers.slice(0, 1) })).status).toBe(200)
    expect((await request(app).post(path + '/complete').set('Authorization', a()).send({ revision: 1, answers })).status).toBe(200)
    expect((await request(app).delete(path).set('Authorization', a())).status).toBe(200)
  })
  it('does not accept owner identifiers in request payloads or query strings', async () => {
    const response = await request(app).post('/api/v1/interviews').set('Authorization', b()).send({ requestId: randomUUID(), preferences, ownerId: 'user_owner_a' })
    expect(response.status).toBe(400)
    expect((await request(app).get('/api/v1/interviews?ownerId=user_owner_a').set('Authorization', b())).status).toBe(400)
  })
  it('preserves legacy records without granting new users access', async () => {
    await db.user.upsert({ where: { id: 'legacy-fixture' }, create: { id: 'legacy-fixture', legacy: true }, update: {} })
    const legacy = await db.interview.create({ data: { ownerId: 'legacy-fixture', requestId: randomUUID(), preferences } })
    expect((await request(app).get('/api/v1/interviews/' + legacy.id).set('Authorization', a())).status).toBe(404)
    expect(await db.interview.findUnique({ where: { id: legacy.id } })).not.toBeNull()
  })
  it('rejects expired sessions without changing saved data', async () => {
    const session = await start(a())
    const response = await request(app).delete('/api/v1/interviews/' + session.id).set('Authorization', 'Bearer ' + tokenFor('user_owner_a', { exp: 1 }))
    expect(response.status).toBe(401)
    expect(await db.interview.findUnique({ where: { id: session.id } })).not.toBeNull()
  })
})
