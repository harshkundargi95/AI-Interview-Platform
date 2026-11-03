import { validateProduction } from './config.js'
import { createLogger } from './middleware/observability.js'
import { configuredVoiceProvider, transcriptSchema } from './voice/provider.js'
import { configuredStorage } from './uploads/storage.js'
import { cleanExpiredResumes } from './uploads/routes.js'
import { configuredProvider } from './ai/provider.js'
import { createAiOperations } from './ai/operations.js'
import { createApp, localOrigins } from './app.js'
import { createDatabase } from './database.js'

validateProduction()
const logger = createLogger()
let shuttingDown = false
const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.')
const origins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) ?? localOrigins
const db = createDatabase()
const storage = configuredStorage()
const voiceProvider = configuredVoiceProvider()
const quotaOptions = { dailyLimit: Number(process.env.AI_DAILY_LIMIT || 30), globalDailyLimit: Number(process.env.AI_GLOBAL_DAILY_LIMIT || 500) }
const voice = voiceProvider ? createAiOperations(db, voiceProvider, { ...quotaOptions, retainResult: false, validate: (_kind, data) => transcriptSchema.parse(data) }) : null
const app = createApp({ db, storage, voice, logger, isShuttingDown: () => shuttingDown, ai: createAiOperations(db, configuredProvider(), quotaOptions), origins, authOptions: {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  jwtKey: process.env.CLERK_JWT_KEY?.replaceAll('\\n', '\n'),
} })
await db.$connect()
const cleanup = () => cleanExpiredResumes(db, storage).catch(() => logger({ event: 'cleanup_error', code: 'RESUME_CLEANUP_FAILED' }))
await cleanup()
const cleanupTimer = setInterval(cleanup, 60000)
cleanupTimer.unref()
const server = app.listen(port, process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1', () => logger({ event: 'server_started', code: process.env.NODE_ENV === 'production' ? 'API_READY' : 'LOCAL_API_READY' }))
server.on('error', async error => { logger({ event: 'startup_error', code: error.code === 'EADDRINUSE' ? 'PORT_IN_USE' : 'STARTUP_FAILED' }); await db.$disconnect(); process.exitCode = 1 })
server.headersTimeout = 15000
server.requestTimeout = 65000
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  if (shuttingDown) return
  shuttingDown = true
  clearInterval(cleanupTimer)
  const deadline = setTimeout(() => { server.closeAllConnections(); void db.$disconnect().finally(() => process.exit(1)) }, 70000)
  deadline.unref()
  server.close(() => { clearTimeout(deadline); void db.$disconnect() })
})
