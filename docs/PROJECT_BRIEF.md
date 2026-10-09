You are my full-stack development mentor and implementation partner. Continue building my AI Interview Platform through the remaining phases.

I am learning full-stack development. Implement working code while explaining important concepts in clear, beginner-friendly language.

## Current project status

The original project is completed through Phase 3:
- React frontend and interview screens.
- Local interviews with fixed questions.
- Express backend connected to the frontend.
- Temporary in-memory storage.

Verify this against the actual code and progress notes. Do not assume everything works, but do not restart or rebuild completed phases.

The original scope focused on frontend developers. We are now expanding it to software developer roles and core computer science subjects.

Your immediate task is Phase 3.1: extend the existing implementation to the updated scope. Finish and verify that phase, then stop at a learning checkpoint.

## Product goal

Build a mock interview platform for software developer internships and junior software developer positions.

Users should be able to:
- Sign up and sign in.
- Select a role track, experience level, interview type, and subjects.
- Complete text-based interviews.
- Receive AI-generated questions and adaptive follow-ups.
- Receive detailed AI analysis of their answers.
- Personalize interviews using a job description and resume.
- Review interview history and progress by subject.
- Answer through voice after the text experience is complete.

Support these tracks:
- General Software Developer.
- Frontend Developer.
- Backend Developer.
- Full-Stack Developer.

Senior-level interviews are outside the first release.

## Important AI requirement

Fixed questions are appropriate for the current local implementation and early development phases.

They must not remain the only question source in the completed product.

From Phase 6 onward:
- AI must generate questions dynamically.
- AI must analyze submitted answers against documented rubrics.
- AI must generate relevant, bounded follow-up questions.
- Generated questions must use the selected role, experience level, topics, language, and technologies.
- Phase 7 must additionally use the JD and resume.

Keep fixed question banks as an explicitly labeled fallback when AI is unavailable.

Never silently show sample feedback as real AI analysis. Clearly distinguish mock, fallback, and live AI behavior.

## Technology stack

Preserve the existing stack unless inspection reveals a necessary change:
- React with Vite and JavaScript.
- React Router.
- Existing CSS and reusable UI components.
- Node.js with Express.
- PostgreSQL.
- Prisma for database access and migrations.
- Zod for request and AI-response validation.
- Clerk for authentication, verified on the backend.
- Gemini API through its official SDK and a replaceable provider interface.
- Vitest, React Testing Library, Supertest, and Playwright where appropriate.
- GitHub Actions for CI.
- Vercel for the frontend.
- Render for the backend and PostgreSQL.
- Private S3-compatible storage when uploads are introduced.

Check current official documentation for provider integrations and compatible versions.

Avoid adding frameworks or infrastructure without a concrete need. Do not introduce microservices, Kubernetes, vector databases, or agent frameworks.

## Supported interview content

General Software Developer:
- Programming fundamentals.
- Core computer science subjects.
- Debugging, Git, testing, and basic software design.

Frontend:
- HTML, CSS, JavaScript.
- Frameworks selected by the user.
- Accessibility, browser behavior, API integration, and performance.

Backend:
- API design, databases, validation, error handling.
- Authentication, authorization, security, and basic concurrency.

Full-Stack:
- Frontend and backend fundamentals.
- Browser-to-server communication.
- End-to-end feature design, databases, security, and deployment.

All tracks:
- Behavioral questions.
- Project discussion.
- Technical decisions and tradeoffs.

## Core computer science subjects

Explicitly support:

Computer Networks:
- TCP/IP, HTTP/HTTPS, DNS.
- TCP versus UDP, ports, latency.
- How a browser request reaches a server.

Object-Oriented Programming:
- Encapsulation, abstraction, inheritance, polymorphism.
- Composition, interfaces, practical design examples.

Data Structures and Algorithms:
- Arrays, strings, linked lists, stacks, queues, hash maps.
- Trees and basic graphs.
- Searching, sorting, time and space complexity.

Database Management Systems:
- Relational concepts, keys, relationships.
- SQL, joins, normalization, indexes.
- Transactions, ACID, basic isolation concepts.

Operating Systems:
- Processes, threads, memory basics.
- Concurrency, synchronization, deadlocks.

Keep depth suitable for internships and junior positions.

## Interview configuration

Allow users to select:
- Role track.
- Experience level: internship or junior.
- Interview type: technical, behavioral, or mixed.
- Automatic/balanced topic coverage or selected subjects.
- Preferred programming language.
- Relevant technologies.
- Question count within reasonable limits.
- Optional JD and resume when supported.

If difficulty already exists, keep it relative to experience level. A difficult internship interview must not become a senior-level interview.

Behavioral-only interviews should not require technical subjects.

If the question count cannot cover every selected subject, explain the limitation or require enough questions.

## Text and voice scope

Text interviews are the core release:
- Display questions.
- Accept typed answers.
- Save answers and provide feedback.

Phase 8 adds turn-based oral answers:
- Display a question and optionally read it aloud.
- Let the user record a spoken answer.
- Transcribe it.
- Let the user edit and confirm the transcript.
- Analyze the confirmed answer using the same rubric as text answers.

Do not implement continuous realtime conversation in the first release.

Do not infer personality, confidence, or employability from voice characteristics. Distinguish transcription errors from answer quality.

## Working rules

1. Inspect existing files and applicable repository instructions before editing.
2. Preserve unrelated changes and working functionality.
3. Implement and verify code rather than stopping at a plan.
4. Complete one phase per turn, then wait for “continue.”
5. Make routine decisions without repeatedly asking permission.
6. Ask only when missing information materially blocks progress.
7. Prefer readable code and small functions.
8. Explain concepts briefly when introducing them.
9. Never claim checks passed unless they actually ran successfully.
10. Never request secrets in chat. Use environment variables and secure provider settings.
11. When credentials are missing, finish independent work and distinguish mock verification from live verification.
12. Do not purchase services, create paid resources, push code, or publish without my explicit instruction.
13. Do not create commits unless asked; suggest a commit message.
14. Do not implement future phases prematurely.

## Project documentation

Maintain:
- README.md.
- docs/ROADMAP.md.
- docs/ARCHITECTURE.md.
- docs/LEARNING.md.
- docs/PROGRESS.md.
- docs/API.md.
- docs/DEPLOYMENT.md.
- Environment example files with placeholders only.

Record actual completion status, checks, limitations, and the next step.

On “continue,” read progress notes and resume the next unfinished phase.

## Phases 0–3 — Already implemented

Inspect and verify these phases rather than rebuilding them:
- Setup and documentation.
- Interview interface.
- Local fixed-question interview flow.
- Express API communication and in-memory sessions.

Fix regressions relevant to the scope extension. Document unrelated issues without expanding the phase unnecessarily.

## Phase 3.1 — Expand to software developer interviews

Inspect frontend-only assumptions in:
- UI text.
- Interview setup.
- Question banks.
- API validation.
- Session data.
- Sample feedback.

Implement:
- Four role tracks.
- Internship and junior experience levels.
- Topic selection, including CN, OOP, DSA, DBMS, and OS.
- Language and technology preferences.
- Configurable question count with sensible limits.
- Updated UI descriptions and session summaries.

Extend the fixed question bank with stable IDs and metadata:
- Track applicability.
- Subject/topic.
- Interview type.
- Experience level.
- Difficulty.
- Language or technology applicability.

Select questions on the backend. Provide enough eligible questions for supported configurations and avoid duplicates.

Prefer language-neutral questions when specific coverage is unavailable. Never substitute unrelated frontend questions for another track.

Keep active question sets stable and ensure answers belong to the interview’s questions.

Preserve existing frontend API compatibility where practical using explicit defaults.

Keep storage in memory. Do not add database, authentication, or AI yet.

Acceptance:
- Each role track supports a complete interview.
- Selected topics affect the questions.
- Invalid configurations receive clear errors.
- Existing frontend interviews still work.
- Relevant tests pass.

Update the roadmap and stop for review.

## Phase 4 — PostgreSQL persistence

Replace in-memory storage with Prisma and PostgreSQL.

Model:
- Interviews and configuration.
- Questions with exact text, ordering, and topic metadata.
- Answers.
- Feedback reports.
- Relevant timestamps and session status.

Add migrations and development seed data.

Support:
- History.
- Resuming unfinished interviews.
- Deleting interviews.
- Safe multi-step writes and state transitions.

Keep provisional development identity local and isolated from production.

Acceptance:
- Data survives restarts.
- History uses real records.
- A fresh database can be created from migrations.
- Answers cannot be attached to unrelated questions.
- Invalid session transitions are rejected.

## Phase 5 — Authentication and authorization

Integrate Clerk using current official documentation.

- Verify tokens on Express.
- Map verified identities to database users.
- Derive ownership from the authenticated session.
- Never trust client-supplied user IDs.
- Scope every read, write, report, and deletion to its owner.
- Protect UI routes and handle expired sessions.
- Disable provisional development identity in production.

Acceptance:
- Users can access their own interviews.
- Unauthenticated requests fail safely.
- User A cannot read, modify, or delete User B’s records.
- Access-control tests pass.

## Phase 6 — AI questions and answer analysis

Implement a provider interface with explicit mock and live modes.

Use AI to:
- Generate an initial question plan from interview configuration.
- Ask relevant, bounded follow-ups.
- Analyze answers.
- Produce a final report with subject-level feedback.

Save each exact question before showing it. Keep server-side session state authoritative.

For adaptive interviews:
- Set clear limits for base questions and follow-ups.
- Show accurate progress.
- Avoid duplicate questions.
- Preserve recoverable state when requests fail.

Analyze technical answers using:
- Correctness.
- Relevance.
- Reasoning and tradeoffs.
- Clarity.
- Depth appropriate to experience.

Analyze behavioral answers using:
- Relevance.
- Structure.
- Specificity.
- Reflection.

Feedback must include:
- Strengths.
- Missing or incorrect points.
- Evidence from the answer.
- Actionable improvements.
- An example improved answer when useful.

Accept valid alternative approaches. Do not assume a reference answer is the only correct solution.

Implement:
- Structured response validation.
- Score range validation.
- Model and rubric version tracking.
- Timeouts and bounded retries.
- Per-user quotas and output limits.
- Duplicate-request protection.
- Usage tracking without sensitive answer logging.
- A visible fixed-bank fallback.
- Safe handling of provider outages and malformed output.

Treat candidate content as untrusted data. Give the model no unrestricted tools or database credentials.

Clearly label scores as coaching guidance.

Acceptance:
- Live question generation and analysis work when configured.
- Mock mode remains clearly labeled.
- Provider failures preserve user answers.
- Question generation respects tracks and selected subjects.
- A small evaluation dataset covers strong, weak, irrelevant, and instruction-manipulation answers across subjects.
- Report qualitative limitations honestly.

## Phase 7 — JD and resume personalization

Add:
- JD input with length limits.
- Skill extraction with an editable user-visible summary.
- PDF/DOCX resume upload.
- Private storage and authorized, expiring download links.
- File type and size validation.
- Parsing with resource and time limits.
- Editable extracted resume text.
- Deletion and retention controls.

AI question generation should:
- Combine JD requirements with the selected track and experience level.
- Respect explicit subject selections.
- Prioritize required skills over optional ones.
- Ask about relevant resume projects.
- Avoid assuming experience absent from the resume.
- Generate useful questions without a JD or resume.
- Explain conflicts between selected scope and JD expectations.
- Fall back to the matching question bank on failure.

Send only necessary personal information to the provider.

Introduce durable background jobs only if needed and explain the choice.

Acceptance:
- Questions change meaningfully with JD/resume context.
- Invalid documents fail safely.
- Private documents are inaccessible to other users.
- Failed processing can be retried safely.

## Phase 8 — Turn-based voice answers

Implement:
- Microphone permissions.
- Visible recording and stop controls.
- Recording duration and size limits.
- Server-side transcription through a documented provider integration.
- Editable transcript before submission.
- Optional question playback.
- Text fallback.
- Recording consent and retention behavior.

Use the same answer-analysis engine for typed answers and confirmed transcripts.

Acceptance:
- Permission denial and unsupported browsers are handled.
- Recording cannot continue invisibly.
- Users can correct transcription mistakes.
- Text interviews work without voice services.
- Actual live voice checks are distinguished from mocks.

## Phase 9 — Security and reliability review

Security must be implemented throughout earlier phases; this phase consolidates verification.

Review:
- Authentication and ownership.
- Input limits and validation.
- Rate limits and AI spending controls.
- CORS and security headers.
- Safe rendering of AI text.
- CSRF where cookie-authenticated mutations are used.
- File privacy and parser restrictions.
- Secrets and sensitive logs.
- Dependency vulnerabilities.
- Database security.
- Deletion and retention.
- Concurrent requests, duplicate submissions, and retries.

Add:
- Structured logs and request IDs.
- Health and readiness checks.
- Error monitoring configuration.
- CI for relevant tests and builds.
- End-to-end tests for the main journey.

Evaluate question relevance and feedback across all tracks and core subjects.

Acceptance:
- Sign in → configure → interview → feedback → history → delete passes.
- Cross-user access is blocked.
- AI failure/retry behavior is verified.
- Secrets are absent from frontend bundles and committed files.
- Remaining risks are documented accurately.

## Phase 10 — Deployment

Prepare and document:
- Vercel frontend deployment.
- Render backend and PostgreSQL.
- Private file storage.
- Production environment variables.
- Authentication origins and CORS.
- Database migrations and backups.
- Hosting constraints.
- Release and rollback procedures.

Disable mock identity and unintended mock AI in production.

Prepare all deployable files before requesting publication authorization.

If authorized and access is available, deploy and verify actual URLs. Otherwise record the exact remaining steps and mark deployment pending.

Acceptance:
- A clean checkout builds using documented instructions.
- HTTPS, authentication, persistence, and AI work on the deployed application when deployment is possible.
- Deployment status is based on verification, not merely configuration files.

## Phase 11 — Portfolio completion

Finish:
- README and actual screenshots.
- Architecture explanation.
- API examples.
- Engineering decisions and limitations.
- Resume bullets based on implemented work.
- Interview talking points.
- A small future backlog.

Never invent users, performance improvements, accuracy metrics, or deployment results.

## Coding assessment boundary

The current scope includes:
- DSA explanations.
- Pseudocode.
- Code snippets and code discussion.

AI code review is not execution-based verification.

Executable coding assessments are a separate extension requiring isolated execution, supported languages, test cases, and strict CPU, memory, time, and network limits.

Never run candidate code inside the application server.

## End-of-phase checkpoint

Report:
1. What works now.
2. Important files changed.
3. How to run and manually verify it.
4. Checks performed and actual results.
5. Concepts I should understand.
6. One small practice task.
7. Blockers and limitations.
8. Suggested commit message.
9. Next phase.

Update documentation and stop until I say “continue.”

Start now by inspecting the completed Phase 3 implementation and implementing Phase 3.1 only.
---
## Historical original brief

The current scope above supersedes this original prompt wherever they differ. Retained verbatim for Phase 0–3 history.

<details>
<summary>Original master prompt (historical reference)</summary>

Act as my full-stack development mentor and implementation partner. Build an AI Interview Platform from scratch through deployment, following the phases below.

I am learning full-stack development. Help me understand the project while implementing real, working code. Keep the architecture simple and explain important decisions in beginner-friendly language.

## Project goal

Users should be able to:
- Sign up and sign in.
- Select a job role, interview type, and difficulty.
- Complete a mock interview.
- Receive detailed, evidence-based AI feedback.
- Review past interviews and progress.
- Personalize interviews using a resume or job description.
- Optionally answer using voice after the core product is complete.

Start with frontend developer interviews and behavioral questions. Build a complete text-based product before adding voice.

## Stack

Use:
- Frontend: React with Vite and JavaScript.
- Routing: React Router.
- Styling: plain CSS initially, with a small reusable component system.
- Backend: Node.js with Express and JavaScript.
- Database: PostgreSQL.
- Database access and migrations: Prisma.
- Validation: Zod.
- Authentication: Clerk, verified on the Express backend.
- AI: Gemini API through its official SDK, behind a replaceable provider interface.
- Testing: Vitest, React Testing Library, Supertest, and Playwright where appropriate.
- Version control: Git.
- CI: GitHub Actions.
- Deployment: Vercel for the frontend, Render for Express and managed PostgreSQL.
- Resume storage: private S3-compatible object storage when resume uploads are added.

Check current official documentation before implementing provider-specific integrations. Use compatible supported versions and commit lockfiles.

Do not add TypeScript, Next.js, microservices, Kubernetes, Redis, vector databases, or agent frameworks unless an actual requirement justifies them and you explain the tradeoff first.

## Working rules

1. Inspect the existing project and applicable repository instructions before changing files. Preserve unrelated work.
2. Implement code, run it, and verify behavior. Do not stop at generating a plan.
3. Complete one phase per turn. At the end of the phase, give me a learning checkpoint and wait for me to say “continue.”
4. Within a phase, make routine implementation decisions without repeatedly asking permission.
5. Ask only when missing information materially blocks progress. Use sensible defaults for naming and visual design.
6. Explain key concepts briefly when introducing them.
7. Prefer readable code, small functions, and clear names over clever abstractions.
8. Use comments to explain non-obvious decisions, not every line.
9. Never claim a test passed, an integration works, or deployment succeeded unless you verified it.
10. If credentials or external access are missing, complete all independent work, document the blocker, and distinguish mock verification from live verification.
11. Never request secrets in chat. Tell me which environment variables to configure securely.
12. Do not purchase services, create paid resources, push to a remote, or publish the application without my explicit instruction. Prepare the necessary files first.
13. Do not create automatic commits unless I ask. Suggest a commit message after each phase.
14. Do not implement future phases prematurely.

## Project documentation

Create and maintain:
- README.md: setup, commands, features, and project overview.
- docs/ROADMAP.md: phases, acceptance criteria, and completion status.
- docs/ARCHITECTURE.md: components, data flow, and important decisions.
- docs/LEARNING.md: concepts introduced and small practice exercises.
- docs/PROGRESS.md: completed work, actual verification results, blockers, and next step.
- docs/API.md: endpoint contracts once the backend is introduced.
- docs/DEPLOYMENT.md: hosting, environment variables, migrations, and rollback.
- .env.example files containing placeholders only.

On “continue,” read the progress notes and implement the next unfinished phase rather than restarting.

## Phase 0 — Inspect, plan, and set up

- Inspect the workspace and available runtimes.
- Establish a simple structure with client/, server/, and docs/.
- Set up the React frontend and development scripts.
- Add Git ignore rules and basic linting.
- Document the final phases and their acceptance criteria.
- Explain the browser, frontend, backend, database, and AI provider responsibilities.
- Avoid introducing the database or AI before they are needed.

Acceptance:
- The frontend starts successfully.
- A basic page renders.
- Setup instructions match the commands actually verified.

## Phase 1 — Build the interface

Create:
- Landing page.
- Interview setup page.
- Interview room.
- Feedback page.
- Interview history page with clearly labeled sample data.

Requirements:
- Responsive layout.
- Accessible labels, keyboard navigation, and visible focus states.
- Reusable buttons, form controls, cards, and layout components.
- Clear navigation.
- Friendly empty and error states.
- No fake claims that authentication or AI is connected.

Acceptance:
- All screens can be navigated.
- Layout works on narrow and wide screens.
- The production frontend build succeeds.

Explain components, props, routing, and CSS organization.

## Phase 2 — Make the interview work locally

- Add a small fixed question bank.
- Support role, type, and difficulty selection.
- Show one question at a time.
- Collect answers and show progress.
- Preserve answers when moving between questions.
- Validate empty and excessively long answers.
- Allow completion and show clearly labeled sample feedback.
- Warn before abandoning unsaved answers.

Acceptance:
- A user can complete a five-question interview.
- Answers remain attached to the correct questions.
- No backend or AI connection is required.

Explain state, controlled inputs, event handlers, and derived values.

## Phase 3 — Add Express and connect the frontend

- Set up Express with organized routes, controllers, and services.
- Introduce /api/v1 endpoints.
- Add health checks.
- Return interview questions from the backend.
- Accept answers and complete interviews.
- Use temporary in-memory storage and clearly document that it is temporary.
- Add request validation, body size limits, consistent errors, and an explicit CORS allowlist.
- Add loading, retry, and error behavior on the frontend.
- Make duplicate submissions safe.
- Keep this unauthenticated version local.

Acceptance:
- The frontend sends and receives real backend data.
- Invalid requests return useful errors.
- Backend outages produce understandable frontend messages.
- Relevant API tests pass.

Explain HTTP, REST, JSON, status codes, fetch, and CORS.

## Phase 4 — Persist data in PostgreSQL

- Set up Prisma and PostgreSQL.
- Create migrations and development seed data.
- Replace in-memory interview storage.
- Model interviews, questions, answers, and feedback with appropriate relationships and constraints.
- Add timestamps and interview status.
- Support history, resume of unfinished interviews, and deletion.
- Use transactions where a multi-step write must succeed together.
- Use server-side session state to reject invalid transitions.
- Keep provisional local development identity isolated from production.

Acceptance:
- Data survives application restarts.
- History reflects actual records.
- Answers cannot be assigned to unrelated questions or completed interviews.
- A clean database can be created from migrations.
- Relevant persistence tests pass.

Explain tables, foreign keys, migrations, queries, and transactions.

## Phase 5 — Add authentication and private data

- Integrate Clerk into React and Express using current official documentation.
- Verify session tokens on the backend.
- Map verified provider identities to application users.
- Derive identity from the verified session, never a user ID supplied by the client.
- Scope every interview, answer, feedback, and deletion operation to its owner.
- Protect routes and handle expired sessions.
- Remove production access to provisional development identity.
- Ensure development authentication shortcuts cannot run in production.

Acceptance:
- Users can sign in and view their own history.
- Unauthenticated requests are rejected.
- User A cannot read, modify, or delete User B’s records.
- Ownership and authentication tests pass.

Explain authentication versus authorization and why frontend route protection is insufficient.

## Phase 6 — Add real AI feedback

- Introduce a backend AI provider interface.
- Implement Gemini using the official SDK.
- Keep credentials exclusively on the backend.
- Maintain explicit mock and live modes; label mock output visibly.
- Assess correctness, relevance, clarity, and depth using a documented rubric.
- Return strengths, missing points, suggestions, and evidence from the answer.
- Validate structured responses and score ranges.
- Record provider, model, and rubric versions.
- Add timeouts, bounded retries, output limits, and per-user quotas.
- Prevent duplicate report generation from causing duplicate charges.
- Track usage without logging private answers.
- Treat answers and job descriptions as untrusted input.
- Give the AI no database credentials or unrestricted tools.
- Preserve submitted answers when AI generation fails.
- Present scores as coaching guidance.

Acceptance:
- Real feedback works when credentials are configured.
- Mock mode works without credentials and is unmistakably labeled.
- Provider failures are handled gracefully.
- Malformed AI output is rejected safely.
- A small evaluation dataset covers weak, strong, irrelevant, and instruction-manipulation answers.
- Report limitations honestly; do not treat mocked tests as proof of feedback quality.

Explain backend secrets, structured output, prompts, rate limits, and evaluation.

## Phase 7 — Add personalized and adaptive interviews

- Accept a job description with length limits.
- Support PDF and DOCX resume uploads.
- Validate actual file types and sizes.
- Use private storage, generated object names, ownership checks, and expiring download links.
- Parse files with time and resource limits.
- Provide a resume text preview that the user can correct.
- Send only necessary information to the AI provider.
- Add resume deletion and explain retention.
- Generate role-relevant questions and bounded follow-ups.
- Store the exact questions asked.
- Keep a fixed question bank fallback.
- Add durable background processing only if parsing or generation requires it; explain the choice before adding infrastructure.

Acceptance:
- Personalization works with sample documents.
- Unsupported or malformed files fail safely.
- Private files are inaccessible to other users.
- Adaptive interviews have a bounded length.
- Interrupted or failed processing can be retried safely.

## Phase 8 — Add voice input

Build a turn-based voice experience first:
- Microphone permission handling.
- Recording and stop controls.
- Server-side speech transcription through a documented provider integration.
- Editable transcript before answer submission.
- Optional question playback.
- Text input fallback.
- File size and recording duration limits.
- Explicit recording consent and retention behavior.
- Clear separation between transcription quality and interview scoring.

Acceptance:
- Permission denial and unsupported browsers are handled.
- Users can correct transcripts.
- Recording cannot continue invisibly.
- Text interviews still work without voice services.
- Live verification is reported separately from mocked tests.

Do not add continuous realtime voice or evaluate personality, confidence, or employability from vocal characteristics.

## Phase 9 — Security, reliability, and final verification

Security must be included in earlier phases; this phase consolidates and tests it.

Review and fix:
- Ownership enforcement.
- Input validation and request limits.
- Rate limits and AI spending controls.
- Safe session handling.
- CORS and security headers.
- XSS and safe rendering of AI output.
- CSRF protections where cookie-authenticated mutations are used.
- File privacy and parsing limits.
- Secrets and sensitive data in logs.
- Dependency vulnerabilities.
- Database connection security.
- Deletion behavior and data retention.
- Duplicate requests and concurrent submissions.
- Public error messages versus internal diagnostics.

Add:
- Structured logs with request identifiers.
- Health/readiness checks.
- Error monitoring configuration.
- Relevant unit, integration, and end-to-end tests.
- CI checks for linting, tests, and production builds.

Acceptance:
- The main journey passes: sign in → interview → answers → feedback → history → deletion.
- Cross-user access tests pass.
- AI failure and retry behavior passes.
- No secrets are committed or included in the frontend build.
- Any unresolved issues are documented with their actual impact.

## Phase 10 — Prepare and perform deployment

- Prepare frontend and backend deployment configurations.
- Add a backend Dockerfile if appropriate.
- Document all environment variables and which are public.
- Configure production authentication origins and CORS.
- Document database migrations and backups.
- Keep development and production credentials separate.
- Check current hosting constraints instead of assuming free tiers support every requirement.
- Prepare a release checklist and rollback instructions.
- Ask for external publication authorization only after the application is ready to review.
- If authorization and account access are available, deploy and verify the real URLs.
- Otherwise provide exact remaining setup steps and mark deployment as pending.

Acceptance:
- A clean checkout can be installed and built using the README.
- Production configuration disables mock identity and accidental mock AI.
- HTTPS, login, persistence, and feedback work on the deployed app when deployment is possible.
- Missing account access or credentials are listed explicitly.
- Never claim “deployed” based only on configuration files.

## Phase 11 — Finish the portfolio presentation

- Polish the README.
- Add actual screenshots when capture tools are available.
- Document architecture and API examples.
- Explain key engineering decisions and known limitations.
- Write resume bullets based only on implemented, verified work.
- Provide interview talking points.
- List a small optional future backlog: continuous voice, more roles, and coding assessments.

Do not invent usage numbers, accuracy metrics, performance improvements, or deployment results.

## End-of-phase response

After each phase, provide:
1. What now works.
2. Important files changed.
3. How to run and manually check it.
4. Checks actually performed and their results.
5. Three to five concepts I should understand.
6. One small practice task I can do myself.
7. Blockers or remaining limitations.
8. A suggested Git commit message.
9. The next phase.

Update progress documentation, then stop at the learning checkpoint.

Start now with Phase 0. Inspect the workspace, briefly explain your approach, and implement the setup. Do not build the entire project in the first turn.
</details>

