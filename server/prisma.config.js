import 'dotenv/config'
import { defineConfig } from 'prisma/config'
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node --env-file-if-exists=.env prisma/seed.js' },
  datasource: { url: process.env.DATABASE_URL },
})
