import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { createDatabase } from '../src/database.js'
import { createApp } from '../src/app.js'
import { createAiOperations } from '../src/ai/operations.js'
import { transcriptSchema } from '../src/voice/provider.js'
import { authOptions, tokenFor } from './auth-fixture.js'
import { wav } from './fixtures/wav.js'
describe.skipIf(!process.env.TEST_DATABASE_URL)('authenticated voice', () => {
  let db, app, interview, path
  const generate = vi.fn().mockResolvedValue({ data: { transcript: 'I used SQL.' }, inputTokens: 1, outputTokens: 1 })
  const a = 'Bearer ' + tokenFor('voice-a-' + randomUUID()), b = 'Bearer ' + tokenFor('voice-b-' + randomUUID())
  beforeAll(async () => {
    db = createDatabase(process.env.TEST_DATABASE_URL)
    const voice = createAiOperations(db, { mode: 'mock', model: 'voice-test', generate }, { retainResult: false, validate: (_kind, data) => transcriptSchema.parse(data) })
    app = createApp({ db, voice, authOptions })
    const response = await request(app).post('/api/v1/interviews').set('Authorization', a).send({ requestId: randomUUID(), preferences: { role: 'frontend', type: 'behavioral', difficulty: 'foundations' } })
    interview = response.body.data
    path = `/api/v1/voice/${interview.id}/${interview.questions[0].id}/${randomUUID()}`
  })
  afterAll(async () => db?.$disconnect())
  const send = (url, auth, bytes = wav()) => request(app).post(url).set('Authorization', auth).set('Content-Type', 'application/octet-stream').send(bytes)
  it('rejects missing auth and foreign owners before processing audio', async () => {
    expect((await request(app).post(path).send({})).status).toBe(401)
    expect((await send(path, b)).status).toBe(404)
    expect(generate).not.toHaveBeenCalled()
  })
  it('rejects malformed/oversized recordings without a provider call', async () => {
    expect((await send(path, a, Buffer.from('fake'))).status).toBe(400)
    expect((await send(path, a, wav(61))).status).toBe(413)
    expect(generate).not.toHaveBeenCalled()
  })
  it('returns an editable transcript, stores no audio/transcript, and never repeats a successful charge', async () => {
    const response = await send(path, a)
    expect(response.status).toBe(200); expect(response.body.data).toEqual({ transcript: 'I used SQL.', mode: 'mock' })
    expect((await send(path, a)).status).toBe(409); expect(generate).toHaveBeenCalledTimes(1)
    const operation = await db.aiOperation.findFirst({ where: { kind: 'transcription', key: { startsWith: 'voice:' + interview.id } } })
    expect(operation.result).toBeNull(); expect(operation.status).toBe('succeeded')
    const read = await request(app).get('/api/v1/interviews/' + interview.id).set('Authorization', a)
    expect(read.body.data.answers).toEqual({})
  })
  it('rejects deleted interviews', async () => {
    await request(app).delete('/api/v1/interviews/' + interview.id).set('Authorization', a)
    expect((await send(path, a)).status).toBe(404)
  })
})
