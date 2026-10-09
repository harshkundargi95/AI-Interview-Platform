import express from 'express'
import { ApiError, errorHandler } from './middleware/errors.js'
import { createInterviewService } from './services/interviews.js'
import { interviewRoutes } from './routes/interviews.js'

export const localOrigins = [
  'http://127.0.0.1:5173', 'http://localhost:5173',
  'http://127.0.0.1:4173', 'http://localhost:4173',
]

export function createApp({ service = process.env.NODE_ENV === 'test' ? createInterviewService() : null, origins = localOrigins, environment = process.env.NODE_ENV } = {}) {
  if (environment === 'production') throw new Error('This unauthenticated Phase 4 API is local-only.')
  if (!service) throw new Error('A PostgreSQL interview service is required.')
  if (!origins.length || origins.some((origin) => !localOrigins.includes(origin))) throw new Error('CORS origins must be an explicit subset of the supported local frontend origins.')
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
      res.set('Access-Control-Allow-Headers', 'Content-Type')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) return next(new ApiError(415, 'JSON_REQUIRED', 'Send application/json.'))
    next()
  })
  app.use(express.json({ limit: '256kb' }))
  app.get('/api/v1/health', async (req, res) => { await service.health?.(); res.json({ data: { status: 'ok', storage: service.storage || 'temporary-memory', authentication: 'none-local-only' } }) })
  app.use('/api/v1/interviews', interviewRoutes(service))
  app.use((req, res, next) => next(new ApiError(404, 'ROUTE_NOT_FOUND', 'API route not found.')))
  app.use(errorHandler)
  return app
}


