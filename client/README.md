# React frontend — Phase 6

See ../README.md for Clerk/Google setup and local startup. VITE_CLERK_PUBLISHABLE_KEY
is required for account access; VITE_API_URL stays public configuration.
Never place the Clerk secret key in VITE_*.

auth/AuthProvider.jsx wraps the router and supplies an account-bound API client.
auth/RequireAccount.jsx gates private screens; pages/Account.jsx hosts Clerk's
SignIn/SignUp components, including Google when enabled in the Clerk dashboard.
auth/AccountControls.jsx confirms sign-out if unsaved edits exist.
App.jsx keys private session state by account ID to prevent cross-account leakage.

The existing interview setup, explicit Save progress, history/resume/delete and
labeled mock/live coaching reports are supported. Fictional samples remain only
for the sample page and older interviews. 401 errors retain drafts while the identity
remains; sign-out/account change clears them. Saved answers are durable.
No live Google sign-in is claimed until recorded in ../docs/PROGRESS.md.

Setup fetches /ai-config and discloses outgoing Gemini data in live mode. The room
labels source/fallback, shows base/follow-up progress and offers optional follow-ups.
Feedback renders the stored report as escaped React text. Generating reports is a
separate action after durable completion. AI failures retain answers; no autosave.
Never put GEMINI_API_KEY in VITE_*; all provider requests happen on the server.

Phase 7 Setup includes reviewed JD/skills/resume text and authenticated upload/download/delete. Uploaded text remains editable; failures preserve drafts. See the setup disclosure for provider sharing and separate file/interview retention.


Phase 8: Interview has optional voice consent, bounded microphone capture, local
recording review, editable transcript confirmation and local question playback.
Typed answers remain available. Microphone testing requires localhost/HTTPS and a
browser supporting AudioWorklet with 16 kHz AudioContext. No new client keys needed.

Phase 9 uses Playwright through the root `npm run test:e2e` command. Its separate
entry under e2e/ wraps the real App in a synthetic account context; the normal
AuthProvider and build are unchanged. The fixture tests safe AI text rendering and
the complete persisted workflow, but does not exercise hosted Clerk/Google login.
No frontend secrets or new VITE_ variables were added. Request IDs are available
in API response headers/error envelopes for troubleshooting.

## Hosted free demo (Phase 10)

Use repository root in Vercel Hobby and the free vercel.app address. Set
VITE_DEPLOYMENT_MODE=demo, VITE_API_URL=https://YOUR_API.onrender.com/api/v1 and the matching
Clerk development publishable key (pk_test_...). Without explicit demo mode hosted builds
still require pk_live_. No database, S3 or secret Clerk key belongs in VITE variables.
The UI displays demo/cold-start/quota guidance. Rebuild after environment changes.
See ../docs/DEPLOYMENT.md. Nothing has been published; local builds remain supported.
