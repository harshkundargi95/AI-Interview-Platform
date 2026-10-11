import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, it, vi } from 'vitest'
import App from '../App.jsx'
import { AuthContext } from '../auth/context.js'
import { defaultPreferences } from '../../../shared/interviewOptions.js'

function state(overrides = {}) {
  return { configured: true, isLoaded: true, isSignedIn: true, userId: 'user_a', signOut: vi.fn(), api: { start: vi.fn(), history: vi.fn(), read: vi.fn() }, ...overrides }
}
function mount(auth, path = '/setup') {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: [path] })
  const tree = value => <AuthContext.Provider value={value}><RouterProvider router={router} /></AuthContext.Provider>
  const view = render(tree(auth))
  return { ...view, update: value => view.rerender(tree(value)), user: userEvent.setup() }
}
const session = {
  id: 'session-a', status: 'active', revision: 0, preferences: { ...defaultPreferences },
  questions: [{ id: 'q1', subject: 'programming', category: 'technical', text: 'Private question for A' }], answers: {},
}

it('blocks protected pages when signed out or unconfigured without fetching history', () => {
  const auth = state({ isSignedIn: false, userId: null })
  const view = mount(auth, '/history')
  expect(screen.getByRole('heading', { name: 'Sign in to practice' })).toBeInTheDocument()
  expect(auth.api.history).not.toHaveBeenCalled()
  view.update({ ...auth, configured: false })
  expect(screen.getByRole('heading', { name: 'Sign-in setup needed' })).toBeInTheDocument()
})

it('waits for authentication instead of exposing protected content', () => {
  mount(state({ isLoaded: false, isSignedIn: false, userId: null }), '/history')
  expect(screen.getByText('Checking your session…')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Interview history' })).not.toBeInTheDocument()
})

it('clears private drafts immediately when the account changes', async () => {
  const auth = state()
  auth.api.start.mockResolvedValue(session)
  const view = mount(auth)
  await view.user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Private answer from A' } })
  view.update(state({ userId: 'user_b' }))
  expect(screen.queryByDisplayValue('Private answer from A')).not.toBeInTheDocument()
  expect(screen.queryByText('Private question for A')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Ready when you are.' })).toBeInTheDocument()
})

it('keeps unsaved edits on a 401 and confirms before signing out', async () => {
  const auth = state()
  auth.api.start.mockResolvedValue(session)
  auth.api.save = vi.fn().mockRejectedValue(new Error('Your session expired. Sign in again.'))
  const { user } = mount(auth)
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  await screen.findByRole('textbox', { name: 'Your answer' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), { target: { value: 'Keep this unsaved answer' } })
  await user.click(screen.getByRole('button', { name: 'Save progress' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('session expired')
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Keep this unsaved answer')
  await user.click(screen.getByRole('button', { name: 'Sign out', exact: true }))
  expect(auth.signOut).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Keep editing' }))
  expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('Keep this unsaved answer')
  await user.click(screen.getByRole('button', { name: 'Sign out', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Discard edits and sign out' }))
  expect(auth.signOut).toHaveBeenCalledOnce()
})
