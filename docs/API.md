# Local API — current through Phase 9

Base URL: http://127.0.0.1:3001/api/v1. Clerk authentication is required for all
/interviews routes. Send Authorization: Bearer <Clerk session token>. Health, /ai-config and
preflight do not require sign-in. Cookies alone never authorize API calls.
Ownership comes from the verified Clerk subject mapped to a database User; never
send ownerId or userId in a request body/query. POST/PUT require JSON, max 256 KiB.
Success envelope: { "data": ... }. Error envelope: { "error": { "code", "message",
"details" } }; details is optional.

| Method/path | Request | Result |
| --- | --- | --- |
| GET /health | None | 200 after SELECT 1; storage postgresql, authentication clerk |
| POST /interviews | requestId UUID, preferences | 201 new; 200 matching retry |
| GET /interviews | skip 0–100000, take 1–50; defaults 0/20 | { items, hasMore } newest first |
| GET /interviews/:id | UUID | Exact saved snapshot |
| PUT /interviews/:id/answers | revision, answers (0–12) | Replace the full draft snapshot atomically |
| POST /interviews/:id/complete | revision, every answer | Atomically persist completed snapshot |
| DELETE /interviews/:id | UUID | 200 { id, deleted: true }; missing 404 |

Snapshot fields: id, preferences, status (active/completed), revision, createdAt,
updatedAt, completedAt, exact ordered questions, answers keyed by question ID,
generation (source/mode/model/baseCount/maxFollowups/reason),
feedback (null until a report exists; otherwise source/content/modelVersion/rubricVersion). There is no expiresAt.
History items include preferences/status/timestamps/questionCount/savedAnswerCount,
but omit answer text. Pagination uses offset and a limit; concurrent new records
can shift pages, so Refresh history returns the latest list.

Start example:

```json
{
  "requestId": "f649f330-49da-438b-83eb-78e365b7d170",
  "preferences": { "role": "backend", "type": "technical", "difficulty": "foundations" }
}
```

Save example (copy the current revision and a question ID from GET):

```json
{
  "revision": 0,
  "answers": [
    { "questionId": "COPY_FROM_SESSION", "text": "Your nonblank answer" }
  ]
}
```

Each answer is nonblank and at most 3000 JavaScript string units. Duplicate or
unrelated question IDs fail. An empty PUT array clears saved answers.
The frontend omits blank drafts when saving. PUT replaces rather than merges;
omitted answers are removed. Completion requires the exact full question set.

Include revision on writes. Differing changes from an older revision return 409
STALE_INTERVIEW; preserve/copy the current draft before reloading from history.
An identical save or completion retry returns the persisted result, even if the
first response was lost. Completed answers are immutable. Same-key creation is
protected by a durable owner/requestId unique key while the interview exists.
Deleting an interview also deletes its key; replay after deletion can create anew.

Errors: 401 AUTH_REQUIRED for missing/invalid/expired sessions; 400 validation/invalid JSON/duplicate or unrelated questions; 403 rejected
origin; 404 missing or other-user interview, or missing route; 409 stale revision, request-key reuse,
incomplete interview, immutable completion or exhausted write conflict; 413 body
too large; 415 JSON required; 500 unexpected/database failures. Database failures
never silently switch storage to memory. The UI retains unsaved answers on failures.

## Local access and retention

Allowed origins: http://127.0.0.1:5173, http://localhost:5173,
http://127.0.0.1:4173, http://localhost:4173. CORS_ORIGINS can narrow this list.
Preflight allows GET, POST, PUT, DELETE, OPTIONS with Content-Type and Authorization.
Requests without Origin still require an authorized-party Clerk token. No cookies
authorize this API. The Clerk frontend manages its own provider session.
CORS is not authentication. Records persist until explicitly deleted.

## Authentication details

The official Express SDK validates session tokens. azp must match a configured local
frontend origin. The verified subject is upserted as User.clerkUserId; its internal
ID scopes every interview operation and the nested feedback report. Wrong-owner
reads/writes/deletes return 404 without leaking whether the record exists.
A 401 leaves the current browser draft intact until sign-out/account change. Sign
out and sign in again when needed; copy unsaved edits before doing so.
Legacy Phase 4 records are retained separately and cannot be claimed through sign-in.
No Google password or OAuth provider access token is sent to this API.

## Preference contract (retained from Phase 3.1)

Existing role/type/difficulty fields remain required. Roles: general, frontend,
backend, fullstack. Types: technical, behavioral, mixed. Difficulty keys remain
foundations, intermediate, advanced; advanced displays as Challenging within the
selected experience level. Old frontend requests using these three fields receive:

```json
{
  "experience": "internship",
  "topicMode": "balanced",
  "subjects": [],
  "language": "neutral",
  "technologies": [],
  "questionCount": 5
}
```

experience: internship | junior. topicMode: balanced | selected. questionCount:
integer 3–10. languages: neutral, javascript, typescript, python, java, csharp, cpp,
go. technologies: up to five unique values from react, vue, angular, node, express,
django, spring, dotnet, postgres, mysql, mongodb. Unknown fields/values fail.

Subjects: programming, frontend, backend, fullstack, cn, oop, dsa, dbms, os.
General permits programming and all five core CS subjects. Frontend/backend add
only their own domain. Full-stack permits all nine. Explicit technical selection
requires at least one unique eligible subject and sufficient technical slots.
Mixed reserves ceil(questionCount / 2) technical slots and the remainder behavioral.
Balanced coverage rotates in track order, starting with role fundamentals; a short
interview may not cover all eligible subjects, as disclosed in setup.

Behavioral mode normalizes subjects to [] and topicMode to balanced. Balanced
normalizes subjects to []. Subject/technology arrays are sorted for stable retry
comparison. A retry with the same normalized configuration returns the same session;
changing configuration under the same key returns 409.

Question snapshots additionally contain subject, tracks, experienceLevels,
difficulties, languages, technologies, chosen experience/difficulty, source
(fixed-bank, mock or gemini), and a visible applicability description. Bank IDs are editorial
keys; AI question IDs are server UUIDs and no longer derived from array positions. Existing sessions keep their exact
question text/order; no request silently reselects their questions. Pre-Phase-4 memory sessions were not migrated; new PostgreSQL records are durable.

The answer array supports 0–12 entries for PUT. Completion requires exactly the
session's question set, not a hardcoded five. Request body limit is 256 KiB to
accommodate twelve maximum-length answers, including JSON escaping. Per-answer limit
remains 3,000 JavaScript string units. History and DELETE paths were added in Phase 4.

## Phase 6 endpoints

| Method/path | Request | Result |
| --- | --- | --- |
| GET /ai-config | None, public | { mode: mock/live/disabled, maxFollowups } without keys |
| POST /interviews/:id/followups | { questionId, revision } | Saved snapshot with one appended follow-up; repeats return existing snapshot |
| POST /interviews/:id/report | {} | Completed snapshot with persisted mock/live report; repeated success uses stored report |

New interview creation automatically requests a plan in the configured mode. On
AI_UNAVAILABLE or AI_QUOTA, it saves a fixed-bank-fallback generation source and
reason. AI_BUSY/AI_IN_PROGRESS instead ask the caller to retry later. No partial
question plan is returned. Existing pre-AI interviews retain their fixed questions
and answer review; start a new interview to use AI features.

Follow-ups require a saved nonblank base answer, matching revision, active status,
and matching session/server AI mode. They are appended; one per base question,
two total, at most 12 total questions. The UI saves drafts first. A follow-up failure
does not erase that save. All new routes enforce the same Clerk ownership rules.

Reports require completed answers. Each answer entry has questionId, scores
(dimension/value), strengths, missing, improvements, exact evidence quotes and an
optional example (empty string when absent). Report content adds subject scores,
improvement suggestions, summary and a coaching disclaimer. Source is mock/live.

AI errors: 409 AI_IN_PROGRESS, AI_INPUT_CHANGED, AI_MODE_CHANGED, FOLLOWUP_LIMIT,
DUPLICATE_QUESTION, STALE_INTERVIEW or INTERVIEW_ACTIVE; 429 AI_QUOTA/AI_BUSY;
503 AI_UNAVAILABLE. Errors contain no provider credentials, prompts or answers.
Timeout is 45 seconds on the server, 60 seconds for frontend AI requests (ordinary
requests stay at 10 seconds). Repeated failed/uncertain operations do not call the
provider again; start a new interview for a fresh attempt, subject to quotas.

## Phase 7 resume and personalization API

All /api/v1/resumes endpoints require Clerk bearer auth and owner checks.
POST /resumes?filename=resume.pdf accepts application/octet-stream, up to 2 MiB.
Returns {data:{id,filename,text,expiresAt}} after bounded parsing and storage.
GET /resumes lists the current owner's unexpired ready files (at most five).
POST /resumes/:id/link returns a relative path and expiry (60 seconds).
GET that path requires both its HMAC/expiry and the owner's bearer token; response
is an attachment with application/octet-stream. DELETE /resumes/:id revokes access
and erases the file/text; cleanup retries physical deletion on storage failure.
Expired or foreign files return 404. Invalid/oversized files return 400/413; parsing
failure 422; upload concurrency/file limit 429; unavailable storage 503.

Interview preferences optionally include personalization: jobDescription and
resumeText (each max 12,000 chars), requiredSkills/optionalSkills (each max 30 entries,
1–80 chars each). Context is copied into the interview and used only for plan
requests. Deleting a resume does not remove an existing interview copy. The caller
reviews and edits text; raw files and storage keys are never sent to Gemini.

Internal AI ledger diagnostics distinguish AI_PROVIDER_<HTTP status>, AI_TIMEOUT,
AI_INVALID_OUTPUT, AI_STORAGE_ERROR and AI_PROVIDER_ERROR. Public failures retain
AI_UNAVAILABLE; no provider messages or private text are returned in diagnostics.


## Phase 8 voice

`GET /ai-config` adds `voiceMode`: disabled, mock or live.
`POST /voice/:interviewId/:questionId/:requestId` requires Clerk Bearer authentication,
an owned active interview/question, UUID interview/request IDs and octet-stream WAV
bytes. Supported input is canonical 44-byte-header, 16 kHz, mono PCM16 WAV, 1–60 seconds,
maximum 1,920,044 bytes. Other layouts/formats are rejected, not transcoded.
Response data: `{ transcript: "editable text", mode: "live" }` (or mock). Max 3,000
characters; no answer is saved by this endpoint. Save through the existing answer API.

401 missing auth, 404 foreign/missing/inactive question, 400 invalid audio/IDs, 413
oversize, 415 content type, 429 capacity/quota, 503 provider failure/disabled voice.
409 AI_RESULT_NOT_RETAINED means an already-transcribed recording cannot be replayed;
use the local text or record again. Keep the same request ID for a transport retry.
No audio/transcript result is persisted in the AI ledger; usage metadata is retained.


### Gemini 503 recovery update (2026-10-22)

Explicit provider 429/503 responses now receive one delayed, jittered retry (maximum
two calls per invocation, under the 45-second deadline). Timeouts and uncertain
network failures do not automatically replay. For voice only, a failed 503 may be
retried with the same recording/request ID after five seconds, capped at four calls
in total. Input hash, model, owner and concurrency checks still apply; successful
transcripts are not retained or replayed. This supersedes earlier statements that
only 429 can be retried or every failed recording must be discarded. Provider errors
can still persist; no retry policy guarantees availability or provider billing.

Reference: https://ai.google.dev/gemini-api/docs/troubleshooting

## Phase 9 operational contract

- GET `/live`: public 200 liveness. GET `/ready`: public 200 when local DB and
  configured storage are ready, 503 NOT_READY after dependency failure, draining
  or a two-second response deadline. Neither promises Gemini/Clerk availability.
- All responses carry a server-generated X-Request-Id. Error envelopes now also
  contain requestId. CORS exposes X-Request-Id and Retry-After to allowed origins.
- RATE_LIMIT (429): 240 requests/min/direct IP; protected route families additionally
  120/min/verified account. Retry-After contains seconds. OPTIONS/probes exempt.
  Counters are process-local and reset on restart. Proxy headers are untrusted.
- API headers: no-store, nosniff, DENY frames, no-referrer, deny-all CSP and camera/
  microphone/geolocation disabled on API responses (not on the frontend document).
- AI_DAILY_LIMIT defaults 30; AI_GLOBAL_DAILY_LIMIT defaults 500. Both include
  failed/cached metadata rows created or updated today (UTC); shared across AI and
  voice. All API processes must use identical settings. These are operation ceilings,
  not token/currency budgets. Existing running limits and bounded retries still apply.
- Logs contain only event/time/requestId/method/route template/status/duration/code.
  Unknown paths are logged as unmatched; no raw path, query, identity or content.
