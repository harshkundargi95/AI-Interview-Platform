import { expect, it } from 'vitest'
import request from 'supertest'
import { databaseOptions, httpsOrigin, storageEndpoint, validateProduction } from '../src/config.js'
import { createApp } from '../src/app.js'
const env = {
  NODE_ENV: 'production', DATABASE_URL: 'postgresql://app:synthetic-password@db.example.com/interview', DATABASE_TRANSPORT: 'tls',
  CORS_ORIGINS: 'https://interview.example.com', CLERK_PUBLISHABLE_KEY: 'pk_live_' + Buffer.from('clerk.example.com$').toString('base64'), CLERK_SECRET_KEY: 'sk_live_fixture',
  AI_MODE: 'live', VOICE_MODE: 'disabled', GEMINI_API_KEY: 'synthetic', GEMINI_MODEL: 'synthetic-model',
  S3_ENDPOINT: 'https://s3.example.com', S3_REGION: 'test', S3_BUCKET: 'private', S3_ACCESS_KEY_ID: 'fixture', S3_SECRET_ACCESS_KEY: 'fixture', RESUME_LINK_SECRET: 'synthetic-only-32-character-test-secret',
}
it('rejects missing production settings, development credentials and mock providers', () => {
  expect(() => validateProduction(env)).not.toThrow()
  for (const key of ['DATABASE_URL', 'CORS_ORIGINS', 'CLERK_SECRET_KEY', 'S3_BUCKET', 'RESUME_LINK_SECRET', 'GEMINI_MODEL']) expect(() => validateProduction({ ...env, [key]: '' })).toThrow()
  for (const change of [{ AI_MODE: 'mock' }, { VOICE_MODE: 'mock' }, { CLERK_SECRET_KEY: 'sk_test_fixture' }, { S3_ENDPOINT: 'http://127.0.0.1:4569' }, { RESUME_LINK_SECRET: 'short' }, { CORS_ORIGINS: '*' }]) expect(() => validateProduction({ ...env, ...change })).toThrow()
})
it('accepts exact HTTPS origins only', () => {
  for (const value of ['https://app.example.com/', 'http://app.example.com', 'https://*.example.com', 'https://app.example.com/path', 'https://localhost', 'https://user:pass@app.example.com']) expect(httpsOrigin(value)).toBe(false)
  expect(httpsOrigin(env.CORS_ORIGINS)).toBe(true)
})
it('enforces certificate verification and bounds the private Render exception', () => {
  const options = databaseOptions(env.DATABASE_URL + '?sslmode=no-verify', env)
  expect(options.ssl.rejectUnauthorized).toBe(true)
  expect(options.connectionString).not.toContain('sslmode')
  const internal = 'postgresql://app:synthetic-password@dpg-example-a/interview'
  expect(() => databaseOptions(internal, { ...env, DATABASE_TRANSPORT: 'render-internal' })).toThrow()
  expect(databaseOptions(internal, { ...env, DATABASE_TRANSPORT: 'render-internal', RENDER: 'true' }).ssl).toBeUndefined()
  expect(() => databaseOptions(env.DATABASE_URL, { ...env, DATABASE_TRANSPORT: 'render-internal', RENDER: 'true' })).toThrow()
  expect(() => databaseOptions('postgresql://app:pw@127.0.0.1/db', env)).toThrow()
  expect(() => databaseOptions(env.DATABASE_URL, {})).toThrow()
})
it('serves production health while rejecting unapproved origins and unauthenticated access', async () => {
  const app = createApp({ environment: 'production', db: { $queryRaw: async () => [] }, storage: { health: async () => {} }, ai: { mode: 'live' }, origins: [env.CORS_ORIGINS], authOptions: { publishableKey: env.CLERK_PUBLISHABLE_KEY, secretKey: env.CLERK_SECRET_KEY } })
  const ready = await request(app).get('/api/v1/ready')
  expect(ready.status).toBe(200)
  expect(ready.headers['strict-transport-security']).toBe('max-age=31536000')
  expect((await request(app).get('/api/v1/interviews').set('Origin', env.CORS_ORIGINS)).status).toBe(401)
  expect((await request(app).get('/api/v1/ready').set('Origin', 'https://evil.example.com')).status).toBe(403)
  expect((await request(app).options('/api/v1/interviews').set('Origin', env.CORS_ORIGINS)).headers['access-control-allow-origin']).toBe(env.CORS_ORIGINS)
})

const demoEnv = { ...env, DEPLOYMENT_MODE: 'demo', CLERK_PUBLISHABLE_KEY: env.CLERK_PUBLISHABLE_KEY.replace('pk_live_', 'pk_test_'), CLERK_SECRET_KEY: 'sk_test_fixture', GEMINI_FREE_TIER_CONFIRMED: 'true', AI_DAILY_LIMIT: '5', AI_GLOBAL_DAILY_LIMIT: '20' }
it('requires explicit demo mode, matched development keys and bounded acknowledged free-tier use', () => {
  expect(() => validateProduction(demoEnv)).not.toThrow()
  for (const change of [{ DEPLOYMENT_MODE: '' }, { DEPLOYMENT_MODE: 'demmo' }, { DEPLOYMENT_MODE: 'production' }, { GEMINI_FREE_TIER_CONFIRMED: 'false' }, { AI_DAILY_LIMIT: '6' }, { AI_GLOBAL_DAILY_LIMIT: '21' }, { AI_MODE: 'mock' }, { VOICE_MODE: 'mock' }, { CLERK_SECRET_KEY: 'sk_live_fixture' }, { DATABASE_TRANSPORT: 'render-internal' }]) expect(() => validateProduction({ ...demoEnv, ...change })).toThrow()
})
it('accepts Supabase S3 paths without weakening exact CORS origins', () => {
  const endpoint = 'https://fixture.storage.supabase.co/storage/v1/s3'
  expect(storageEndpoint(endpoint)).toBe(true)
  expect(httpsOrigin(endpoint)).toBe(false)
  expect(() => validateProduction({ ...demoEnv, S3_ENDPOINT: endpoint })).not.toThrow()
  for (const value of ['https://fixture.storage.supabase.co/storage/v1/s3?key=secret', 'https://user:pass@fixture.supabase.co/storage/v1/s3', 'http://fixture.supabase.co/storage/v1/s3', 'https://evil.example/storage/v1/s3', 'https://fixture.supabase.co/other', 'https://fixture.supabase.co/storage/v1/s3#fragment']) expect(storageEndpoint(value)).toBe(false)
})
it('demo still rejects missing bearer tokens and disallowed origins', async () => {
  const app = createApp({ environment: 'production', deploymentMode: 'demo', db: {}, storage: {}, ai: { mode: 'live' }, origins: ['https://demo.vercel.app'], authOptions: { publishableKey: demoEnv.CLERK_PUBLISHABLE_KEY, secretKey: demoEnv.CLERK_SECRET_KEY } })
  expect((await request(app).get('/api/v1/interviews').set('Origin', 'https://demo.vercel.app')).status).toBe(401)
  expect((await request(app).get('/api/v1/interviews').set('Origin', 'https://other.vercel.app')).status).toBe(403)
})
