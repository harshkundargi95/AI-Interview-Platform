import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { AuthContext } from '../auth/context.js'
import { defaultPreferences } from '../../../shared/interviewOptions.js'
function mount({ failFollowup = false, failReport = false } = {}) {
  let row = { id: 'ai-session', status: 'active', revision: 0, preferences: { ...defaultPreferences, questionCount: 3 }, generation: { mode: 'mock', source: 'mock', baseCount: 3, maxFollowups: 2 }, questions: [1, 2, 3].map(i => ({ id: 'q' + i, text: 'Practice question ' + i, subject: 'dsa', category: 'technical' })), answers: {} }
  const api = {
    config: vi.fn(async () => ({ mode: 'mock' })), start: vi.fn(async () => structuredClone(row)),
    save: vi.fn(async (_, answers) => { row = { ...row, answers: { ...answers }, revision: row.revision + 1 }; return structuredClone(row) }),
    followup: vi.fn(async () => { if (failFollowup) throw new Error('AI unavailable; saved answers are safe.'); row = { ...row, revision: row.revision + 1, questions: [...row.questions, { id: 'f1', parentId: 'q1', text: 'Explain your example.', subject: 'dsa', category: 'technical' }] }; return structuredClone(row) }),
    complete: vi.fn(async (_, answers) => { row = { ...row, answers, status: 'completed' }; return structuredClone(row) }),
    report: vi.fn(async () => { if (failReport) throw new Error('Report unavailable; saved answers are safe.'); row = { ...row, feedback: { source: 'mock', modelVersion: 'mock-v1', rubricVersion: 'coaching-v1', content: { summary: 'Demonstration scores only.', subjects: [{ subject: 'dsa', score: 2, improvements: ['Add a test case.'] }], answers: [], disclaimer: 'Coaching only.' } } }; return structuredClone(row) }),
  }
  const router = createMemoryRouter([{ path: '*', element: <AuthContext.Provider value={{ configured: true, isLoaded: true, isSignedIn: true, userId: 'ai-user', api }}><App /></AuthContext.Provider> }], { initialEntries: ['/setup'] })
  render(<RouterProvider router={router} />)
  return { api, user: userEvent.setup() }
}
it('labels mock mode, saves before follow-up, shows accurate expanded progress and generates a report', async () => {
  const { api, user } = mount()
  await screen.findByText(/Mock mode. Questions/)
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  fireEvent.change(await screen.findByRole('textbox', { name: 'Your answer' }), { target: { value: 'An example answer.' } })
  await user.click(screen.getByRole('button', { name: 'Save & ask a follow-up' }))
  expect(await screen.findByText('Question 4 of 4')).toBeInTheDocument()
  expect(api.save).toHaveBeenCalledTimes(1)
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Follow-up answer.' } })
  await user.click(screen.getByRole('button', { name: 'Complete interview' }))
  // Completion returns to the first missing base answer.
  expect(screen.getByText('Question 2 of 4')).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Second answer.' } })
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Third answer.' } })
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  await user.click(screen.getByRole('button', { name: 'Complete interview' }))
  await user.click(await screen.findByRole('button', { name: 'Generate feedback' }))
  expect(await screen.findByText('Mock report · not an assessment')).toBeInTheDocument()
  expect(screen.getByText('Demonstration scores only.')).toBeInTheDocument()
})
it('keeps saved and editable answers when follow-up generation fails', async () => {
  const { user } = mount({ failFollowup: true })
  await screen.findByText(/Mock mode. Questions/)
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  fireEvent.change(await screen.findByRole('textbox', { name: 'Your answer' }), { target: { value: 'Keep this answer.' } })
  await user.click(screen.getByRole('button', { name: 'Save & ask a follow-up' }))
  expect(await screen.findByText('AI unavailable; saved answers are safe.')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Keep this answer.')
  expect(screen.getByText('Saved progress is up to date.')).toBeInTheDocument()
})
