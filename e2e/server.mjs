import express from 'express'
import { createDatabase } from '../server/src/database.js'
import { createApp } from '../server/src/app.js'
import { createAiOperations } from '../server/src/ai/operations.js'
import { createMockProvider } from '../server/src/ai/provider.js'
import { authOptions, tokenFor } from '../server/test/auth-fixture.js'
if (!/^\/interview_test_[a-f0-9]{32}$/.test(new URL(process.env.TEST_DATABASE_URL).pathname)) throw new Error('An isolated test database is required.')
const db = createDatabase(process.env.TEST_DATABASE_URL)
const outer = express()
// This endpoint and ephemeral signing key exist ONLY in this standalone test server.
outer.get('/fixture-token', (req, res) => res.json({ token: tokenFor('user_e2e', { azp: 'http://127.0.0.1:4173', exp: Math.floor(Date.now() / 1000) + 600 }) }))
const mock = createMockProvider()
const provider = { ...mock, async generate(kind, input) {
  const result = await mock.generate(kind, input)
  if (kind === 'report') result.data.summary = '<img src=x onerror="window.injected=true"> Plain text safety probe.'
  return result
} }
outer.use(createApp({ db, authOptions, ai: createAiOperations(db, provider), logger: () => {} }))
const server = outer.listen(3101, '127.0.0.1')
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => db.$disconnect()))
