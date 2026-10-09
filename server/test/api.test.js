import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createInterviewService } from '../src/services/interviews.js'
import { selectQuestions } from '../src/data/questions.js'

const preferences = { role: 'frontend', type: 'mixed', difficulty: 'foundations' }
const origin = 'http://127.0.0.1:5173'
async function start(app, requestId = randomUUID(), choices = preferences) {
  return request(app).post('/api/v1/interviews').send({ requestId, preferences: choices })
}
function answersFor(session) {
  return session.questions.map((question, index) => ({ questionId: question.id, text: `Answer ${index + 1}` }))
}

it('returns health, allows exact local CORS preflight, and rejects other origins', async () => {
  const app = createApp()
  expect((await request(app).get('/api/v1/health')).body.data.storage).toBe('temporary-memory')
  const allowed = await request(app).options('/api/v1/interviews').set('Origin', origin).set('Access-Control-Request-Method', 'POST')
  expect(allowed.status).toBe(204)
  expect(allowed.headers['access-control-allow-origin']).toBe(origin)
  for (const rejected of ['https://example.com', 'null', 'http://127.0.0.1:5173.evil.test']) {
    const response = await request(app).get('/api/v1/health').set('Origin', rejected)
    expect(response.status).toBe(403)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  }
  expect(() => createApp({ environment: 'production' })).toThrow('local-only')
  expect(() => createApp({ origins: ['*'] })).toThrow()
})

it('validates preferences, malformed JSON, media types, body limits, IDs, and unknown routes', async () => {
  const app = createApp()
  const invalid = await start(app, randomUUID(), { ...preferences, type: 'other' })
  expect(invalid.status).toBe(400)
  expect(invalid.body.error.details[0].field).toBe('preferences.type')
  expect((await request(app).post('/api/v1/interviews').set('Content-Type', 'application/json').send('{')).body.error.code).toBe('INVALID_JSON')
  expect((await request(app).post('/api/v1/interviews').send('plain text')).status).toBe(415)
  expect((await request(app).post('/api/v1/interviews').send({ text: 'x'.repeat(300000) })).status).toBe(413)
  expect((await request(app).get('/api/v1/interviews/not-an-id')).status).toBe(400)
  expect((await request(app).get('/api/v1/interviews/' + randomUUID())).status).toBe(404)
  expect((await request(app).get('/missing')).body.error.code).toBe('ROUTE_NOT_FOUND')
})

it('deduplicates concurrent starts and rejects key reuse with different preferences', async () => {
  const app = createApp()
  const key = randomUUID()
  const responses = await Promise.all([start(app, key), start(app, key)])
  expect(responses.map((r) => r.status).sort()).toEqual([200, 201])
  expect(responses[0].body.data.id).toBe(responses[1].body.data.id)
  expect(responses[0].body.data.questions).toHaveLength(5)
  expect((await start(app, key, { ...preferences, type: 'technical' })).status).toBe(409)
})

it('stores draft answers, completes atomically, and makes repeated completion safe', async () => {
  const app = createApp()
  const session = (await start(app)).body.data
  const path = '/api/v1/interviews/' + session.id
  const answers = answersFor(session)
  expect((await request(app).put(path + '/answers').send({ answers: answers.slice(0, 2) })).status).toBe(200)
  const early = await request(app).post(path + '/complete').send({ answers: answers.slice(0, 2) })
  expect(early.status).toBe(409)
  const active = (await request(app).get(path)).body.data
  expect(active.status).toBe('active')
  expect(Object.keys(active.answers)).toHaveLength(2)
  const results = await Promise.all([
    request(app).post(path + '/complete').send({ answers }),
    request(app).post(path + '/complete').send({ answers: [...answers].reverse() }),
  ])
  expect(results.every((result) => result.status === 200)).toBe(true)
  expect(results[0].body.data).toEqual(results[1].body.data)
  expect(results[0].body.data.status).toBe('completed')
  expect((await request(app).put(path + '/answers').send({ answers })).status).toBe(200)
  answers[0].text = 'changed'
  expect((await request(app).post(path + '/complete').send({ answers })).status).toBe(409)
  expect((await request(app).put(path + '/answers').send({ answers })).status).toBe(409)
})

it('rejects blank, long, duplicate and unrelated answers without modifying the session', async () => {
  const app = createApp()
  const session = (await start(app)).body.data
  const path = '/api/v1/interviews/' + session.id
  const valid = answersFor(session)
  const cases = [
    [{ ...valid[0], text: '   ' }],
    [{ ...valid[0], text: 'a'.repeat(3001) }],
    [valid[0], valid[0]],
    [{ questionId: 'other-question', text: 'answer' }],
  ]
  for (const answers of cases) expect((await request(app).put(path + '/answers').send({ answers })).status).toBe(400)
  expect((await request(app).get(path)).body.data.answers).toEqual({})
  expect((await request(app).put(path + '/answers').send({ answers: [{ ...valid[0], text: 'a'.repeat(3000) }] })).status).toBe(200)
})

it('accepts five maximum-length Unicode answers within the body limit', async () => {
  const app = createApp()
  const session = (await start(app)).body.data
  const answers = answersFor(session).map((answer) => ({ ...answer, text: '界'.repeat(3000) }))
  const response = await request(app).post('/api/v1/interviews/' + session.id + '/complete').send({ answers })
  expect(response.status).toBe(200)
  expect(response.body.data.status).toBe('completed')
})

it('expires records, bounds memory, and starts empty after restart', async () => {
  let clock = 0
  const service = createInterviewService({ now: () => clock, ttlMs: 1000, capacity: 1 })
  const input = { requestId: randomUUID(), preferences }
  const first = service.create(input).session
  expect(() => service.create({ ...input, requestId: randomUUID() })).toThrow('full')
  clock = 1001
  expect(() => service.read(first.id)).toThrow('expired')
  expect(service.create(input).session.id).not.toBe(first.id)
  expect(() => createInterviewService().read(first.id)).toThrow('expired')
})

describe('question bank', () => {
  for (const difficulty of ['foundations', 'intermediate', 'advanced']) {
    for (const type of ['behavioral', 'technical', 'mixed']) {
      it(`returns five unique ${difficulty} ${type} questions`, () => {
        const questions = selectQuestions({ role: 'frontend', difficulty, type })
        expect(questions).toHaveLength(5)
        expect(new Set(questions.map((q) => q.id)).size).toBe(5)
        expect(questions.every((q) => q.difficulty === difficulty)).toBe(true)
        expect(new Set(questions.map((q) => q.category)).size).toBe(type === 'mixed' ? 2 : 1)
      })
    }
  }
})


