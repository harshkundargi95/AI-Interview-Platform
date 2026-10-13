import express from 'express'
import { ApiError, errorHandler } from './middleware/errors.js'
import { createAuthentication } from './middleware/authentication.js'
import { createInterviewService } from './services/interviews.js'
import { interviewRoutes } from './routes/interviews.js'

export const localOrigins = [
  'http://127.0.0.1:5173', 'http://localhost:5173',
  'http://127.0.0.1:4173', 'http://localhost:4173',
]

export function createApp({ db, service, ai = null, authOptions = {}, origins = localOrigins, environment = process.env.NODE_ENV } = {}) {
  // Deployment remains Phase 10. No runtime development identity exists in Phase 5.
  if (environment === 'production') throw new Error('Deployment configuration is pending; this API remains local-only.')
  if (!origins.length || origins.some(origin => !localOrigins.includes(origin))) throw new Error('CORS origins must be an explicit subset of the supported local frontend origins.')
  // Earlier regression fixtures are available only inside a Vitest process.
  const fixture = !db && process.env.NODE_ENV === 'test' && process.env.VITEST ? (service || createInterviewService()) : null
  if (!db && !fixture) throw new Error('A PostgreSQL database and Clerk authentication are required.')
  const app = express()
  app.disable('x-powered-by')
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    res.set('X-Content-Type-Options', 'nosniff')
    const origin = req.get('Origin')
    if (origin && !origins.includes(origin)) return next(new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed.'))
    if (origin) {
      res.set('Access-Control-Allow-Origin', origin)
      res.vary('Origin')
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })
  app.get('/api/v1/health', async (req, res) => {
    if (db) await db.$queryRaw`SELECT 1`
    else await fixture.health?.()
    res.json({ data: { status: 'ok', storage: db ? 'postgresql' : fixture.storage || 'temporary-memory', authentication: db ? 'clerk' : 'test-fixture' } })
  })
  app.get('/api/v1/ai-config', (req, res) => res.json({ data: { mode: ai?.mode || 'disabled', maxFollowups: ai ? 2 : 0 } }))
  if (db) app.use('/api/v1/interviews', ...createAuthentication(db, {
    ...authOptions, authorizedParties: origins,
  }, ai))
  app.use((req, res, next) => {
    if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) return next(new ApiError(415, 'JSON_REQUIRED', 'Send application/json.'))
    next()
  })
  app.use(express.json({ limit: '256kb' }))
  app.use('/api/v1/interviews', interviewRoutes(fixture))
  app.use((req, res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'API route not found.')))
  app.use(errorHandler)
  return app
}
