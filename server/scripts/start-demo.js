import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { validateProduction, databaseOptions } from '../src/config.js'
import { demoMigrationUrl, hardenDemoTables } from '../src/demoDeployment.js'

// Free Render has no pre-deploy command. On each wake/deploy, migrations finish before
// listening; Prisma's migration lock prevents overlapping migrators. Never reset/seed.
async function prepare() {
  if (process.env.NODE_ENV !== 'production' || process.env.DEPLOYMENT_MODE !== 'demo') throw new Error('Hosted demo only')
  validateProduction()
  let directory, caFile
  try {
    if (process.env.DATABASE_CA_CERT) {
      directory = await mkdtemp(join(tmpdir(), 'interview-ca-'))
      caFile = join(directory, 'database-ca.pem')
      await writeFile(caFile, process.env.DATABASE_CA_CERT.replaceAll('\\n', '\n'), { mode: 0o600 })
    }
    const url = demoMigrationUrl(process.env, caFile)
    const require = createRequire(import.meta.url)
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--config', 'server/prisma.config.js'], {
        env: { ...process.env, DATABASE_URL: url }, stdio: 'ignore', windowsHide: true,
      })
      const timer = setTimeout(() => { child.kill(); reject(new Error('Migration deadline')) }, 120000)
      child.once('error', () => { clearTimeout(timer); reject(new Error('Migration process failed')) })
      child.once('exit', code => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error('Migration failed')) })
    })
    const client = new pg.Client({ ...databaseOptions(process.env.DATABASE_URL), connectionTimeoutMillis: 10000, statement_timeout: 10000 })
    try { await client.connect(); await hardenDemoTables(client) } finally { await client.end() }
  } finally {
    if (caFile) await unlink(caFile).catch(error => { if (error.code !== 'ENOENT') throw error })
    if (directory) await rmdir(directory)
  }
}
try {
  await prepare()
  console.log(JSON.stringify({ event: 'demo_database_ready' }))
  await import('../src/index.js')
} catch {
  // Provider/SQL errors can contain URLs or content: log a category, never raw errors.
  console.error(JSON.stringify({ event: 'startup_error', code: 'DEMO_START_FAILED', hint: 'Check required demo settings, verified TLS/session-pooler connection, and migration status. API was not started.' }))
  process.exitCode = 1
}
