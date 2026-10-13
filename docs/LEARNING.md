# Learning notes

These sections describe successive historical milestones. Earlier “next phase”
prompts and limitations apply to that checkpoint; the current application is at
Phase 6 verified in mock mode and with live Gemini at backend layers. Use PROJECT_WALKTHROUGH.md for the current code explanation and
REQUIREMENTS_CHECKLIST.md for completion tracking. Update these learning notes
after each completed phase.

## Phase 0 checkpoint

1. **Browser and frontend:** the browser executes JavaScript; a React component is
   a function describing UI with JSX. React updates the page from that description.
2. **Development server versus build:** Vite serves source while you edit; build
   produces deployable static files. Preview lets you inspect those files locally.
3. **npm scripts and workspaces:** root scripts delegate commands to client so
   you can work from one directory. Dependencies provide reusable code and tools.
4. **Lockfiles and linting:** package-lock.json records exact resolved versions;
   npm ci installs them. Lint catches selected code problems without proving behavior.
5. **Trust and persistence:** the future backend enforces trusted operations,
   the database retains data across restarts, and the AI provider supplies coaching.
   A browser cannot safely hold provider secrets.

## Practice (no new features)

Run npm run dev. Change the eyebrow sentence in client/src/App.jsx, save, and
observe the browser update without a manual reload. Change it back and run
npm run lint. Explain why you did not need to restart a backend.

## Self-check

- Which file connects React to the HTML root?
- Why does a production build not prove that authentication works?
- Why would a Gemini API key be unsafe in a VITE_* variable?

Next checkpoint: components, props, React Router, and CSS organization in Phase 1.

## Visual feedback follow-up

- CSS transitions interpolate a property when hover or active state changes.
- Keyframes describe a short multi-step entrance animation.
- :active adds press feedback; :focus-visible keeps keyboard position clear.
- Native details/summary provides an expandable panel with keyboard support.
- prefers-reduced-motion respects the user's operating-system motion preference.

Practice: compare a 180ms button transition with 250ms. Keep the reduced-motion
override in place. CSS effects here simulate tactile feedback; they do not vibrate
a device or implement swipe gestures.

## Themes

Shared semantic CSS variables (such as --surface and --text) let components
inherit the chosen palette. React state updates the toggle; data-theme chooses
the CSS palette; localStorage remembers the preference on the same origin.
An early script applies the saved theme before React renders to prevent a flash.
The theme button uses aria-pressed to expose whether dark mode is enabled.

Practice: adjust --accent in the light palette and observe which elements inherit it.

## Phase 1 — Components, props, routing, CSS

1. **Components** are reusable functions that return UI. Layout owns the parts
   shared by every screen; each page owns its screen content.
2. **Props** pass data into a component. Card receives children;
   SelectField receives id, label, and options. One fix benefits every use.
3. **Routing** connects a URL to a component. BrowserRouter tracks the URL,
   Routes selects a Route, and Outlet places its page inside Layout.
   Link navigates; NavLink also indicates the current page.
4. **CSS organization** separates global theme tokens from component/layout
   styles. Grid defines columns; media queries change the layout at breakpoints.
5. **Accessibility** includes labels, semantic controls, visible focus, and
   managing focus after navigation. A styled link still navigates; a button
   performs an action. Do not swap their semantics just to reuse styling.

### Practice

In pages/Setup.jsx, use the existing Card component to add a short preparation
tip. Give it a heading and one sentence. Check it in both themes and at a narrow
width, then run npm run lint and npm run build. No new CSS should be necessary.

### Self-check

- Why is the header in Layout instead of being copied into five pages?
- What is the difference between Button and ButtonLink?
- Why does changing a setup select not change the sample interview yet?
- Which file would you change to adjust the background of cards in both themes?

Next: state, controlled inputs, handlers, derived progress, and a real local
five-question journey in Phase 2.

## Phase 2 concepts

- State is the session data React remembers while the page is open.
- A controlled input gets its value from state and updates it with an onChange handler.
- Event handlers turn user actions into reducer actions such as answer, move, complete.
- A reducer collects state transitions in one place and rejects invalid completion.
- Derived values, such as answeredCount, are calculated from answers instead of stored
  separately; this avoids counters getting out of sync.

Practice after verification: add a short guidance sentence for technical questions.
Keep it separate from question selection and confirm mixed interviews show the right
guidance for each question. Run npm test, npm run lint, and npm run build.

Phase 2 checkpoint complete: all 15 tests passed in the user-run suite; see PROGRESS.md for browser checks and limits.


## Phase 3 concepts

1. HTTP and REST: the browser sends requests to named resources. GET reads,
   POST creates/completes, and PUT replaces an answer snapshot in this API.
2. JSON and validation: both sides exchange structured text. Express parses it;
   Zod checks the shape, then the service checks interview-specific rules.
3. Status codes: 201 means created, 200 success, 400 invalid input, 404 missing,
   409 conflicting state, and 503 temporarily unavailable.
4. fetch and asynchronous state: the UI waits for a response and shows loading,
   failure or success. A failed request must not erase the user's draft. Retrying
   a request key prevents an uncertain response from creating a duplicate session.
5. CORS: different ports are different origins. An allowlist permits our local
   frontend to read API responses. CORS does not sign users in or protect ownership.

Practice: open browser DevTools → Network, start an interview, and find the POST
/api/v1/interviews request. Identify its preferences JSON, 201 response and five
returned questions. Explain why changing frontend validation alone cannot change
what the server accepts.

Checkpoint: Phase 3 has 10 passing frontend tests and 16 passing server tests.
The real browser completed a five-question interview with Express. Questions now
live in server/src/data/questions.js. Phase 4 will introduce database persistence.

## Phase 3.1 learning checkpoint

- Metadata describes when a question is applicable; it is different from its text.
- Stable editorial IDs keep identity independent of display order.
- Normalization gives semantically identical requests the same representation.
- Round-robin selection spreads a limited number of questions across subjects.
- Parameterized tests verify families of configurations, not just one happy path.

Practice: select Mixed, three questions, and CN/OOP/OS. Explain the coverage error,
then increase to five questions and inspect the selected subjects in the room.
Read PROJECT_WALKTHROUGH.md (Phase 3.1 chapter) for the implementation steps. Earlier checkpoints are
historical; the current completed milestone is 3.1.


## Phase 4 checkpoint

PostgreSQL persists data independently of Node. Prisma models become tables through
migrations; generated client code is separate from applying migrations. Composite
foreign keys preserve answer/question membership. Transactions commit multi-step
writes together. Revisions detect stale tabs; idempotency makes exact retries safe.

Practice: save one answer, restart Express, and resume from History. Trace the save
request and explain why unsaved edits still need a warning. See the Phase 4 chapter
in PROJECT_WALKTHROUGH.md for the full file-by-file explanation. Next: Phase 5.

## Phase 5 checkpoint

Authentication verifies identity; authorization checks ownership of a resource.
Clerk handles sign-in, including Google OAuth. Express verifies a session token
and maps its subject to a database User. Foreign keys and owner-scoped queries
serve different purposes: relational integrity and access control.

Practice with two accounts in separate browser profiles: save in A, verify B has
independent history, then explain why supplying A’s user ID cannot grant access.
Learn why VITE_* keys are public, why the Clerk secret stays server-side, and why
private React state must be cleared on account changes. Live operation was confirmed by the user on 2026-10-11; that report is separate
from the signed-fixture automated tests. See PROGRESS.md.

## Phase 6 checkpoint

Understand a provider interface, schema validation versus factual validation,
idempotency keys, persisted snapshots and database-backed quotas. Follow one request
from Clerk identity to AI claim to Gemini/mock provider to PostgreSQL and back to
React. Explain why a valid JSON response can still contain a wrong assessment.

Exercises: request a follow-up and observe the changed total; reopen its exact text
from History; generate a mock report and explain why its scores are not meaningful;
contrast an explicit 429 retry with an uncertain timeout. Use the evaluation probes
to question live model quality when configured, not to assume it. No live scoring
accuracy is claimed until those results are recorded in PROGRESS.md.

Live debugging checkpoint (2026-10-13): distinguish provider overload (503),
request-schema rejection (400), and local validation failure. A successful HTTP
response does not guarantee a valid report. Compact generation grammar and strict
local validation have different jobs; see PROGRESS.md for the live probe results.
