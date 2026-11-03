import { databaseOptions } from './config.js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('Set DATABASE_URL in server/.env and run npm run db:migrate first.')
  return new PrismaClient({ adapter: new PrismaPg({ ...databaseOptions(url), connectionTimeoutMillis: 5000, statement_timeout: 10000, idle_in_transaction_session_timeout: 15000, max: 5 }) })
}
