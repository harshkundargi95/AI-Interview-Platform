// Fail closed before opening sockets or contacting providers. Never log environment values.
export function httpsOrigin(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.origin === value && !url.username && !url.password && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.hostname.includes('*')
  } catch { return false }
}
export function deploymentMode(value = 'production') {
  if (!['production', 'demo'].includes(value)) throw new Error('DEPLOYMENT_MODE must be production or demo.')
  return value
}
export function clerkKeysMatch(publishableKey, secretKey, mode) {
  const tier = deploymentMode(mode) === 'demo' ? 'test' : 'live'
  return publishableKey?.startsWith(`pk_${tier}_`) && secretKey?.startsWith(`sk_${tier}_`)
}
export function storageEndpoint(value) {
  try {
    const url = new URL(value)
    return httpsOrigin(url.origin) && !url.username && !url.password && !url.search && !url.hash &&
      (url.pathname === '/' || (/^[a-z0-9-]+(?:\.storage)?\.supabase\.co$/.test(url.hostname) && url.pathname === '/storage/v1/s3'))
  } catch { return false }
}
export function validateProduction(env = process.env) {
  if (env.NODE_ENV !== 'production') return
  const mode = deploymentMode(env.DEPLOYMENT_MODE)
  const required = ['DATABASE_URL', 'CORS_ORIGINS', 'CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'RESUME_LINK_SECRET']
  for (const name of required) if (!env[name] || /YOUR_|REPLACE_|S3RVER|local-development-only/.test(env[name])) throw new Error(`Production requires a real ${name} setting.`)
  if (!env.CORS_ORIGINS.split(',').map(s => s.trim()).every(httpsOrigin)) throw new Error('Production CORS_ORIGINS requires exact HTTPS origins.')
  if (!clerkKeysMatch(env.CLERK_PUBLISHABLE_KEY, env.CLERK_SECRET_KEY, mode)) throw new Error(mode === 'demo' ? 'Demo requires matching Clerk development keys.' : 'Production requires Clerk live keys.')
  if (mode === 'demo') {
    if (env.GEMINI_FREE_TIER_CONFIRMED !== 'true') throw new Error('Confirm the Gemini project has no paid billing before enabling demo AI. This is an operator acknowledgement, not billing verification.')
    if (env.DATABASE_TRANSPORT !== 'tls') throw new Error('Demo database requires verified TLS.')
    for (const [name, max] of [['AI_DAILY_LIMIT', 5], ['AI_GLOBAL_DAILY_LIMIT', 20]]) {
      const value = Number(env[name])
      if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`Demo ${name} must be between 1 and ${max}.`)
    }
  }
  if (env.AI_MODE !== 'live' || !['live', 'disabled'].includes(env.VOICE_MODE || env.AI_MODE)) throw new Error('Production disallows mock AI and mock voice.')
  if (!storageEndpoint(env.S3_ENDPOINT)) throw new Error('S3_ENDPOINT requires HTTPS with no credentials/query; only Supabase supports /storage/v1/s3.')
  if (env.RESUME_LINK_SECRET.length < 32) throw new Error('RESUME_LINK_SECRET requires at least 32 random characters.')
  databaseOptions(env.DATABASE_URL, env)
}
export function databaseOptions(value, env = process.env) {
  let url
  try { url = new URL(value) } catch { throw new Error('DATABASE_URL must be a PostgreSQL URL.') }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must be a PostgreSQL URL.')
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (env.NODE_ENV !== 'production') {
    if (!local) throw new Error('Development requires a local database.')
    return { connectionString: value }
  }
  if (local || !url.username || !url.password || url.password === 'local-development-only') throw new Error('Production requires a hosted database with private credentials.')
  // Only an explicitly selected Render internal hostname may use its private network without TLS.
  if (env.DATABASE_TRANSPORT === 'render-internal' && env.RENDER === 'true' && /^dpg-[a-z0-9-]+$/.test(url.hostname) && !url.search) return { connectionString: value }
  if (env.DATABASE_TRANSPORT !== 'tls') throw new Error('Choose DATABASE_TRANSPORT=tls or verified render-internal.')
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key)
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: true, ...(env.DATABASE_CA_CERT ? { ca: env.DATABASE_CA_CERT.replaceAll('\\n', '\n') } : {}) } }
}
