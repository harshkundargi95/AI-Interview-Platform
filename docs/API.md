# Local API — Phase 4

Base URL: http://127.0.0.1:3001/api/v1. No authentication yet; local use only.
All routes use the server's provisional local-development owner, never an owner
supplied by the browser. POST/PUT require JSON; body limit is 256 KiB.
Success envelope: { "data": ... }. Error envelope: { "error": { "code", "message",
"details" } }; details is optional.

| Method/path | Request | Result |
| --- | --- | --- |
| GET /health | None | 200 after SELECT 1; storage postgresql, authentication none-local-only |
| POST /interviews | requestId UUID, preferences | 201 new; 200 matching retry |
| GET /interviews | skip 0–100000, take 1–50; defaults 0/20 | { items, hasMore } newest first |
| GET /interviews/:id | UUID | Exact saved snapshot |
| PUT /interviews/:id/answers | revision, answers (0–10) | Replace the full draft snapshot atomically |
| POST /interviews/:id/complete | revision, every answer | Atomically persist completed snapshot |
| DELETE /interviews/:id | UUID | 200 { id, deleted: true }; missing 404 |

Snapshot fields: id, preferences, status (active/completed), revision, createdAt,
updatedAt, completedAt, exact ordered questions, answers keyed by question ID,
feedback (null until a report exists). There is no expiresAt.
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

Errors: 400 validation/invalid JSON/duplicate or unrelated questions; 403 rejected
origin; 404 missing interview or route; 409 stale revision, request-key reuse,
incomplete interview, immutable completion or exhausted write conflict; 413 body
too large; 415 JSON required; 500 unexpected/database failures. Database failures
never silently switch storage to memory. The UI retains unsaved answers on failures.

## Local access and retention

Allowed origins: http://127.0.0.1:5173, http://localhost:5173,
http://127.0.0.1:4173, http://localhost:4173. CORS_ORIGINS can narrow this list.
Preflight allows GET, POST, PUT, DELETE, OPTIONS and Content-Type.
Requests without Origin are allowed for local clients. No cookies are used.
CORS is not authentication. Records persist until explicitly deleted.

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
(fixed-bank), and a visible applicability description. IDs are explicit editorial
keys and no longer derived from array positions. Existing sessions keep their exact
question text/order; no request silently reselects their questions. Pre-Phase-4 memory sessions were not migrated; new PostgreSQL records are durable.

The answer array supports 0–10 entries for PUT. Completion requires exactly the
session's question set, not a hardcoded five. Request body limit is 256 KiB to
accommodate ten maximum-length answers, including JSON escaping. Per-answer limit
remains 3,000 JavaScript string units. History and DELETE paths were added in Phase 4.
