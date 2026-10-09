# Deployment (pending)

No application has been published and no cloud resources have been created.

## Current local setup — Phase 4

See ../README.md for commands. server/.env requires DATABASE_URL and optionally PORT
and CORS_ORIGINS. client/.env.example retains the public VITE_API_URL; never place
database credentials in VITE_* variables.

npm run db:local starts real PostgreSQL on loopback port 55432 and preserves files
under server/.data/postgres. The helper and its known local password are development
conveniences only. The application refuses production and non-local database hosts
while the provisional development owner is enabled. Do not tunnel or publish it.

After npm ci, run npm run db:generate. Apply committed migrations with npm run
db:migrate. Optional npm run db:seed creates a labeled development example.
Do not run development seeding in production. Never delete .data to solve a migration
problem; it contains your saved interviews.

## How the local setup carries over to deployment

PostgreSQL is already provided by the project's embedded-postgres development
dependency. It runs a real local database; you do not need a separate Windows
PostgreSQL installation or pgAdmin for this setup. Prisma is installed through
npm and connects the Express backend to that database using server/.env.

This is suitable for development. The deployed application is planned to use
managed PostgreSQL on Render instead of the local helper:

| During development | During deployment |
| --- | --- |
| npm run db:local starts PostgreSQL on your PC | A hosted PostgreSQL service runs the database |
| Data lives in server/.data/postgres | Data lives in the hosted database |
| server/.env supplies the local connection | Backend hosting settings supply the production DATABASE_URL securely |
| Provisional local development identity | Verified authentication and ownership must be in place |

Prisma stays in the project. The models, queries and committed migrations carry
over; switching to hosted PostgreSQL does not require a database rewrite.
Deployment still requires configuring the hosted connection and security settings,
applying migrations, and replacing the current local-only restrictions after
authentication is implemented. It is not ready for publication merely by changing
DATABASE_URL.

Schema migrations create or update tables; they do not copy your local interview
records into the hosted database. If you want those records online, plan and verify
a separate data transfer. Do not upload the local database directory or reuse its
development credentials as production configuration.

## Schema changes, tests and backups

Committed migrations build a fresh database; test:db verified this on real local
PostgreSQL. It creates/drops only a unique disposable database. For future schema
changes, use Prisma migrate dev with a suitable local shadow database, inspect the
generated SQL, retain it in version control and verify it against a fresh database.
Do not edit an already applied migration or reset a database containing wanted data.

Before production migrations, make and verify a restorable backup and assess
compatibility with the previous server version. Production backup/restore and
rollback are not implemented or verified in Phase 4. Reverting application code
does not automatically revert database schema or recover deleted interviews.

## Planned Phase 10 release

- Vercel: client/dist with non-asset route rewrites to /index.html.
- Render: Express and managed PostgreSQL with distinct production credentials.
- Private S3-compatible storage: resumes, beginning in Phase 7.
- Include shared/ in both workspace build contexts.
- Verify Clerk authentication, ownership, HTTPS, CORS, provider configuration,
  persistence, migrations, backups, monitoring and rollback.
- Resolve or explicitly assess dependency advisories recorded in PROGRESS.md.
- Replace development identity/guards only after authentication is implemented.

Recheck official hosting constraints and supported versions during Phase 10.
Prepare the release before asking for publication authorization. Report actual
deployed URLs only after deployment and live verification; deployment remains pending.
