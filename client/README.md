# React frontend — Phase 5

See ../README.md for Clerk/Google setup and local startup. VITE_CLERK_PUBLISHABLE_KEY
is required for account access; VITE_API_URL stays public configuration.
Never place the Clerk secret key in VITE_*.

auth/AuthProvider.jsx wraps the router and supplies an account-bound API client.
auth/RequireAccount.jsx gates private screens; pages/Account.jsx hosts Clerk's
SignIn/SignUp components, including Google when enabled in the Clerk dashboard.
auth/AccountControls.jsx confirms sign-out if unsaved edits exist.
App.jsx keys private session state by account ID to prevent cross-account leakage.

The existing interview setup, explicit Save progress, history/resume/delete and
fictional feedback samples remain. 401 errors retain drafts while the identity
remains; sign-out/account change clears them. Saved answers are durable.
No live Google sign-in is claimed until recorded in ../docs/PROGRESS.md.
