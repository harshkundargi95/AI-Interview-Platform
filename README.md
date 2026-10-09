# Interview Practice

A full-stack learning project for software developer internships and junior roles.
**Current milestone: Phase 4 complete — PostgreSQL persistence, history, resume and deletion.**

## What works

- General, frontend, backend and full-stack tracks; internship/junior levels; 3–10 questions selected on the backend.
- Answers stay attached to questions across previous/next navigation.
- Nonblank answers with a 3,000-character limit; all selected answers submitted on completion.
- Server-confirmed answer review, loading states, understandable errors and retries.
- Duplicate-safe starts and completion; backend validation and bounded requests.
- Responsive interface, light/dark toggle, accessible controls and motion preferences.
- Real PostgreSQL history, explicit Save progress, resume and deletion.
- Feedback illustrations stay fictional. No AI or sign-in yet.

## Run locally

Use Node.js 22.12+ (22.x) or Node 24+. Verified with Node 22.14.0 on Windows.
Run commands from the project root. Use npm.cmd if PowerShell blocks npm.ps1.

First-time setup:

```powershell
npm ci
npm run db:generate
Copy-Item server/.env.example server/.env
```

Copy the example only when server/.env does not already exist; preserve existing
configuration. A local example .env was created during Phase 4 setup on this machine.
The documented development password is local-only, not a production credential.

Terminal 1 — keep the database running:

```powershell
npm run db:local
```

The helper runs real PostgreSQL on 127.0.0.1:55432 and preserves files in
server/.data/postgres (ignored by Git). It does not install a Windows service.
Start one instance only. Ctrl+C stops it without deleting data.

Terminal 2 — initialize the schema, optionally seed, then start Express:

```powershell
npm run db:migrate
npm run db:seed
npm run dev:server
```

Migrations are repeatable; the seed creates one labeled unfinished development
example and does not overwrite existing edited answers. No AI feedback is seeded.

Terminal 3:

```powershell
npm run dev
```

Open http://127.0.0.1:5173. API health is http://127.0.0.1:3001/api/v1/health.
Keep this unauthenticated version local. You can alternatively use an existing
local PostgreSQL database by setting DATABASE_URL in server/.env.

| Command | Purpose |
| --- | --- |
| npm run db:local | Persistent local PostgreSQL helper |
| npm run db:generate | Generate the JavaScript Prisma client |
| npm run db:migrate | Apply committed migrations |
| npm run db:seed | Add an explicitly labeled development example |
| npm run dev:server | Express with watch mode |
| npm run dev | Vite on port 5173 |
| npm test | 46 client/server fixture checks; database tests skipped here |
| npm run test:db | Six real PostgreSQL checks in a fresh disposable database |
| npm run lint | Client, server and shared lint |
| npm run build | Production frontend build |
| npm run preview | Built frontend on port 4173; API/database still required |

test:db requires the local database role to have CREATE DATABASE privilege. It
creates and removes only a uniquely named interview_test_* database, never the
development database. npm test does not prove database persistence by itself.

## Manual check

1. Start an interview; type an answer and click Save progress.
2. Refresh, open History, and choose Resume interview. Revisit the saved answer.
3. Restart Express; reopen History and verify the same text and question order.
4. Complete all answers, then reopen the completed review from History.
5. Delete an interview: cancel once, then confirm; verify it disappears.
6. Stop the API and attempt to save an edit. The error preserves the browser draft.
7. Open the same interview in two tabs; save differing edits. The second stale save
   must fail. Copy any needed draft text before reopening the latest record.

There is no autosave. Unsaved edits remain browser memory only. Saved data has no
one-hour expiry and survives server restarts. Refresh recovery is through History.
Native refresh/close warnings still depend on the browser.

## Where to edit

- server/src/data/questions.js: the fixed bank (104 explicit-ID prompts with applicability metadata).
- server/src/routes/, controllers/, services/: HTTP routing and interview rules.
- server/src/validation.js and middleware/errors.js: validation and error format.
- client/src/interview/api.js: fetch requests and timeout/error handling.
- client/src/interview/InterviewContext.jsx: shared session and request state.
- client/src/pages/: setup, interview, feedback, history and overview screens.
- client/src/index.css and App.css: themes, layout and interactions.

Edit a question's text while retaining its stable ID. Start a new interview to
see the updated bank. Test and lint after behavioral changes; ordinary text edits
can be previewed directly through the development servers.

## Documentation

Start with the detailed [phase-by-phase project walkthrough](docs/PROJECT_WALKTHROUGH.md)
to understand how the implementation was built and trace the code yourself.

The [master requirements checklist](docs/REQUIREMENTS_CHECKLIST.md) tracks each
phase task. The [Phase 1–3 audit](docs/PROGRESS.md#historical-phase-13-audit) records completion evidence.
Documents are reviewed and updated after every phase under the root AGENTS.md rules.

The docs folder contains nine maintained Markdown files:

| File | Read it for |
| --- | --- |
| PROJECT_WALKTHROUGH.md | Detailed explanation of how each phase was built, through Phase 4 |
| PROGRESS.md | Current checkpoint, recorded checks, limitations and historical audit |
| PROJECT_BRIEF.md | Current master prompt; original prompt in a historical appendix |
| REQUIREMENTS_CHECKLIST.md | Individual requirements and completion evidence |
| ROADMAP.md | Phase sequence and acceptance summary |
| ARCHITECTURE.md | Current components, responsibilities and data flow |
| API.md | Current endpoint contracts, configuration and errors |
| LEARNING.md | Concepts and practice tasks by milestone |
| DEPLOYMENT.md | Environment, hosting plans and future release requirements |

Start with the walkthrough and progress. The screenshots subfolder retains actual
milestone evidence. Separate phase guides and audit files have been consolidated.

[Progress](docs/PROGRESS.md), [roadmap](docs/ROADMAP.md),
[architecture](docs/ARCHITECTURE.md), [API contracts](docs/API.md),
[learning notes](docs/LEARNING.md), [deployment](docs/DEPLOYMENT.md),
and [master requirements](docs/PROJECT_BRIEF.md).

Complete one phase at a time. No automatic commits, pushes or publication.

![Server-confirmed interview review](docs/screenshots/phase-3-1-completion.png)


## Phase 3.1 configuration

Select automatic/balanced coverage or explicit subjects, including CN, OOP, DSA,
DBMS and OS. Technical slots equal the question count for Technical and its rounded-up
half for Mixed. Selected subjects each require at least one technical slot.
Behavioral-only interviews need no subjects. Language and up to five technologies
are preferences: specialized matches are used where available; neutral questions
cover gaps without substituting unrelated frontend content. Current specialist
prompts cover React, Python, Java and PostgreSQL; other choices use neutral concepts.
Difficulty adjusts the requested explanation depth within internship/junior scope.
Questions are fixed, not AI-generated; AI plans, follow-ups and analysis arrive in
Phase 6. Resume/JD personalization arrives in Phase 7. Code is never executed.

