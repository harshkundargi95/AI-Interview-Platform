import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { AuthContext } from '../auth/context.js'
import { interviewApi } from '../interview/api.js'
import { selectQuestions } from '../../../server/src/data/questions.js'

vi.mock('../interview/api.js', () => ({ interviewApi: { start: vi.fn(), complete: vi.fn(), save: vi.fn(), history: vi.fn(), read: vi.fn(), remove: vi.fn() } }))
let remote
beforeEach(() => {
  vi.resetAllMocks()
  interviewApi.history.mockResolvedValue({ items: [], hasMore: false })
  interviewApi.save.mockImplementation(async (id, answers) => { remote = { ...remote, answers, revision: (remote.revision || 0) + 1 }; return remote })
  interviewApi.read.mockImplementation(async () => remote)
  interviewApi.remove.mockResolvedValue({ deleted: true })
  interviewApi.start.mockImplementation(async (requestId, preferences) => {
    remote = { id: crypto.randomUUID(), preferences, questions: selectQuestions(preferences), answers: {}, status: 'active' }
    return remote
  })
  interviewApi.complete.mockImplementation(async (id, answers) => ({ ...remote, answers, status: 'completed' }))
})

function renderApp(path = '/setup') {
  const router = createMemoryRouter([{ path: '*', element: <AuthContext.Provider value={{ configured: true, isLoaded: true, isSignedIn: true, userId: 'user_test', api: interviewApi, signOut: vi.fn() }}><App /></AuthContext.Provider> }], { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return { router, user: userEvent.setup() }
}

it('completes five questions, preserves edited answers by question, and labels sample feedback', async () => {
  const { user } = renderApp()
  await user.selectOptions(screen.getByLabelText('Interview type'), 'mixed')
  await user.selectOptions(screen.getByLabelText('Difficulty'), 'intermediate')
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  expect(screen.getByRole('heading', { name: /semantic HTML/ })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Write an answer')
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'x'.repeat(3001) } })
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  expect(screen.getByRole('alert')).toHaveTextContent('3000')
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'First answer' } })
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  await user.type(screen.getByRole('textbox', { name: 'Your answer' }), 'Second answer')
  await user.click(screen.getByRole('button', { name: 'Previous question' }))
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('First answer')
  await user.type(screen.getByRole('textbox', { name: 'Your answer' }), ' improved')
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Second answer')
  await user.click(screen.getByRole('button', { name: 'Next question →' }))
  for (const answer of ['Third answer', 'Fourth answer', 'Fifth answer']) {
    await user.type(screen.getByRole('textbox', { name: 'Your answer' }), answer)
    await user.click(screen.getByRole('button', { name: answer === 'Fifth answer' ? 'Complete interview' : 'Next question →' }))
  }
  expect(await screen.findByRole('heading', { name: 'You made time to practice.' })).toBeInTheDocument()
  expect(screen.getByText('First answer improved')).toBeInTheDocument()
  expect(screen.getByText('Second answer')).toBeInTheDocument()
  expect(screen.getByText(/scores and comments do not assess your responses/)).toBeInTheDocument()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  await user.click(screen.getByRole('link', { name: 'Explore another setup →' }))
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('')
})

it('warns on links and browser-back; staying preserves answers and discarding clears them', async () => {
  const { user, router } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  await user.type(screen.getByRole('textbox', { name: 'Your answer' }), 'Keep this draft')
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  await user.click(screen.getByRole('link', { name: 'History', exact: true }))
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: 'Keep practicing' }))
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Keep this draft')
  await act(async () => { await router.navigate(-1) })
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Discard and leave' }))
  expect(await screen.findByRole('button', { name: 'Start interview →' })).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'Room', exact: true }))
  expect(screen.getByRole('heading', { name: 'Ready when you are.' })).toBeInTheDocument()
})

it('handles a direct room visit without a session', () => {
  renderApp('/interview')
  expect(screen.getByRole('link', { name: 'Explore interview setup' })).toHaveAttribute('href', '/setup')
})



it('keeps the same creation key on retry after an outage', async () => {
  const { user } = renderApp()
  interviewApi.start.mockRejectedValueOnce(new Error('Server unavailable. Please retry.'))
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable')
  const requestId = interviewApi.start.mock.calls[0][0]
  await user.click(screen.getByRole('button', { name: 'Retry starting interview' }))
  expect(interviewApi.start.mock.calls[1][0]).toBe(requestId)
  expect(await screen.findByRole('textbox', { name: 'Your answer' })).toBeInTheDocument()
})

it('preserves all answers when completion fails and retries the same submission', async () => {
  const { user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  interviewApi.complete.mockRejectedValueOnce(new Error('Server is unavailable. Your draft is retained.'))
  for (let i = 1; i <= 5; i++) {
    fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Draft ' + i } })
    await user.click(screen.getByRole('button', { name: i === 5 ? 'Complete interview' : 'Next question →' }))
  }
  expect(await screen.findByRole('alert')).toHaveTextContent('draft is retained')
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Draft 5')
  const submitted = interviewApi.complete.mock.calls[0][1]
  expect(Object.values(submitted)).toEqual(['Draft 1', 'Draft 2', 'Draft 3', 'Draft 4', 'Draft 5'])
  await user.click(screen.getByRole('button', { name: 'Retry completion' }))
  expect(interviewApi.complete.mock.calls[1][1]).toEqual(submitted)
  expect(await screen.findByRole('heading', { name: 'You made time to practice.' })).toBeInTheDocument()
})



it('configures a backend junior interview with selected topics and a variable question count', async () => {
  const { user } = renderApp()
  await user.selectOptions(screen.getByLabelText('Job role'), 'backend')
  await user.selectOptions(screen.getByLabelText('Experience level'), 'junior')
  await user.selectOptions(screen.getByLabelText('Interview type'), 'technical')
  await user.selectOptions(screen.getByLabelText('Question count'), '3')
  await user.selectOptions(screen.getByLabelText('Topic coverage'), 'selected')
  expect(screen.getByRole('button', { name: 'Start interview →' })).toBeDisabled()
  await user.click(screen.getByLabelText('Computer Networks (CN)'))
  await user.selectOptions(screen.getByLabelText('Preferred programming language'), 'go')
  await user.click(screen.getByLabelText('PostgreSQL'))
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  expect(interviewApi.start.mock.calls[0][1]).toMatchObject({ role: 'backend', experience: 'junior', subjects: ['cn'], language: 'go', technologies: ['postgres'], questionCount: 3 })
  for (let i = 1; i <= 3; i++) {
    fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Networking answer ' + i } })
    await user.click(screen.getByRole('button', { name: i === 3 ? 'Complete interview' : 'Next question →' }))
  }
  expect(await screen.findByRole('heading', { name: 'You made time to practice.' })).toBeInTheDocument()
  expect(screen.getByText(/All 3 answers are ready/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Backend Developer' })).toBeInTheDocument()
})

it('explains subject coverage limits and lets behavioral interviews start without subjects', async () => {
  const { user } = renderApp()
  await user.selectOptions(screen.getByLabelText('Interview type'), 'mixed')
  await user.selectOptions(screen.getByLabelText('Question count'), '3')
  await user.selectOptions(screen.getByLabelText('Topic coverage'), 'selected')
  for (const name of ['Computer Networks (CN)', 'Object-Oriented Programming (OOP)', 'Operating Systems (OS)']) await user.click(screen.getByLabelText(name))
  expect(screen.getByRole('alert')).toHaveTextContent('2 technical slots for 3 subjects')
  expect(screen.getByRole('button', { name: 'Start interview →' })).toBeDisabled()
  await user.selectOptions(screen.getByLabelText('Interview type'), 'behavioral')
  expect(screen.queryByText('Subjects', { selector: 'legend' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Start interview →' })).toBeEnabled()
})

it('saves progress, resumes from history and retains unsaved edits on save failure', async () => {
  const { user } = renderApp()
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  await user.type(screen.getByRole('textbox', { name: 'Your answer' }), 'Saved answer')
  await user.click(screen.getByRole('button', { name: 'Save progress' }))
  expect(await screen.findByText('Saved progress is up to date.')).toBeInTheDocument()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  interviewApi.history.mockResolvedValue({ items: [{ ...remote, createdAt: new Date().toISOString(), savedAnswerCount: 1, questionCount: 5 }], hasMore: false })
  await user.click(screen.getByRole('link', { name: 'History', exact: true }))
  await user.click(await screen.findByRole('button', { name: 'Resume interview' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  await user.click(screen.getByRole('button', { name: 'Previous question' }))
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Saved answer')
  interviewApi.save.mockRejectedValueOnce(new Error('Database offline'))
  await user.type(screen.getByRole('textbox', { name: 'Your answer' }), ' unsaved')
  await user.click(screen.getByRole('button', { name: 'Save progress' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Database offline')
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Saved answer unsaved')
})

it('shows a history error with retry and requires confirmation before deletion', async () => {
  interviewApi.history.mockRejectedValueOnce(new Error('Database unavailable'))
  const { user } = renderApp('/history')
  expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable')
  interviewApi.history.mockResolvedValueOnce({ items: [{ id: 'saved-id', preferences: { role: 'backend', type: 'technical' }, status: 'active', createdAt: new Date().toISOString(), savedAnswerCount: 1, questionCount: 3 }], hasMore: false })
  await user.click(screen.getByRole('button', { name: 'Refresh history' }))
  await user.click(await screen.findByRole('button', { name: 'Delete interview' }))
  expect(interviewApi.remove).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Confirm delete' }))
  expect(interviewApi.remove).toHaveBeenCalledWith('saved-id')
  expect(await screen.findByRole('heading', { name: 'Your first chapter is still ahead.' })).toBeInTheDocument()
})
