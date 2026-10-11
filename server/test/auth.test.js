import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { authOptions, tokenFor } from './auth-fixture.js'

function fixture() {
  const upsert = vi.fn(async ({ create }) => ({ id: 'mapped-id', ...create, legacy: false }))
  const db = { user: { upsert }, $queryRaw: vi.fn(async () => []) }
  return { app: createApp({ db, authOptions }), upsert }
}
describe('Clerk verification using ephemeral signed test JWTs', () => {
  it('rejects missing tokens and cookies alone before database access', async () => {
    const { app, upsert } = fixture()
    for (const method of ['get', 'post', 'put', 'delete']) {
      expect((await request(app)[method]('/api/v1/interviews').set('Cookie', '__session=' + tokenFor())).status).toBe(401)
    }
    expect(upsert).not.toHaveBeenCalled()
  })
  it('rejects malformed, expired, wrong-origin, missing-origin and forged tokens', async () => {
    const { app, upsert } = fixture()
    const now = Math.floor(Date.now() / 1000)
    const signed = tokenFor()
    const parts = signed.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    const forged = [parts[0], Buffer.from(JSON.stringify({ ...payload, sub: 'user_attacker' })).toString('base64url'), parts[2]].join('.')
    for (const token of ['not-a-token', tokenFor('user_test_a', { exp: now - 60 }), tokenFor('user_test_a', { azp: 'https://evil.example' }), tokenFor('user_test_a', { azp: undefined }), forged]) {
      const response = await request(app).get('/api/v1/interviews').set('Authorization', 'Bearer ' + token)
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('AUTH_REQUIRED')
    }
    expect(upsert).not.toHaveBeenCalled()
  })
  it('maps a verified subject and ignores spoofed identity headers', async () => {
    const { app, upsert } = fixture()
    const response = await request(app).get('/api/v1/interviews/not-a-uuid').set('Authorization', 'Bearer ' + tokenFor('user_verified')).set('X-User-Id', 'user_spoofed')
    expect(response.status).toBe(400)
    expect(upsert).toHaveBeenCalledWith({ where: { clerkUserId: 'user_verified' }, create: { clerkUserId: 'user_verified' }, update: {} })
  })
  it('requires configured authentication and keeps the deployment guard', () => {
    expect(() => createApp({ db: {} })).toThrow('CLERK_PUBLISHABLE_KEY')
    expect(() => createApp({ db: {}, authOptions, environment: 'production' })).toThrow('local-only')
  })
  it('allows bearer CORS preflight and public health without an account', async () => {
    const { app, upsert } = fixture()
    const response = await request(app).options('/api/v1/interviews').set('Origin', 'http://127.0.0.1:5173').set('Access-Control-Request-Headers', 'Authorization')
    expect(response.headers['access-control-allow-headers']).toContain('Authorization')
    expect((await request(app).get('/api/v1/health')).body.data.authentication).toBe('clerk')
    expect(upsert).not.toHaveBeenCalled()
  })
})
