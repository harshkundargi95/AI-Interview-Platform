import request from 'supertest'
import { expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { authOptions } from './auth-fixture.js'
import { createLogger } from '../src/middleware/observability.js'

it('sets security headers and fresh request IDs without logging secrets or URLs', async () => {
  const lines = []
  const app = createApp({ logger: createLogger(line => lines.push(JSON.parse(line))) })
  const response = await request(app).get('/missing/private-id?token=secret-query').set('Authorization', 'Bearer secret-token').set('X-Request-Id', 'untrusted')
  expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/)
  expect(response.body.error.requestId).toBe(response.headers['x-request-id'])
  expect(response.headers['content-security-policy']).toContain("default-src 'none'")
  expect(response.headers['x-frame-options']).toBe('DENY')
  expect(JSON.stringify(lines)).not.toMatch(/secret|private-id|untrusted/)
  expect(lines[0]).toMatchObject({ event: 'http_request', route: 'unmatched', status: 404 })
})
it('bounds requests, ignores spoofed forwarded addresses, and recovers after the window', async () => {
  let now = 0
  const app = createApp({ logger: () => {}, rateLimitOptions: { limit: 2, now: () => now } })
  for (let i = 0; i < 2; i++) expect((await request(app).get('/api/v1/ai-config')).status).toBe(200)
  const blocked = await request(app).get('/api/v1/ai-config').set('X-Forwarded-For', '1.2.3.4')
  expect(blocked.status).toBe(429)
  expect(blocked.headers['retry-after']).toBe('60')
  expect((await request(app).get('/api/v1/live')).status).toBe(200)
  now = 60001
  expect((await request(app).get('/api/v1/ai-config')).status).toBe(200)
})
it('readiness fails closed on dependencies or draining while liveness stays up', async () => {
  const query = vi.fn(async () => [])
  const storage = { health: vi.fn(async () => {}) }
  let draining = false
  const app = createApp({ db: { $queryRaw: query }, storage, authOptions, logger: () => {}, readinessTimeoutMs: 20, isShuttingDown: () => draining })
  expect((await request(app).get('/api/v1/ready')).status).toBe(200)
  storage.health.mockRejectedValue(new Error('SECRET storage error'))
  let response = await request(app).get('/api/v1/ready')
  expect(response.status).toBe(503)
  expect(JSON.stringify(response.body)).not.toContain('SECRET')
  storage.health.mockResolvedValue()
  query.mockImplementation(() => new Promise(() => {}))
  expect((await request(app).get('/api/v1/ready')).status).toBe(503)
  draining = true
  expect((await request(app).get('/api/v1/ready')).status).toBe(503)
  expect((await request(app).get('/api/v1/live')).status).toBe(200)
})
it('refuses cross-origin mutations and oversized JSON', async () => {
  const app = createApp({ logger: () => {} })
  expect((await request(app).post('/api/v1/interviews').set('Origin', 'https://evil.example').send({})).status).toBe(403)
  expect((await request(app).post('/api/v1/interviews').send({ text: 'x'.repeat(270000) })).status).toBe(413)
})
