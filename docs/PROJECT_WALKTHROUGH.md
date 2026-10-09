# How this interview platform was built

A phase-by-phase guide to understanding the project and explaining its code.

**Status: Phases 0–4 completed, including 3.1. Phases 5–11 are planned.**
Read [Phase 4](#phase-4--postgresql-persistence) for current storage behavior. Earlier memory/expiry descriptions are historical.
The detailed chapters below preserve the Phase 3 milestone. For the current expanded implementation, read [Phase 3.1 step by step](#phase-31--scope-configuration-and-fixed-bank-planning) first. Frontend-only, positional-ID and five-question descriptions below are historical. The current roadmap and brief supersede the old future-phase summaries, particularly dynamic question generation and follow-ups in Phase 6.

The [Phase 1–3 audit](PROGRESS.md#historical-phase-13-audit) verifies the completed scope against the
master prompt. The [requirements checklist](REQUIREMENTS_CHECKLIST.md) tracks
every phase task and acceptance bullet. This guide and all affected project
documents must be updated after each completed phase, following root AGENTS.md.

This guide explains the implementation, not just the feature list. Read it beside
the source files and trace the examples yourself. The project was developed with
AI assistance; being able to explain, change and debug the code is how you build
your own understanding. You can accurately describe it as your project built
with AI-assisted implementation and learning support.

File paths below are relative to the repository root. Code examples labeled
“simplified” illustrate the design and are not additional files to create.

## Contents

1. [The project as a whole](#1-the-project-as-a-whole)
2. [Phase 0: establish the foundation](#2-phase-0-establish-the-foundation)
3. [Phase 1: build the interface](#3-phase-1-build-the-interface)
4. [Phase 2: make interviews work in the browser](#4-phase-2-make-interviews-work-in-the-browser)
5. [Phase 3: connect React to Express](#5-phase-3-connect-react-to-express)
6. [Trace one complete interview](#6-trace-one-complete-interview)
7. [Run, edit and check the project](#7-run-edit-and-check-the-project)
8. [What future phases will add](#8-what-future-phases-will-add)
9. [Practice explaining the project](#9-practice-explaining-the-project)
10. [Phase 3.1: expanded scope](#phase-31--scope-configuration-and-fixed-bank-planning)

## 1. The project as a whole

The goal is a text-based interview practice application: select a role and focus,
answer questions, receive coaching and eventually review saved progress. We began
with frontend developer interviews and behavioral questions so the first version
would have a manageable scope.

The application grows in layers:

```text
Phase 0: a running React project and a documented plan
Phase 1: screens, navigation and visual design
Phase 2: local interview state and answer collection
Phase 3: real frontend/backend communication
Phase 4 onward: persistence, accounts, AI and other planned capabilities
```

### Responsibilities of the main parts

| Part | What it does | Current status |
| --- | --- | --- |
| Browser | Displays the interface and executes frontend JavaScript | Used |
| React | Describes screens and updates them when state changes | Used |
| Vite | Serves frontend code during development and creates build files | Used |
| React Router | Connects URL paths to screens without a full document reload | Used |
| Node.js | Runs JavaScript outside the browser | Runs the backend and development tools |
| Express | Receives HTTP requests and returns API responses | Used |
| Zod | Validates the structure and allowed values of incoming data | Used |
| PostgreSQL and Prisma | Durable data storage and database access | Planned for Phase 4 |
| Clerk | Sign-in and verified user identity | Planned for Phase 5 |
| Gemini | AI-generated interview coaching | Planned for Phase 6 |

The word “AI” in the project goal does not mean AI feedback already works. The
current feedback report is a labeled fictional example. Actual submitted answers
are shown in a separate review section.

### Current folder structure

```text
project root/
  package.json               Commands and npm workspace configuration
  package-lock.json          Exact dependency versions
  client/
    public/theme.js          Restores the saved theme before first paint
    src/
      main.jsx              Mounts React and the router
      App.jsx               Defines the application routes
      components/           Shared layout, controls and behavior
      pages/                Individual screens
      interview/            Session state, validation and API requests
      data/                 Fictional display data
      test/                 Frontend journey tests
      index.css             Global styles and theme tokens
      App.css               Component styles, layout and animations
  server/
    src/
      index.js              Starts the local HTTP server
      app.js                Configures Express and middleware
      routes/               Connects HTTP paths to controllers
      controllers/          Validates requests and formats responses
      services/             Interview rules and temporary storage
      data/questions.js     Current fixed question bank
      validation.js         Zod schemas and parsing helpers
      middleware/errors.js  Consistent error responses
    test/api.test.js        Backend API tests
  docs/                     Requirements, progress and learning guides
```

## 2. Phase 0: establish the foundation

**Problem:** before implementing interviews, we needed a project that could run
reliably and a clear plan for how it would grow.

### Step 1: inspect the workspace and tools

The setup checked the available Node.js, npm and Git environment and established
the project structure. Node runs development tools and later the backend; npm
installs dependencies and executes scripts; Git can record source history.

The verified development environment was Node 22.14.0 and npm 11.3.0 on Windows.
The package's engine requirement documents the supported Node range. This is a
record of the environment used, not a recommendation to ignore future runtime
updates.

### Step 2: create the React/Vite frontend

Vite provides a development server that serves the browser application. React
mounts into the page's root element and renders components. Starting Vite does
not start Express: they became separate processes in Phase 3.

The first acceptance check was intentionally small: start the frontend and see a
page render. A working foundation makes later errors easier to isolate.

### Step 3: organize the repository

We reserved `client/`, `server/` and `docs/` from the beginning. The server began
as a placeholder; it became a real npm workspace in Phase 3.

The root `package.json` exposes convenient commands. The root lockfile records
exact dependency resolutions so another installation can reproduce them with
`npm ci`. `.gitignore` excludes generated files and local configuration that
should not be committed. Environment examples document configuration without
containing secrets.

Git was initialized, but no automatic commits or remote pushes were made.
Initializing Git and committing a snapshot are separate actions.

### Step 4: add basic quality checks and documentation

Oxlint checks JavaScript/JSX for supported problems. A frontend build checks that
Vite can transform and bundle the application. Neither check proves the entire
user journey behaves correctly; behavior tests and browser checks came later.

The roadmap, architecture, learning notes and progress file were created so each
phase had an explicit purpose and acceptance criteria. `PROJECT_BRIEF.md` retains
the complete original requirements.

**Result:** a running frontend, repeatable commands, a simple structure and a
phase-by-phase plan. No database, authentication or AI integration was added.

**Explain it yourself:** “I first established the React/Vite workspace and
verification commands so later features had a stable starting point.”

## 3. Phase 1: build the interface

**Problem:** users needed a coherent set of screens before we connected real
interview behavior or backend services.

### Step 1: create the five main screens

| Screen | Route | Purpose |
| --- | --- | --- |
| Overview | `/` | Explain the practice experience and provide navigation |
| Setup | `/setup` | Choose role, interview type and difficulty |
| Interview room | `/interview` | Present a question and answer area |
| Feedback | `/feedback` | Show the intended report layout |
| History | `/history` | Show a labeled example history and an empty state |

Unknown routes render `NotFound.jsx` instead of an unexplained blank screen.
At the end of Phase 1, these were interface previews: setup did not create an
interview and the room showed a read-only example. Later phases replaced that
behavior, so the current source is more advanced than the Phase 1 version.

### Step 2: connect screens with React Router

`App.jsx` maps paths to page components. A shared `Layout` wraps the pages and
renders the selected child through an `Outlet`. This avoids copying the header,
navigation, notice and footer into every screen.

Links change routes; buttons perform actions. `NavLink` provides active-route
styling. Changing a route does not need to reload the entire HTML document.

Phase 1 used `BrowserRouter`. Phase 2 changed the router setup to
`createBrowserRouter` and `RouterProvider` to support navigation blocking. The
current `main.jsx` therefore reflects that later decision.

### Step 3: build reusable components

`components/ui.jsx` contains shared controls such as buttons, cards, headings,
select fields, text areas and empty states. A component is a reusable piece of
interface. Props are the inputs that customize it.

For example, a shared button receives its label through `children`, its action
through `onClick`, and its availability through `disabled`. A single shared
implementation keeps spacing, focus and disabled styling consistent.

### Step 4: establish the visual design and themes

The visual follow-ups introduced midnight, lavender and peach colors, hover and
press feedback, and a light/dark toggle near the top right.

- `index.css` defines global rules and semantic variables such as surface and
  text colors. Components use these variables instead of repeating raw colors.
- `App.css` defines layouts, cards, buttons, responsive behavior and motion.
- `ThemeToggle.jsx` changes `document.documentElement.dataset.theme` and stores
  the chosen theme in localStorage.
- `public/theme.js` reads that saved preference before first paint to reduce a
  flash of the wrong theme. Dark is the fallback.

The theme can survive refresh because it is explicitly written to localStorage.
Interview answers are not stored there. Storing one preference does not
automatically persist all application state.

The interactions provide visual feedback; they are not physical vibration or a
hardware haptic implementation. Reduced-motion rules limit decorative movement
when the user has requested less motion.

### Step 5: make the screens usable across devices

Responsive layouts adapt to narrow and wide screens. Native controls have labels,
keyboard users receive visible focus, and a skip link bypasses repeated navigation.
Route changes update the title and move focus to the main content.

The actual checks included route navigation, wide and narrow layouts, theme
persistence, keyboard interactions, unknown routes and the production build.
These checks were not a full accessibility certification.

**Result:** a navigable, responsive interface with reusable components. Sample
content was explicitly labeled so it did not imply a real AI or account system.

**Explain it yourself:** “I separated shared layout and controls from individual
pages, then added routing, themes and accessible interaction states.”

## 4. Phase 2: make interviews work in the browser

**Problem:** a good-looking form was not enough. The application needed to remember
answers, move between questions and enforce the rules of an interview.

### Step 1: introduce a fixed question bank

The bank contains 30 prompts: five technical and five behavioral questions at each
of three difficulty levels. Only the frontend developer role is supported.

Technical and behavioral interviews each select their five matching questions.
Mixed interviews select three technical and two behavioral questions, interleaved
technical → behavioral → technical → behavioral → technical. Selection is fixed,
not random and not generated by AI.

The bank originally lived in the frontend. Its **current** location is
`server/src/data/questions.js` because Phase 3 moved selection to Express.
`client/src/interview/questions.js` now supplies display labels only.

Question IDs are generated from difficulty, category and position, for example
`foundations-behavioral-1`. Editing text in the same position keeps its ID;
reordering or inserting entries changes which prompt a positional ID identifies.
Existing server sessions retain their own selected question snapshots.

### Step 2: store a session rather than scattered values

A session holds preferences, selected questions, answers, the current question
index and active/completed status. Phase 3 later added server IDs and timestamps.

Simplified shape:

```js
{
  preferences: { role: 'frontend', type: 'behavioral', difficulty: 'foundations' },
  questions: [{ id: 'foundations-behavioral-1', text: '...', category: 'behavioral' }],
  answers: { 'foundations-behavioral-1': 'My answer...' },
  index: 0,
  status: 'active'
}
```

The real session contains five questions. Answers use question IDs as keys so
navigation reads and updates the correct answer instead of relying on a changing
visible position alone.

### Step 3: use context and a reducer

`InterviewProvider` shares the current session across setup, room and feedback.
Context makes this shared value available without passing it through every
intermediate component.

`interviewReducer` in `session.js` defines state transitions:

| Action | Effect |
| --- | --- |
| `start` | Creates the browser session and sets index to zero |
| `answer` | Replaces the answer for a valid question in an active session |
| `move` | Changes the current index within the question bounds |
| `complete` | Updates the completed session; currently requires server confirmation |
| `discard` | Clears the browser session |

The reducer returns new objects using object spread instead of changing the old
state directly. This makes the updates explicit and lets React render the new
state. Phase 2 completion was local; the current reducer reflects Phase 3's
server-confirmed completion behavior.

### Step 4: make the answer field controlled

The textarea value comes from `session.answers[question.id]`. Each `onChange`
dispatches an answer action. The sequence is:

```text
Type a character → onChange → dispatch → reducer updates answers → React renders
```

Moving to another question changes the index, not the existing answer entries.
Returning to a question reads its stored answer again. This is why Previous/Next
navigation preserves edits.

### Step 5: validate and derive progress

`validateAnswer` rejects whitespace-only text and values longer than 3,000
JavaScript string units. Some Unicode characters occupy more than one unit, so
this is not a count of human-perceived characters in every language.

`answeredCount` calculates progress by counting valid answers for the selected
questions. A separate stored progress counter could drift out of sync; deriving
it from answers keeps one source of truth.

Before completion, the UI checks all five answers and returns to an invalid one
if necessary. Validation errors explain what the user needs to fix.

### Step 6: warn before abandoning work

`AbandonGuard.jsx` uses React Router's `useBlocker` for in-app navigation and a
native dialog offering “Keep practicing” or “Discard and leave.” A
`beforeunload` handler requests a warning on refresh/close. The browser decides
whether that native warning appears; the application cannot guarantee it.

Warnings help prevent accidental loss. They are not persistence. Refreshing still
destroys this version's browser session if the user proceeds.

### Step 7: separate actual answers from example feedback

Completion shows the user's answer review. The report underneath is a fictional
sample about a different answer. Its scores are not calculated from the user's
submission. History is also fictional at this stage.

The final Phase 2 suite passed 15 tests in the user's recorded local run. Browser
checks covered completion, answer preservation, validation and navigation guards.
Tests were reorganized in Phase 3, so today's frontend-only count is different.

**Result:** a complete five-question journey that originally required no backend.

**Explain it yourself:** “I represented an interview as shared state, keyed answers
by question ID and used a reducer to control navigation and completion.”

## 5. Phase 3: connect React to Express

**Problem:** browser-only state cannot provide a trusted API or durable shared
application behavior. This phase established the backend boundary, while keeping
storage temporary so database work could remain a separate phase.

### Step 1: start a separate backend process

`server/src/index.js` reads configuration, creates the Express app and starts it
on `127.0.0.1:3001` by default. The frontend runs on port 5173, or 4173 for preview.
These are separate programs even though both run on the same computer.

`app.js` configures request handling without immediately listening on a port.
Separating app creation from startup lets tests create isolated app instances.

### Step 2: separate routes, controllers and services

```text
HTTP request → middleware → route → controller → service → JSON response
```

- A **route** associates a method/path with a handler.
- A **controller** reads and validates request inputs, calls the service and
  chooses the response status/shape.
- A **service** implements interview rules and manages the temporary records.
- **Middleware** handles shared concerns such as CORS, JSON parsing and errors.

For example, `POST /api/v1/interviews` reaches the create controller. It parses
the body with `startSchema`, calls `service.create`, and returns 201 for a new
record or 200 for a replay of an existing request.

This division lets you find a bug by responsibility: wrong URL mapping belongs in
routes; invalid body handling in validation/controllers; incorrect completion
rules in the service.

### Step 3: expose versioned endpoints

The `/api/v1` prefix identifies the current API contract. It provides room for
future versions; it does not itself implement version migration.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/health` | Confirms the API responds and reports temporary storage |
| `POST /api/v1/interviews` | Creates an interview and returns five selected questions |
| `GET /api/v1/interviews/:id` | Returns one existing session |
| `PUT /api/v1/interviews/:id/answers` | Replaces the answer snapshot with 1–5 valid answers |
| `POST /api/v1/interviews/:id/complete` | Validates all five answers and completes the session |

The UI currently uses creation and completion. The read and partial-answer
endpoints are implemented and tested, but there is no browser autosave or resume
flow yet. In particular, clicking Next does not call the PUT endpoint.

Success responses wrap the result in `{ "data": ... }`. Errors use
`{ "error": { "code": "...", "message": "..." } }`, with optional field details.
See [API.md](API.md) for the full contract.

### Step 4: validate inputs on the server

Zod schemas require an allowed role/type/difficulty, a UUID request ID, valid
answer objects and bounded strings. Unknown fields are rejected by strict schemas.
Express parses JSON and limits the body to 128 KiB. A valid-length Unicode answer
can use more bytes than ASCII text, so the body limit must accommodate that.

The service then checks rules that require session knowledge: every question ID
must belong to this interview, each question appears once, and completion requires
all five answers. Shape validation and business-rule validation serve different
purposes.

Frontend validation gives quick guidance, but callers can bypass the frontend.
Backend validation enforces what the API actually accepts.

### Step 5: keep temporary records in a Map

The service stores sessions in a JavaScript `Map`, keyed by interview ID, and a
second map connects creation request IDs to existing sessions. A session contains
its exact selected questions, answers, status and timestamps.

There is a maximum of 500 sessions. Records expire one hour after creation;
expired records and their request keys are removed when a service operation next
runs. This is cleanup on access, not a scheduled background deletion job.

All records disappear when the process restarts. Development watch mode can
restart the process when backend source changes. The Map is not a database and
does not share state with another server process.

### Step 6: make retries safe

A browser can lose the response even when the server completed the request. If
retrying always creates another interview, a temporary network issue creates
duplicate records.

The frontend generates a UUID creation key and retains it across retries for the
same preferences. The backend returns the existing session for that key. Reusing
the key with different preferences returns a 409 conflict.

Completion validates everything before synchronously writing the answers, status
and completion time. Submitting the same answers again returns the completed
record; sending changed answers after completion returns a conflict. Answer order
does not affect equality because comparison uses question IDs.

This is called **idempotency**: repeating the same operation does not add a new
effect. Here the guarantee lasts only while the in-memory record exists. It is
not a durable distributed transaction or a guarantee across server restarts.

### Step 7: connect the frontend with fetch

`client/src/interview/api.js` builds API URLs, serializes JSON, calls `fetch` and
extracts the response data. It checks unsuccessful HTTP responses explicitly:
`fetch` does not automatically reject merely because the server returned 400.

An `AbortController` stops waiting after ten seconds. Aborting the client request
does not guarantee the server never processed it, which is another reason retries
must be safe. No cookies are sent by the current client.

`InterviewProvider` coordinates the asynchronous work:

- `busy` controls loading/disabled states.
- A ref-based lock prevents overlapping submissions from repeated clicks.
- `requestError` makes failures visible without clearing answers.
- A generation marker prevents a discarded session from being restored by a late
  response.
- A successful start dispatches the backend session into browser state.
- A successful completion dispatches the confirmed completed session.

While typing and navigating, answers still live in React memory. Only completion
sends all five through the current UI. There is no automatic retry loop: users
explicitly choose Retry after an error.

### Step 8: restrict this unauthenticated version to local use

The server binds to loopback and refuses `NODE_ENV=production`. Its CORS allowlist
contains localhost and 127.0.0.1 at the two supported frontend ports. Configuration
can narrow that list. Public wildcard origins are not accepted.

An origin is the combination of scheme, host and port, so port 5173 and port 3001
are different origins. CORS tells browsers which frontend origins may read API
responses. It is not a login system: local non-browser callers can still send
requests, and knowing an interview ID is not proof of ownership.

Response headers disable caching and content-type sniffing. Unexpected errors
return a generic message rather than exposing stack traces. The implementation
does not intentionally log private answer bodies.

### Step 9: verify behavior at different levels

The final recorded Phase 3 checks were:

| Check | Result and meaning |
| --- | --- |
| Frontend tests | 10 passed across three files; cover reducer, request and journey behavior |
| Backend tests | 16 passed; cover API validation, CORS, duplicates, state, expiry, capacity and questions |
| Lint | Passed for both workspaces |
| Production frontend build | Passed |
| Real browser journey | Loaded backend questions and completed five answers through Express |
| Real outage/restart checks | Helpful errors appeared and browser drafts remained available |

Frontend journey tests mock API calls so they can control failures reliably.
Those tests alone do not prove a live connection; the browser smoke check provided
separate evidence. Supertest exercises the Express app through HTTP. The browser
checks are not yet a committed automated end-to-end suite.

One sandboxed test run failed due to temporary-worker access and blocked local
sockets. An approved run outside that sandbox passed all 26 tests. This distinction
is recorded in `PROGRESS.md` so an environment failure is not confused with a
failing product assertion.

**Result:** a real local client/server application, with temporary storage and
clear error/retry behavior. No database, accounts or AI provider is connected yet.

**Explain it yourself:** “I moved question selection and completion rules to an
Express API, validated requests, and made retries safe while retaining drafts on
failure.”

## 6. Trace one complete interview

Read these steps with the named files open:

1. **Visit Setup:** `App.jsx` renders `Setup.jsx` through the shared layout.
2. **Choose preferences:** controlled select inputs update Setup's local state.
3. **Click Start:** Setup awaits `startInterview(preferences)` from the provider.
4. **Prepare a request:** the provider retains a creation UUID; `api.js` sends
   `{ requestId, preferences }` to the backend.
5. **Receive it:** Express applies middleware and selects the create route.
6. **Validate:** the controller parses the body with the Zod start schema.
7. **Create or reuse:** the service checks the request key, selects questions,
   stores a session snapshot and returns it.
8. **Render the room:** the frontend stores the returned session and navigates to
   `/interview`; the current index starts at zero.
9. **Type answers:** textarea changes update answers by question ID in React.
   Previous/Next changes only the visible index. No autosave request occurs.
10. **Click Complete:** the UI validates all five, then sends an answer array to
    `/interviews/:id/complete` and displays the submitting state.
11. **Confirm on the server:** the service checks membership, duplicates,
    completeness and existing status before saving the final result.
12. **Show review:** the successful response updates the reducer to completed;
    the room redirects to `/feedback`. Actual answers and fictional coaching are
    displayed separately.

If step 10 fails, the browser keeps its answers and displays an error. A network
retry may recover. If the backend record disappeared after a restart or expiry,
repeated completion cannot recreate it; a new session is needed. Preserve any
answer text you need before discarding that browser draft.

### Where data lives now

| Data | Location | Survives browser refresh? | Survives server restart? |
| --- | --- | --- | --- |
| Theme choice | Browser localStorage | Usually yes, if storage is available | Yes |
| In-progress UI answers/session ID | React memory | No | Remains in the open tab, but server session may be gone |
| Created session and submitted answers | Server Map | Server record remains, but UI does not reconnect to it | No |
| Question bank | Source file | Yes | Yes |
| Fictional report/history | Source file | Yes | Yes |

Discarding a browser draft does not delete a previously submitted server record.
There is no server deletion endpoint in Phase 3. Temporary records disappear on
expiry cleanup or process restart.

## 7. Run, edit and check the project

Install from the repository root with `npm ci`, then use two terminals:

```powershell
# Terminal 1: Express
npm run dev:server
```

```powershell
# Terminal 2: React/Vite
npm run dev
```

Open http://127.0.0.1:5173. Health is available at
http://127.0.0.1:3001/api/v1/health. Use `npm.cmd` if PowerShell blocks `npm.ps1`.

| Command | What it tells you |
| --- | --- |
| `npm run dev` | Lets you manually interact with the frontend and see edits |
| `npm run dev:server` | Runs the API and restarts it on watched changes |
| `npm test` | Checks automated expectations in both workspaces |
| `npm run lint` | Checks source for supported static problems |
| `npm run build` | Produces bundled frontend assets |
| `npm run preview` | Serves the existing build on port 4173; API still required |

**Why test if dev already works?** Development preview lets you inspect whichever
path you happen to try. Tests repeat specific checks, such as preserving an edited
answer or rejecting changed completed answers. Running tests does not apply your
edits; saving changes does that. You do not need a full test run for every wording
edit, but logic/API changes should be checked with the relevant tests.

Preview serves built files, so saving frontend source alone does not update it:
rebuild and reload. The development server normally updates frontend edits without
that manual build.

### Where to make common changes

| Desired change | Start reading here |
| --- | --- |
| Question wording | `server/src/data/questions.js` |
| Setup choices | `client/src/pages/Setup.jsx` and backend preference validation/bank |
| Answer limits | `client/src/interview/session.js` and `server/src/validation.js` |
| Next/Previous behavior | `client/src/pages/Interview.jsx` and the session reducer |
| Request timeout/errors | `client/src/interview/api.js` |
| Completion rules | `server/src/services/interviews.js` |
| Color palette | `client/src/index.css` |
| Layout/hover effects | `client/src/App.css` |
| Route/navigation | `client/src/App.jsx` and `components/Layout.jsx` |
| Fictional report text | `client/src/data/sampleInterview.js` |

Adding a new role is more than adding an option: the frontend, allowed backend
values and question selection all need to agree. Similarly, changing a limit in
only the browser cannot change the server's limit.

## 8. What future phases will add

**Everything in this section is planned. These are intentions and acceptance
goals, not completed features or exact instructions for integrations already set up.**

### Phase 4 — persistent data with PostgreSQL and Prisma

Replace the temporary Map with database records. Model interviews, questions,
answers and feedback with relationships and constraints. Prisma migrations will
record schema changes; seed data will support development. Transactions will keep
related writes together when partial success would produce inconsistent records.

Add actual history, unfinished-session resume and deletion. Verify data survives
restarts and a clean database can be created from migrations. Keep provisional
local identity isolated until real authentication is introduced.

### Phase 5 — authentication and private records

Add Clerk sign-in to React and verify tokens on Express. Associate records with
the verified user, not a user ID supplied as trusted input by the browser.

Authentication answers “Who is calling?” Authorization answers “May this caller
access this record?” Both are required. Test that one user cannot read, change or
delete another user's interviews, and handle missing or expired sessions.

### Phase 6 — actual AI feedback

Add a replaceable backend provider interface and Gemini's official SDK. Keep
credentials on the server. Send answers for assessment using a documented rubric
and validate returned structured data before presenting it.

Include answer evidence, strengths, missing points and practical suggestions.
Keep explicit mock/live modes, timeouts, bounded retries, quotas and duplicate
generation protection. Evaluate weak, strong, irrelevant and manipulative inputs.
Verify live behavior separately from mocked tests; scores remain coaching guidance.

### Phase 7 — personalization and adaptive questions

Accept bounded job descriptions and private PDF/DOCX resumes. Validate real file
types and sizes, limit parsing work, and let users inspect/correct extracted text.
Use private storage, ownership checks and expiring access links.

Generate relevant questions and a bounded number of follow-ups while keeping the
fixed bank as a fallback. Store the exact questions asked, support deletion and
explain retention. File handling is a new subsystem, not just an upload button.

### Phase 8 — optional voice input

Add turn-based recording with explicit permission, visible recording/stop states,
limits and a server transcription service. Let users edit the transcript before
submission and retain the text-only path. Optional playback may read questions.

Handle denied permissions and unsupported browsers. Explain recording retention
and distinguish transcription accuracy from interview scoring. Continuous voice
and personality/employability judgments from vocal characteristics are excluded.

### Phase 9 — consolidated security and reliability

Review the safeguards introduced throughout earlier phases: authorization,
validation, quotas, secrets, safe rendering, file privacy, request limits and
duplicate handling. Add structured request tracking, readiness/monitoring and CI
checks through GitHub Actions.

Verify the complete account → interview → answers → feedback → history → deletion
journey, including cross-user and provider-failure cases. Security work does not
wait until this phase; this phase consolidates and verifies it.

### Phase 10 — deployment preparation and authorized publication

Prepare Vercel frontend hosting and Render backend/PostgreSQL configuration.
Configure actual production origins, environment variables, HTTPS, migrations,
backups and rollback procedures. Check current official service requirements then.

Publication requires explicit authorization and available account access. Verify
the real deployed URLs and full journey before claiming deployment. Creating
configuration files alone does not mean the app is live.

### Phase 11 — portfolio presentation

Polish documentation with actual screenshots, architecture, API examples and
engineering decisions. Prepare talking points and resume bullets supported by
implemented work. Document remaining limits and optional ideas without inventing
usage numbers, accuracy or performance improvements.

## 9. Practice explaining the project

### A truthful current project description

> I am building an interview practice application in phases using React, Vite,
> React Router and Express. It currently supports a five-question interview with
> backend-selected fixed questions, browser draft state and server-confirmed
> completion. I use Zod for backend validation and make retries safe with request
> IDs and immutable completed answers. Storage is currently in memory; database
> persistence, authentication and real AI feedback are the next stages. I use
> AI-assisted development and verify changes through tests and browser checks.

### Questions you should be able to answer

1. Why does the application need two running processes now?
2. Which file handles a button click, and which file enforces completion rules?
3. Why are answers stored by question ID?
4. How can the theme survive refresh while an interview draft disappears?
5. What is the difference between a route, controller and service?
6. Why does validation happen on both the frontend and backend?
7. What happens if the server saves a submission but the response is lost?
8. Why does CORS not replace authentication?
9. Why is having a save-answers endpoint different from implementing autosave?
10. Which displayed information is actual user data and which is fictional?

### A practical learning sequence

1. Read `main.jsx`, `App.jsx` and `Layout.jsx`; trace how Setup appears.
2. Read Setup, the provider and `api.js`; inspect the start request in DevTools.
3. Follow that request through backend routes, controller, validation and service.
4. Read the reducer and Interview page; trace one keystroke and one Next click.
5. Finish an interview and trace the completion response into the Feedback page.
6. Change one question's wording, start a new interview and explain why an existing
   session does not simply re-read the bank on every render.
7. Read a test before running it; predict the result and explain its assertion.

Use [PROGRESS.md](PROGRESS.md) for actual verification records,
[API.md](API.md) for endpoint details, and [ROADMAP.md](ROADMAP.md) for remaining
acceptance criteria. Update this guide after each future phase so its “completed”
claims continue to match the code.



## Phase 3.1 — scope configuration and fixed-bank planning

This is the current implementation, superseding frontend-only/five-question
assumptions in the historical Phase 0–3 chapters below. The original brief is
preserved in the historical appendix of PROJECT_BRIEF.md; PROJECT_BRIEF.md now contains the expanded
software-developer scope. No database, login or AI integration was added here.

### 1. One shared catalog

shared/interviewOptions.js defines four role labels, internship/junior levels,
subjects, languages, technologies, defaults and the technical-slot calculation.
Both React and Express import it so they agree on option keys. Sharing a catalog
does not replace backend validation: the server still parses every incoming request.
The shared folder is an ES module package without additional dependencies.

### 2. Configuration validation and normalization

The old role/type/difficulty request still works. New fields have explicit defaults:
internship, balanced coverage, no subjects, neutral language, no technologies and
five questions. New requests can choose 3–10 questions. Zod rejects unsupported
options, duplicate selections, invalid counts and impossible coverage plans.

A Technical interview has questionCount technical slots. Mixed has
ceil(questionCount / 2) technical slots. Five chosen technical subjects therefore
need at least five Technical questions or nine Mixed questions. Behavioral mode
requires no technical subjects. The UI explains the limitation and disables Start
until it is resolved; the server independently enforces it.

Normalization sorts subject and technology arrays and clears irrelevant subjects.
This makes retries equivalent when the same choices arrive in a different order.
It also makes persisted configuration easier to interpret when Phase 4 arrives.

### 3. Bank metadata and stable identity

server/src/data/questions.js now contains 104 explicit-ID prompts: ten for each
of nine technical subjects plus behavioral, with four specialist prompts. Each
question declares track applicability, subject, technical/behavioral category,
experience levels, difficulties, languages and technologies. IDs such as cn-dns
are editorial keys; moving a row no longer changes its ID. Avoid reusing an ID for
an unrelated question. Sessions copy question snapshots rather than reading the
mutable bank during every answer submission.

All base prompts stay within internship/junior scope. Experience and difficulty
select a bounded explanation instruction (basic example, edge case, or small-feature
tradeoff/testing). Challenging internship depth does not assume senior or leadership
experience. This is template-based adaptation, not AI-generated text.

### 4. Selection on the backend

The selector filters by role, experience/difficulty support and language/technology
applicability. It prioritizes matching specialist prompts within a selected subject,
then uses neutral concept questions. Current specialist coverage is React, Python,
Java and PostgreSQL; other configured technologies can use neutral concept coverage.
Selecting a technology does not override an explicit subject selection.

Round-robin selection takes one question per subject before taking another from a
subject. Explicit subject selection guarantees coverage because validation reserves
enough slots. Balanced mode starts with track fundamentals and rotates through its
available subjects; fewer slots means only the leading subjects appear. This is
explained in the form. Selection is deterministic and contains no duplicate IDs.

General tracks never receive frontend-specific prompts as fallback. Core CS
subjects are available across tracks; full-stack also includes frontend/backend
and end-to-end design. Behavioral questions discuss projects, teamwork and tradeoffs.

### 5. Frontend changes and completion

Setup.jsx uses accessible select controls and checkbox groups. Changing role clears
subjects to avoid carrying incompatible choices. Behavioral mode hides technical
subject requirements. SessionSummary.jsx displays role, experience, type, difficulty,
count, topics, language, technologies and the fixed-bank disclosure in the room and
review. Progress and completion use session.questions.length throughout.

The backend accepts up to ten answers but completion still checks the exact session
question set. The body limit increased to 256 KiB so ten valid 3,000-unit answers
can fit even with JSON escaping. Per-answer limits did not increase. The example
feedback remains explicitly fictional and frontend-specific, separate from the
actual selected-track answer review. No code snippets are executed.

### 6. Verification and learning

The passing suite checks all four tracks, levels, difficulties, types and counts;
single-subject ten-question coverage for every offered language; selected core
subject coverage; specialist matching; legacy defaults; configuration errors; and
completed sessions for every track/type. Frontend tests cover the form, warnings,
three-question completion and the existing journey. See PROGRESS.md for final counts.
A real browser completed a junior backend/CN interview through Express; setup was
inspected at mobile width as well.

Practice: choose Mixed with three questions and select CN, OOP and OS. Explain why
only two technical slots are available. Increase the count to five, then start and
confirm all three selected subjects appear among the technical questions.

Next: Phase 4 must persist the expanded configuration and exact ordered question
metadata. Phase 6 must generate question plans, bounded follow-ups and subject-level
answer analysis. Phase 7 adds JD/resume context to that existing generation flow.


## Phase 4 — PostgreSQL persistence

### What changed and why

Phase 3.1 stored interviews in a JavaScript Map. That is part of a running process:
when Node stops, the Map disappears. Phase 4 moves authoritative records into
PostgreSQL. React remains responsible for editing and display; Express remains
responsible for validation and session rules. Prisma translates the service's
database operations into PostgreSQL queries.

The database is a third local process. The optional embedded-postgres development
helper starts an actual PostgreSQL server without a cloud account or a system-wide
installer. Its files live in server/.data/postgres and are ignored by Git. This is
not an in-memory database or a mock. Use the root README's three-terminal setup.

### Step 1: describe the data

server/prisma/schema.prisma defines four models:

| Model | Stored information | Why it exists |
| --- | --- | --- |
| Interview | Configuration JSON, owner, creation request ID, status, revision and timestamps | The parent record for one practice session |
| Question | Interview ID, stable editorial ID, exact text, position, subject and metadata | Keeps the selected question plan unchanged |
| Answer | Interview ID, question ID, answer text and last-update timestamp | Associates typed text with the correct stored question |
| FeedbackReport | Interview ID, source, structured content, optional model/rubric versions and timestamp | Prepares durable report storage without introducing AI yet |

A question's database identity is the pair (interviewId, id). Two interviews may
reuse a bank question ID, but their saved question rows are independent. Answer
references the same pair with a foreign key. Even a direct database insert cannot
attach an answer to a question that does not exist within that interview.

Question position is unique per interview and is used when reading the snapshot.
We store exact text because changing an editorial prompt tomorrow must not change
what yesterday's answer was responding to. Metadata and configuration are JSON
because the existing shared option catalog already defines and validates their
shape; primary keys, ordering, relationships and status remain relational.

### Step 2: make the schema reproducible

The migration folder contains the SQL that creates these tables, indexes, enum and
foreign keys. prisma migrate deploy applies unapplied migrations and records their
history. A new database can be built from the same files. prisma generate produces
the JavaScript database client from the schema; it does not itself create tables.

We use Prisma 7.10 with the PostgreSQL adapter and the existing JavaScript project.
The prisma-client-js generator avoids introducing a TypeScript build step; Prisma
documents that this older generator will be removed in a future major version.
Revisit that choice during future major-version upgrades. prisma.config.js loads
the database URL from the server environment and defines migration/seed locations.

The development seed creates one unfinished general technical interview and one
clearly labeled example answer. Repeating it preserves existing edits. It does not
create fake personal scores or populate actual interviews with fictional feedback.

### Step 3: replace the service, preserve the frontend contract

server/src/index.js constructs the database client, checks connectivity, creates
the persistent service and passes it into createApp. Normal startup requires
DATABASE_URL and never falls back to memory. The old Map implementation remains
only as the fast fixture used by the existing API regression tests.

Controllers became async because database I/O finishes later. They await the result
before building the JSON response. Express 5 passes rejected async operations into
the existing error middleware. The request format still uses preferences and stable
question IDs; saved snapshots now include revision and updatedAt instead of expiry.

### Step 4: make multi-step writes safe

Saving answers requires removing the previous snapshot, inserting replacements and
incrementing the interview revision. Completion additionally changes status and
records completedAt. All these steps run inside one transaction: PostgreSQL commits
them together or rolls them all back.

Transactions use Serializable isolation. Conflicting operations may need to retry;
the service makes at most three attempts. Creation additionally uses a unique
(ownerId, requestId) key, so simultaneous retries create only one interview.

Revision is an integer version counter. Suppose tabs A and B both read revision 0.
A saves and receives revision 1. B tries to save different answers using revision 0.
The server returns STALE_INTERVIEW instead of overwriting A. The UI keeps B's draft
so the user can copy anything useful before reopening the latest record.

Identical retries are special: a lost response must not force the user to guess
whether completion happened. Repeating the exact saved/completed answer set returns
the same persisted result. Different changes after completion are rejected.
There is no endpoint that turns completed interviews back into active interviews.

### Step 5: let the user save and recover

The React reducer now keeps savedAnswers beside the editable answers object.
Typing updates answers only. Save progress sends all nonblank answers plus the
current revision. On success, savedAnswers and revision update. A failed save leaves
the draft intact. Removing an answer and saving removes that stored answer.

This is explicit saving, not autosave. Previous/next navigation still preserves
drafts within the tab. Completion saves all answers in one request. The room shows
whether changes remain unsaved and warns before leaving only when necessary.

After a refresh, the in-memory React session is gone but PostgreSQL still holds
saved records. Open History and choose Resume interview. The provider GETs the
stored snapshot and opens the first unanswered question; earlier saved answers
remain editable. Completed interviews instead open the existing answer review.

### Step 6: use real history and deletion

History requests the newest 20 records with real timestamps, status and saved-answer
counts. It has loading/error/retry/empty states and Previous/Next page buttons.
There are no fictional history entries. The optional seed is clearly labeled in
its answer and is a real development record.

Delete first shows a confirmation. The API deletes the interview; foreign-key
cascades remove questions, answers and any feedback. The current React session is
cleared if it refers to that interview. Deletion does not create a backup or an
undo record; cancellation is available before confirmation.

### Step 7: keep development identity honest

The owner is assigned in server code, not accepted from request JSON. Service reads,
writes, lists and deletes are scoped to that owner. The app rejects production and
remote database hosts while this provisional identity is active. All users of this
local server still share that identity: it is not authentication. Phase 5 will
replace it with verified Clerk identities and authenticated ownership tests.

### Step 8: verify behavior at the correct layer

npm test runs 14 frontend and 32 server fixture checks. The new frontend tests
exercise save/resume, failed-save draft retention, history retry and delete
confirmation. These mock the network and do not prove database durability.

npm run test:db creates a uniquely named temporary PostgreSQL database, applies the
committed migration, and runs six live integration tests. They cover concurrent
creation, exact snapshots, stale revisions, atomic completion, duplicate retries,
unrelated-question foreign keys, conflicting saves, owner scoping, history,
cascaded deletion, and actual API child-process restart survival. The temporary
database is then dropped; development records are not reset.

The client production build and lint pass. No new browser screenshot or live visual
inspection is claimed for this phase. The existing UI layouts remain, and automated
component journeys verify interaction behavior.

### Learning checkpoint

Explain the difference between browser memory, server memory and database storage.
Then trace Save progress from Interview.jsx through api.js, the async controller,
persistentInterviews.js and the Prisma transaction. Explain why a database foreign
key and an application validation check are both useful.

Practice: create an interview, save one answer, restart Express and resume from
History. Explain which process lost memory and why your saved text remained.

Remaining limits: unsaved edits can be lost, refresh recovery is through History,
there is no autosave or cross-tab merge, and browser close warnings remain
browser-controlled. Authentication is Phase 5; real AI reports are Phase 6.
Dependency/tooling advisories and the PostgreSQL driver warning are recorded in
PROGRESS.md. Do not publish this local development identity.
