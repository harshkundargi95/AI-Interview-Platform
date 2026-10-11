import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('Set DATABASE_URL in server/.env and run npm run db:migrate first.')
  const parsed = new URL(url)
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
    throw new Error('Deployment is pending; use a local database and non-production server.')
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, connectionTimeoutMillis: 5000, max: 5 }) })
}
