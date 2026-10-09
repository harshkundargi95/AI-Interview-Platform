import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// A local development convenience: real PostgreSQL, no system service or cloud account.
const databaseDir = resolve('.data/postgres')
const pg = new EmbeddedPostgres({
  databaseDir, port: 55432, user: 'interview_dev', password: 'local-development-only',
  persistent: true, authMethod: 'scram-sha-256',
  postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: () => {},
})
if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise()
await pg.start()
const client = pg.getPgClient('postgres', '127.0.0.1')
try {
  await client.connect()
  const { rows } = await client.query("SELECT 1 FROM pg_database WHERE datname = 'interview_dev'")
  if (!rows.length) await client.query('CREATE DATABASE interview_dev')
} finally { await client.end() }
console.log('Local PostgreSQL running on 127.0.0.1:55432. Data stays in server/.data/postgres. Ctrl+C stops it without deleting data.')
const timer = setInterval(() => {}, 1000)
let stopping = false
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  if (stopping) return
  stopping = true
  clearInterval(timer)
  await pg.stop()
})
