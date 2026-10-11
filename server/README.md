# Express backend — Phase 5

See ../README.md for local PostgreSQL and Clerk setup. Required server/.env values:
DATABASE_URL, CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. Optional CLERK_JWT_KEY is
the Clerk public verification key, never a private key. Default port is 3001.

Run npm run db:generate and npm run db:migrate from the root after installing.
The second migration preserves Phase 4 records as legacy users and adds ownership
relations. db:seed is optional and creates a legacy record, not a signed-in user's
interview. Never reset the database to enable accounts.

Bearer token → official Clerk verification → verified User mapping → owner-scoped
service → Prisma/PostgreSQL. All interview routes require authentication; health
and CORS preflight are public. Cookies alone and client identity fields cannot grant
access. Normal startup has no provisional identity and fails if keys are missing.

npm test runs fixture/SDK verification tests; npm run test:db additionally creates
a disposable real database for persistence and authenticated ownership tests.
Both use synthetic signed test tokens, not live Clerk accounts.
Production and remote database connections remain disabled until deployment work.
