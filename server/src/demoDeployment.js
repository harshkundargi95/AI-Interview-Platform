import { databaseOptions } from './config.js'

// Runtime and migration connections must verify certificates, including a supplied CA.
export function demoMigrationUrl(env, caFile) {
  databaseOptions(env.DATABASE_URL, env)
  const url = new URL(env.DATABASE_URL)
  if (url.port === '6543') throw new Error('Use the Supabase session pooler on port 5432, not the transaction pooler.')
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key)
  url.searchParams.set('sslmode', 'verify-full')
  if (caFile) url.searchParams.set('sslrootcert', caFile)
  return url.toString()
}

// Supabase's Data API must not become a second path around Clerk ownership checks.
// Disable Data API in the dashboard BEFORE the first migration as well.
export async function hardenDemoTables(client) {
  const tables = ['User', 'Interview', 'Question', 'Answer', 'FeedbackReport', 'AiOperation', 'Resume', '_prisma_migrations']
  await client.query('BEGIN')
  try {
    const { rows } = await client.query("SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')")
    for (const table of tables) {
      await client.query(`REVOKE ALL ON TABLE public."${table}" FROM PUBLIC`)
      for (const role of rows) {
        if (!['anon', 'authenticated'].includes(role.rolname)) throw new Error('Unexpected Data API role')
        await client.query(`REVOKE ALL ON TABLE public."${table}" FROM "${role.rolname}"`)
      }
    }
    await client.query('COMMIT')
  } catch (error) { await client.query('ROLLBACK'); throw error }
}
