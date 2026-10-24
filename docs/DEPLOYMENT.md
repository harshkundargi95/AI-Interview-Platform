# Deployment (pending)

No application has been deployed. Phase 4 source was pushed to GitHub at the user’s
request; that is not a deployment. Clerk is configured locally.

## Current local setup — through Phase 9

See ../README.md for commands. server/.env requires DATABASE_URL and optionally PORT
and CORS_ORIGINS. Clerk also requires CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
on the server, plus VITE_CLERK_PUBLISHABLE_KEY on the client. client/.env.example retains the public VITE_API_URL; never place
database credentials in VITE_* variables.

npm run db:local starts real PostgreSQL on loopback port 55432 and preserves files
under server/.data/postgres. The helper and its known local password are development
conveniences only. The application refuses production and non-local database hosts
until deployment configuration is verified. No provisional owner is enabled. Do not tunnel or publish it.

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
| Clerk development application and verified ownership | Separate production Clerk application/domain/OAuth configuration |

Prisma stays in the project. The models, queries and committed migrations carry
over; switching to hosted PostgreSQL does not require a database rewrite.
Deployment still requires configuring the hosted connection and security settings,
applying migrations, and replacing the current local-only restrictions during the deployment phase. It is not ready for publication merely by changing
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
- Configure production guards/origins after reviewing the authenticated deployment.

Recheck official hosting constraints and supported versions during Phase 10.
Prepare the release before asking for publication authorization. Report actual
deployed URLs only after deployment and live verification; deployment remains pending.

## Google OAuth and release readiness

Enable Google for sign-up/sign-in in Clerk SSO connections. Development can use
shared OAuth credentials; production requires custom Google OAuth credentials and
authorized redirects configured in the provider dashboards. Never expose secrets
in VITE_* or commit .env files. Use a regular browser for live Google checks.
A public health response does not prove OAuth works. Phase 5 live verification is
tracked separately in PROGRESS.md; no publication is authorized by this phase.

## Phase 6 local AI configuration

Keep Gemini secrets only in server/.env. AI_MODE=mock is the development default.
Live mode requires a permitted GEMINI_MODEL and GEMINI_API_KEY; setting a key alone
does not enable provider calls. Restart the API after configuration changes. Start
a new interview after switching modes; old sessions cannot silently send mock
answers to a newly enabled live provider. Apply migration 202610110001_ai_operations.

Before deployment review provider data handling, budgets, model availability,
quotas, retention and monitoring. The local ledger limits work but is not billing
reconciliation. Existing production/network guards remain; nothing is published.

## Phase 7 local-only storage gate

Start `npm run storage:local`; port 4569, bucket resumes, files server/.data/objects.
Never expose this development emulator or its fixed development credentials. It is
archived upstream and has dependency advisories. Production requires a maintained,
private S3-compatible service, restricted credentials, verified bucket policy and
lifecycle cleanup, resource isolation and shared upload limits. No deployment added.
Retention cleanup runs while the API is running; inaccessible expired content may
remain physically present until API and storage are both available. Database
interview copies have their own explicit deletion lifecycle.


Phase 8 remains local-only. Microphone capture requires a secure context (localhost
or HTTPS), AudioContext at 16 kHz and AudioWorklet. The same-origin public worklet file
must be served. Audio capture has no browser codec dependency; only canonical PCM WAV
is accepted server-side. Optional question playback needs an installed on-device voice.
VOICE_MODE overrides AI_MODE for transcription (disabled/mock/live); VOICE_MODEL
optionally overrides GEMINI_MODEL, using the existing server-only GEMINI_API_KEY.
No new paid service/account is provisioned. Shared AI quotas apply to voice too.
Audio/transcript content is transient in this app; Google live processing follows its
API terms. Future production work must account for transport/proxy limits and provider
terms, not assume client cancellation revokes an already-sent provider request.

## Phase 9 release review — 2026-10-23

Publication remains blocked by the existing production guard. No deployment or
remote CI run is claimed. Local verification is in PROGRESS.md.

- Full npm audit after compatible Prisma 7.10.1 updates: **4 findings (3 high,
  1 moderate)** in dev-only S3rver/busboy/dicer/fast-xml-parser. `npm audit --omit=dev`
  reports zero. S3rver is loopback-only with known credentials; replace it with
  private hosted storage before publication. Do not blindly force a major downgrade.
- Request logs are allowlisted metadata only. Local monitor thresholds are in
  config/monitoring.json; configure actual hosted log retention/access/alert routing
  in Phase 10. No telemetry provider or billing account was provisioned.
- Readiness is `/api/v1/ready`; liveness `/api/v1/live`. Readiness checks local DB/S3,
  not external Clerk/Gemini. Preserve bounded SQL timeouts and graceful draining.
- HTTP rate limits are per-process; before horizontal scaling use shared counters
  and verify trusted proxy configuration. Durable AI ceiling settings must match
  on all API instances. Configure provider budget alerts separately; quotas are not
  a hard currency cap and unsuccessful calls may still be charged.
- Explicit production retention is still required for account deletion, usage ledger
  and orphan AI plan caches. Interview data persists until deletion; uploaded files
  and extracted upload text expire after 24h; copied interview context persists.
- Database least privilege/TLS, backup restore, production Clerk domains/OAuth,
  frontend CSP/security headers and private storage policies require Phase 10 work.
  Do not disable the production guard merely to publish the current local helpers.
- CI config is present and uses synthetic identities/mock AI; remote execution awaits
  authorized commit/push. The user confirmed the real-account journey and Phase 8 working on 2026-10-24
  after the manual checklists. This is user-reported local acceptance, distinct from
  assistant-observed Chromium fixtures and live synthetic evals; deployed acceptance
  remains a future requirement.

Sources used for review: [Express security guidance](https://expressjs.com/advanced/best-practice-security/),
[OWASP safe logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html),
[Playwright web servers](https://playwright.dev/docs/test-webserver) and
[Playwright CI](https://playwright.dev/docs/ci). Adapted to this local architecture;
these references do not certify the application as secure.
