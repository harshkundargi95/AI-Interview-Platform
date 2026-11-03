# Deployment — zero-cost portfolio demo

Current target (2026-10-25): Vercel Hobby + Render Free + Supabase Free PostgreSQL
and private Storage + Clerk development + Gemini free tier. No purchased domain.
The user's zero-cost instruction supersedes the earlier paid Render/production Clerk
plan. The source is prepared; no accounts, services or URLs have been deployed here.
Phase 10 preparation is included in this source release. Phase 11 remains pending.

## Cost boundary and provider limits

This is a non-commercial portfolio demo, not an always-on production service.
Use free accounts/plans only. Do not activate trials, attach payment methods, enable
usage billing, or upgrade automatically. If a provider requires a card or paid feature
for your account/region, stop and reassess; do not accept a paid substitute.
The app cannot inspect your provider billing accounts or guarantee future pricing.

| Component | Selected service | Relevant restriction |
| --- | --- | --- |
| Frontend | Vercel Hobby, free vercel.app address | Personal/non-commercial use and plan quotas |
| API | Render Free web service | Sleeps after 15 minutes idle; waking takes about a minute |
| Database and files | One dedicated Supabase Free project | 500 MB database, 1 GB files; inactivity can pause the project |
| Authentication | Clerk development instance | Real verified accounts, development limits; not production OAuth |
| Questions/reports/voice | Gemini Free-tier project | Model-specific quotas; exhausted quota means refusal/fallback, not an upgrade |

Render's free database expires after 30 days, so this blueprint creates no Render DB.
Render bandwidth/build overages can charge an account with payment details; without a
payment method the corresponding service/build is suspended instead. Keep this demo
in a free workspace without billing details. Do not use uptime pings to defeat sleep.
Sources: [Render Free](https://render.com/docs/free),
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Supabase Free limits](https://supabase.com/pricing).

Gemini must use a dedicated project showing **Free Tier**, with no active linked billing
account. Verify the selected model has free access in AI Studio; do not assume a ChatGPT
or Gemini consumer subscription includes API usage. GEMINI_FREE_TIER_CONFIRMED=true is
only your acknowledgement after checking, not a billing verification performed by code.
The application caps demo AI at 5 operations/user/day and 20 globally/day (lower values
allowed), including voice. These are not token/currency limits; retries can make more
than one provider request. No paid model/provider fallback is implemented. See
[Gemini billing](https://ai.google.dev/gemini-api/docs/billing).

## 1. Prepare the source and account configuration

Commit/push Phase 10 when authorized and inspect GitHub Actions for that exact commit.
The local app retains its four-terminal README workflow and unchanged .env files.
Use the existing Clerk **development** instance or a dedicated demo development instance;
enable Google there. Do not complete Clerk's production-domain form or buy a domain.
Keep matching pk_test_/sk_test_ keys private except the publishable frontend key.
Clerk supports host-provided preview addresses with development keys:
[Clerk environments](https://clerk.com/docs/guides/development/managing-environments).

Choose a stable Vercel project name, e.g. YOUR-PROJECT.vercel.app (availability must be
confirmed in Vercel). The exact resulting URL is required for CORS; no *.vercel.app
wildcard. You can create the Vercel project later and update CORS before testing.
Use a separate database for the demo; local interview records are not transferred.

## 2. Create one Supabase Free project

Use a dedicated Free organization/project; decline Pro, paid IPv4 and other add-ons.
Choose a region near the Render API (the template uses Singapore). Save its database
password privately. **Disable Data API in project API settings before migrations**:
this app accesses PostgreSQL through Express/Prisma, not browser Supabase REST APIs.
Do not put Supabase anon/service-role/database keys in the frontend. Authentication
remains Clerk; there is no Supabase Auth integration to configure.

In Connect, select the shared **session pooler**, port **5432**, with its IPv4-compatible
host, username including project reference, database and password. Copy the real URL
as DATABASE_URL. Do not use transaction pooler port 6543: migrations/advisory locks need
session semantics. Percent-encode special characters in the password if building a URL.
Download the database CA certificate from Supabase settings and provide its PEM contents
as DATABASE_CA_CERT (multiline or escaped newlines). Runtime and migration connections
verify certificates/hostnames. Never fix TLS errors by disabling verification.
References: [connections](https://supabase.com/docs/guides/database/connecting-to-postgres),
[SSL](https://supabase.com/docs/guides/platform/ssl-enforcement),
[Prisma/Data API](https://supabase.com/docs/guides/database/prisma).

Create a Storage bucket named `resumes`, **Public OFF**, maximum object size 2 MiB.
The server stores bytes as application/octet-stream, so allow that MIME type if adding
bucket MIME restrictions; server validation still checks actual PDF/DOCX content.
Enable S3 access and generate S3 access/secret keys. Copy the endpoint and region exactly
from its settings, normally `https://PROJECT.storage.supabase.co/storage/v1/s3`.
Set S3_FORCE_PATH_STYLE=true. Do not use the database password as an S3 secret.

Supabase S3 keys bypass RLS and cover the project's buckets: keep them backend-only in
a dedicated demo project. Our API checks Clerk ownership and expiring download signatures.
Do not add public Storage policies. Verify direct unauthenticated access fails after
setup. [Supabase S3 authentication](https://supabase.com/docs/guides/storage/s3/authentication).

## 3. Deploy the Render Free API

After publication authorization, import the repository as a Blueprint using root
render.yaml. Review the plan as **Free** and confirm it creates only one web service,
no database/disk/cron/paid resources. Both build and start work from repository root.
Keep automatic deploys off and one instance. No preDeployCommand is used because it
requires paid compute ([Render deploys](https://render.com/docs/deploys)).

The template runs:

```sh
npm ci --include=dev && npm run db:generate && npm prune --omit=dev
node server/scripts/start-demo.js
```

The first line builds; the second is the start command. Startup validates settings,
applies committed migrations, revokes public/anon/authenticated access to this app's
seven tables plus Prisma metadata, then starts the API. On failure it does not listen.
These revocations are repeated safely on restart; existing owner access remains.
Storage/auth schemas are not modified. Disable Data API before first startup as above
so there is no migration-time exposure. No resets, seed or user deletion are run.

Set the manually requested variables in Render, never in Git or chat:

| Variable | Value |
| --- | --- |
| DATABASE_URL | Supabase session-pooler URL on 5432 |
| DATABASE_CA_CERT | Supabase CA certificate PEM |
| CORS_ORIGINS | Exact https://YOUR-PROJECT.vercel.app, no trailing slash |
| CLERK_PUBLISHABLE_KEY | Matching pk_test_... |
| CLERK_SECRET_KEY | Matching sk_test_... |
| GEMINI_API_KEY | Key for the dedicated project with no paid billing |
| GEMINI_MODEL | Model confirmed available on that project's free tier |
| GEMINI_FREE_TIER_CONFIRMED | true, only after checking AI Studio billing |
| S3_ENDPOINT | Supabase S3 URL including /storage/v1/s3 |
| S3_REGION | Region from S3 settings |
| S3_BUCKET | resumes |
| S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY | Generated S3 credentials |

Blueprint defaults: NODE_ENV=production, DEPLOYMENT_MODE=demo, DATABASE_TRANSPORT=tls,
S3_FORCE_PATH_STYLE=true, AI_MODE=live, VOICE_MODE=live, AI_DAILY_LIMIT=5,
AI_GLOBAL_DAILY_LIMIT=20. RESUME_LINK_SECRET is generated once. Keep it stable across
restarts; rotating it invalidates outstanding 60-second links. Voice can be disabled
explicitly if its model isn't free/available; typed answers remain supported.

NODE_ENV stays production for hosted runtime behavior. Only the explicit deployment
mode permits development Clerk keys; it does not bypass token/owner checks or accept
mock AI. Omitting demo mode still enforces production Clerk live keys.

Once running, open https://YOUR-API.onrender.com/api/v1/ready. Expect status ready.
Cold-start loading pages or a paused Supabase project are availability issues, not a
reason to disable authentication/TLS. Startup errors log a category without raw secrets;
check settings/migration status privately if DEMO_START_FAILED occurs.

## 4. Deploy Vercel Hobby frontend

Import the same repository as a **personal Hobby** project. Root directory: repository
root, not client. Framework: Vite. Node24. Install npm ci; build npm run build; output
client/dist. Root vercel.json supplies routing/security headers and these commands.
Choose these variables for the deployment environment you will actually use:

```text
VITE_DEPLOYMENT_MODE=demo
VITE_API_URL=https://YOUR-API.onrender.com/api/v1
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PK_TEST_PUBLISHABLE_KEY
```

Use the actual pk_test_ value; the example is a placeholder. Never put other credentials
in VITE variables. Rebuild after changes. The UI shows a free-demo label, cold-start and
quota notice, and asks for fictional resume details. Typed/voice coaching labels remain.
Confirm the actual assigned vercel.app URL matches Render CORS_ORIGINS; if it differs,
update Render and restart before testing. Keep this one stable URL for demonstrations.
Changing preview domains requires explicit matching origins; never allow wildcard azp.

## 5. Verify and close the phase

These checks remain pending until the actual hosted setup exists:

- [ ] All provider dashboards show free plans/no paid billing; no custom domain purchased.
- [ ] HTTPS frontend/API, deep links /sign-in, /setup, /history, static voice worklet.
- [ ] Google sign-in with Clerk development; sign-out/expired sessions handled.
- [ ] Create, answer, save, Gemini feedback, refresh, resume from History, delete.
- [ ] Voice capture/transcription/edit/confirm; text fallback and microphone denial.
- [ ] Resume private upload/download/delete; another account cannot access it.
- [ ] Supabase Data API disabled; anon/authenticated roles have no app-table privileges.
- [ ] Runtime and migration TLS connect with correct CA; wrong CA fails.
- [ ] Render sleep/restart preserves DB/files; show wake delay without clearing drafts.
- [ ] Low quota yields explicit failure/fixed-bank fallback, never fake real feedback.
- [ ] Back up and restore synthetic demo data into an isolated DB; test code rollback.
- [ ] Record URLs, release commit/date and actual limits, then update PROGRESS/checklist.

## Retention, recovery and limits

Supabase S3 lacks bucket lifecycle configuration/versioning; do not follow the previous
AWS lifecycle instructions here. App download/list access expires at 24h. Cleanup runs
on API startup and once a minute while awake, deleting expired files/text. If Render
sleeps or Supabase pauses, physical deletion is delayed until a later successful cleanup.
Manually remove unwanted files in Storage if the demo is retired; do not delete only
storage metadata SQL rows. No paid cron or fake keepalive was added.
[Supabase S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility).

Use fictional resumes/answers for a public portfolio demo, especially with free AI
provider data-processing terms. Saved interview context lasts until interview deletion;
usage ledger/orphan plan caches and account deletion still need an explicit retention
procedure. Do not claim immediate erasure from backups/providers or guaranteed recovery.

Free backup/PITR capabilities differ from the earlier paid plan. Export your application
schema/data with PostgreSQL pg_dump using a verified TLS connection and private PG*
environment variables, encrypt/store locally, and rehearse restoring into a disposable
PostgreSQL database. Never include Supabase-managed auth/storage schemas in a blind
restore. Object bytes are separate from a DB backup. No paid PITR guarantee is assumed.

Before schema changes save a backup; use additive migrations compatible with old code.
Restore a previous Vercel/API deployment to roll back code, but do not reverse migrations
or reset the hosted DB blindly. Repair forward, or restore into a new isolated database
and cut over after verification. Free Render rollback history is limited. Keep release
commit IDs and a source copy; do not rely on an unlimited hosting history.

API rate limits are process-local; keep one instance. Forwarded IP headers remain
untrusted, so Render proxy users can share a rate-limit bucket. Readiness checks DB/S3,
not Clerk/Gemini. Do manual health checks for demos; no keepalive monitoring is configured.
Parser resource limits aren't antivirus/OS sandboxing. Frontend CSP is partial. Hosted
Linux, Supabase TLS/S3 and real hosted Google/Gemini journey still need verification.

## Local verification and implementation map

See PROGRESS.md for commands and actual outcomes. Added config/demo startup regressions
and a real temporary-DB check for public privilege revocation. Hosted build checks must
cover pk_test_ only with explicit demo, production still pk_live_, and localhost refusal.

Files: render.yaml (free-only); server/src/config.js (explicit mode/cost acknowledgement),
server/src/demoDeployment.js and server/scripts/start-demo.js (TLS migrations and Data API
hardening); client/vite.config.js (build guard); Layout.jsx (demo notice). The earlier
production mode remains supported by code but is not provisioned by any current manifest.
No extra framework, auth provider, DB engine, paid resource, commit or push was introduced.

Verification on 2026-10-25: 140 tests passed (35 client, 70 server, 34 isolated local DB,
1 Chromium), lint/build/secret scan and five hosted build guard combinations passed.
Initial parser/worker timeouts passed on rerun without changed limits. Provider account
configuration and hosted acceptance are still pending. See PROGRESS.md for details.
