import { expect, it, vi } from 'vitest'
import { demoMigrationUrl, hardenDemoTables } from '../src/demoDeployment.js'
const env = { NODE_ENV: 'production', DATABASE_TRANSPORT: 'tls', DATABASE_URL: 'postgresql://postgres.fixture:synthetic@pooler.example.com:5432/postgres?sslmode=no-verify' }
it('requires a session connection and verified TLS for startup migrations', () => {
  const url = new URL(demoMigrationUrl(env, '/tmp/ca.pem'))
  expect(url.searchParams.get('sslmode')).toBe('verify-full')
  expect(url.searchParams.get('sslrootcert')).toBe('/tmp/ca.pem')
  expect(() => demoMigrationUrl({ ...env, DATABASE_URL: env.DATABASE_URL.replace(':5432', ':6543') })).toThrow('session pooler')
})
it('revokes public and Data API table access atomically without changing storage tables', async () => {
  const query = vi.fn(async () => ({ rows: [{ rolname: 'anon' }, { rolname: 'authenticated' }] }))
  await hardenDemoTables({ query })
  const sql = query.mock.calls.map(([text]) => text)
  expect(sql[0]).toBe('BEGIN'); expect(sql.at(-1)).toBe('COMMIT')
  expect(sql).toContain('REVOKE ALL ON TABLE public."Answer" FROM "anon"')
  expect(sql.filter(text => text.startsWith('REVOKE'))).toHaveLength(24)
  expect(sql.join(' ')).not.toContain('storage.')
})
it('rolls back incomplete Data API hardening', async () => {
  const query = vi.fn(async text => { if (text.startsWith('REVOKE')) throw new Error('denied'); return { rows: [] } })
  await expect(hardenDemoTables({ query })).rejects.toThrow('denied')
  expect(query).toHaveBeenLastCalledWith('ROLLBACK')
})
