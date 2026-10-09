# React frontend — Phase 4

Run commands from the root; see ../README.md. Start PostgreSQL and Express too.
main.jsx mounts RouterProvider; App.jsx defines routes. InterviewProvider owns
session/request state; interview/api.js calls the local backend.
Setup and SessionSummary share the expanded configuration catalog.
pages/History.jsx fetches actual records, opens saved sessions and confirms deletion.
The room exposes Save progress and indicates whether edits are saved.
Only unsaved changes trigger the leave warning. After refresh use History to resume.
Completed answers are durable; sampleInterview.js remains fictional feedback only.

index.css defines themes; App.css groups layout/component styles.
VITE_API_URL is public configuration. Never put database credentials in VITE_*.
