# Requirements checklist — revised software developer scope

PROJECT_BRIEF.md is the current user brief, updated on 2026-10-08. The earlier brief is preserved in the historical appendix of PROJECT_BRIEF.md; original completed-phase tasks are retained below. The Phase 1–3 audit
applies to the original scope; it is not evidence for newly added requirements.

## Phase 3.1 evidence

- Shared catalog and setup: four tracks, two experience levels, nine technical
  subjects including CN/OOP/DSA/DBMS/OS, language and technology choices, 3–10 count.
- Backend: explicit stable IDs and applicability metadata; round-robin selected
  coverage, bounded experience-relative depth, specialized matches or neutral
  fallback within the chosen track/subject. Frozen per-session question snapshots.
- Validation: empty/impossible subject plans, wrong tracks, unknown options,
  duplicates and count bounds rejected; legacy frontend defaults retained.
- Verification: server scope matrix and per-track completion tests; frontend setup,
  coverage warning and variable-length completion tests; see PROGRESS.md for totals.
- Live browser: junior backend/CN/Go/PostgreSQL, three questions, server-confirmed
  review; mobile setup inspected at 390px with no horizontal overflow.

Checked below means the completed phase's tasks were inspected and verified.
Future phases remain unchecked. Preserve every requirement when updating this file.
Apply the documentation gate in ../AGENTS.md after every phase. Non-phase product,
content and safety requirements remain authoritative in PROJECT_BRIEF.md: scope
includes internships/junior only, dynamic questions and analysis from Phase 6,
JD/resume from Phase 7, no candidate code execution, no premature integrations.

## Phases 0–3 — Already implemented

Inspect and verify these phases rather than rebuilding them:
- [x] Setup and documentation.
- [x] Interview interface.
- [x] Local fixed-question interview flow.
- [x] Express API communication and in-memory sessions.

Fix regressions relevant to the scope extension. Document unrelated issues without expanding the phase unnecessarily.

## Phase 3.1 — Expand to software developer interviews

Inspect frontend-only assumptions in:
- [x] UI text.
- [x] Interview setup.
- [x] Question banks.
- [x] API validation.
- [x] Session data.
- [x] Sample feedback.

Implement:
- [x] Four role tracks.
- [x] Internship and junior experience levels.
- [x] Topic selection, including CN, OOP, DSA, DBMS, and OS.
- [x] Language and technology preferences.
- [x] Configurable question count with sensible limits.
- [x] Updated UI descriptions and session summaries.

Extend the fixed question bank with stable IDs and metadata:
- [x] Track applicability.
- [x] Subject/topic.
- [x] Interview type.
- [x] Experience level.
- [x] Difficulty.
- [x] Language or technology applicability.

Select questions on the backend. Provide enough eligible questions for supported configurations and avoid duplicates.

Prefer language-neutral questions when specific coverage is unavailable. Never substitute unrelated frontend questions for another track.

Keep active question sets stable and ensure answers belong to the interview’s questions.

Preserve existing frontend API compatibility where practical using explicit defaults.

Keep storage in memory. Do not add database, authentication, or AI yet.

Acceptance:
- [x] Each role track supports a complete interview.
- [x] Selected topics affect the questions.
- [x] Invalid configurations receive clear errors.
- [x] Existing frontend interviews still work.
- [x] Relevant tests pass.

Update the roadmap and stop for review.

## Phase 4 evidence

- Prisma schema/migration: Interview configuration, exact Question snapshots and
  ordering, composite Answer foreign key, FeedbackReport storage, timestamps/status.
- persistentInterviews.js: PostgreSQL persistence, owner-scoped list/read/delete,
  serializable transactions, revision protection and duplicate-safe operations.
- Client: real History with pagination/retry, resume/review/delete confirmation,
  explicit Save progress, saved/unsaved state and failed-save draft retention.
- Live PostgreSQL: fresh migration, seed, six integration tests including actual
  API process restart, foreign-key failure, concurrency and cascade deletion.
- 46 ordinary tests plus six live database tests passed; lint/build passed.
- Provisional identity is server-assigned, local-only and refused in production.
  Authentication remains Phase 5. Reports are modeled; generation is Phase 6.
- UI checks were component tests with mocked network; no new browser screenshot.
  Tooling advisories and driver warning remain documented in PROGRESS.md.
- Migration and development seed requirement (not originally a checkbox): implemented
  and verified. The full Phase 4 walkthrough is in PROJECT_WALKTHROUGH.md.

## Phase 4 — PostgreSQL persistence

Replace in-memory storage with Prisma and PostgreSQL.

Model:
- [x] Interviews and configuration.
- [x] Questions with exact text, ordering, and topic metadata.
- [x] Answers.
- [x] Feedback reports.
- [x] Relevant timestamps and session status.

Add migrations and development seed data.

Support:
- [x] History.
- [x] Resuming unfinished interviews.
- [x] Deleting interviews.
- [x] Safe multi-step writes and state transitions.

Keep provisional development identity local and isolated from production.

Acceptance:
- [x] Data survives restarts.
- [x] History uses real records.
- [x] A fresh database can be created from migrations.
- [x] Answers cannot be attached to unrelated questions.
- [x] Invalid session transitions are rejected.

## Phase 5 evidence and live gate

- Official Clerk React/Express SDKs; fresh bearer tokens; SDK signature/lifetime
  verification and explicit authorized-party checks; JSON 401 failures.
- User migration and verified subject mapping; owner-scoped operations including
  nested feedback; old shared local records kept separate as legacy users.
- Protected screens, sign-out confirmation, account-state clearing and useful
  expired-session errors with retained drafts until identity changes.
- 57 ordinary tests and ten real PostgreSQL tests passed; lint/build passed.
  Authentication fixtures use ephemeral signed JWTs verified by the real SDK.
- [x] Google sign-in integration through Clerk prebuilt screens and setup docs.
- [x] Live acceptance: user confirmed “its working properly” on 2026-10-11 after
  receiving the Google sign-in, save/resume and second-account checklist. This is
  user-reported acceptance, not assistant-observed browser verification of each
  step. Automated cross-account tests passed separately; see PROGRESS.md.

## Phase 5 — Authentication and authorization

Integrate Clerk using current official documentation.

- [x] Verify tokens on Express.
- [x] Map verified identities to database users.
- [x] Derive ownership from the authenticated session.
- [x] Never trust client-supplied user IDs.
- [x] Scope every read, write, report, and deletion to its owner.
- [x] Protect UI routes and handle expired sessions.
- [x] Disable provisional development identity in production.

Acceptance:
- [x] Users can access their own interviews.
- [x] Unauthenticated requests fail safely.
- [x] User A cannot read, modify, or delete User B’s records.
- [x] Access-control tests pass.

## Phase 6 — AI questions and answer analysis

Implement a provider interface with explicit mock and live modes.

Use AI to:
- [x] Generate an initial question plan from interview configuration.
- [x] Ask relevant, bounded follow-ups.
- [x] Analyze answers.
- [x] Produce a final report with subject-level feedback.

Save each exact question before showing it. Keep server-side session state authoritative.

For adaptive interviews:
- [x] Set clear limits for base questions and follow-ups.
- [x] Show accurate progress.
- [x] Avoid duplicate questions.
- [x] Preserve recoverable state when requests fail.

Analyze technical answers using:
- [x] Correctness.
- [x] Relevance.
- [x] Reasoning and tradeoffs.
- [x] Clarity.
- [x] Depth appropriate to experience.

Analyze behavioral answers using:
- [x] Relevance.
- [x] Structure.
- [x] Specificity.
- [x] Reflection.

Feedback must include:
- [x] Strengths.
- [x] Missing or incorrect points.
- [x] Evidence from the answer.
- [x] Actionable improvements.
- [x] An example improved answer when useful.

Accept valid alternative approaches. Do not assume a reference answer is the only correct solution.

Implement:
- [x] Structured response validation.
- [x] Score range validation.
- [x] Model and rubric version tracking.
- [x] Timeouts and bounded retries.
- [x] Per-user quotas and output limits.
- [x] Duplicate-request protection.
- [x] Usage tracking without sensitive answer logging.
- [x] A visible fixed-bank fallback.
- [x] Safe handling of provider outages and malformed output.

Treat candidate content as untrusted data. Give the model no unrestricted tools or database credentials.

Clearly label scores as coaching guidance.

Acceptance:
- [x] Live question generation and analysis work when configured.
- [x] Mock mode remains clearly labeled.
- [x] Provider failures preserve user answers.
- [x] Question generation respects tracks and selected subjects.
- [x] A small evaluation dataset covers strong, weak, irrelevant, and instruction-manipulation answers across subjects.
- [x] Report qualitative limitations honestly.

Phase 6 evidence (2026-10-13): provider/contracts/operations, persistent service,
AI routes and UI implemented; 88 tests, lint and build passed. Real Flash-Lite
plan/follow-up/report, database reread and cached retry passed with a temporary
synthetic user. Four live evaluation calls covered 16 probes successfully. Provider
schema compatibility and model availability fixes are explained in PROGRESS.md.
The user subsequently confirmed the browser app and Gemini reviews work on
2026-10-13; no assistant-observed OAuth check. UI tests mock API responses. Scores remain coaching
only and the small evaluation is not an accuracy benchmark.

## Phase 7 — JD and resume personalization

Add:
- [x] JD input with length limits.
- [x] Skill extraction with an editable user-visible summary.
- [x] PDF/DOCX resume upload.
- [x] Private storage and authorized, expiring download links.
- [x] File type and size validation.
- [x] Parsing with resource and time limits.
- [x] Editable extracted resume text.
- [x] Deletion and retention controls.

AI question generation should:
- [x] Combine JD requirements with the selected track and experience level.
- [x] Respect explicit subject selections.
- [x] Prioritize required skills over optional ones.
- [x] Ask about relevant resume projects.
- [x] Avoid assuming experience absent from the resume.
- [x] Generate useful questions without a JD or resume.
- [x] Explain conflicts between selected scope and JD expectations.
- [x] Fall back to the matching question bank on failure.

Send only necessary personal information to the provider.

Introduce durable background jobs only if needed and explain the choice.

Acceptance:
- [x] Questions change meaningfully with JD/resume context.
- [x] Invalid documents fail safely.
- [x] Private documents are inaccessible to other users.
- [x] Failed processing can be retried safely.

Phase 7 evidence (2026-10-15): prior 100 automated tests, lint/build and real local
S3 lifecycle checks passed. New diagnostic regression raises database tests to 25
(101 aggregate). Two live Gemini context comparisons and persisted interview/retry
checks passed: React inventory and CSS gallery produced materially different,
subject-appropriate questions. An intervening fallback confirms provider availability
can fluctuate. User confirmed browser upload/interview/feedback and, on 2026-10-15,
resume-based questions in a fresh interview; no new assistant browser check. Local S3 emulator/dependency limitations remain documented
in PROGRESS.md and DEPLOYMENT.md; completion is local-development scoped.

## Phase 8 — Turn-based voice answers

Implement:
- [ ] Microphone permissions.
- [ ] Visible recording and stop controls.
- [ ] Recording duration and size limits.
- [ ] Server-side transcription through a documented provider integration.
- [ ] Editable transcript before submission.
- [ ] Optional question playback.
- [ ] Text fallback.
- [ ] Recording consent and retention behavior.

Use the same answer-analysis engine for typed answers and confirmed transcripts.

Acceptance:
- [ ] Permission denial and unsupported browsers are handled.
- [ ] Recording cannot continue invisibly.
- [ ] Users can correct transcription mistakes.
- [ ] Text interviews work without voice services.
- [ ] Actual live voice checks are distinguished from mocks.

## Phase 9 — Security and reliability review

Security must be implemented throughout earlier phases; this phase consolidates verification.

Review:
- [ ] Authentication and ownership.
- [ ] Input limits and validation.
- [ ] Rate limits and AI spending controls.
- [ ] CORS and security headers.
- [ ] Safe rendering of AI text.
- [ ] CSRF where cookie-authenticated mutations are used.
- [ ] File privacy and parser restrictions.
- [ ] Secrets and sensitive logs.
- [ ] Dependency vulnerabilities.
- [ ] Database security.
- [ ] Deletion and retention.
- [ ] Concurrent requests, duplicate submissions, and retries.

Add:
- [ ] Structured logs and request IDs.
- [ ] Health and readiness checks.
- [ ] Error monitoring configuration.
- [ ] CI for relevant tests and builds.
- [ ] End-to-end tests for the main journey.

Evaluate question relevance and feedback across all tracks and core subjects.

Acceptance:
- [ ] Sign in → configure → interview → feedback → history → delete passes.
- [ ] Cross-user access is blocked.
- [ ] AI failure/retry behavior is verified.
- [ ] Secrets are absent from frontend bundles and committed files.
- [ ] Remaining risks are documented accurately.

## Phase 10 — Deployment

Prepare and document:
- [ ] Vercel frontend deployment.
- [ ] Render backend and PostgreSQL.
- [ ] Private file storage.
- [ ] Production environment variables.
- [ ] Authentication origins and CORS.
- [ ] Database migrations and backups.
- [ ] Hosting constraints.
- [ ] Release and rollback procedures.

Disable mock identity and unintended mock AI in production.

Prepare all deployable files before requesting publication authorization.

If authorized and access is available, deploy and verify actual URLs. Otherwise record the exact remaining steps and mark deployment pending.

Acceptance:
- [ ] A clean checkout builds using documented instructions.
- [ ] HTTPS, authentication, persistence, and AI work on the deployed application when deployment is possible.
- [ ] Deployment status is based on verification, not merely configuration files.

## Phase 11 — Portfolio completion

Finish:
- [ ] README and actual screenshots.
- [ ] Architecture explanation.
- [ ] API examples.
- [ ] Engineering decisions and limitations.
- [ ] Resume bullets based on implemented work.
- [ ] Interview talking points.
- [ ] A small future backlog.

Never invent users, performance improvements, accuracy metrics, or deployment results.


## Historical completed-phase requirements

These checked tasks refer to original Phases 0–3. Phase 3.1 supersedes frontend-only and fixed-five assumptions. Evidence: PROGRESS.md historical audit.

### Phase 0 — Inspect, plan, and set up

- [x] Inspect the workspace and available runtimes.
- [x] Establish a simple structure with client/, server/, and docs/.
- [x] Set up the React frontend and development scripts.
- [x] Add Git ignore rules and basic linting.
- [x] Document the final phases and their acceptance criteria.
- [x] Explain the browser, frontend, backend, database, and AI provider responsibilities.
- [x] Avoid introducing the database or AI before they are needed.

Acceptance:
- [x] The frontend starts successfully.
- [x] A basic page renders.
- [x] Setup instructions match the commands actually verified.

### Phase 1 — Build the interface

Create:
- [x] Landing page.
- [x] Interview setup page.
- [x] Interview room.
- [x] Feedback page.
- [x] Interview history page with clearly labeled sample data.

Requirements:
- [x] Responsive layout.
- [x] Accessible labels, keyboard navigation, and visible focus states.
- [x] Reusable buttons, form controls, cards, and layout components.
- [x] Clear navigation.
- [x] Friendly empty and error states.
- [x] No fake claims that authentication or AI is connected.

Acceptance:
- [x] All screens can be navigated.
- [x] Layout works on narrow and wide screens.
- [x] The production frontend build succeeds.

- [x] Explain components, props, routing, and CSS organization.

### Phase 2 — Make the interview work locally

- [x] Add a small fixed question bank.
- [x] Support role, type, and difficulty selection.
- [x] Show one question at a time.
- [x] Collect answers and show progress.
- [x] Preserve answers when moving between questions.
- [x] Validate empty and excessively long answers.
- [x] Allow completion and show clearly labeled sample feedback.
- [x] Warn before abandoning unsaved answers.

Acceptance:
- [x] A user can complete a five-question interview.
- [x] Answers remain attached to the correct questions.
- [x] No backend or AI connection is required.

- [x] Explain state, controlled inputs, event handlers, and derived values.

### Phase 3 — Add Express and connect the frontend

- [x] Set up Express with organized routes, controllers, and services.
- [x] Introduce /api/v1 endpoints.
- [x] Add health checks.
- [x] Return interview questions from the backend.
- [x] Accept answers and complete interviews.
- [x] Use temporary in-memory storage and clearly document that it is temporary.
- [x] Add request validation, body size limits, consistent errors, and an explicit CORS allowlist.
- [x] Add loading, retry, and error behavior on the frontend.
- [x] Make duplicate submissions safe.
- [x] Keep this unauthenticated version local.

Acceptance:
- [x] The frontend sends and receives real backend data.
- [x] Invalid requests return useful errors.
- [x] Backend outages produce understandable frontend messages.
- [x] Relevant API tests pass.

- [x] Explain HTTP, REST, JSON, status codes, fetch, and CORS.




### Phase 7 optional setup refinement — 2026-10-15

- [x] Explicit personalization opt-in/out; off excludes context from new requests
  while preserving the current Setup draft (does not delete uploaded files).
- [x] Technical / Behavioral / Mixed and 3–10 base-question controls inside the
  optional section, synchronized with the existing main interview preferences.
- [x] Client regression covers opt-out payload, restored draft, synchronized settings,
  and behavioral subject reset. All 24 client tests passed with one worker; lint/build
  passed. Visual browser verification was unavailable for this refinement.
