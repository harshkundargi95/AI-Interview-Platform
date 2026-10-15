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
