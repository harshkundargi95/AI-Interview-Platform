# Roadmap

Complete one phase per turn, update PROGRESS.md with actual verification, and
stop for the learning checkpoint. The full requirements and working rules are
preserved in [PROJECT_BRIEF.md](PROJECT_BRIEF.md). This table summarizes the gates;
it does not replace that brief. Security accompanies every applicable phase.

Use [REQUIREMENTS_CHECKLIST.md](REQUIREMENTS_CHECKLIST.md) to track individual
master-prompt tasks and acceptance gates. The [Phase 1–3 audit](PROGRESS.md#historical-phase-13-audit)
records their implementation evidence and verification limits. Follow the
documentation closeout instructions in the root AGENTS.md after every phase.

| Phase | Scope | Acceptance gate | Status |
| --- | --- | --- | --- |
| 0 | Inspect; client/server/docs; React/Vite; scripts; ignore rules; lint; learning documentation | Frontend starts, page renders, documented commands verified | Complete (see PROGRESS.md) |
| 1 | Landing, setup, room, feedback, and sample history; Router; reusable components | All screens navigable; narrow/wide layout; labels, keyboard/focus, empty/error states; build passes; no false integration claims | Complete (see PROGRESS.md) |
| 2 | Fixed questions; role/type/difficulty; local answers and progress | Five-question journey; correct question/answer mapping; back/forward preserves answers; empty/long validation; abandonment warning; sample feedback; no backend needed | Complete (see PROGRESS.md) |
| 3 | Express /api/v1; routes/controllers/services; temporary memory; frontend fetch | Real requests; health check; Zod/body limits/CORS; useful invalid-request and outage behavior; safe duplicate submission; API tests; local only | Complete (see PROGRESS.md) |
| 3.1 | Four role tracks; internship/junior; subjects including CN/OOP/DSA/DBMS/OS; language/technology preferences; 3–10 fixed questions | Complete interviews for each track; subject-sensitive selection; clear validation; legacy defaults; relevant tests | Complete (see PROGRESS.md) |
| 4 | PostgreSQL/Prisma; migrations/seed; persistence; history/resume/delete | Restart persistence; clean migration; relations/constraints/transactions; server state rejects invalid writes/transitions; persistence tests; isolated provisional identity | Complete (see PROGRESS.md) |
| 5 | Clerk React/Express; verified identities; private records | Live sign-in when configured; unauthenticated rejection; cross-user read/write/delete denial; expired sessions; no production dev identity; auth/ownership tests | Complete; automated checks passed and user confirmed live operation 2026-10-11 (see PROGRESS.md) |
| 6 | Dynamic AI question plans, bounded adaptive follow-ups, subject-level answer analysis; replaceable AI provider; official Gemini SDK; explicit mock/live; rubric and evidence | Live feedback with credentials; visible mock mode; valid structured output/ranges; version metadata; timeouts/retries/limits/quotas and duplicate-charge prevention; preserved answers on failures; weak/strong/irrelevant/manipulation evals; honest quality limits | Not started |
| 7 | Job descriptions; private PDF/DOCX uploads; editable skill extraction; personalize AI questions using JD/resume and explicit subjects | Real type/size checks; bounded parsing; editable text preview; minimal AI data; ownership/expiring links/deletion/retention; sample documents; safe failure/retry; exact stored questions and fixed fallback | Not started |
| 8 | Optional turn-based voice after core text product | Consent; permission/unsupported handling; visible bounded recording; server transcription; editable transcript; text fallback; retention; separate mock/live checks; no voice-based personality scoring | Not started |
| 9 | Consolidated security/reliability; request IDs; readiness; monitoring; CI | Main sign-in/interview/feedback/history/deletion journey; cross-user and AI failure/retry tests; CSRF where relevant; safe rendering/logs/files; quotas/concurrency; dependency review; no build secrets; remaining risks documented | Not started |
| 10 | Vercel frontend; Render Express/PostgreSQL; release preparation and authorized deployment | Clean install/build; secure production env/auth/CORS; migrations/backups/rollback; current hosting constraints checked; no accidental mock identity/AI; real HTTPS/login/persistence/feedback checked only when published; blockers explicit | Not started |
| 11 | Portfolio documentation and real screenshots | Accurate README, architecture/API examples, implemented-work resume bullets, engineering talking points, known limits, small future backlog; no invented metrics | Not started |

## Constraints to retain

React/Vite/JavaScript, React Router, plain CSS; Node/Express/JavaScript;
PostgreSQL/Prisma; Zod; Clerk; Gemini official SDK behind a provider interface.
Use Vitest, React Testing Library, Supertest, and Playwright where appropriate.
GitHub Actions arrives with CI. Private S3-compatible storage arrives with uploads.
Check current official provider documentation at the phase introducing each integration.
No TypeScript, Next.js, microservices, Redis, vector databases, Kubernetes, or agent
frameworks without a justified requirement and an explained tradeoff.
No automatic commits, remote pushes, paid provisioning, or publication.





