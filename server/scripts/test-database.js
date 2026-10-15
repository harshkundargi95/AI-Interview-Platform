import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import pg from 'pg'
const require = createRequire(import.meta.url)
const base = new URL(process.env.DATABASE_URL)
if (!['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Database tests require local PostgreSQL.')
const name = 'interview_test_' + randomUUID().replaceAll('-', '')
if (!/^interview_test_[a-f0-9]{32}$/.test(name)) throw new Error('Invalid test database name.')
const admin = new pg.Client({ connectionString: base.toString() })
await admin.connect()
async function run(file, args, env) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], { stdio: 'inherit', env: { ...process.env, ...env }, windowsHide: true })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('Database check failed: ' + code)))
  })
}
try {
  await admin.query('CREATE DATABASE "' + name + '"')
  base.pathname = '/' + name
  const url = base.toString()
  await run(require.resolve('prisma/build/index.js'), ['migrate', 'deploy'], { DATABASE_URL: url })
  await run(require.resolve('vitest/package.json').replace('package.json', 'vitest.mjs'), ['run', 'test/persistence.test.js', 'test/authorization.test.js', 'test/ai-persistence.test.js', 'test/resumes-persistence.test.js'], { TEST_DATABASE_URL: url })
} finally {
  // Only the unique database created by this invocation can be removed.
  await admin.query('DROP DATABASE IF EXISTS "' + name + '" WITH (FORCE)')
  await admin.end()
}
