# Architecture — Phase 5

## Current data flow

React → Clerk session token → Express Clerk verification → database User mapping
→ Zod controller → owner-scoped persistent interview
service → Prisma → PostgreSQL → JSON snapshot → React reducer.

Three local processes run: Vite (5173), Express (3001), PostgreSQL (55432 with the
optional local helper). Production mode and remote database hosts are rejected
until deployment is configured. Clerk keys and a Clerk application are required;
there is no runtime development identity. No AI key is needed.

## Responsibilities

- shared/interviewOptions.js defines valid tracks, levels, subjects and preferences.
- server/src/data/questions.js selects 3–10 fixed questions with stable editorial IDs.
- server/prisma/schema.prisma defines User, Interview, Question, Answer and FeedbackReport.
- server/prisma/migrations/ contains reproducible SQL; seed.js adds one explicitly
  labeled development answer in an unfinished interview.
- server/src/database.js creates the Prisma PostgreSQL adapter and enforces local use.
- server/src/services/persistentInterviews.js handles history, snapshots, transactions,
  revisions, completion and deletion. The old Map service is a unit-test fixture only;
  normal startup always injects PostgreSQL and never silently falls back to memory.
- Controllers await service operations; Express 5 forwards rejected promises to the
  existing error handler.
- InterviewProvider coordinates requests and keeps edited answers in browser memory.
  Save progress sends a full replacement snapshot. Completion saves every answer.
- History fetches real records in pages of 20 and uses GET to resume or review.
  Deletion requires an explicit inline confirmation.
- The reducer tracks savedAnswers separately from edits. Only unsaved edits trigger
  AbandonGuard. Refresh recovery is through History, not browser answer storage.

## Database invariants

Interview stores normalized JSON configuration, timestamps, status, revision and
an owner mapped from the verified Clerk subject. Each Question stores exact text, position,
subject and full applicability metadata. Editing the bank affects only new sessions.

Question has composite key (interviewId, id); Answer references that same pair.
This database foreign key prevents an answer from referencing an unrelated question.
Ordering is unique within each interview. Deleting an interview cascades to its
questions, answers and feedback.

Creation uses a unique (ownerId, requestId) constraint and a serializable transaction.
Save/completion validates the question set and uses serializable transactions with
up to three attempts for serialization or uniqueness races. A revision check rejects
stale differing writes. Exact retries return the persisted result. Completion is
active → completed only; different edits to completed answers return 409.

FeedbackReport is a durable schema slot with source/content/model/rubric fields.
There is no report generation yet; AI analysis begins in Phase 6. Fictional UI examples are not persisted
as assessments of a real interview.

## Identity and boundaries

Authentication uses @clerk/react and @clerk/express. Bearer-only interview routes
verify token signatures/lifetime and authorized frontend origins. Database User
records map unique Clerk identities to internal IDs; each request gets a service
scoped to that ID. Client-provided identity values never establish ownership.
Legacy local records remain preserved under users without a Clerk identity.
No runtime development identity exists. Production remains disabled pending Phase 10.

React protected routes wait for auth state, and the provider remounts private state
on account changes/sign-out. API token retrieval checks the identity before/after
awaiting the SDK; stale responses cannot populate another account. A 401 preserves
the current draft until identity changes; sign-out confirms unsaved-edit loss.
CORS is not authentication. No candidate code is executed.

Answers remain local to the machine. Saved data persists until deleted; there is
no one-hour expiry. Unsaved edits can still be lost on refresh/close. Browser-native
close warnings cannot be guaranteed. No autosave, cross-tab merge or automatic
current-session restoration is claimed.

## UI and future work

Existing responsive CSS, light/dark theme, reduced motion, keyboard focus and shared
controls remain. Application code stores only theme preference in localStorage; Clerk manages its own authentication session.
Phase 6 adds dynamic AI plans, bounded follow-ups and
analysis; Phase 7 adds private resume/JD context. No future phase was implemented.
