# Project instructions

## Source of truth and phase scope

- Read docs/PROJECT_BRIEF.md (the user's master prompt), the current checkpoint
  at the top of docs/PROGRESS.md, docs/ROADMAP.md and docs/REQUIREMENTS_CHECKLIST.md
  before continuing implementation. Preserve the full master prompt.
- Complete only the next unfinished phase unless the user explicitly changes scope.
- Do not claim completion from the roadmap alone. Inspect implementation and
  verify each requirement and acceptance criterion with appropriate evidence.
- Preserve the user's instructions: no automatic commits, pushes, paid resources
  or publication. End a phase at its learning checkpoint and wait for “continue.”

## Required documentation gate after every phase

The user explicitly requires documents to be kept current after each completed
phase and every task in the master prompt to be tracked.

1. Review every task, acceptance criterion and learning requirement in that phase
   of PROJECT_BRIEF.md. Update REQUIREMENTS_CHECKLIST.md with status and evidence.
   If anything is unimplemented, failed or blocked, leave it unchecked and explain
   its impact and next action. Never silently drop or defer a required item.
2. Update PROGRESS.md with actual changes, commands/check results, live versus
   mocked verification, limitations, blockers and the next unfinished phase.
   Keep the authoritative current checkpoint at the top; label older notes historical.
3. Update ROADMAP.md only when the phase's acceptance criteria have been verified.
4. Update PROJECT_WALKTHROUGH.md with the phase's actual implementation, file
   responsibilities, decisions, data flow, learning exercises and remaining limits.
   Clearly distinguish the current implementation from earlier milestone behavior.
5. Review README.md, ARCHITECTURE.md, LEARNING.md, API.md, DEPLOYMENT.md,
   client/README.md, server/README.md and .env.example files. Change those affected;
   record the review in PROGRESS.md rather than making meaningless edits to others.
   Examples must contain no secrets. Keep documented commands and contracts accurate.
6. Record any changed or superseded earlier requirement explicitly, explaining
   which later phase or user instruction changed it. Preserve evidence history.
7. Finish with the master prompt's end-of-phase report, learning checkpoint,
   limitations and suggested commit message. Do not start another phase automatically.

## Checklist maintenance

Keep documentation consolidated into the nine existing Markdown files in docs/.
Add new phase explanations to PROJECT_WALKTHROUGH.md and audit evidence to
PROGRESS.md, rather than creating separate phase/audit files. PROJECT_BRIEF.md
contains the current prompt first and the original prompt in a historical appendix;
the current prompt wins wherever they differ. REQUIREMENTS_CHECKLIST.md retains
original completed-phase tasks in its historical section. Add a new document only
when its distinct purpose cannot reasonably fit an existing one.

REQUIREMENTS_CHECKLIST.md preserves the master prompt's phase tasks and gates.
Each completed phase must also have an evidence summary: implementation locations,
tests, browser/manual checks when applicable, dates and verification limitations.
Future phases remain unchecked until implemented and verified. If the master prompt
changes, update the checklist to match rather than treating it as a replacement.
