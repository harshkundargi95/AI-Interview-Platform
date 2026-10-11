import { createApp, localOrigins } from './app.js'
import { createDatabase } from './database.js'

const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.')
const origins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) ?? localOrigins
const db = createDatabase()
const app = createApp({ db, origins, authOptions: {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  jwtKey: process.env.CLERK_JWT_KEY?.replaceAll('\\n', '\n'),
} })
await db.$connect()
const server = app.listen(port, '127.0.0.1', () => console.log(`Local API: http://127.0.0.1:${port}/api/v1/health (PostgreSQL, Clerk authentication)`))
server.on('error', async error => { console.error(`Server could not start: ${error.code}`); await db.$disconnect(); process.exitCode = 1 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => db.$disconnect()))
