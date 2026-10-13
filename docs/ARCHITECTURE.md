# Architecture — Phase 6

## Current data flow

React → Clerk session token → Express Clerk verification → database User mapping
→ Zod controller → owner-scoped persistent interview
service → Prisma → PostgreSQL → JSON snapshot → React reducer.

Three local processes run: Vite (5173), Express (3001), PostgreSQL (55432 with the
optional local helper). Production mode and remote database hosts are rejected
until deployment is configured. Clerk keys and a Clerk application are required;
there is no runtime development identity. Mock AI needs no key; live mode requires server-only Gemini configuration.

## Responsibilities

- shared/interviewOptions.js defines valid tracks, levels, subjects and preferences.
- server/src/data/questions.js selects 3–10 fixed questions with stable editorial IDs.
- server/prisma/schema.prisma defines User, Interview, Question, Answer, FeedbackReport and AiOperation.
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
Phase 6 persists mock/live reports with model and rubric versions. Mock reports
are labeled demonstrations; they are never presented as real assessments.

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

Saved answers remain in local PostgreSQL. In live mode, explicitly requested
follow-ups/reports send relevant content to Gemini. Saved data persists until deleted; there is
no one-hour expiry. Unsaved edits can still be lost on refresh/close. Browser-native
close warnings cannot be guaranteed. No autosave, cross-tab merge or automatic
current-session restoration is claimed.

## UI and future work

Existing responsive CSS, light/dark theme, reduced motion, keyboard focus and shared
controls remain. Application code stores only theme preference in localStorage; Clerk manages its own authentication session.
Phase 6 implements dynamic AI plans, bounded follow-ups and analysis; live
verification passed at provider/service/database layers on 2026-10-13. Phase 7 resume/JD context has not started.

## AI request path

Authenticated owner → persistent interview service → AiOperation claim/UTC quota
under a PostgreSQL advisory transaction lock → mock or official Gemini provider →
Zod and semantic validation → cached validated output → transaction persists the
exact question/report → response to React. Provider calls run outside database
transactions. No model has tools or database credentials.

Plan slots come from existing track/subject coverage rules; live prompts receive
slot subject/category, not fixed-bank question text. Returned count, slot identity
and normalized duplicate text are checked. AI question IDs are server UUIDs.
Follow-ups target one saved base answer, at most one per base and two total, and
append to the question list. Revisions prevent late AI results changing completed
or concurrently edited interviews. Completed answers are immutable.

Reports cover each question once, enforce the category's rubric dimensions and
0–5 integers, and require evidence that is an exact substring of the saved answer.
The server computes per-subject averages and collects improvement suggestions.
These checks validate structure/grounding, not factual correctness or fairness.

The ledger stores ownership, stable operation key, input hash, status, configured
model/rubric, attempts and token counts. Cached generated content is private data,
not telemetry. Deletion clears cached content while retaining quota/idempotency
metadata; a conditional completion write cannot resurrect deleted cache content.
Uncertain calls are never automatically replayed, including after a crash. This
limits duplicate charges but cannot guarantee a provider did not charge a timed-out
call. Only explicit 429 rejection gets one bounded retry; SDK retries are disabled.

The provider grammar retains minimum array lengths but omits maximum array/string
length constraints for Gemini compatibility. Strict local contracts enforce every
bound before persistence. Flash-Lite 3.1 uses minimal thinking; other configured
models retain their default thinking settings and require separate verification.
