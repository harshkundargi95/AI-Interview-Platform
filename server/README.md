# Express backend — Phase 4

See ../README.md for the three-terminal local setup. PostgreSQL must be running,
server/.env must provide DATABASE_URL, and migrations must be applied.
Run npm run db:generate after installing dependencies.

Routes → async controllers → Zod validation → persistent service → Prisma/PostgreSQL.
The normal entry point never falls back to the earlier Map service.
API listens at 127.0.0.1:3001 and refuses production. A hardcoded development
identity is used locally; this is not authentication.

npm run test:db (from root) creates and migrates a unique temporary local database,
runs real persistence checks, then drops only that test database. It requires
CREATE DATABASE privilege. npm test runs the ordinary fixtures without PostgreSQL.

Fixed bank and shared configuration are preserved. See ../docs/API.md and the
Phase 4 chapter in ../docs/PROJECT_WALKTHROUGH.md.
