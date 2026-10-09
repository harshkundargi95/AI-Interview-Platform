import { createApp, localOrigins } from './app.js'
import { createDatabase } from './database.js'
import { createPersistentInterviewService } from './services/persistentInterviews.js'

const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.')
const origins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) ?? localOrigins
const db = createDatabase()
await db.$connect()
const service = createPersistentInterviewService(db)
await service.health()
const app = createApp({ origins, service })
const server = app.listen(port, '127.0.0.1', () => console.log(`Local API: http://127.0.0.1:${port}/api/v1/health (PostgreSQL, development identity only)`))
server.on('error', async error => { console.error(`Server could not start: ${error.code}`); await db.$disconnect(); process.exitCode = 1 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => db.$disconnect()))
